## ADDED Requirements

### Requirement: PowerPoint artifact kind and MIME
The system SHALL treat `human.artifacts` rows with `kind = 'powerpoint'` as generated PowerPoint presentation artifacts. Such rows MUST reference a `.pptx` object in the private artifacts bucket when ready, MUST use the PowerPoint OOXML MIME type, and MUST store the reviewed presentation structure in metadata rather than storing binary content in the table.

#### Scenario: Ready PowerPoint artifact points to a PPTX object
- **WHEN** PowerPoint generation completes successfully
- **THEN** the artifact row MUST have `kind = 'powerpoint'` and `status = 'ready'`
- **AND** `mime_type` MUST be `application/vnd.openxmlformats-officedocument.presentationml.presentation`
- **AND** `object_path` MUST obey the owner-scoped artifact key convention
- **AND** `metadata` MUST include the reviewed presentation structure or a documented compact equivalent

#### Scenario: PowerPoint artifact keeps source provenance
- **WHEN** a PowerPoint artifact is created from selected pins
- **THEN** `source_pin_ids` MUST list the selected pin ids used for generation
- **AND** metadata MUST include safe provenance such as source count, generation timestamp, model name when available, and user instructions when safe to store

#### Scenario: PowerPoint artifact row does not store binary content
- **WHEN** a generated PowerPoint file is persisted
- **THEN** the corresponding `human.artifacts` row MUST store metadata and object references only
- **AND** the `.pptx` bytes MUST reside in private Supabase Storage

#### Scenario: Failed PowerPoint generation does not appear ready
- **WHEN** client-side generation or upload fails after artifact work begins
- **THEN** the artifact row MUST NOT be shown as `ready`
- **AND** any failure state or cleanup MUST avoid exposing another user's data
