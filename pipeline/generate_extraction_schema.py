#!/usr/bin/env python3
"""
Generate a CSS extraction schema for Climate-ADAPT case study pages.

Use this script to produce a schema that extracts the fields needed for the
pipeline. You can provide HTML from a URL (fetched with crawl4ai) or from a
local file (e.g. pipeline/source_html/page_1.html). The generated schema
is saved to a JSON file; you can then edit it and use it in extract_from_html.py.

Instructions passed to the LLM stress:
- Extract ALL items in lists (images, documents, websites, adapt_options).
- Prefer type "list" for any repeating block; use a selector that matches
  each item, not the container.
- Contact: structure as much as possible (e.g. name, email, phone, org).
"""

import argparse
import asyncio
import json
import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode, LLMConfig
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy

# Load .env from pipeline/ or repo root
REPO_ROOT = Path(__file__).resolve().parent.parent
for d in [Path(__file__).resolve().parent, REPO_ROOT]:
    env_file = d / ".env"
    if env_file.exists():
        load_dotenv(env_file)
        break

DEFAULT_OUTPUT = Path(__file__).resolve().parent / "extraction_schema_generated.json"

# Instruction so the LLM produces a schema that extracts all list items and desired fields
SCHEMA_QUERY = """
Target: Climate-ADAPT case study / metadata pages (single item per page, with metadata and sections).

CRITICAL - Climate-ADAPT HTML structure (use these exact patterns when possible):
- subtitle: NOT the element with class "subtitle" (that is the category e.g. "Case Studies"). The real subtitle is the first summary paragraph (italic) in the main content: the first <p> with <i> text after the main image, e.g. ".case-studies-review-image-wrapper + div p:first-of-type" to get the paragraph that contains "The Port Authority, in collaboration with...".
- image_url: the primary/hero image URL (single text or attribute). Use ".case-studies-review-image-wrapper img" with attribute "src".
- references: MUST be type "list". Each item = one reference link. Selector for each link: "#source div p a". Each item has "title" (link text) and "url" (href). Do NOT take the whole #source as text (that mixes in "Published in Climate-ADAPT" date).
- contact: full text of the contact block. Selector "#contact" or "#contact .section" then take the inner div text (the section content, not the "Contact" heading).
- websites: list of links from "#websites .item a" or "#websites div[role=listitem] a", each with url and label.
- adapt_options: list of links from "#adapt_options_anchor .item a" or "#adapt_options_anchor div[role=listitem] a", each with url and label.
- creation_date: from the metadata column, e.g. ".content-metadata h5" whose text is "Date of creation:" then the following sibling p. Use ".content-metadata h5:nth-of-type(1) + p" if the first h5 is Date of creation.
- case_study_documents: list from ".documents-list .item a" or "a.document-list-item", each item with title (span or link text) and url (href).

Required fields:
- title (text, h1.documentFirstHeading or similar)
- subtitle (text, first summary paragraph after main image - see CRITICAL above)
- image_url (text or attribute: primary image src from .case-studies-review-image-wrapper img)
- images (type "list", optional: all images; each item url/alt)
- adapt_options (type "list"); selector must match each link in #adapt_options_anchor
- contact (text or nested); selector #contact or its content div
- websites (type "list"); selector must match each link in #websites
- references (type "list"); each item = one reference with title and url from #source div p a
- creation_date (text)
- keywords, climate_impacts, adaptation_approaches, sectors, governance_level (text or list)
- case_study_documents (type "list"); each item title + url from .documents-list
- geographic_characterisation (nested): continent, macro_transnational_region, countries, sub_nationals, city

Also: stakeholder_participation, success_limitations, cost_benefit, implementation_time, lifetime (section content by id, e.g. #stake_holder_anchor + div or #stake_holder_anchor .section content).

Rules:
- Use ONLY CSS selectors. No XPath. baseSelector: .case-study-view or .db-item-view.
- references MUST be a list of {title, url}, one entry per link in #source div p a.
"""

