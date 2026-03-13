#!/usr/bin/env python3
"""
Step 1 of the data pipeline: fetch and save raw HTML for each URL in the list.

This folder (source_html/) is the source of truth: all downstream steps
derive from these files. No extraction or transformation is applied—
only the HTML returned by the server is stored.

Usage:
  From repo root:
    python pipeline/fetch_html.py
  From pipeline/:
    python fetch_html.py

  With options:
    python pipeline/fetch_html.py --csv pipeline/data-5.csv --output pipeline/source_html --start 0 --end 10
"""

import asyncio
import csv
import json
import argparse
from pathlib import Path

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

MANIFEST_FILENAME = "url_manifest.json"


# Default paths relative to repository root
REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CSV = REPO_ROOT / "pipeline" / "data-5.csv"
DEFAULT_OUTPUT_DIR = REPO_ROOT / "pipeline" / "source_html"


def load_urls(csv_path: Path) -> list[str]:
    """Load URLs from CSV. First column (header 'About') is the URL."""
    urls = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader)  # skip header
        for row in reader:
            if row and row[0].strip():
                urls.append(row[0].strip())
    return urls


async def fetch_and_save_html(
    crawler: AsyncWebCrawler,
    url: str,
    output_path: Path,
) -> bool:
    """Fetch a single URL and save its raw HTML to output_path."""
    try:
        result = await crawler.arun(
            url=url,
            config=CrawlerRunConfig(cache_mode=CacheMode.BYPASS),
        )
        if result.success and result.html:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(result.html, encoding="utf-8")
            return True
        return False
    except Exception as e:
        print(f"  Error: {e}")
        return False


async def main():
    parser = argparse.ArgumentParser(
        description="Fetch and save raw HTML for each URL in the CSV (pipeline step 1)."
    )
    parser.add_argument(
        "--csv",
        type=Path,
        default=DEFAULT_CSV,
        help=f"Path to CSV with URLs (first column). Default: {DEFAULT_CSV}",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help=f"Directory to save HTML files. Default: {DEFAULT_OUTPUT_DIR}",
    )
    parser.add_argument(
        "--start",
        type=int,
        default=0,
        help="Start index (0-based). Default: 0",
    )
    parser.add_argument(
        "--end",
        type=int,
        default=None,
        help="End index (exclusive). Default: process all URLs",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.0,
        help="Seconds to wait between requests. Default: 1.0",
    )
    args = parser.parse_args()

    if not args.csv.exists():
        print(f"Error: CSV not found: {args.csv}")
        return 1

    urls = load_urls(args.csv)
    total = len(urls)
    end = args.end if args.end is not None else total
    urls_slice = urls[args.start:end]

    if not urls_slice:
        print("No URLs to process (check --start and --end).")
        return 1

    args.output.mkdir(parents=True, exist_ok=True)
    print(f"Source of truth directory: {args.output.resolve()}")
    print(f"URLs to process: {len(urls_slice)} (indices {args.start} to {end - 1})")
    print()

    browser_config = BrowserConfig(
        headless=True,
        java_script_enabled=True,
    )

    async with AsyncWebCrawler(config=browser_config) as crawler:
        ok = 0
        manifest = {}
        for i, url in enumerate(urls_slice):
            idx = args.start + i
            # Temporary filename: index-based. ID strategy (e.g. hash, slug) can be applied later.
            out_file = args.output / f"page_{idx}.html"
            manifest[out_file.stem] = url
            print(f"[{idx}] {url[:80]}...")
            success = await fetch_and_save_html(crawler, url, out_file)
            if success:
                ok += 1
                print(f"     -> {out_file.name}")
            else:
                print(f"     -> FAILED")
            await asyncio.sleep(args.delay)

        # Write manifest so extract_from_html.py can add source_url to each JSON
        manifest_path = args.output / MANIFEST_FILENAME
        manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        print(f"     -> {MANIFEST_FILENAME}")

    print()
    print(f"Done. Saved {ok}/{len(urls_slice)} HTML files to {args.output}")
    return 0 if ok == len(urls_slice) else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
