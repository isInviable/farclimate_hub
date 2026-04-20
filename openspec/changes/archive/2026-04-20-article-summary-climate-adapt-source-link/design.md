## Context

- **Storage:** `knowledge.documents.source_url` holds the original case study URL (e.g. `https://climate-adapt.eea.europa.eu/en/metadata/case-studies/...`). Ingestion sets it via `packages/db/src/push-climate-adapt.ts` from JSON `source_url`.
- **API / app:** `mapKnowledgeRowToArticleDocument` already passes `source_url` through to the explorer `document` object (`knowledgeDocument.ts`). No new RPC or column is required.
- **UI gap:** `ArticleSummaryView.vue` does not render `source_url` today.

## Goals / Non-Goals

**Goals:**

- Show one prominent outbound link in the **Summary** tab when `document.source_url` is present and looks like `http://` or `https://`.
- Use **i18n** for the link label (and optional helper text). Mark the link `target="_blank"` and `rel="noopener noreferrer"`.
- Fit existing layout: place the link **above or directly below** the short-description block (first column-spanning section), or in a slim row with icon (`i-lucide-external-link` or Nuxt UI icon), consistent with Nuxt UI + Tailwind.

**Non-Goals:**

- Fetching or validating URLs at runtime beyond a simple scheme check (no HEAD request).
- Showing the link on every tab (`structured`, `full`) in v1 unless product asks later.
- Rewriting URLs or supporting non–Climate-ADAPT sources differently in v1 (generic “original source” copy is enough).

## Decisions

1. **Visibility guard** — Render only if `typeof source_url === 'string' && /^https?:\/\//i.test(source_url.trim())`. Empty or invalid strings hide the block (no error).

2. **Component** — Prefer **`UButton`** with `to` as external URL, or native `<a>` with Tailwind inside a `div`/`p` for minimal chrome. Avoid duplicating `SelectableBlock` pin semantics on this link unless product asks (pin story is separate).

3. **Copy** — Primary label key e.g. `article.viewOnClimateAdapt` (EN) / ES equivalent; optional second line `article.sourceLinkHint` if we need “Opens on EEA Climate-ADAPT”.

4. **Accessibility** — Link text SHALL be descriptive (not “click here”); `aria` can reinforce external navigation.

## Risks / Trade-offs

- **[Risk]** Some documents may have stale or wrong `source_url` from pipeline — **Mitigation:** same trust as data ingest; no extra validation in UI.
- **[Risk]** Non–Climate-ADAPT rows might still have `source_url` — **Mitigation:** generic i18n (“View original article”) keeps wording accurate without hard-coding only EEA.

## Migration Plan

Frontend-only deploy; rollback by reverting the Vue + locale changes.

## Open Questions

- Whether to show `source_type` (e.g. `climate_adapt_case_study`) next to the link for power users — **deferred** unless requested.
