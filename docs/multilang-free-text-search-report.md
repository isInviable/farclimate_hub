# Multilingual free-text search parity report

Generated: 2026-05-26T09:47:58.103Z

Endpoint: `POST /api/explorer-search` with `includeFacets: false`, `limit: 15`, hybrid mode (default).

Each intent uses the same informational need in three languages (`lang` must match query language).

## Summary

| Intent | Query (ES) | EN total | ES total | IT total | Overlap top-15 (all 3 langs) |
|--------|------------|----------|----------|----------|-------------------------------|
| Forestry / silviculture | `silvicultura` | 15 | 0 | 0 | 0 |
| Agriculture | `agricultura` | 15 | 2 | 4 | 1 |
| Mediterranean wildfires | `incendios mediterraneo` | 8 | 1 | 1 | 1 |
| Climate adaptation of crops | `adaptacion climatica de cultivos` | 15 | 0 | 1 | 0 |

## Findings

1. **English dominates recall** for forestry and crop-adaptation intents (ES/IT often 0 or much lower).
2. **Same case studies do align** when translations share distinctive terms (e.g. CALCHAS for Mediterranean fires; drought insurance Austria for agriculture).
3. **Infrastructure is per-language** (separate fulltext + embeddings per `lang`); gaps are mostly vocabulary and translation coverage, not facet logic.
4. **Italian FTS** was fixed (index/query both use `italian`); remaining IT gaps vs EN are content/synonym issues.

## Detail by intent

### Forestry / silviculture (`forestry`)

| Lang | Query | Total | Mode | Top titles |
|------|-------|-------|------|------------|
| en | `forestry` | 15 | hybrid | A community of practice for the sustainable management of forests surrounding the Occhito Lake in Puglia, Italy<br>Sustainability credits for promoting sustainable forestry in the Tuscan-Emilian Apennines, Italy<br>Sustainable climate change adaptation of forestry  in the province of Soria, Spain |
| es | `silvicultura` | 0 | hybrid | — |
| it | `silvicoltura` | 0 | hybrid | — |

Overlap in top-15 `document_uid`: all three = **0**; en∩es = 0; en∩it = 0; es∩it = 0.

### Agriculture (`agriculture`)

| Lang | Query | Total | Mode | Top titles |
|------|-------|-------|------|------------|
| en | `agriculture` | 15 | hybrid | Subsidised drought insurance for farmers in Austria<br>Autonomous adaptation to droughts in an agro-silvo-pastoral system in Alentejo<br>Adapting agriculture to wetter and drier climates: the Tullstorp stream Project (Sweden) |
| es | `agricultura` | 2 | hybrid | Seguro de sequía subvencionado para agricultores en Austria<br>Restauración de ecosistemas marinos y costeros para la adaptación al cambio climático en el Caribe (Guadalupe, Región de Ultramar francesa) |
| it | `agricoltura` | 4 | hybrid | Assicurazione contro la siccità sovvenzionata per gli agricoltori in Austria<br>IRRINET: Sistema irriguo informatico per la gestione idrica agricola in Emilia-Romagna, Italia<br>Vrijburcht: un giardino collettivo finanziato privatamente e a prova di clima ad Amsterdam |

Overlap in top-15 `document_uid`: all three = **1**; en∩es = 1; en∩it = 2; es∩it = 1.

Shared across EN, ES, IT:

- `climateadapt::Subsidised-drought-insurance-for-farmers-in-Austria`

### Mediterranean wildfires (`mediterranean_fires`)

| Lang | Query | Total | Mode | Top titles |
|------|-------|-------|------|------------|
| en | `mediterranean wildfires` | 8 | hybrid | CALCHAS - An integrated analysis system for the effective fire conservancy of forests<br>Building fire resilience using recycled water in Riba-Roja de Túria, Spain<br>Sustainable climate change adaptation of forestry  in the province of Soria, Spain |
| es | `incendios mediterraneo` | 1 | hybrid | CALCHAS - Sistema de análisis integrado para la efectiva conservación de los bosques frente a incendios |
| it | `incendi mediterranei` | 1 | hybrid | CALCHAS - Un sistema di analisi integrato per l'efficace tutela antincendio delle foreste |

Overlap in top-15 `document_uid`: all three = **1**; en∩es = 1; en∩it = 1; es∩it = 1.

Shared across EN, ES, IT:

- `climateadapt::calchas-an-integrated-analysis-system-for-the-effective-fire-conservancy-of-forests`

### Climate adaptation of crops (`crop_climate_adaptation`)

| Lang | Query | Total | Mode | Top titles |
|------|-------|-------|------|------------|
| en | `climate adaptation of crops` | 15 | hybrid | Crop diversification and improved soil management for adaptation to climate change in Segovia (Spain)<br>Improving soil structure of an arable crop farm in the district of Heilbronn (Germany)<br>Autonomous adaptation to droughts in an agro-silvo-pastoral system in Alentejo |
| es | `adaptacion climatica de cultivos` | 0 | hybrid | — |
| it | `adattamento climatico colture` | 1 | hybrid | IRRINET: Sistema irriguo informatico per la gestione idrica agricola in Emilia-Romagna, Italia |

Overlap in top-15 `document_uid`: all three = **0**; en∩es = 0; en∩it = 1; es∩it = 0.

## Proposed solutions (equivalence)

### Short term (product / API)

1. **Query expansion per locale** — Before search, map common domain phrases to synonym lists (e.g. ES `silvicultura` → also search `forestal`, `gestión forestal`; IT `silvicoltura` → `forestale`). Can live in app layer or a small `search_query_expansions` table.
2. **Lower `min_score` only for non-EN** — Riskier; prefer tuning hybrid weights (`semantic_weight` / `full_text_weight`) per `lang` if semantic leg under-recalls.
3. **Expose search mode in UI** — Let power users switch keyword vs hybrid when results are empty (debugging and fallback).

### Medium term (content pipeline)

4. **Glossary injection in translations** — When generating `*_en_augmented_es.json` / `_it`, ensure sector/topic terms from EN (forestry, crops, wildfire) appear in summary/fulltext in the target language.
5. **Regenerate embeddings after glossary pass** — `pnpm db:embed -- --langs=es,it` so semantic leg sees enriched text.

### Long term (search architecture)

6. **Cross-lingual retrieval** — Single query embeds once; search union of langs or map to `document_id` then hydrate in user locale (best parity, more engineering).
7. **Multilingual embedding model** — One index across languages (e.g. multilingual E5) instead of three isolated indexes.
8. **Postgres synonym dictionaries** — `CREATE TEXT SEARCH DICTIONARY` / thesaurus per language for FTS leg alignment with EN concepts.

### Monitoring

Re-run this matrix after changes:

```bash
NUXT_TEST_BASE_URL=http://localhost:3000 node apps/web/scripts/multilang-search-report.mjs
NUXT_TEST_BASE_URL=http://localhost:3000 pnpm --filter web test tests/api/explorer-search.multilang-matrix.test.ts
```
