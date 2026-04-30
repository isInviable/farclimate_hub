## Context

The board page currently opens a dummy podcast modal from `ActionBarBoard.vue`, but the backend has no contract for podcast generation, artifact persistence, or audio storage. Existing human pinboard data lives in the `human` schema with owner-only RLS, and existing pin image storage uses private Supabase Storage objects with owner-scoped prefixes. This change follows those patterns while keeping generated artifacts separate from curated pins.

The backend flow has two distinct phases:

1. Summarize selected pin/document context into an editable podcast script using Gemini.
2. Convert the reviewed script into audio using Google Cloud Text-to-Speech, upload the audio to Supabase Storage, and persist artifact metadata in Postgres.

## Goals / Non-Goals

**Goals:**

- Define a durable `human.artifacts` model for generated outputs, beginning with podcasts.
- Keep audio bytes in Supabase Storage and keep `human.artifacts` as metadata plus Storage references.
- Enforce owner-only access for artifact metadata and private audio objects.
- Provide testable Nuxt server endpoints for script generation and text-to-speech artifact creation.
- Keep provider credentials server-side only.

**Non-Goals:**

- Build the frontend podcast wizard or board Artifacts UI; that belongs to the frontend spec.
- Implement public sharing UX beyond a metadata/storage model that can support future signed-link sharing.
- Add background job processing, queues, or long-running status polling in the first version.
- Generate multi-speaker studio-quality podcasts; the first version creates one reviewed speech script and one audio file.

## Decisions

### Create `human.artifacts` instead of storing podcasts as pins

Artifacts represent generated files, while pins represent curated board items and snippets. A separate table avoids overloading `body_kind`, keeps file lifecycle concerns isolated, and allows future artifact kinds such as PDFs, exports, videos, and generated bundles.

Alternative considered: store podcast rows in `human.pins` with `body_kind = "podcast"`. This would be faster for the first UI but mixes generated deliverables with selected source material and makes artifact listing/deletion semantics harder to evolve.

### Store private audio in Supabase Storage and persist object references

`human.artifacts` will store fields such as `bucket_id`, `object_path`, `mime_type`, `byte_size`, `metadata`, and optional source references. The audio bytes remain in a private Storage bucket. Supabase Storage policies rely on RLS on `storage.objects`; uploads require `INSERT`, and upsert-style replacement also requires `SELECT` and `UPDATE`.

The initial object path should be owner/project scoped, for example:

`<owner_user_id>/<project_id>/<artifact_id>/podcast.mp3`

Alternative considered: store public URLs directly in the table. This would simplify playback but weaken access control and make revocation harder. Private objects plus signed URLs preserve owner-only defaults and allow future share links.

### Use server-side orchestration for summarization and TTS

Both endpoints live under `apps/web/server/api`. The browser sends selected pin/document context to `/api/podcast-summarize`, receives editable script text, then sends reviewed script text to `/api/podcast-text-to-speech`. The second endpoint calls Google Cloud Text-to-Speech, uploads the resulting MP3 to Storage, and inserts the artifact row.

The server must authenticate the current user, verify ownership of the target project/pinboard context, and use trusted server credentials for provider calls and Storage upload. The client never receives Google credentials or Supabase service credentials.

Alternative considered: call Storage directly from the client after receiving TTS bytes. That would expose more orchestration to the browser and complicate ownership verification.

### Validate context before calling Gemini

The summarize endpoint should reject requests with no selected items, too many selected items, or too many total words/characters. The request payload should keep per-source boundaries: pin id, title, source document uid, body kind, note, selected text/markdown/fulltext, and any user instructions.

The prompt should ask Gemini for speech-friendly output, not a written report. For long input, the implementation may compress each source into structured briefs before final script generation, but the externally testable contract remains a single request that returns an editable script.

### Treat share links as future capability

This spec prepares for sharing by storing artifact metadata and Storage object paths, but the first version remains owner-only. Future public sharing can add explicit share records or signed URL issuance without changing where audio is stored.

## Risks / Trade-offs

- Provider latency or long scripts may exceed normal request timeouts → Keep first-version limits conservative, return clear validation errors, and leave background job orchestration for a later change.
- LLM output may include inaccurate claims or awkward spoken prose → Require editable script review before TTS and keep source boundaries in the prompt.
- Storage and metadata can drift if upload succeeds but DB insert fails → Insert metadata after successful upload, delete the object on insert failure when possible, and log cleanup failures.
- Service credentials can become over-permissive → Use server-only runtime config, never expose service keys to the browser, and keep RLS policies owner-scoped even if server routes use privileged upload paths.
- Future sharing can conflict with owner-only assumptions → Model sharing as an explicit later layer rather than making the bucket public now.

## Migration Plan

1. Add bootstrap SQL for `human.artifacts`, indexes, RLS policies, grants, and updated setup documentation.
2. Add or document a private artifact Storage bucket, for example `human-artifacts`, with owner-prefix policies.
3. Add server runtime configuration for Google Cloud Text-to-Speech and the artifact bucket name.
4. Add `/api/podcast-summarize` with validation and Gemini script generation.
5. Add `/api/podcast-text-to-speech` with Google TTS synthesis, Storage upload, artifact insert, and cleanup on partial failure.
6. Add unit tests with mocked Gemini/TTS/Storage clients and integration tests that run only when Supabase test credentials are configured.

Rollback: remove or disable the two server routes and dependency first. The table and bucket can remain inert; a later cleanup migration may drop unused artifact rows and Storage objects if no frontend has shipped.

## Open Questions

- What exact first-version script limit should we enforce: selected item count, total words, total characters, or model-token estimate?
- Should the first TTS voice be fixed by environment/config, or should the API already accept language/voice options for the future frontend wizard?
- Should artifact deletion remove Storage objects synchronously in the API/composable, or should deletion cleanup be handled by a later background task?
