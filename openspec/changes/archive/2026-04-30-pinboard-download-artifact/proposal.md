## Why

Users want an offline-friendly snapshot of an entire pinboard (pins, notes, images, and richer context for article-backed pins) without manually copying cards. Large boards and many image fetches require an **asynchronous artifact job** (like podcast generation), not a single blocking request.

## What Changes

- Add a **pinboard export artifact** job: user triggers export for the **whole** current pinboard; the system produces **one ZIP file per run** stored under the existing private **`human-artifacts`** bucket and tracked in **`human.artifacts`** with lifecycle **`pending` → (work) → `ready` / `failed`**.
- ZIP layout includes **Markdown** (human-readable pin content, `user_note`, provenance fields), **embedded or sidecar JSON** for each pin’s raw `body` (included **for now**; product may strip later), **`manifest.json`**, **fetched images** where possible, and **full article payloads** for pins that have `source_document_uid` (server fetches current knowledge document; other pins rely on **stable pin row / user memory** only).
- **Access**: prefer the **simplest** implementation consistent with existing artifacts—e.g. **signed URL** or the same authenticated download path used for podcast artifacts (implementation choice in design/tasks).
- **Pinboard UI**: extend the board **Artifacts** area with a **Downloads** subsection: list pinboard export artifacts and a **Generate new download** control; **poll** (or subscribe if already used elsewhere) while status is `pending`.

## Capabilities

### New Capabilities

- `pinboard-export`: Asynchronous server workflow to build the ZIP, optional enqueue/worker step, Storage upload, `human.artifacts` row with `kind` dedicated to pinboard export (exact string in design), owner-scoped object path, and tests/mocks for the job and API.

### Modified Capabilities

- `human-artifacts`: Extend requirements for a new artifact `kind`, async `pending`/`ready`/`failed` behavior for this job, `source_pin_ids` populated with **all pins** included in the export, and cleanup/error semantics aligned with existing artifact rules.
- `human-pins-frontend`: Artifacts panel gains a **Downloads** section with **generate** action and list/status for pinboard export artifacts, reusing patterns from the Podcasts subsection where practical.

## Impact

- **Nuxt server**: new API route(s) to start export and optionally poll status; background work (Nitro task, queue, or deferred handler—decided in design) using Supabase service role for Storage and knowledge reads where needed.
- **Supabase**: `human.artifacts` only (no new table required if job state fits existing columns); Storage under existing bucket and RLS conventions.
- **Apps/web**: `explorer/board` artifacts slot (`PinBoardArtifactsView` or successor), composables for listing exports + triggering generation, i18n strings.
- **Knowledge**: read-only use of document APIs or DB for pins with `source_document_uid`.
- **Dependencies**: ZIP building (runtime library), image fetch (timeouts, size limits, failure placeholders in Markdown).
