## Context

- `buildPerHitUmapVectors` in `apps/web/app/utils/explorerBioregions.ts` builds rows as **bioregion multi-hot + 3× `umapJitter01(hit.id)`** dimensions.
- Search hits already expose `document.location` as **`[lat, lon]`** per `SearchResult` (`apps/web/app/types/search.d.ts`). Map view and API use the same field.
- `explorer-umap-bioregion` spec currently normatively describes **jitter** as the non–bioregion part of the vector.

## Goals / Non-Goals

**Goals:**

- Append **normalized latitude and longitude** per hit to the UMAP input vector so **geographic proximity** influences 2D layout alongside **bioregion similarity**.
- **Reduce** id-based jitter (target: **zero or one** optional dimension) once lat/lon provide separation; document the final choice in code comments aligned with spec.
- Handle **missing / invalid / placeholder** coordinates explicitly so UMAP never receives `NaN` and behavior is predictable.

**Non-Goals:**

- Changing search API or DB schema.
- Using full document embeddings or title text in this change.
- Perfect cartographic fidelity (UMAP remains non-linear; circles and overlap semantics stay as in current spec).

## Decisions

1. **Source of truth**  
   - **What**: Read `hit.document?.location` as `[lat, lon]` in **degrees**, same order as existing map code (`ViewModeMap`: `lat = location[0]`, `lon = location[1]`).  
   - **Why**: One field, already on hits.

2. **Invalid / unknown coordinates**  
   - **What**: Treat as invalid when: not a length-2 numeric array, non-finite values, or **both** lat and lon are **0** (matches common “no coords” placeholder in this codebase).  
   - **Missing/invalid**: Use a **fixed sentinel pair** in scaled space (e.g. both `0.5` after min-max, or center of chosen bbox) **or** two zeros in **normalized** geo dims with a separate binary “has_coords” flag (optional third dimension). **Preferred simple approach**: min-max scale valid points; invalid points get **median** or **centroid** of valid set, plus **at most one** jitter dim to avoid perfect stacking—only if empirical tests show ties.  
   - **Why**: Avoid `(0,0)` off Africa skewing layouts; keep vectors finite.

3. **Scaling lat/lon vs bioregion bits**  
   - **What**: After computing per-dimension values, **min-max normalize** lat and lon across **the current filtered hit list** to roughly **[0, 1]** (or clamp to EU bbox first then normalize if outliers dominate—**start with dataset min-max** for simplicity).  
   - **Why**: Raw degrees (~35–70 lat, -10–40 lon) would dominate L2/cosine-style distances relative to 0/1 bioregion bits.

4. **Jitter reduction**  
   - **What**: Remove **two or all three** jitter dimensions; keep **≤1** id-derived dimension only if QA shows degenerate overlaps for identical bioregion + identical valid coords.  
   - **Why**: User asked for **meaningful** position from geography, not random spread.

5. **UMAP hyperparameters**  
   - **What**: Revisit `nNeighbors` / `minDist` in `ViewModeBioregionUmap.vue` lightly after vector change if layouts collapse or over-stretch; document any tweak in commit message, not spec unless behaviorally required.

## Risks / Trade-offs

- **[Risk] Many hits lack valid coordinates** → Layout stays bioregion-dominant; sentinel + optional tiny jitter prevents NaN and excessive overlap.  
- **[Risk] Lat/lon dominates and “breaks” bioregion clustering** → Mitigation: min-max on batch + keep bioregion dimensions first; tune UMAP `minDist`.  
- **[Trade-off] Bioregion vs geography semantics** → Still one combined UMAP; tooltip remains authoritative for bioregion membership.

## Migration Plan

- Ship as a **client-only** change; rollback by reverting `explorerBioregions.ts` and spec delta. No migration.

## Open Questions

- Whether **0,0** always means “no location” in production data (confirm against a sample of hits).  
- Whether a fixed **EU bounding box** is preferable to **per-result min-max** for cross-session comparability (v1: per-result min-max for simplicity).
