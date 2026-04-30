## 1. Server API and artifact row lifecycle

- [x] 1.1 Add `POST` Nuxt server route to start pinboard export: validate auth + project ownership, resolve pinboard + ordered pins, insert `human.artifacts` with `kind = 'pinboard_export'`, `status = 'pending'`, placeholder path/title/metadata, `source_pin_ids` empty or full list per design choice, return artifact id for polling.
- [x] 1.2 Implement async job runner (after response / deferred execution) that builds ZIP, uploads to `human-artifacts` with existing key convention, updates row to `ready` with `byte_size`, `mime_type`, `object_path`, and `source_pin_ids` for all pins; on failure set `failed` and optional `metadata` error; best-effort Storage cleanup on failure.
- [x] 1.3 Wire knowledge fetch for pins with `source_document_uid` (reuse or add minimal server helper); write under `articles/` in ZIP; handle missing document without failing whole export.

## 2. ZIP generation

- [x] 2.1 Add ZIP dependency and utility module: write `manifest.json` (format version, ids, counts, timestamp).
- [x] 2.2 For each pin (sorted): emit `pins/...md` and `pins/...json` (full snapshot including `body` envelope and notes).
- [x] 2.3 Image fetcher with timeout, max size, bounded concurrency; write `media/` files and Markdown fallbacks on failure.

## 3. Frontend — composables and data

- [x] 3.1 Extend or add composable to list `pinboard_export` artifacts for current project (mirror `usePodcastArtifacts` patterns).
- [x] 3.2 Ensure signed download URL path supports ZIP artifacts (reuse `signedUrlForArtifact` or shared helper with correct filename extension).

## 4. Frontend — UI

- [x] 4.1 Update `PinBoardArtifactsView` (or extract shared layout) to add **Downloads** subsection: list, pending state, failed state, download button for ready rows.
- [x] 4.2 Add **Generate new download** button; call start-export API; refresh list; poll while any export is `pending` (interval + stop on unmount/project switch).
- [x] 4.3 Wire board page: load exports on project change alongside podcasts; i18n keys for Downloads labels and errors.

## 5. Tests and docs

- [x] 5.1 Add API/unit tests with mocked Storage, fetch, and knowledge: happy path creates ZIP shape expectations; non-owner rejected.
- [x] 5.2 Optional: integration test when Supabase env present (owner isolation), skipped with documented reason when not.
- [x] 5.3 Update `packages/supabase-setup/README.md` or web README only if artifact `kind` values are documented there for operators.

## 6. Archive and main specs (after implementation)

- [x] 6.1 Port delta specs from `openspec/changes/pinboard-download-artifact/specs/` into `openspec/specs/` (merge ADDED blocks into `human-artifacts`, `human-pins-frontend`; add `openspec/specs/pinboard-export/spec.md`).
- [x] 6.2 Run OpenSpec archive flow for this change when implementation is verified.
