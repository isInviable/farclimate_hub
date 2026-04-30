## ADDED Requirements

### Requirement: Pinboard export API starts an artifact job

The system SHALL expose an authenticated Nuxt server endpoint that starts a **whole pinboard** export for a project the caller owns. The endpoint MUST create a `human.artifacts` row with `kind = 'pinboard_export'`, `status = 'pending'`, and valid Storage path metadata for the eventual ZIP, then trigger asynchronous work to build and upload the ZIP and transition the row to `ready` or `failed`. The endpoint MUST NOT return a ready ZIP synchronously for large work; it MAY return the new artifact id and initial `pending` status for client polling.

#### Scenario: Owner starts export for current project

- **WHEN** an authenticated user requests a pinboard export for a `project_id` they own
- **THEN** the system MUST verify ownership, resolve that project’s pinboard and all pins ordered by `sort_order` (with deterministic tie-break), create a `pending` artifact row, and schedule the export job
- **AND** the response MUST allow the client to identify the artifact for polling

#### Scenario: Non-owner cannot start export

- **WHEN** an authenticated user requests export for a project they do not own
- **THEN** the system MUST deny the request
- **AND** no artifact row or Storage object for that request MUST be created

### Requirement: Export job builds a single ZIP

The export job SHALL assemble one ZIP archive containing at minimum: `manifest.json`; for each pin, one Markdown file and one JSON file with the full pin snapshot including the `body` envelope; best-effort binary image files for image pins; and best-effort full-article files for pins with non-null `source_document_uid`. The job MUST upload the ZIP to the configured private artifacts bucket under the owner prefix convention and set `mime_type` appropriate for ZIP, `byte_size`, and `object_path` on the artifact row.

#### Scenario: Successful export marks artifact ready

- **WHEN** the job completes without unrecoverable error
- **THEN** the system MUST upload the ZIP to Storage
- **AND** the system MUST update the artifact row to `status = 'ready'` with correct `byte_size` and `mime_type`
- **AND** `source_pin_ids` MUST list every pin id included in the export

#### Scenario: Failed export marks artifact failed

- **WHEN** the job cannot produce or upload the ZIP
- **THEN** the system MUST set `status = 'failed'`
- **AND** the system SHOULD record a safe error summary in `metadata` without leaking secrets

### Requirement: Manifest documents export provenance

The ZIP SHALL include `manifest.json` with export timestamp, project and pinboard identifiers, pin count, and a format version string so consumers can evolve parsing.

#### Scenario: Manifest is valid JSON

- **WHEN** a user unpacks a successful export ZIP
- **THEN** `manifest.json` MUST exist and MUST parse as a JSON object with the required fields defined by implementation documentation

### Requirement: Article-backed pins include fetched knowledge

For each pin with non-null `source_document_uid`, the job SHALL attempt to load the current knowledge document (full article payload appropriate for offline archive) and write it under a dedicated folder in the ZIP. Pins without `source_document_uid` SHALL rely on pin row and `body` JSON only.

#### Scenario: Article file is written when knowledge resolves

- **WHEN** a pin has `source_document_uid` and the server successfully loads the document
- **THEN** the ZIP MUST contain an article snapshot file keyed by that document uid (or equivalent stable filename)

#### Scenario: Article fetch failure does not abort entire export

- **WHEN** a pin has `source_document_uid` but the document cannot be loaded
- **THEN** the export MUST still complete if other steps succeed
- **AND** the Markdown or manifest for that pin SHOULD note the missing article fetch

### Requirement: Image pins are best-effort inlined as files

For pins whose body indicates an image (`body_kind` or data convention used by the app), the job SHALL attempt to download bytes from the recorded `src` URL subject to timeouts and size limits, store them under `media/` (or equivalent) in the ZIP, and reference or describe them from the pin Markdown. When download fails, the Markdown MUST still include alt text and original URL when available.

#### Scenario: Unreachable image still yields pin Markdown

- **WHEN** image bytes cannot be fetched
- **THEN** the export MUST still include the pin’s Markdown and JSON
- **AND** the Markdown MUST indicate that the image file is missing

### Requirement: Provider and privileged access stay server-side

Pinboard export SHALL use server-only configuration for Supabase service credentials, knowledge access, and HTTP fetching. The browser MUST only call application HTTP APIs and MUST NOT receive service role keys.

#### Scenario: Client does not upload the ZIP bytes directly with privileged keys

- **WHEN** the export completes
- **THEN** Storage upload MUST have been performed with server-side credentials
- **AND** the client MUST obtain the file via the same authenticated access pattern as other artifacts (e.g. signed URL)

### Requirement: Pinboard export is covered by automated tests

The system SHALL include tests that mock Storage, knowledge fetch, and HTTP image fetch where practical, and assert validation, happy-path ZIP structure (e.g. manifest + at least one pin file), and owner isolation consistent with podcast artifact tests.

#### Scenario: Tests run without live Supabase when not configured

- **WHEN** integration credentials are absent
- **THEN** unit-level tests MUST still validate orchestration and error paths with mocks