# Fields that are redundant with fulltext (content already in fulltext); exclude from schema.
FIELDS_REDUNDANT_WITH_FULLTEXT = frozenset({
    "challenges",
    "stakeholder_participation",
    "success_limitations",
    "cost_benefit",
    "implementation_time",
    "lifetime",
})

# Overlay: exact field definitions for Climate-ADAPT. Applied after LLM generation to fix known selectors.
CLIMATE_ADAPT_FIELD_OVERLAY = [
    {"name": "subtitle", "selector": ".case-studies-review-image-wrapper + div p:first-of-type", "type": "text"},
    {"name": "image_url", "selector": ".case-studies-review-image-wrapper img", "type": "attribute", "attribute": "src"},
    {"name": "adapt_options", "type": "list", "selector": "#adapt_options_anchor .item a", "fields": [
        {"name": "label", "type": "text"},
        {"name": "url", "type": "attribute", "attribute": "href"},
    ]},
    {"name": "contact", "selector": "#contact div", "type": "text"},
    {"name": "websites", "type": "list", "selector": "#websites .item a", "fields": [
        {"name": "label", "type": "text"},
        {"name": "url", "type": "attribute", "attribute": "href"},
    ]},
    {"name": "references", "type": "list", "selector": "#source div p a", "fields": [
        {"name": "title", "type": "text"},
        {"name": "url", "type": "attribute", "attribute": "href"},
    ]},
    {"name": "creation_date", "selector": ".content-metadata h5:nth-of-type(1) + p", "type": "text"},
    {"name": "case_study_documents", "type": "list", "selector": ".documents-list .item a", "fields": [
        {"name": "title", "selector": "span", "type": "text"},
        {"name": "url", "type": "attribute", "attribute": "href"},
    ]},
]


def get_html_from_file(html_path: Path) -> str | None:
    """Read HTML from a local file."""
    if not html_path.exists():
        print(f"Error: File not found: {html_path}", file=sys.stderr)
        return None
    return html_path.read_text(encoding="utf-8")


async def get_html_from_url(url: str) -> str | None:
    """Fetch HTML from URL using crawl4ai."""
    browser_config = BrowserConfig(headless=True, java_script_enabled=True)
    async with AsyncWebCrawler(config=browser_config) as crawler:
        result = await crawler.arun(
            url=url,
            config=CrawlerRunConfig(cache_mode=CacheMode.BYPASS),
        )
        if result.success and result.html:
            return result.html
        print(f"Error: Failed to fetch URL: {result.error_message or 'No HTML'}", file=sys.stderr)
        return None


def _xpath_to_css(sel: str) -> str:
    """Convert common XPath patterns to CSS. Returns original if not recognized."""
    if not sel or not isinstance(sel, str):
        return sel
    s = sel.strip()
    if not s.startswith("/") and not s.startswith(".//") and "[@" not in s:
        return sel
    # //div[contains(@class, 'x')] or .//div[contains(@class, 'x')] -> div[class*="x"]
    m = re.match(r"^\.?//?(\w+)\[contains\(@class,\s*['\"]([^'\"]+)['\"]\)\]$", s)
    if m:
        tag, cls = m.groups()
        return f'{tag}[class*="{cls}"]'
    # //div[@id='x'] or .//div[@id='x'] -> #x
    m = re.match(r"^\.?//?(?:\w+)?\[@id=['\"]([^'\"]+)['\"]\]$", s)
    if m:
        return "#" + m.group(1)
    # .//div[@id='x']//... -> #x ... (convert rest recursively)
    m = re.match(r"^\.?//?(?:\w+)?\[@id=['\"]([^'\"]+)['\"]\]//\s*(.+)$", s)
    if m:
        rest = _xpath_to_css("//" + m.group(2).strip())
        return f"#{m.group(1)} {rest}" if rest != "//" + m.group(2).strip() else f"#{m.group(1)} *"
    # .//tag[contains(@attr, 'val')] -> tag[attr*="val"]
    m = re.match(r"^\.?//?(\w+)\[contains\(@(\w+),\s*['\"]([^'\"]+)['\"]\)\]$", s)
    if m:
        tag, attr, val = m.groups()
        return f'{tag}[{attr}*="{val}"]'
    return sel


