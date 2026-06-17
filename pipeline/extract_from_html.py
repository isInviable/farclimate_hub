#!/usr/bin/env python3
"""
Extract structured JSON from local HTML files (source of truth).

Reads HTML from pipeline/source_html/ (or --input), runs the extraction schema
(CSS or XPath), adds fulltext as article-only text (target_elements + PruningContentFilter), and
writes one JSON per HTML to pipeline/extracted/. Optionally writes markdown.

Output JSON shape (per page): fulltext + all fields defined in the schema.
"""

import argparse
import json
import re
import sys
from pathlib import Path

from crawl4ai.content_scraping_strategy import WebScrapingStrategy
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
from crawl4ai.content_filter_strategy import PruningContentFilter
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy, JsonXPathExtractionStrategy

REPO_ROOT = Path(__file__).resolve().parent.parent

# Climate-ADAPT article targeting (main content only)
ARTICLE_TARGET_ELEMENTS = [".db-item-view", "#page-header"]
ARTICLE_EXCLUDED_TAGS = ["nav", "footer", "header", "script", "style", "iframe", "noscript"]
ARTICLE_WORD_COUNT_THRESHOLD = 10


def _schema_uses_xpath(schema: dict) -> bool:
    """Return True if any selector in the schema looks like XPath (e.g. starts with / or contains @)."""
    def check_selector(sel: str) -> bool:
        if not sel or not isinstance(sel, str):
            return False
        s = sel.strip()
        return s.startswith("/") or "[@" in s or "contains(@" in s

    if check_selector(schema.get("baseSelector", "")):
        return True
    for field in schema.get("fields", []):
        if check_selector(field.get("selector", "")):
            return True
        for sub in field.get("fields", []):
            if check_selector(sub.get("selector", "")):
                return True
    return False


DEFAULT_INPUT_DIR = Path(__file__).resolve().parent / "source_html"
DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent / "extracted"
DEFAULT_SCHEMA = Path(__file__).resolve().parent / "extraction_schema_generated.json"
URL_MANIFEST_FILENAME = "url_manifest.json"

# Fields extracted as comma-separated text that should be stored as arrays
FIELDS_AS_ARRAYS = (
    "climate_impacts",
    "adaptation_approaches",
    "keywords",
    "sub_nationals",
    "countries",
    "sectors",
)


def _string_to_array(value):  # noqa: ANN001
    """Split a string by comma into trimmed strings; return list as-is; empty/None -> []."""
    if value is None or (isinstance(value, str) and not value.strip()):
        return []
    if isinstance(value, list):
        return value
    return [s.strip() for s in value.split(",") if s.strip()]


def _normalize_array_fields(item: dict) -> None:
    """In-place: ensure FIELDS_AS_ARRAYS are lists (comma-split if string)."""
    for key in FIELDS_AS_ARRAYS:
        if key not in item:
            continue
        item[key] = _string_to_array(item[key])


def _read_url_manifest(input_dir: Path) -> dict[str, str]:
    """Read stem -> URL from url_manifest.json if present."""
    path = input_dir / URL_MANIFEST_FILENAME
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _lang_from_html(html: str) -> str:
    """Extract language from <html lang="..."> or default to 'en'."""
    m = re.search(r"<html[^>]*\blang=[\"']([^\"']+)[\"']", html, re.IGNORECASE)
    if m:
        return m.group(1).split("-")[0].lower()
    return "en"


def _title_from_html(html: str) -> str:
    """Best-effort extraction of the case-study title from the page header <h1>."""
    # Look for <h1 ... class="...documentFirstHeading...">
    m = re.search(
        r"<h1[^>]*class=[\"'][^\"']*documentFirstHeading[^\"']*[\"'][^>]*>(.*?)</h1>",
        html,
        re.IGNORECASE | re.DOTALL,
    )
    if not m:
        return ""
    inner = m.group(1)
    # Strip HTML tags inside the H1
    text = re.sub(r"<[^>]+>", "", inner)
    return text.strip()


# Map h5 label text (normalized: strip trailing colon) to geographic_characterisation key.
_GEOCHAR_H5_TO_KEY = {
    "macro-transnational region": "macro_transnational_region",
    "biogeographical regions": "biogeographical_regions",
    "countries": "countries",
    "sub nationals": "sub_nationals",
    "city": "city",
}


