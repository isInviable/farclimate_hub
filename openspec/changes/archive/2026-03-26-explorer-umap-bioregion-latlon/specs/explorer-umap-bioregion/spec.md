# explorer-umap-bioregion (delta)

## MODIFIED Requirements

### Requirement: UMAP from per-hit feature vectors

Two-dimensional positions for hit dots SHALL be computed with **UMAP** (`umap-js` or equivalent) from **per-hit** vectors that include:

1. A **multi-hot** over the sorted union of bioregions in the current result set (unchanged semantics versus the pre-change baseline).

2. **Two dimensions** encoding **latitude and longitude** from each hit’s `document.location` when that field is a **pair of finite numbers** in **degrees**, in the same axis order used elsewhere in the explorer for map display (first element latitude, second longitude). The client SHALL **exclude** coordinates treated as **non-geographic placeholders** (at minimum, when both latitude and longitude are **zero**, consistent with “no usable point” in existing map usage). For hits with **missing or invalid** coordinates, the client SHALL substitute a **defined non-NaN** encoding (e.g. sentinel values after scaling and/or a small deterministic tie-break) so every row has the **same vector length** and UMAP does not error.

3. **Scaling**: Latitude and longitude dimensions SHALL be **normalized** relative to the **current filtered hit set** (e.g. min–max to a bounded range) so that geographic components do not **overwhelmingly dominate** the bioregion multi-hot bits in distance calculations used by UMAP.

4. **Jitter**: **Id-derived jitter** dimensions SHALL be **reduced** relative to the pre-change baseline of **three** dimensions; **at most one** optional id-derived dimension MAY remain solely to break **exact** ties after bioregion + location encoding. The primary separation for hits sharing the same bioregion set SHALL come from **geographic position** where valid coordinates exist, not from pseudo-random jitter alone.

The client SHALL guard single-hit and degenerate cases with a non-throwing fallback layout.

#### Scenario: Few hits

- **WHEN** the filtered set has only one hit
- **THEN** the client SHALL still render a legible position without throwing

#### Scenario: Valid coordinates contribute to the vector

- **WHEN** a hit has `document.location` with two finite values that are not rejected as placeholders
- **THEN** the UMAP input row for that hit SHALL include scaled latitude and longitude dimensions derived from those values

#### Scenario: Missing or invalid coordinates

- **WHEN** a hit lacks `document.location`, has non-finite values, or matches the defined placeholder rule
- **THEN** the client SHALL still produce a finite UMAP input row of consistent length and SHALL NOT pass NaN to UMAP

#### Scenario: Same bioregions, different coordinates

- **WHEN** two hits share the same normalized bioregion multi-hot but have distinct valid coordinates
- **THEN** their UMAP input vectors SHALL differ in the geographic dimensions so the layout MAY separate them without relying solely on id jitter
