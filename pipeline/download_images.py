#!/usr/bin/env python3
"""
Download article images into a local cache with a manifest.

Reads `extracted/page_*.json` (produced by `extract_from_html.py`), downloads
each image referenced in `gallery_images[]` into
`pipeline/images/<slug>/NN.<ext>`, and writes a sibling
`pipeline/images/<slug>/manifest.json` listing the successfully-downloaded
items. The TS loader (`packages/db/src/push-climate-adapt.ts`) consumes this
manifest to upload binaries to Supabase Storage and upsert the
`knowledge.document_images` rows.

The script is idempotent: if the on-disk file already exists and `--force` is
not passed, the HTTP request is skipped but the manifest entry is still
regenerated from the cached file's size and content type.

Exit codes:
- 0: at least one image was kept in the output manifest (or no articles had
     any images).
- 1: there was at least one processed article AND every image in every
     processed article failed.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import urlparse

import httpx

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_PAGES_DIR = Path(__file__).resolve().parent / "extracted"
DEFAULT_OUT_DIR = Path(__file__).resolve().parent / "images"
MANIFEST_FILENAME = "manifest.json"

# Keep the allow-list small and aligned with the Supabase bucket MIME guard
# (packages/supabase-setup/sql/08_article_images_storage.sql).
_CONTENT_TYPE_TO_EXT = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
}

_EXT_TO_CONTENT_TYPE = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}


def _content_type_from_ext(path: Path) -> str | None:
    return _EXT_TO_CONTENT_TYPE.get(path.suffix.lower())


@dataclass
class ArticleResult:
    slug: str
    page_file: str
    attempted: int
    succeeded: int
    manifest_path: Path


def _ext_from_content_type(content_type: str | None) -> str | None:
    if not content_type:
        return None
    ct = content_type.split(";", 1)[0].strip().lower()
    return _CONTENT_TYPE_TO_EXT.get(ct)


def _ext_from_url(url: str) -> str | None:
    path = urlparse(url).path
    if not path:
        return None
    dot = path.rfind(".")
    if dot == -1:
        return None
    ext = path[dot:].lower()
    # Plone images often expose `/@@images/image/<scale>` with no file extension
    # in the last segment; filter out anything that is not a short alnum run.
    if len(ext) <= 1 or len(ext) > 5 or not ext[1:].isalnum():
        return None
    # Normalize .jpeg -> .jpg for filesystem friendliness.
    return ".jpg" if ext == ".jpeg" else ext


def _pick_extension(url: str, content_type: str | None) -> str:
    return (
        _ext_from_content_type(content_type)
        or _ext_from_url(url)
        or ".bin"
    )


def _slug_from_source_url(source_url: str, fallback_stem: str) -> str:
    """Use the trailing path segment of the article URL as the slug.

    Falls back to the JSON filename stem when the source URL is empty or
    doesn't look like a Climate-ADAPT metadata page.
    """
    if not source_url:
        return fallback_stem
    path = urlparse(source_url).path.rstrip("/")
    if not path:
        return fallback_stem
    return path.rsplit("/", 1)[-1] or fallback_stem


def _read_gallery_images(page_path: Path) -> tuple[str, list[dict]]:
    """Return (source_url, gallery_images[]) from an extracted page JSON."""
    data = json.loads(page_path.read_text(encoding="utf-8"))
    gallery = data.get("gallery_images") or []
    if not isinstance(gallery, list):
        gallery = []
    source_url = data.get("source_url") or ""
    return source_url, gallery


def _download_one(
    client: httpx.Client,
    entry: dict,
    slug: str,
    out_dir: Path,
    force: bool,
) -> dict | None:
    """Download one image entry, returning the manifest row on success.

    Tries `source_url` first, then `source_url_fallback`. When the local file
    already exists and `force=False`, the HTTP fetch is skipped but the
    manifest row is still produced from the on-disk bytes.
    """
    position = entry.get("position")
    if not isinstance(position, int) or position < 0:
        print(f"  [skip] invalid position: {entry!r}", file=sys.stderr)
        return None

    urls_to_try: list[str] = []
    primary = entry.get("source_url")
    fallback = entry.get("source_url_fallback")
    if primary:
        urls_to_try.append(primary)
    if fallback and fallback not in urls_to_try:
        urls_to_try.append(fallback)
    if not urls_to_try:
        return None

    out_dir.mkdir(parents=True, exist_ok=True)

    cached_path: Path | None = None
    if not force:
        for existing in sorted(out_dir.glob(f"{position:02d}.*")):
            if existing.name == MANIFEST_FILENAME:
                continue
            cached_path = existing
            break

    effective_url = primary or urls_to_try[0]
    content_type: str | None = entry.get("content_type")
    bytes_written: int | None = None

    if cached_path is not None:
        # Keep the cached binary; infer size + stick with the declared content type.
        bytes_written = cached_path.stat().st_size
        local_path = cached_path
    else:
        local_path = None
        last_error: str | None = None
        for url in urls_to_try:
            try:
                resp = client.get(url, timeout=30.0, follow_redirects=True)
            except httpx.HTTPError as exc:
                last_error = f"{url}: {exc.__class__.__name__}: {exc}"
                continue
            if resp.status_code < 200 or resp.status_code >= 300:
                last_error = f"{url}: HTTP {resp.status_code}"
                continue
            content_type = resp.headers.get("content-type") or content_type
            ext = _pick_extension(url, content_type)
            local_path = out_dir / f"{position:02d}{ext}"
            local_path.write_bytes(resp.content)
            bytes_written = len(resp.content)
            effective_url = url
            break
        if local_path is None:
            print(
                f"  [fail] position {position}: all URLs failed ({last_error})",
                file=sys.stderr,
            )
            return None

    try:
        relative = local_path.relative_to(REPO_ROOT)
    except ValueError:
        relative = local_path

    # Guarantee the manifest carries a usable content_type: HTTP headers are
    # only populated on a fresh download, so fall back to the file extension
    # when the cached path is reused (otherwise the TS loader would upload
    # with application/octet-stream, which the bucket rejects).
    if not content_type or content_type.split(";", 1)[0].strip().lower() == "application/octet-stream":
        content_type = _content_type_from_ext(local_path) or content_type

    row: dict = {
        "position": position,
        "source_url": effective_url,
        "local_path": str(relative),
        "storage_path_hint": f"climateadapt/{slug}/{local_path.name}",
    }
    for key in ("title", "description", "credits", "width", "height"):
        value = entry.get(key)
        if value not in (None, ""):
            row[key] = value
    if content_type:
        row["content_type"] = content_type
    if bytes_written is not None:
        row["bytes"] = bytes_written
    return row


def _process_article(
    client: httpx.Client,
    page_path: Path,
    out_root: Path,
    force: bool,
) -> ArticleResult | None:
    source_url, gallery = _read_gallery_images(page_path)
    slug = _slug_from_source_url(source_url, page_path.stem)
    if not gallery:
        # Even when there are no images, write an empty manifest so the loader
        # can distinguish "no images known" from "image pipeline did not run".
        article_dir = out_root / slug
        article_dir.mkdir(parents=True, exist_ok=True)
        (article_dir / MANIFEST_FILENAME).write_text(
            json.dumps(
                {
                    "slug": slug,
                    "source_url": source_url,
                    "page_file": page_path.name,
                    "images": [],
                },
                indent=2,
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
        return ArticleResult(
            slug=slug,
            page_file=page_path.name,
            attempted=0,
            succeeded=0,
            manifest_path=article_dir / MANIFEST_FILENAME,
        )

    article_dir = out_root / slug
    rows: list[dict] = []
    for entry in gallery:
        row = _download_one(client, entry, slug, article_dir, force=force)
        if row is not None:
            rows.append(row)

    rows.sort(key=lambda r: r["position"])
    manifest_path = article_dir / MANIFEST_FILENAME
    manifest_path.write_text(
        json.dumps(
            {
                "slug": slug,
                "source_url": source_url,
                "page_file": page_path.name,
                "images": rows,
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    return ArticleResult(
        slug=slug,
        page_file=page_path.name,
        attempted=len(gallery),
        succeeded=len(rows),
        manifest_path=manifest_path,
    )


def _iter_page_files(pages_dir: Path, pattern: str, only: str | None) -> Iterable[Path]:
    for path in sorted(pages_dir.glob(pattern)):
        if only:
            # Match either the JSON file stem or the slug embedded in source_url.
            if only == path.stem:
                yield path
                continue
            try:
                _, _ = _read_gallery_images(path)
                data = json.loads(path.read_text(encoding="utf-8"))
            except Exception:
                continue
            slug = _slug_from_source_url(data.get("source_url") or "", path.stem)
            if slug == only:
                yield path
        else:
            yield path


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Download article images from extracted/page_*.json into pipeline/images/<slug>/.",
    )
    parser.add_argument(
        "--pages-dir",
        type=Path,
        default=DEFAULT_PAGES_DIR,
        help=f"Directory containing extracted page JSON. Default: {DEFAULT_PAGES_DIR}",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=DEFAULT_OUT_DIR,
        help=f"Root directory for downloaded images. Default: {DEFAULT_OUT_DIR}",
    )
    parser.add_argument(
        "--pattern",
        type=str,
        default="page_*.json",
        help="Glob pattern for JSON files under --pages-dir. Default: page_*.json",
    )
    parser.add_argument(
        "--only",
        type=str,
        default=None,
        help="Process only one article (matches the page-file stem or the slug).",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-download even when a cached file already exists on disk.",
    )
    args = parser.parse_args()

    if not args.pages_dir.is_dir():
        print(f"Error: pages dir not found: {args.pages_dir}", file=sys.stderr)
        return 2

    args.out_dir.mkdir(parents=True, exist_ok=True)
    page_files = list(_iter_page_files(args.pages_dir, args.pattern, args.only))
    if not page_files:
        print(f"No page JSON files matched '{args.pattern}' under {args.pages_dir}", file=sys.stderr)
        return 2

    total_attempted = 0
    total_succeeded = 0
    results: list[ArticleResult] = []
    with httpx.Client(headers={"User-Agent": "farclimate-pipeline/0.1 (+https://farclimate.eu)"}) as client:
        for page_path in page_files:
            try:
                result = _process_article(client, page_path, args.out_dir, force=args.force)
            except Exception as exc:  # pragma: no cover - defensive, surfaced to logs
                print(f"  {page_path.name}: processing failed: {exc}", file=sys.stderr)
                continue
            if result is None:
                continue
            results.append(result)
            total_attempted += result.attempted
            total_succeeded += result.succeeded
            status = "ok" if result.succeeded == result.attempted else "partial" if result.succeeded else "fail"
            print(
                f"  {page_path.name} [{status}] slug={result.slug} {result.succeeded}/{result.attempted} images -> {result.manifest_path.relative_to(REPO_ROOT)}"
            )

    print(
        f"\nProcessed {len(results)} articles, downloaded {total_succeeded}/{total_attempted} images into {args.out_dir}"
    )
    # Exit non-zero only when at least one article had images but zero succeeded across the whole run.
    if total_attempted > 0 and total_succeeded == 0:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
