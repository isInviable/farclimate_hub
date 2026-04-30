## ADDED Requirements

### Requirement: Artifact metadata table is bootstrap reproducible
The system SHALL provision `human.artifacts` through the Supabase setup/bootstrap flow using idempotent SQL, grants, indexes, RLS policies, and documentation consistent with existing `human` schema setup.

#### Scenario: Bootstrap creates artifact infrastructure
- **WHEN** operators run the documented Supabase bootstrap on a new project
- **THEN** the database MUST contain `human.artifacts` with the required columns, constraints, indexes, grants, and RLS policies
- **AND** the setup documentation MUST list the artifact table and its Storage bucket requirements

### Requirement: Artifacts store metadata and Storage references
The system SHALL define artifact rows with durable ownership and file metadata: `id`, `project_id`, `owner_user_id`, `kind`, `status`, `title`, `bucket_id`, `object_path`, `mime_type`, `byte_size`, `metadata`, `source_pin_ids`, `created_at`, and `updated_at`. Audio bytes and other files MUST NOT be stored in the table; rows MUST point to Supabase Storage objects instead.

#### Scenario: Podcast artifact stores an audio pointer
- **WHEN** podcast audio is generated successfully
- **THEN** the system MUST create a `human.artifacts` row with `kind = 'podcast'`, `status = 'ready'`, an audio MIME type, the Storage bucket id, the object path, and podcast metadata
- **AND** the row MUST include source pin ids when the podcast was generated from selected pins

#### Scenario: Artifact row does not store binary content
- **WHEN** a generated file is persisted
- **THEN** the corresponding `human.artifacts` row MUST store metadata and object references only
- **AND** the binary audio content MUST reside in Supabase Storage

### Requirement: Artifact metadata is owner scoped
The system SHALL enable RLS on `human.artifacts` and allow authenticated users to select, insert, update, and delete only rows whose `owner_user_id` equals `auth.uid()` and whose project belongs to the same owner.

#### Scenario: Owner can read own artifacts
- **WHEN** an authenticated owner queries artifacts for their project
- **THEN** the system MUST return that owner’s artifact rows

#### Scenario: Non-owner cannot read artifacts
- **WHEN** an authenticated user queries artifacts belonging to another user
- **THEN** the system MUST return no rows or deny access according to RLS

#### Scenario: Anon cannot access artifacts
- **WHEN** an unauthenticated or anon client queries or mutates `human.artifacts`
- **THEN** the operation MUST be denied by grants or RLS policy

### Requirement: Artifact Storage is private and owner scoped
The system SHALL use a private Supabase Storage bucket for generated artifacts and SHALL define Storage policies on `storage.objects` so authenticated users can access only objects under their own owner prefix. Server-side trusted flows MAY upload objects on behalf of the authenticated owner.

#### Scenario: Owner can access own artifact object
- **WHEN** an authenticated user requests access to an artifact object under their owner prefix
- **THEN** the Storage policy MUST allow access subject to the private bucket’s signed or authenticated access mechanism

#### Scenario: User cannot access another owner prefix
- **WHEN** a user attempts to read, update, or delete an artifact object under another user’s owner prefix
- **THEN** the Storage operation MUST be denied

#### Scenario: Public bucket is not required
- **WHEN** artifact audio is stored
- **THEN** the object MUST be stored in a private bucket rather than relying on public bucket URLs for normal playback

### Requirement: Artifact lifecycle handles Storage cleanup
The system SHALL attempt to keep artifact metadata and Storage objects consistent when artifacts are created or deleted. If metadata insertion fails after an upload, the system MUST attempt to remove the uploaded object. If object cleanup fails, the failure MUST be logged and MUST NOT expose another user’s data.

#### Scenario: Metadata insert fails after upload
- **WHEN** the server uploads audio to Storage but cannot insert the artifact row
- **THEN** the server MUST attempt to delete the uploaded Storage object
- **AND** the endpoint MUST return an error without returning a ready artifact

#### Scenario: Artifact deletion removes object best effort
- **WHEN** an artifact is deleted through an authorized flow
- **THEN** the system MUST attempt to remove the referenced Storage object
- **AND** cleanup failure MUST be logged without granting unauthorized access
