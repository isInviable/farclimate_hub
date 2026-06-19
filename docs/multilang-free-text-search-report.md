# Multilingual free-text search parity report

Generated: 2026-06-18T00:48:30.127Z

Endpoint: `POST /api/explorer-search` with `includeFacets: false`, `limit: 15`, hybrid mode (default).

Each intent uses the same informational need in three languages (`lang` must match query language).

## Summary

| Intent | Query (ES) | EN total | ES total | IT total | Overlap top-15 (all 3 langs) |
|--------|------------|----------|----------|----------|-------------------------------|
| Forestry / silviculture | `silvicultura` | 15 | 15 | 15 | 12 |
| Agriculture | `agricultura` | 15 | 15 | 15 | 12 |
| Mediterranean wildfires | `incendios mediterraneo` | 8 | 9 | 10 | 7 |
| Climate adaptation of crops | `adaptacion climatica de cultivos` | 15 | 0 | 15 | 0 |

## Findings

1. **English dominates recall** for forestry and crop-adaptation intents (ES/IT often 0 or much lower).
2. **Same case studies do align** when translations share distinctive terms (e.g. CALCHAS for Mediterranean fires; drought insurance Austria for agriculture).
3. **Infrastructure is per-language** (separate fulltext + embeddings per `lang`); gaps are mostly vocabulary and translation coverage, not facet logic.
4. **Italian FTS** was fixed (index/query both use `italian`); remaining IT gaps vs EN are content/synonym issues.

## Translation length parity (pipeline)

Source: `pipeline/caches/translation_parity_report.json` (145 document×lang pairs).

Average fulltext length ratio (translated/source): **1.12**.
Below floor (ratio < 0.5): **0**.

## Detail by intent

### Forestry / silviculture (`forestry`)

| Lang | Query | Total | Mode | Top titles |
|------|-------|-------|------|------------|
| en | `forestry` | 15 | hybrid | A community of practice for the sustainable management of forests surrounding the Occhito Lake in Puglia, Italy<br>Sustainability credits for promoting sustainable forestry in the Tuscan-Emilian Apennines, Italy<br>Sustainable climate change adaptation of forestry  in the province of Soria, Spain |
| es | `silvicultura` | 15 | hybrid | Créditos de sostenibilidad para promover la silvicultura sostenible en los Apeninos tosco-emilianos, Italia<br>Adaptación sostenible al cambio climático de la silvicultura en la provincia de Soria, España<br>Adaptación al cambio climático en un hayedo periurbano con gran afluencia de visitantes - Bosque de Soignes, Bélgica |
| it | `silvicoltura` | 15 | hybrid | Adattamento sostenibile della silvicoltura ai cambiamenti climatici nella provincia di Soria, Spagna<br>Crediti di sostenibilità per la promozione della silvicoltura sostenibile nell'Appennino Tosco-Emiliano, Italia<br>Soluzioni di ripristino forestale su larga scala per la resilienza a molteplici stress climatici in Renania Settentrionale-Vestfalia, Germania |

Overlap in top-15 `document_uid`: all three = **12**; en∩es = 13; en∩it = 14; es∩it = 13.

Shared across EN, ES, IT:

- `climateadapt::a-community-of-practice-for-the-sustainable-management-of-forests-surrounding-the-occhito-lake-in-puglia-italy`
- `climateadapt::sustainability-credits-for-promoting-sustainable-forestry-in-the-tuscan-emilian-apennines-italy`
- `climateadapt::sustainable-climate-change-adaptation-of-the-forest-sector-in-the-province-of-soria-spain`
- `climateadapt::managing-the-increasing-risk-of-wildfires-in-a-changing-climate-sweden`
- `climateadapt::prescribed-fire-and-grazing-as-integrated-approach-to-make-forests-climate-resilient-in-viseu-dao-lafoes-portugal`
- `climateadapt::how-to-choose-climate-adapted-tree-species-decision-support-for-forest-owners-in-hesse-germany`
- `climateadapt::building-fire-resilience-using-recycled-water-in-riba-roja-de-turia-spain`
- `climateadapt::climate-change-adaptation-in-a-peri-urban-beech-forest-with-a-high-number-of-visitors-sonian-forest-belgium`
- `climateadapt::bosco-limite-a-participatory-strategy-of-water-saving-and-aquifer-artificial-recharge-in-northern-italy`
- `climateadapt::autonomous-adaptation-to-droughts-in-an-agro-silvo-pastoral-system-in-alentejo`
- `climateadapt::nature-based-measures-against-rockfalls-over-forests-in-the-engadin-region-switzerland`
- `climateadapt::landscape-and-watershed-recovery-programme-for-the-kosice-region-of-slovakia`

### Agriculture (`agriculture`)

| Lang | Query | Total | Mode | Top titles |
|------|-------|-------|------|------------|
| en | `agriculture` | 15 | hybrid | Subsidised drought insurance for farmers in Austria<br>Autonomous adaptation to droughts in an agro-silvo-pastoral system in Alentejo<br>Adapting agriculture to wetter and drier climates: the Tullstorp stream Project (Sweden) |
| es | `agricultura` | 15 | hybrid | Adaptación autónoma a sequías en un sistema agrosilvopastoril en el Alentejo<br>Adaptación al cambio climático mediante la mejora de las prácticas de riego en el valle de Vipava, Eslovenia<br>Programa de recuperación de paisajes y cuencas hidrográficas para la región de Košice en Eslovaquia |
| it | `agricoltura` | 15 | hybrid | Adattamento autonomo alla siccità in un sistema agro-silvo-pastorale in Alentejo<br>Adattamento ai cambiamenti climatici migliorando le pratiche irrigue nella Valle del Vipava, Slovenia<br>Agroforestazione: agricoltura del futuro? Il caso di Montpellier |

