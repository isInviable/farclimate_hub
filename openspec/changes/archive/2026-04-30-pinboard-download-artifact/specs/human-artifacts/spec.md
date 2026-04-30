## ADDED Requirements

### Requirement: Pinboard export artifact kind and MIME

The system SHALL treat `human.artifacts` rows with `kind = 'pinboard_export'` as pinboard snapshot exports. Such rows MUST reference a single ZIP object (`mime_type` for ZIP) in the private artifacts bucket and MUST populate `source_pin_ids` with all pin ids included in that export when the job succeeds.

#### Scenario: Ready pinboard export points to a ZIP object

- **WHEN** a pinboard export job completes successfully
- **THEN** the artifact row MUST have `kind = 'pinboard_export'` and `status = 'ready'`
- **AND** `mime_type` MUST identify a ZIP archive
- **AND** `object_path` MUST obey the owner-scoped key convention

#### Scenario: Pending pinboard export has no usable file yet

- **WHEN** a pinboard export row has `status = 'pending'`
- **THEN** clients MUST NOT treat the Storage object as final
- **AND** the UI SHOULD show a pending state until `ready` or `failed`

### Requirement: Async failure semantics for pinboard export

When a `pinboard_export` job fails after a `pending` row exists, the system SHALL set `status = 'failed'` and SHOULD avoid leaving orphan completed ZIP objects; if a partial upload occurred, cleanup MUST follow the same best-effort rules as other artifacts without exposing cross-tenant data.

#### Scenario: Failed job does not report ready

- **WHEN** the export job terminates with error
- **THEN** the artifact row MUST NOT remain in `pending` indefinitely
- **AND** the final `status` MUST be `failed` unless a retry policy explicitly returns to `pending` (out of scope unless specified later)
