# Explorer UMAP bioregion (bubble) view

The explorer “by bioRegions” (bubble) mode SHALL show a **two-dimensional UMAP** of **search hits**, **one uniform dot per hit**, and **one dashed enclosing circle per distinct bioregion** that contains all dots for hits attributed to that region. Region labels SHALL be visible without hover. The canvas SHALL be pannable. Users SHALL focus one bioregion to dim unrelated geometry. Tooltips SHALL surface counts and per-hit bioregion lists. **Overlapping region circles** are expected: a hit with a single bioregion MAY still lie inside another region’s circle in screen space because layout is similarity-based and circles are geometric hulls, not territorial partitions.

---

### Requirement: Bubble view replaces placeholder

When the user selects the explorer view mode labeled for biogeographical regions (bubble / “by bioRegions”), the client SHALL render the bioregion UMAP visualization for the **current filtered hits**, not a permanent placeholder.

#### Scenario: Non-empty results

- **WHEN** the explorer has a non-empty filtered hit list and the user activates the bioregion bubble view mode
- **THEN** the main results area SHALL display the visualization with one dot per hit and at least one bioregion circle when the result set implies at least one bioregion facet value

#### Scenario: Empty results

- **WHEN** the filtered hit list is empty
- **THEN** the client SHALL show a clear empty state and SHALL NOT error

### Requirement: Bioregion normalization matches facets

For each hit, bioregion membership SHALL be derived from `document.geographic_characterisation.biogeographical_regions` with the same rules as elsewhere in the explorer: comma-separated strings split and trimmed, JSON arrays of strings honored, and missing or empty values mapped to **`no-identificados`**.

#### Scenario: Multiple regions on one hit

- **WHEN** a hit lists multiple bioregions
- **THEN** that hit SHALL contribute to every enclosing circle (and counts) for each listed value

### Requirement: One dot per search hit with uniform size

The client SHALL draw **exactly one** interactive dot per filtered hit. All hit dots SHALL use the **same** radius (no size encoding by count or other metrics in this version). The layout SHALL be **flat 2D** only (no extruded cylinders or pseudo-3D height).

#### Scenario: Same radius for all hits

- **WHEN** two hits have different numbers of attributed bioregions
- **THEN** both dots SHALL still use the same geometric radius

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

### Requirement: One enclosing circle per bioregion

For each distinct bioregion present in the filtered set, the client SHALL render a **dashed** circle (or project-equivalent stroke) that **encloses all hit dots** for hits that include that bioregion, using a **smallest enclosing circle** (or equivalent) with padding. A hit that belongs to multiple bioregions lies inside **each** of those circles.

#### Scenario: Single hit in a bioregion

- **WHEN** exactly one hit has a given bioregion
- **THEN** the client SHALL still draw a legible minimum circle for that bioregion

### Requirement: Visible bioregion labels

Each bioregion circle SHALL have an **always-visible** text label (truncation allowed for long names). Labels SHALL remain readable (e.g. contrast stroke) and SHALL not block pointer interaction on dots where the implementation separates hit-testing order.

#### Scenario: Label without hover

- **WHEN** the bioregion view is shown and the user does not hover
- **THEN** each rendered bioregion SHALL still show its label

### Requirement: Tooltips for regions and hits

Hovering a **bioregion circle** SHALL show a tooltip with the **region name** and **hit count** for that region in the filtered set. Hovering a **hit dot** SHALL show the **document title** (or equivalent) and a **list of that hit’s bioregions** (normalized values).

#### Scenario: Hit tooltip lists bioregions

- **WHEN** the user hovers a hit dot that has one or more normalized bioregions
- **THEN** the tooltip SHALL enumerate those bioregions (e.g. as a short list)

### Requirement: Pannable canvas without breaking clicks

The visualization SHALL support **drag-to-pan** the translated layer. Panning SHALL **not** prevent **`click`** from firing on hit dots or bioregion circles (e.g. avoid pointer capture that retargets `click` away from those targets; use document/window-level move/up tracking if needed).

#### Scenario: Click after no drag

- **WHEN** the user presses and releases on a bioregion circle without exceeding the pan movement threshold
- **THEN** the client SHALL deliver a normal click to that circle’s focus handler

### Requirement: Focus one bioregion and clear on empty click

The client SHALL allow **selecting a focused bioregion** by **clicking** its circle. While a bioregion is focused, **other** bioregion circles, their labels, and hit dots **not** containing that bioregion SHALL render at a **reduced opacity**; matching hits and the focused region’s geometry SHALL remain at full opacity. **Clicking** on **empty** chart background (outside hit and region targets) SHALL clear the focus.

#### Scenario: Focus dims non-members

- **WHEN** a bioregion is focused and a hit does not include that bioregion
- **THEN** that hit’s dot SHALL render faded relative to hits that include the focused bioregion

#### Scenario: Clear focus

- **WHEN** a bioregion is focused and the user clicks empty background
- **THEN** the client SHALL clear focus and restore full opacity for all elements

### Requirement: Hit opens explorer document panel

Clicking a hit dot (without a preceding pan gesture that suppresses click) SHALL emit **`document-selected`** with that hit’s document when a stable document id exists, consistent with other explorer view modes.

#### Scenario: Open side panel

- **WHEN** the user clicks a hit dot that has `document.id`
- **THEN** the explorer SHALL open the article side panel for that document

### Requirement: Overlapping circles do not imply extra bioregions

The specification SHALL treat **geometric overlap** of bioregion enclosing circles as **expected**: a hit assigned **only** bioregion A MAY still fall inside the drawn circle for bioregion B in 2D because UMAP places dots by **vector similarity** and circles are **minimum enclosing disks** in that plane, not exclusive regions. **Authoritative** bioregion membership for a hit remains the **normalized list** from data (tooltip and filters), not screen position inside another circle.

#### Scenario: Single bioregion inside multiple disks

- **WHEN** a hit’s data list contains only bioregion A but its dot lies inside both A’s and B’s enclosing circles on screen
- **THEN** the implementation SHALL still be conforming; the hit tooltip SHALL list only the data-derived bioregions (e.g. only A)