Overlap in top-15 `document_uid`: all three = **12**; en∩es = 13; en∩it = 13; es∩it = 13.

Shared across EN, ES, IT:

- `climateadapt::Subsidised-drought-insurance-for-farmers-in-Austria`
- `climateadapt::autonomous-adaptation-to-droughts-in-an-agro-silvo-pastoral-system-in-alentejo`
- `climateadapt::adapting-agriculture-to-wetter-and-drier-climates-the-tullstorp-stream-project-sweden`
- `climateadapt::irrinet-it-irrigation-system-for-agricultural-water-management-in-emilia-romagna-italy`
- `climateadapt::agroforestry-agriculture-of-the-future-the-case-of-montpellier`
- `climateadapt::temporary-flood-water-storage-in-agricultural-areas-in-the-middle-tisza-river-basin-hungary`
- `climateadapt::landscape-and-watershed-recovery-programme-for-the-kosice-region-of-slovakia`
- `climateadapt::the-integrated-system-of-nature-based-solutions-to-mitigate-floods-and-drought-risks-in-the-serchio-river-basin-italy`
- `climateadapt::adapting-to-climate-change-by-improving-irrigation-practice-in-vipava-valley-slovenia`
- `climateadapt::natural-water-retention-measures-in-the-altovicentino-area-italy`
- `climateadapt::moor-protection-in-the-allgau-region-germany-through-a-stakeholder-based-approach`
- `climateadapt::crop-diversification-and-improved-soil-management-for-adaptation-to-climate-change-in-segovia-spain`

### Mediterranean wildfires (`mediterranean_fires`)

| Lang | Query | Total | Mode | Top titles |
|------|-------|-------|------|------------|
| en | `mediterranean wildfires` | 8 | hybrid | CALCHAS - An integrated analysis system for the effective fire conservancy of forests<br>Building fire resilience using recycled water in Riba-Roja de Túria, Spain<br>Sustainable climate change adaptation of forestry  in the province of Soria, Spain |
| es | `incendios mediterraneo` | 9 | hybrid | Fomento de la resiliencia contra incendios con agua reciclada en Riba-Roja de Túria, España<br>Adaptación sostenible al cambio climático de la silvicultura en la provincia de Soria, España<br>Una comunidad de práctica para la gestión sostenible de los bosques alrededor del lago Occhito en Apulia, Italia |
| it | `incendi mediterranei` | 10 | hybrid | CALCHAS - Un sistema di analisi integrato per l'efficace conservazione antincendio delle foreste<br>Costruire la resilienza agli incendi usando acqua riciclata a Riba-Roja de Túria, Spagna<br>Una comunità di pratica per la gestione sostenibile delle foreste intorno al Lago di Occhito in Puglia |

Overlap in top-15 `document_uid`: all three = **7**; en∩es = 7; en∩it = 8; es∩it = 9.

Shared across EN, ES, IT:

- `climateadapt::building-fire-resilience-using-recycled-water-in-riba-roja-de-turia-spain`
- `climateadapt::sustainable-climate-change-adaptation-of-the-forest-sector-in-the-province-of-soria-spain`
- `climateadapt::a-community-of-practice-for-the-sustainable-management-of-forests-surrounding-the-occhito-lake-in-puglia-italy`
- `climateadapt::prescribed-fire-and-grazing-as-integrated-approach-to-make-forests-climate-resilient-in-viseu-dao-lafoes-portugal`
- `climateadapt::autonomous-adaptation-to-droughts-in-an-agro-silvo-pastoral-system-in-alentejo`
- `climateadapt::sustainability-credits-for-promoting-sustainable-forestry-in-the-tuscan-emilian-apennines-italy`
- `climateadapt::tamera-water-retention-landscape-to-restore-the-water-cycle-and-reduce-vulnerability-to-droughts`

### Climate adaptation of crops (`crop_climate_adaptation`)

| Lang | Query | Total | Mode | Top titles |
|------|-------|-------|------|------------|
| en | `climate adaptation of crops` | 15 | hybrid | Crop diversification and improved soil management for adaptation to climate change in Segovia (Spain)<br>Improving soil structure of an arable crop farm in the district of Heilbronn (Germany)<br>Autonomous adaptation to droughts in an agro-silvo-pastoral system in Alentejo |
| es | `adaptacion climatica de cultivos` | 0 | hybrid | — |
| it | `adattamento climatico colture` | 15 | hybrid | Diversificazione delle colture e migliore gestione del suolo per l'adattamento ai cambiamenti climatici a Segovia (Spagna)<br>Miglioramento della struttura del suolo di un'azienda agricola nel distretto di Heilbronn (Germania)<br>Adattamento autonomo alla siccità in un sistema agro-silvo-pastorale in Alentejo |

Overlap in top-15 `document_uid`: all three = **0**; en∩es = 0; en∩it = 12; es∩it = 0.

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
