## 1. Supabase Artifact Infrastructure

- [x] 1.1 Add idempotent setup SQL for `human.artifacts` with required columns, constraints, ownership fields, timestamps, and indexes.
- [x] 1.2 Add owner-only RLS policies and grants for `human.artifacts`, including anon denial and project-owner checks.
- [x] 1.3 Add or document the private `human-artifacts` Supabase Storage bucket with owner-prefix access policies on `storage.objects`.
- [x] 1.4 Update `packages/supabase-setup` ordering and README documentation for artifact table and Storage setup.
- [x] 1.5 Add integration coverage for artifact owner CRUD and cross-user/anon isolation when Supabase test credentials are available.

## 2. Server Types and Shared Utilities

- [x] 2.1 Add artifact and podcast request/response types for selected context, summarize response, TTS request, and artifact metadata.
- [x] 2.2 Add validation helpers for selected item count, context text size, script text size, and required project ownership fields.
- [x] 2.3 Add prompt/context assembly helpers that preserve selected source boundaries and include optional user instructions.
- [x] 2.4 Add server-side Supabase helpers for authenticated user lookup, project ownership verification, artifact insertion, signed/private object references, and upload cleanup.

## 3. Podcast Summarization Endpoint

- [x] 3.1 Implement `POST /api/podcast-summarize` with authentication, request parsing, empty-selection validation, and oversize validation.
- [x] 3.2 Wire the summarize endpoint to the configured Gemini model using the structured podcast prompt.
- [x] 3.3 Return editable script text plus source count and generation metadata in a stable response shape.
- [x] 3.4 Add unit tests proving validation failures do not call Gemini and valid requests assemble the expected prompt shape.

## 4. Text-to-Speech Artifact Endpoint

- [x] 4.1 Add `@google-cloud/text-to-speech` to `apps/web` and configure server-only runtime settings for voice, audio encoding, credentials, and artifact bucket.
- [x] 4.2 Implement `POST /api/podcast-text-to-speech` with authentication, project ownership verification, and script validation.
- [x] 4.3 Call Google Cloud Text-to-Speech with text or SSML input and MP3 output.
- [x] 4.4 Upload synthesized audio to the private artifact Storage bucket under an owner/project/artifact path.
- [x] 4.5 Insert the ready `human.artifacts` podcast metadata row and return the created artifact metadata.
- [x] 4.6 Attempt Storage cleanup when artifact metadata insertion fails, and log cleanup failures.
- [x] 4.7 Add unit tests for TTS request shape, upload behavior, artifact insert shape, authorization failure, validation failure, and cleanup-on-insert-failure.

## 5. Verification

- [x] 5.1 Run endpoint unit tests for mocked Gemini, Google Text-to-Speech, Storage upload, and artifact insertion.
- [x] 5.2 Run Supabase integration tests for artifact RLS when credentials are configured, confirming skipped tests document missing env vars otherwise.
- [ ] 5.3 Run `pnpm --filter web typecheck` and relevant lint/test commands.
- [x] 5.4 Manually verify both endpoints against the running Nuxt app with a small selected-context payload and a short reviewed script when provider credentials are configured.