def _extract_geochar_block(html: str) -> str:
    """Extract the inner HTML of the first <div class="geochar">. Returns empty string if not found."""
    start_marker = '<div class="geochar">'
    idx = html.find(start_marker)
    if idx == -1:
        return ""
    start = idx + len(start_marker)
    depth = 1
    pos = start
    while pos < len(html) and depth > 0:
        next_open = html.find("<div", pos)
        next_close = html.find("</div>", pos)
        if next_close == -1:
            break
        if next_open != -1 and next_open < next_close:
            depth += 1
            pos = next_open + 4
        else:
            depth -= 1
            if depth == 0:
                return html[start:next_close].strip()
            pos = next_close + 6
    return ""


def parse_geochar_from_html(html: str) -> tuple[dict, str | None]:
    """
    Parse the .geochar block from Climate-ADAPT HTML.
    Returns (geographic_characterisation dict, health_impact or None).
    geographic_characterisation has keys: continent, macro_transnational_region,
    biogeographical_regions, countries, sub_nationals, city (values are strings or null).
    """
    block = _extract_geochar_block(html)
    if not block:
        return {}, None

    geo = {
        "continent": None,
        "macro_transnational_region": None,
        "biogeographical_regions": None,
        "countries": None,
        "sub_nationals": None,
        "city": None,
    }
    health_impact = None

    # First <p> in block = continent
    first_p = re.search(r"<p>(.*?)</p>", block, re.DOTALL)
    if first_p:
        continent_text = re.sub(r"<[^>]+>", "", first_p.group(1)).strip()
        if continent_text:
            geo["continent"] = continent_text

    # Pairs: <h5>Label:</h5> followed by <p>...</p> or <span>...</span>
    # Match h5 then next p or span (possibly with whitespace)
    pattern = re.compile(
        r"<h5[^>]*>([^<]+)</h5>\s*<(p|span)[^>]*>([^<]*(?:<[^/][^>]*>[^<]*)*)</\2>",
        re.IGNORECASE | re.DOTALL,
    )
    for m in pattern.finditer(block):
        label = m.group(1).strip().rstrip(":").lower().strip()
        value = re.sub(r"<[^>]+>", "", m.group(3)).strip()
        if not value:
            continue
        if label in _GEOCHAR_H5_TO_KEY:
            key = _GEOCHAR_H5_TO_KEY[label]
            geo[key] = value
        elif label == "health impact":
            health_impact = value

    # If not inside .geochar, try .content-metadata (Health impact appears there on some pages)
    if not health_impact:
        m = re.search(
            r'<h5[^>]*>\s*Health impact:\s*</h5>\s*<p>([^<]*(?:<[^/][^>]*>[^<]*)*)</p>',
            html,
            re.IGNORECASE | re.DOTALL,
        )
        if m:
            health_impact = re.sub(r"<[^>]+>", "", m.group(1)).strip()

    return geo, health_impact if health_impact else None


# ---------------------------------------------------------------------------
# .content-metadata label-based parsing
# ---------------------------------------------------------------------------

# Map normalized h5 label text (trailing colon stripped, lowercased) to output field.
_CONTENT_METADATA_LABEL_TO_KEY = {
    "keywords": "keywords",
    "climate impacts": "climate_impacts",
    "adaptation approaches": "adaptation_approaches",
    "sectors": "sectors",
}


def _extract_content_metadata_block(html: str) -> str:
    """Extract inner HTML of the first div whose class contains "content-metadata".

    Returns empty string when not found. Uses a depth counter so nested <div>s
    inside the block don't terminate matching early.
    """
    m = re.search(r'<div[^>]*class="[^"]*content-metadata[^"]*"[^>]*>', html, re.IGNORECASE)
    if not m:
        return ""
    start = m.end()
    depth = 1
    pos = start
    while pos < len(html) and depth > 0:
        next_open = html.find("<div", pos)
        next_close = html.find("</div>", pos)
        if next_close == -1:
            break
        if next_open != -1 and next_open < next_close:
            depth += 1
            pos = next_open + 4
        else:
            depth -= 1
            if depth == 0:
                return html[start:next_close].strip()
            pos = next_close + 6
    return ""


