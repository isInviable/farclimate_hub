## ADDED Requirements

### Requirement: Article summary image gallery pins use per-image targets

When the application renders an **image gallery** in `ArticleSummaryView` (or successor) under `ArticleViewAI`, each **individual image** in that gallery SHALL be a distinct pin entry point. Pinning from that entry point SHALL create a pin with `body_kind` appropriate for image content (image pin semantics) and `body.data` SHALL include that image’s `src` and `alt` as captured from the pinned image element. The client SHALL apply the same `source_document_uid` and `source_title_snapshot` rules as for other article-hosted blocks when article context is available.

#### Scenario: Distinct pins for two images from the same article

- **WHEN** an authenticated user pins the first image in the gallery and later pins the second image
- **THEN** the application SHALL create two separate `human.pins` rows with distinct image `body.data` and both SHALL include the same `source_document_uid` when the parent article’s `document_uid` is known

#### Scenario: Gallery image pin is not the whole short-description block

- **WHEN** the user pins from an image-specific control in the gallery
- **THEN** the pinned DOM scope SHALL be the image (or image block) for that thumbnail, not the entire short-description `SelectableBlock` that contains narrative text