def _schema_to_css(schema: dict) -> dict:
    """Rewrite XPath selectors in schema to CSS where possible."""
    out = json.loads(json.dumps(schema))
    base = out.get("baseSelector", "")
    if base:
        out["baseSelector"] = _xpath_to_css(base)
    for field in out.get("fields", []):
        sel = field.get("selector", "")
        if sel:
            field["selector"] = _xpath_to_css(sel)
        for sub in field.get("fields", []):
            s = sub.get("selector", "")
            if s:
                sub["selector"] = _xpath_to_css(s)
    return out


def _apply_climate_adapt_overlay(schema: dict) -> dict:
    """Merge Climate-ADAPT field overlay into schema so key fields use known-good selectors.
    Drops fields that are redundant with fulltext."""
    if not schema or "fields" not in schema:
        return schema
    overlay_by_name = {f["name"]: f for f in CLIMATE_ADAPT_FIELD_OVERLAY}
    fields_out = []
    for field in schema["fields"]:
        name = field.get("name")
        if name in FIELDS_REDUNDANT_WITH_FULLTEXT:
            continue
        if name in overlay_by_name:
            fields_out.append(json.loads(json.dumps(overlay_by_name[name])))
        else:
            fields_out.append(field)
    for name in overlay_by_name:
        if name not in (f.get("name") for f in fields_out):
            fields_out.append(json.loads(json.dumps(overlay_by_name[name])))
    schema["fields"] = fields_out
    return schema


def generate_schema(html: str, llm_config: LLMConfig) -> dict | None:
    """Generate extraction schema from HTML using the LLM. Prefer CSS selectors."""
    try:
        schema = JsonCssExtractionStrategy.generate_schema(
            html=html,
            schema_type="css",
            query=SCHEMA_QUERY,
            llm_config=llm_config,
        )
        if schema:
            schema = _schema_to_css(schema)
            schema = _apply_climate_adapt_overlay(schema)
        return schema
    except Exception as e:
        print(f"Error generating schema: {e}", file=sys.stderr)
        return None


def main():
    parser = argparse.ArgumentParser(
        description="Generate a CSS extraction schema from a sample HTML (URL or file)."
    )
    parser.add_argument(
        "--url",
        type=str,
        default=None,
        help="Sample URL to fetch and use for schema generation.",
    )
    parser.add_argument(
        "--html",
        type=Path,
        default=None,
        help="Path to a local HTML file (e.g. pipeline/source_html/page_1.html).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Output path for the generated schema JSON. Default: {DEFAULT_OUTPUT}",
    )
    parser.add_argument(
        "--provider",
        type=str,
        default="openai/gpt-4o",
        help=(
            "LLM provider and model (LiteLLM format). "
            "Examples: openai/gpt-4o, openai/gpt-4o-mini, gemini/gemini-2.0-flash, gemini/gemini-2.5-flash, gemini/gemini-2.5-pro. "
            "For Gemini use GEMINI_API_KEY in .env; for OpenAI use OPENAI_API_KEY."
        ),
    )
    args = parser.parse_args()

    if not args.url and not args.html:
        parser.error("Provide either --url or --html.")
    if args.url and args.html:
        parser.error("Provide only one of --url or --html.")

    # Pick API key from provider: Gemini uses GEMINI_API_KEY, OpenAI uses OPENAI_API_KEY
    if args.provider.startswith("gemini/"):
        api_key = os.getenv("GEMINI_API_KEY")
        key_name = "GEMINI_API_KEY"
    else:
        api_key = os.getenv("OPENAI_API_KEY")
        key_name = "OPENAI_API_KEY"
    if not api_key:
        print(
            f"Error: {key_name} not set. Set it in pipeline/.env or repo .env.",
            file=sys.stderr,
        )
        return 1

    if args.html:
        html = get_html_from_file(args.html)
    else:
        html = asyncio.run(get_html_from_url(args.url))
    if not html:
        return 1

    llm_config = LLMConfig(provider=args.provider, api_token=api_key)
    schema = generate_schema(html, llm_config)
    if not schema:
        return 1

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(schema, indent=2), encoding="utf-8")
    print(f"Schema written to {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