def parse_content_metadata_from_html(html: str) -> dict:
    """Parse keywords / climate_impacts / adaptation_approaches / sectors by <h5> label.

    Climate-ADAPT omits empty metadata rows, so positional selectors are
    unreliable. Match each <h5> label by its text and read the immediately
    following <p>/<span>, comma-splitting into a trimmed list. Labels not present
    on the page yield an empty list. Returns a dict for the target fields.
    """
    out = {key: [] for key in _CONTENT_METADATA_LABEL_TO_KEY.values()}
    block = _extract_content_metadata_block(html)
    if not block:
        return out

    pattern = re.compile(
        r"<h5[^>]*>(.*?)</h5>\s*<(p|span)[^>]*>(.*?)</\2>",
        re.IGNORECASE | re.DOTALL,
    )
    for m in pattern.finditer(block):
        label = re.sub(r"<[^>]+>", "", m.group(1)).strip().rstrip(":").lower().strip()
        key = _CONTENT_METADATA_LABEL_TO_KEY.get(label)
        if not key:
            continue
        value = re.sub(r"<[^>]+>", "", m.group(3)).strip()
        out[key] = [s.strip() for s in value.split(",") if s.strip()]
    return out


# ---------------------------------------------------------------------------
# window.__data extraction (Volto/Plone server-side initial state)
# ---------------------------------------------------------------------------

# Climate-ADAPT ships `<script nonce="" charset="UTF-8">window.__data={…};</script>` in
# every page. The JSON is mostly valid, but Volto serializes JavaScript `undefined`
# literals (seen under router.location.state / router.location.query, etc.).
# We rewrite the small set of non-JSON tokens seen in samples before parsing.

_WINDOW_DATA_START_RE = re.compile(r"window\.__data\s*=\s*\{")
_UNDEFINED_VALUE_RE = re.compile(r":\s*undefined\b")


def _parse_window_data(html: str) -> dict | None:
    """Locate the window.__data JSON payload and parse it.

    Uses a brace counter that respects string literals so nested `{` / `}`
    inside quoted strings don't throw off matching. Returns the parsed dict,
    or None when the script tag is absent or the JSON cannot be decoded.
    """
    match = _WINDOW_DATA_START_RE.search(html)
    if match is None:
        return None
    start = match.end() - 1  # index of the opening `{`
    depth = 0
    pos = start
    in_string = False
    escape = False
    n = len(html)
    while pos < n:
        ch = html[pos]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
        else:
            if ch == '"':
                in_string = True
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    payload = html[start : pos + 1]
                    fixed = _UNDEFINED_VALUE_RE.sub(": null", payload)
                    try:
                        return json.loads(fixed)
                    except Exception:
                        return None
        pos += 1
    return None


# Priority chain for picking the biggest primary_photo scale URL.
_PRIMARY_PHOTO_SCALE_ORDER = ("huge", "great", "larger", "large")

# Matches the trailing /@@images/image/<scale> segment on Plone-served image URLs.
_PLONE_IMAGE_SCALE_RE = re.compile(r"(/@@images/image)/[^/?#]+(\??[^#]*)$")


def _hero_entry_from_primary_photo(primary_photo: dict, credits: str | None) -> dict | None:
    """Build a `gallery_images[0]` entry from `content.data.primary_photo`.

    Uses the scales priority chain, falling back to the unscaled `download` URL.
    Returns None when no usable URL is present.
    """
    if not isinstance(primary_photo, dict):
        return None
    source_url: str | None = None
    scales = primary_photo.get("scales") or {}
    for name in _PRIMARY_PHOTO_SCALE_ORDER:
        scale = scales.get(name) if isinstance(scales, dict) else None
        if isinstance(scale, dict) and scale.get("download"):
            source_url = scale["download"]
            break
    if not source_url:
        source_url = primary_photo.get("download") or None
    if not source_url:
        return None
    entry: dict = {
        "position": 0,
        "source_url": source_url,
        "source_url_fallback": primary_photo.get("download") or None,
    }
    title = primary_photo.get("filename")
    if title:
        entry["title"] = title
    if credits:
        entry["credits"] = credits
    width = primary_photo.get("width")
    height = primary_photo.get("height")
    if isinstance(width, int) and width > 0:
        entry["width"] = width
    if isinstance(height, int) and height > 0:
        entry["height"] = height
    content_type = primary_photo.get("content-type")
    if content_type:
        entry["content_type"] = content_type
    return entry


def _rewrite_plone_image_to_huge(url: str) -> str:
    """Swap the trailing `/@@images/image/<scale>` segment with `/huge`.

    Leaves URLs without that pattern untouched.
    """
    if not url:
        return url
    return _PLONE_IMAGE_SCALE_RE.sub(r"\1/huge\2", url)


