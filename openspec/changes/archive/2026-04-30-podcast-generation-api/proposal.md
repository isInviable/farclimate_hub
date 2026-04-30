## Why

The pinboard already exposes a dummy "Create podcast" action, but there is no backend contract for turning selected pins into a reviewed podcast script and persisted audio artifact. We need a testable API and persistence layer before building the frontend wizard, so generated podcasts can be owned, listed, listened to, downloaded, and later shared safely.

## What Changes

- Add a `human.artifacts` metadata table for generated user artifacts, beginning with podcast audio.
- Store generated audio files in a Supabase Storage bucket and persist only metadata and object references in `human.artifacts`.
- Add owner-scoped access rules for artifact metadata and Storage objects, with a path model that supports private owner access and future share-link behavior.
- Add `POST /api/podcast-summarize` to validate selected pin/document context and generate an editable podcast script with Gemini.
- Add `POST /api/podcast-text-to-speech` to convert reviewed podcast script text to audio with Google Cloud Text-to-Speech and create the persisted artifact record.
- Add automated tests for endpoint validation, prompt/context assembly, TTS orchestration, artifact metadata shape, and owner isolation where integration credentials are available.

## Capabilities

### New Capabilities

- `human-artifacts`: Metadata, ownership, lifecycle, and Storage object references for generated user artifacts such as podcasts.
- `podcast-generation-api`: Server API contracts for podcast script generation and text-to-speech artifact creation.

### Modified Capabilities

- None.

## Impact

- Affected backend areas in `apps/web`: Nuxt server API routes, server-side Gemini usage, Google Cloud Text-to-Speech integration, Supabase server/storage orchestration, and tests.
- Affected setup areas: `packages/supabase-setup` SQL/bootstrap documentation for `human.artifacts`, Storage bucket configuration, RLS policies, grants, and indexes.
- New dependency in `apps/web`: `@google-cloud/text-to-speech`.
- New environment requirements: Google Cloud Text-to-Speech credentials/configuration, artifact Storage bucket name, and any server-only Supabase service credentials used for trusted object upload.
