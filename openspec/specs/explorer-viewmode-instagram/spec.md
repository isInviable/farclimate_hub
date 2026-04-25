# explorer-viewmode-instagram Specification

## Purpose

Define how the explorer **Instagram** results viewmode presents each hit’s **media header**: all `document.images` in order, a navigable carousel when there are multiple images, Instagram-style indicators, and interaction rules so opening the document is not confused with swiping between slides.

## Requirements

### Requirement: Instagram viewmode shows all document images in a header carousel

The Instagram results viewmode (`ViewModeInstagram` or documented successor) SHALL render the post **media header** from `document.images`, an ordered array of `DocumentImage` entries as provided on search hits. Images SHALL appear in **ascending `position` order** (position `0` first). The UI SHALL NOT derive images from `fulltext` or a legacy single `image_url` field.

#### Scenario: Multiple images show as a navigable carousel

- **WHEN** a hit’s `document.images` contains more than one entry with distinct `public_url` values
- **THEN** the media header SHALL display every entry in order and the user SHALL be able to move between slides using at least one of: horizontal swipe or drag, or on-screen navigation controls

#### Scenario: Single image does not show redundant carousel chrome

- **WHEN** `document.images` contains exactly one image
- **THEN** the media header SHALL render that image without multi-slide dot indicators or duplicate navigation affordances that imply more than one slide

#### Scenario: Missing or empty images uses placeholder

- **WHEN** `document.images` is absent, empty, or no entry has a usable `public_url`
- **THEN** the media header SHALL show the same placeholder treatment the viewmode used for a failed hero image before this change (e.g. project placeholder asset) and SHALL NOT error

### Requirement: Multi-image posts expose Instagram-style slide indicators

When the media header has **more than one** slide, the UI SHALL show **dot indicators** (or equivalent compact progress indicator) reflecting the active slide and the total count. Activating an indicator SHALL move the carousel to the corresponding slide.

#### Scenario: Dots reflect active slide

- **WHEN** the user navigates from slide 1 to slide 2
- **THEN** the indicator for slide 2 SHALL become the active state and inactive dots SHALL be visually distinct

### Requirement: Carousel interactions do not confuse document open with slide change

The viewmode SHALL distinguish **horizontal navigation** from **activating** the document. A gesture that changes the active slide or exceeds a small horizontal movement threshold SHALL NOT emit `document-selected` for that gesture. A clear **non-carousel** affordance (e.g. “View more…” or caption link) SHALL always open the document when activated.

#### Scenario: Swiping between images does not open the document

- **WHEN** the user performs a horizontal swipe or drag that changes the active slide in the carousel
- **THEN** the application SHALL NOT emit `document-selected` solely as a result of that navigation gesture

#### Scenario: View more still opens the document

- **WHEN** the user activates the “View more…” control (or equivalent documented control)
- **THEN** the view SHALL emit `document-selected` with the hit’s document as today

### Requirement: Per-image load errors fall back to placeholder

If an individual slide’s image fails to load, that slide SHALL display the project image placeholder (same as current `@error` handling on the hero image) without breaking the carousel for other slides.

#### Scenario: Broken URL on one slide

- **WHEN** one `public_url` returns an error when rendered as an image
- **THEN** that slide SHALL show the placeholder and the user SHALL still be able to navigate to other slides

### Requirement: Carousel accessibility and i18n

The carousel region SHALL expose appropriate **roles and labels** for assistive technology (e.g. named region, current slide position). Any new user-visible strings (including generic image labels such as “Image {n} of {total}”) SHALL be defined in the project **i18n** files and SHALL NOT be hard-coded English-only in the component.

#### Scenario: Screen reader context for slides

- **WHEN** assistive technology focuses the carousel or the active slide changes
- **THEN** the user SHALL be able to determine which slide is active relative to the total count via accessible name or live announcement consistent with the implementation approach