def _gallery_entry_from_cca(item: dict, position: int) -> dict | None:
    """Build a `gallery_images[position]` entry from a `cca_gallery[i]` element."""
    if not isinstance(item, dict):
        return None
    url = item.get("url")
    if not url:
        return None
    huge_url = _rewrite_plone_image_to_huge(url)
    entry: dict = {
        "position": position,
        "source_url": huge_url,
    }
    if huge_url != url:
        entry["source_url_fallback"] = url
    title = item.get("title")
    description = item.get("description")
    rights = item.get("rights")
    if title:
        entry["title"] = title
    if description:
        entry["description"] = description
    if rights:
        entry["credits"] = rights
    return entry


def _build_gallery_images(window_data: dict) -> list[dict]:
    """Produce an ordered `gallery_images` list from parsed window.__data.

    Position 0 is the hero image (from `primary_photo`) when available;
    remaining positions follow `cca_gallery` order. Each entry always carries
    a `position` + `source_url`; title/description/credits/width/height/
    content_type/source_url_fallback are included when known.
    """
    content_data = (window_data.get("content") or {}).get("data") or {}
    if not isinstance(content_data, dict):
        return []

    primary_photo = content_data.get("primary_photo")
    primary_copyright = content_data.get("primary_photo_copyright")
    gallery = content_data.get("cca_gallery") or []

    entries: list[dict] = []
    hero = _hero_entry_from_primary_photo(primary_photo, primary_copyright) if isinstance(primary_photo, dict) else None
    if hero is not None:
        entries.append(hero)

    if isinstance(gallery, list):
        start_position = len(entries)
        for offset, item in enumerate(gallery):
            entry = _gallery_entry_from_cca(item, start_position + offset)
            if entry is not None:
                entries.append(entry)

    return entries


def extract_article_fulltext(html: str, base_url: str = "") -> str:
    """
    Extract article-only full text (no header, nav, footer) using crawl4ai's
    target_elements + excluded_tags then PruningContentFilter + DefaultMarkdownGenerator for fit_markdown.
    """
    strategy = WebScrapingStrategy()
    result = strategy.scrap(
        url=base_url or "file:///",
        html=html,
        target_elements=ARTICLE_TARGET_ELEMENTS,
        excluded_tags=ARTICLE_EXCLUDED_TAGS,
        word_count_threshold=ARTICLE_WORD_COUNT_THRESHOLD,
    )
    cleaned_html = (result.cleaned_html or "").strip()
    if not cleaned_html:
        return ""

    md_generator = DefaultMarkdownGenerator(
        content_filter=PruningContentFilter(threshold=0.45, threshold_type="dynamic"),
        options={"ignore_links": True, "skip_internal_links": True},
    )
    # crawl4ai API: first positional is input_html (was cleaned_html= keyword)
    md_result = md_generator.generate_markdown(
        cleaned_html,
        base_url=base_url,
        citations=False,
    )
    fulltext = (md_result.fit_markdown or md_result.raw_markdown or "").strip()
    if not fulltext:
        return ""

    # Drop leading copyright line that often comes from the top image wrapper
    # (e.g. "© Guardian Project"), but keep the image itself via `image_url`.
    lines = fulltext.splitlines()
    # Remove leading blank lines
    while lines and not lines[0].strip():
        lines.pop(0)
    if lines and lines[0].lstrip().startswith("©"):
        lines.pop(0)
    fulltext = "\n".join(lines)

    return re.sub(r"\n\s*\n", "\n\n", fulltext)


