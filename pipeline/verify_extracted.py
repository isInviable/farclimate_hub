#!/usr/bin/env python3
"""Pre-push verifier for extracted facet fields (hard-fail gate).

Validates climate_impacts / adaptation_approaches / sectors in every
pipeline/extracted/page_*.json before they are augmented and pushed to the DB.

Two independent layers, both must pass for every page:

  Layer A - ground-truth equality (independent oracle):
    Re-parse each source HTML's .content-metadata block with BeautifulSoup,
    keyed by <h5> label text, and assert set-equality with the extracted JSON.
    This is implemented differently from the regex-based extractor on purpose,
    so an extractor regression cannot pass verification.

  Layer B - controlled vocabulary:
    Every value must belong to its category's allowlist in facet_taxonomy.json.
    Catches taxonomy drift, typos, and unmapped values on future pages.

Exit code 0 when all pages pass; 1 otherwise.
"""
import json
import sys
import re
from pathlib import Path

from bs4 import BeautifulSoup

PIPE = Path(__file__).resolve().parent
EXTRACTED_DIR = PIPE / "extracted"
SOURCE_DIR = PIPE / "source_html"
TAXONOMY_PATH = PIPE / "facet_taxonomy.json"

LABEL_TO_KEY = {
    "keywords": "keywords",
    "climate impacts": "climate_impacts",
    "adaptation approaches": "adaptation_approaches",
    "sectors": "sectors",
}
# Layer A (re-parse equality) covers every label-based field.
FIELDS = ("keywords", "climate_impacts", "adaptation_approaches", "sectors")
# Layer B (controlled vocabulary) covers only the curated taxonomies; keywords are free-form.
VOCAB_FIELDS = ("climate_impacts", "adaptation_approaches", "sectors")


def load_taxonomy() -> dict[str, set[str]]:
    raw = json.loads(TAXONOMY_PATH.read_text(encoding="utf-8"))
    return {f: set(raw.get(f, [])) for f in VOCAB_FIELDS}


def ground_truth_from_html(html: str) -> dict[str, list[str]]:
    """Independent BeautifulSoup parse of the first .content-metadata block."""
    out: dict[str, list[str]] = {f: [] for f in FIELDS}
    soup = BeautifulSoup(html, "html.parser")
    block = soup.select_one(".content-metadata")
    if block is None:
        return out
    for h5 in block.find_all("h5"):
        label = h5.get_text(" ", strip=True).rstrip(":").strip().lower()
        key = LABEL_TO_KEY.get(label)
        if not key:
            continue
        sib = h5.find_next_sibling()
        if sib is None or sib.name not in ("p", "span"):
            continue
        value = sib.get_text(" ", strip=True)
        out[key] = [s.strip() for s in value.split(",") if s.strip()]
    return out


def as_list(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    if isinstance(value, str):
        return [s.strip() for s in value.split(",") if s.strip()]
    return []


def norm_text(s: str) -> str:
    """Collapse whitespace so HTML-parser spacing differences don't cause false diffs."""
    return re.sub(r"\s+", " ", s).strip()


def source_html_for(extracted_path: Path) -> Path | None:
    """extracted/page_N.json -> source_html/page_N.html (by stem)."""
    candidate = SOURCE_DIR / f"{extracted_path.stem}.html"
    return candidate if candidate.exists() else None


def main() -> int:
    if not EXTRACTED_DIR.is_dir():
        print(f"FAIL: extracted dir not found: {EXTRACTED_DIR}", file=sys.stderr)
        return 1
    taxonomy = load_taxonomy()

    files = sorted(
        EXTRACTED_DIR.glob("page_*.json"),
        key=lambda p: int(re.search(r"\d+", p.stem).group()),
    )
    if not files:
        print(f"FAIL: no extracted page_*.json in {EXTRACTED_DIR}", file=sys.stderr)
        return 1

    failures: list[str] = []
    checked = 0

    for f in files:
        item = json.loads(f.read_text(encoding="utf-8"))
        src = source_html_for(f)
        if src is None:
            failures.append(f"{f.stem}: missing source HTML in {SOURCE_DIR}")
            continue

        html = src.read_text(encoding="utf-8")
        truth = ground_truth_from_html(html)
        checked += 1

        for field in FIELDS:
            extracted_vals = as_list(item.get(field))
            truth_vals = truth[field]

            # Layer A: extracted must equal the independent re-parse (order-insensitive).
            extracted_set = {norm_text(v) for v in extracted_vals}
            truth_set = {norm_text(v) for v in truth_vals}
            if extracted_set != truth_set:
                missing = sorted(truth_set - extracted_set)
                extra = sorted(extracted_set - truth_set)
                failures.append(
                    f"{f.stem}: {field} mismatch vs source "
                    f"(missing={missing}, unexpected={extra})"
                )

            # Layer B: every extracted value must be in the canonical allowlist
            # (controlled-vocabulary fields only; keywords are free-form).
            if field in VOCAB_FIELDS:
                unknown = sorted(v for v in extracted_vals if v not in taxonomy[field])
                if unknown:
                    failures.append(
                        f"{f.stem}: {field} has values outside taxonomy: {unknown}"
                    )

    print(f"Verified {checked} page(s); fields checked: {', '.join(FIELDS)}")
    if failures:
        print(f"\nVERIFICATION FAILED ({len(failures)} issue(s)):", file=sys.stderr)
        for msg in failures:
            print(f"  - {msg}", file=sys.stderr)
        return 1

    print("VERIFICATION OK: all extracted facet fields match source and taxonomy.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
