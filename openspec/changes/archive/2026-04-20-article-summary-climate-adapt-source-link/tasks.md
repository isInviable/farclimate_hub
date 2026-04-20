## 1. UI and i18n

- [x] 1.1 In `ArticleSummaryView.vue`, add a conditional block that renders when `document.source_url` matches `^https?://` (trimmed); use `UButton` or `<a>` with `target="_blank"` and `rel="noopener noreferrer"`.
- [x] 1.2 Add English and Spanish strings for the link label (and optional short hint) under a clear key prefix (e.g. `article.viewOnOriginal` or `article.viewOnClimateAdapt`).

## 2. Verification

- [x] 2.1 Manually verify with a document that has `source_url` populated (Climate-ADAPT ingest) and one without, in the explorer article summary tab.
