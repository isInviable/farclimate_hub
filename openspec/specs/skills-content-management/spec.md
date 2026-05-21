## Requirements

### Requirement: Admin panel exposes skills management
The admin panel SHALL include a Skills section that uses the existing admin layout and `connected_admin` route protection.

#### Scenario: Connected admin opens skills editor
- **WHEN** a user with the `connected_admin` role visits `/admin/skills`
- **THEN** the system SHALL display the skills management interface inside the admin layout

#### Scenario: Non-admin user is blocked
- **WHEN** a user without the `connected_admin` role visits `/admin/skills`
- **THEN** the system SHALL prevent access using the same admin authentication flow as other admin pages

### Requirement: Admin can manage one-level skill tags
The system SHALL allow connected admins to create, edit, and delete one-level skill tags with localized names for English, Spanish, and Italian.

#### Scenario: Admin creates a localized tag
- **WHEN** a connected admin submits a tag with English, Spanish, and Italian names
- **THEN** the system SHALL persist the tag and make it available for skill assignment

#### Scenario: Admin omits a required localized tag name
- **WHEN** a connected admin submits a tag missing a required language name
- **THEN** the system SHALL reject the save and identify the missing language

### Requirement: Admin can manage skill content
The system SHALL allow connected admins to create, edit, delete, publish, and unpublish skills with shared common fields and localized content rows for English, Spanish, and Italian. The shared skill SHALL include header image, one or more tags, an ordered list of external links, and publication state. Each localized skill content row SHALL include only title and markdown body, with summary derived from a `<!-- more -->` marker.

#### Scenario: Admin creates a draft skill
- **WHEN** a connected admin saves a new skill with required content fields
- **THEN** the system SHALL persist the skill as draft unless explicitly marked as published

#### Scenario: Admin assigns multiple tags to a skill
- **WHEN** a connected admin selects multiple tags for a skill
- **THEN** the system SHALL persist every selected tag relationship for that skill

#### Scenario: Admin adds external links to a skill
- **WHEN** a connected admin adds external links with labels and URLs
- **THEN** the system SHALL persist the links in the admin-defined order

#### Scenario: Admin publishes a skill
- **WHEN** a connected admin changes a valid draft skill to published
- **THEN** the system SHALL make the skill eligible for public listing and detail pages

#### Scenario: Admin saves localized skill content
- **WHEN** a connected admin edits English, Spanish, or Italian content for a skill
- **THEN** the system SHALL persist only the locale-specific title and markdown body in that locale's separate skill content row

#### Scenario: Admin updates common skill fields
- **WHEN** a connected admin updates tags, external links, header image, or publication state for a skill
- **THEN** the system SHALL persist those fields once on shared records for the conceptual skill

#### Scenario: Admin inserts more marker
- **WHEN** a connected admin inserts `<!-- more -->` in the markdown body
- **THEN** the system SHALL use the markdown before the marker as the skill summary source

### Requirement: Admin can upload skill header images
The system SHALL allow connected admins to upload or replace a shared skill header image using a Supabase Storage bucket named `skills` and save the resulting image URL or storage path with the shared skill record.

#### Scenario: Admin uploads a header image
- **WHEN** a connected admin selects a valid image file for a skill
- **THEN** the system SHALL upload the image to Supabase Storage and associate it with the skill

#### Scenario: Image upload fails
- **WHEN** Supabase Storage rejects or fails an image upload
- **THEN** the system SHALL keep the previous skill image reference unchanged and show an error in the admin interface

### Requirement: Skills content enforces Supabase access control
Supabase SHALL store skills content in the `public` schema, allow public reads only for published skills and tags needed to display published skills, and restrict write operations to connected admins.

#### Scenario: Public user reads published skills
- **WHEN** an anonymous or authenticated non-admin user requests skills content
- **THEN** Supabase SHALL only return records that are published

#### Scenario: Public user cannot write skills content
- **WHEN** an anonymous or authenticated non-admin user attempts to create, update, or delete skills content
- **THEN** Supabase SHALL reject the write operation

#### Scenario: Connected admin writes skills content
- **WHEN** a connected admin creates, updates, or deletes skills content
- **THEN** Supabase SHALL allow the operation when validation and RLS policies pass

#### Scenario: Explorer schemas remain unchanged
- **WHEN** the skills content editor schema is added
- **THEN** the system SHALL NOT add or modify tables, policies, or functions in the `human` schema or the `knowledge` schema