def main():
    parser = argparse.ArgumentParser(
        description="Extract JSON (fulltext + schema fields) from local HTML files."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_INPUT_DIR,
        help=f"Directory containing HTML files. Default: {DEFAULT_INPUT_DIR}",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help=f"Directory for output JSON files. Default: {DEFAULT_OUTPUT_DIR}",
    )
    parser.add_argument(
        "--schema",
        type=Path,
        default=DEFAULT_SCHEMA,
        help=f"Path to extraction schema JSON. Default: {DEFAULT_SCHEMA}",
    )
    parser.add_argument(
        "--pattern",
        type=str,
        default="page_*.html",
        help="Glob pattern for HTML files under --input. Default: page_*.html",
    )
    parser.add_argument(
        "--start",
        type=int,
        default=0,
        help="Start file index (0-based). Default: 0",
    )
    parser.add_argument(
        "--end",
        type=int,
        default=None,
        help="End file index (exclusive). Default: process all. E.g. --start 0 --end 5 processes first 5 files.",
    )
    parser.add_argument(
        "--markdown",
        action="store_true",
        help="Also write article markdown to <stem>.md in the output directory.",
    )
    args = parser.parse_args()

    if not args.input.is_dir():
        print(f"Error: Input directory not found: {args.input}", file=sys.stderr)
        return 1

    if not args.schema.exists():
        print(
            f"Error: Schema file not found: {args.schema}. Run generate_extraction_schema.py first.",
            file=sys.stderr,
        )
        return 1

    schema = json.loads(args.schema.read_text(encoding="utf-8"))
    if _schema_uses_xpath(schema):
        strategy = JsonXPathExtractionStrategy(schema)
    else:
        strategy = JsonCssExtractionStrategy(schema)

    html_files = sorted(args.input.glob(args.pattern))
    if not html_files:
        print(f"No HTML files matched {args.pattern} in {args.input}", file=sys.stderr)
        return 1

    if args.start < 0 or args.start >= len(html_files):
        print(f"Error: --start {args.start} out of range (0 to {len(html_files) - 1})", file=sys.stderr)
        return 1
    end = args.end if args.end is not None else len(html_files)
    if end <= args.start or end > len(html_files):
        print(f"Error: --end {args.end} invalid (must be > start and <= {len(html_files)})", file=sys.stderr)
        return 1
    html_files = html_files[args.start:end]
    print(f"Processing files {args.start} to {end - 1} ({len(html_files)} files)")

    url_manifest = _read_url_manifest(args.input)
    if not url_manifest and html_files:
        print("Note: no url_manifest.json in input dir; source_url will be empty.", file=sys.stderr)

    args.output.mkdir(parents=True, exist_ok=True)
    ok = 0
    for html_path in html_files:
        # Preserve base name for output (e.g. page_0.html -> page_0.json)
        out_name = html_path.stem + ".json"
        out_path = args.output / out_name

        html = html_path.read_text(encoding="utf-8")
        base_url = f"file://{html_path.resolve()}"
        fulltext = extract_article_fulltext(html, base_url=base_url)

        url = base_url
        try:
            extracted_list = strategy.extract(url, html)
        except Exception as e:
            print(f"  {html_path.name}: extraction failed: {e}", file=sys.stderr)
            continue

        # Merge fulltext with first extracted item (one page = one base element)
        if extracted_list:
            item = dict(extracted_list[0])
        else:
            item = {}
        # Ensure we always have a title: fallback to direct HTML parsing if missing.
        if not item.get("title"):
            fallback_title = _title_from_html(html)
            if fallback_title:
                item["title"] = fallback_title
        item["fulltext"] = fulltext

        # DB-ready metadata: source_url, source_file, lang
        source_url = url_manifest.get(html_path.stem, "")
        try:
            source_file = str(html_path.relative_to(REPO_ROOT))
        except ValueError:
            source_file = html_path.name
        lang = _lang_from_html(html)
        item = {
            "source_url": source_url,
            "source_file": source_file,
            "lang": lang,
            **item,
        }
        _normalize_array_fields(item)

        # Overwrite keywords / climate_impacts / adaptation_approaches / sectors using
        # label-based parsing of .content-metadata. The CSS schema relied on positional
        # selectors (h5:nth-of-type(N) / h5 + span) which mis-assign fields when
        # Climate-ADAPT omits empty rows.
        item.update(parse_content_metadata_from_html(html))

        # Overwrite geographic_characterisation and set health_impact from .geochar (label-based parsing)
        geo_obj, health_impact_val = parse_geochar_from_html(html)
        item["geographic_characterisation"] = geo_obj
        if health_impact_val is not None:
            item["health_impact"] = health_impact_val

        # Ordered list of images extracted from window.__data (hero + gallery).
        # On parse failure we still emit an empty list so downstream steps
        # can run idempotently; a single page with no images is not fatal.
        window_data = _parse_window_data(html)
        if window_data is None:
            print(
                f"  {html_path.name}: window.__data missing or unparseable; gallery_images=[]",
                file=sys.stderr,
            )
            item["gallery_images"] = []
        else:
            item["gallery_images"] = _build_gallery_images(window_data)

        out_path.write_text(json.dumps(item, indent=2, ensure_ascii=False), encoding="utf-8")
        if args.markdown and fulltext:
            md_path = args.output / (html_path.stem + ".md")
            md_path.write_text(fulltext, encoding="utf-8")
            print(f"  {html_path.name} -> {out_name}, {html_path.stem}.md")
        else:
            print(f"  {html_path.name} -> {out_name}")
        ok += 1

    print(f"\nWrote {ok}/{len(html_files)} JSON files to {args.output}")
    return 0 if ok == len(html_files) else 1


if __name__ == "__main__":
    sys.exit(main())
