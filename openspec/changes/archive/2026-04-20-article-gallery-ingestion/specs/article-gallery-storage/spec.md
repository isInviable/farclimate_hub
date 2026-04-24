## ADDED Requirements

### Requirement: Public `article-images` Supabase Storage bucket

The Supabase project SHALL provision a public Storage bucket named `article-images` via `packages/supabase-setup/sql/08_article_images_storage.sql`. The bucket SHALL be publicly readable (no RLS on read), writable only by the service role, SHALL cap individual object size at 20 MiB, and SHALL restrict allowed MIME types to `image/jpeg`, `image/png`, and `image/webp`. Objects SHALL use the path convention `climateadapt/<slug>/NN.<ext>`, where `<slug>` is the article's URL slug and `NN` is the zero-padded position that matches the corresponding `knowledge.document_images.position`.

#### Scenario: Bucket exists and is public after setup
- **WHEN** `08_article_images_storage.sql` runs on a fresh Supabase project
- **THEN** `storage.buckets` SHALL contain a row where `id = 'article-images'` and `public = true`, and unauthenticated clients SHALL be able to GET an object from that bucket via its public URL

#### Scenario: Service role can upload, anon cannot
- **WHEN** an anonymous client attempts to upload a file to `article-images`
- **THEN** the upload SHALL be rejected, while the same operation by a service-role client SHALL succeed

#### Scenario: MIME and size guards enforced
- **WHEN** the loader attempts to upload an object exceeding 20 MiB or an object with a disallowed MIME type
- **THEN** Storage SHALL reject the request and the loader SHALL log the failure without aborting the batch

### Requirement: `knowledge.document_images` table shape

A new table `knowledge.document_images` SHALL be defined in `packages/db/sql/02_tables.sql` with columns `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`, `document_id uuid NOT NULL REFERENCES knowledge.documents(id) ON DELETE CASCADE`, `position int NOT NULL`, `source_url text NOT NULL`, `storage_path text NOT NULL`, `public_url text NOT NULL`, `title text`, `description text`, `credits text`, `content_type text`, `width int`, `height int`, `bytes int`, with a `UNIQUE (document_id, position)` constraint and a composite index on `(document_id, position)`. The `anon` and `authenticated` roles SHALL have `SELECT` on the table through the existing knowledge-schema default privilege grants.

#### Scenario: Fresh schema includes the table
- **WHEN** `db:create` runs against a blank database
- **THEN** `knowledge.document_images` SHALL exist with the columns, unique constraint, and index described above

#### Scenario: Cascading delete removes image rows
- **WHEN** a row in `knowledge.documents` is deleted
- **THEN** all `knowledge.document_images` rows referencing it SHALL be removed by the `ON DELETE CASCADE` constraint

### Requirement: Loader uploads local images and upserts `document_images`

The `packages/db/src/push-climate-adapt.ts` loader SHALL, for each article it processes, read `pipeline/images/<slug>/manifest.json`, upload each local file to the `article-images` bucket at `climateadapt/<slug>/NN.<ext>` with `upsert: true`, resolve the resulting `public_url` via the Supabase JS SDK, and replace the article's rows in `knowledge.document_images` (DELETE existing rows for that `document_id`, then INSERT the manifest entries). The loader SHALL NOT write to `knowledge.documents.image_url` and SHALL NOT download from Climate-ADAPT directly.

#### Scenario: First push creates rows and objects
- **WHEN** `db:push` runs for an article with four manifest entries and no prior rows
- **THEN** four objects SHALL exist in the `article-images` bucket at `climateadapt/<slug>/00..03.<ext>`, and `knowledge.document_images` SHALL contain four rows for that document ordered `position = 0..3`

#### Scenario: Re-running after gallery shrinks
- **WHEN** `db:push` runs for an article whose local manifest dropped from four entries to two
- **THEN** after the loader completes, `knowledge.document_images` SHALL contain exactly two rows for that document (positions 0 and 1) and SHALL NOT retain orphan rows at positions 2 or 3

#### Scenario: Re-running with unchanged manifest
- **WHEN** `db:push` runs twice in a row against the same manifest
- **THEN** both runs SHALL succeed idempotently, storage objects SHALL be overwritten in place via `upsert: true`, and the final `document_images` rows SHALL be identical in count and content

#### Scenario: Missing manifest is non-fatal
- **WHEN** an article has no `pipeline/images/<slug>/manifest.json` (e.g. the download step has not been run)
- **THEN** the loader SHALL log a warning, skip image handling for that article, and still upsert the document's other knowledge tables

#### Scenario: Manifest without content_type still uploads successfully
- **WHEN** a manifest entry omits `content_type` or sets it to `application/octet-stream` (e.g. produced by an older version of `download_images.py`)
- **THEN** the loader SHALL infer the MIME type from the local file extension using the same allow-list as the bucket (`.png`→`image/png`, `.jpg`/`.jpeg`→`image/jpeg`, `.webp`→`image/webp`) before calling Storage, store that inferred value into `knowledge.document_images.content_type`, and complete the upload without falling back to the bucket-rejected `application/octet-stream`

### Requirement: Public API functions expose the aggregated `images` column

The public SQL functions `public.get_all_documents`, `public.get_documents_by_ids`, and `public.get_document_by_uid` SHALL return an `images jsonb` column computed as an ordered `jsonb_agg` of `knowledge.document_images` rows for the document, where each element has keys `position`, `public_url`, `source_url`, `title`, `description`, `credits`, `content_type`, `width`, `height`, and `bytes`. When a document has no rows in `document_images`, the column SHALL be `'[]'::jsonb` (empty array), not `null`.

#### Scenario: Function returns ordered image array
- **WHEN** `public.get_document_by_uid` is called for a document with three rows in `document_images`
- **THEN** the response SHALL include an `images` array of length 3 ordered by `position` ascending, each object exposing at least `public_url`, `title`, `description`, `credits`

#### Scenario: Empty images array for documents without pictures
- **WHEN** any of the three functions returns a document with zero `document_images` rows
- **THEN** `images` SHALL equal `[]` and SHALL NOT be null
