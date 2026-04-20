# human-pin-storage Specification

## Purpose

Private bucket `human-pin-images` and owner-prefix Storage policies for pin images; server-side copy/delete flows documented in bootstrap README.

## Requirements
### Requirement: Dedicated storage bucket for pin images
The system SHALL provide a Supabase Storage bucket (name fixed in implementation, e.g. `human-pin-images`) for user-owned pin image objects, with generous beta limits: maximum uploaded object size 20 MiB; allowed MIME types at minimum `image/jpeg`, `image/png`, `image/webp`, `image/gif` (tunable post-beta).

#### Scenario: Bucket is provisioned with bootstrap or documented SQL
- **WHEN** operators complete environment setup per `packages/supabase-setup` documentation
- **THEN** the pin image bucket MUST exist and be named in README

### Requirement: Storage RLS is owner-scoped
The system SHALL define Storage policies on `storage.objects` so authenticated users can `insert`, `select`, `update`, and `delete` only objects under a path prefix derived from their `auth.uid()` (e.g. first folder segment equals user uuid). The `service_role` MAY bypass for server-side copy jobs if used.

#### Scenario: User cannot access another user’s objects
- **WHEN** user A attempts to read or delete an object in user B’s prefix
- **THEN** the operation MUST be denied

#### Scenario: User can manage objects under own prefix
- **WHEN** an authenticated user uploads or deletes an object under their own prefix
- **THEN** the operation MUST succeed subject to bucket limits

### Requirement: Pin image lifecycle with storage
On creation of a pin with `body_kind` indicating an image, the system SHALL copy the source asset from the knowledge/platform source into the user bucket under the owner’s path, and store in `body.data` at minimum `bucket` (or fixed bucket name) and `object_path`, and optionally `caption`. On deletion of that pin, the system SHALL attempt to delete the storage object; failure to delete storage MUST be logged and MUST NOT block pin row deletion.

#### Scenario: Pin row stores pointer to copied image
- **WHEN** an image pin is successfully created through the copy flow
- **THEN** `human.pins.body.data` MUST contain the storage location fields required for later display

#### Scenario: Pin delete attempts object removal
- **WHEN** a pin with an associated storage object is deleted
- **THEN** the system MUST invoke storage delete for that object path (best-effort)

### Requirement: Image flows prefer server-side orchestration
The system SHALL document that multi-step image copy (read from source, write to user bucket, insert pin) SHOULD run through a server route or privileged worker, not solely the browser against mixed ACLs, while simple pin CRUD without images MAY use the direct Supabase client.

#### Scenario: Spec references recommended integration point
- **WHEN** implementers follow tasks for image pins
- **THEN** they MUST have a documented server or service-role path for copy-on-pin

