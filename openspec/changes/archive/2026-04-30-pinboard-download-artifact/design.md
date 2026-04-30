## Context

Pinboards live in `human.pinboards` / `human.pins` with heterogeneous `body_kind` and JSON `body` envelopes. Podcast generation already established **`human.artifacts`** + private **`human-artifacts`** Storage, owner-prefixed object keys, and UI on `/explorer/board` under an Artifacts panel with signed download URLs (`signedUrlForArtifact`). This change adds a **second artifact family**: a **ZIP snapshot** of the **entire** pinboard, produced by a **long-running job** because of image fetches and optional full-article reads.

## Goals / Non-Goals

**Goals:**

- One **ZIP per export run**, stored as a single Storage object + **`human.artifacts`** row.
- Async lifecycle **`pending` → `ready` | `failed`** with UI **polling** (align with existing patterns; Realtime subscription only if already standard for artifacts).
- ZIP contains: **`manifest.json`**, per-pin **Markdown**, per-pin **raw JSON** (`body` + key row fields) for **temporary** provenance (may be removed post-production), **images/** for best-effort fetched image bytes, **articles/** (or similar) for **full article payload** when `source_document_uid` is set; other pins rely on **pin row snapshot only**.
- **Downloads** subsection in the board Artifacts UI with **Generate new download** and list/status/download for exports.
- **Access**: reuse **signed URL** flow already used for podcast MP3 (simplest, consistent RLS).

**Non-Goals:**

- User-selectable subset of pins (always whole pinboard).
- Incremental/delta exports or automatic scheduled backups.
- Stripping JSON from ZIP in this iteration (deferred until after production hardening).
- Public or unauthenticated download links.

## Decisions

1. **Artifact `kind` string**  
   - **Choice**: `pinboard_export` (single Storage object per row, `mime_type` `application/zip`).  
   - **Alternatives**: separate `kind` per file type — rejected; one row matches “one zip per export”.

2. **Job execution model**  
   - **Choice**: Prefer **Nitro server** implementation that inserts `pending` row then runs work in **`afterResponse`** / **`setImmediate`** / internal queue pattern already used or recommended for podcast-length work; if platform limits require it, **split** into “enqueue” + “worker” in a follow-up.  
   - **Alternatives**: Edge function + queue — more moving parts; client-side zip — cannot fetch knowledge server-side or hide secrets.

3. **ZIP layout** (normative for implementers; spec may reference summary)

   - `manifest.json` — schema version, `project_id`, `pinboard_id`, `exported_at`, pin count, app/git version if available.  
   - `pins/<sort_order>-<pin_id>.md` — title, `body_kind`, `user_note`, `source_document_uid`, `source_title_snapshot`, readable body summary + link to JSON file.  
   - `pins/<sort_order>-<pin_id>.json` — full pin snapshot including `body` envelope (beta provenance).  
   - `media/<pin_id>-<slug>.<ext>` — image bytes when fetch succeeds.  
   - `articles/<document_uid>.json` (or `.md`) — server-fetched full article for pins that reference a document; omit or placeholder file when fetch fails.

4. **Image fetch policy**  
   - **Choice**: Bounded concurrency, per-URL timeout, max byte size; on failure write Markdown placeholder and skip file.  
   - **Alternatives**: fail whole export — poor UX for one bad URL.

5. **Knowledge merge rule**  
   - **Choice**: If `source_document_uid` present, server **attempts** current document load into `articles/`; pin Markdown still reflects **stored** pin fields so user memory remains primary for non-article facets.

6. **API surface**  
   - **Choice**: `POST /api/pinboard-export` (or similarly named) with `projectId` (and implicit whole board from project’s pinboard) returns `{ artifactId }` for a `pending` row; client polls **`human.artifacts`** by id or refetches project artifacts list until `ready`/`failed`. Optional `GET` for status if list queries are heavy — implementation detail.

7. **Download access**  
   - **Choice**: Extend composable used by podcasts so **ZIP** artifacts get **signed GET** the same way as MP3.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Serverless timeout on huge boards | Cap image count/size; document limits; split worker if timeouts observed. |
| Image `src` is third-party or expired | Best-effort + placeholder in Markdown. |
| Article fetch changes meaning of “snapshot” | Document in manifest that `articles/` is “as of export time”; pin JSON remains user-stable. |
| ZIP contains PII / large JSON | Temporary inclusion; follow-up to redact; warn in UI if needed later. |
| Duplicate exports consume Storage | Out of scope v1; optional retention policy later. |

## Migration Plan

- No breaking DB migration if `kind` remains free text.  
- Deploy server + UI; old clients ignore unknown `kind`.  
- Rollback: disable route + UI button; pending rows may be cleaned manually or left to fail.

## Open Questions

- Exact **article serialization** shape (reuse existing API serializer vs raw DB row) — resolve during implementation for consistency with explorer.  
- Whether **`failed`** rows store error text in `metadata` only — recommend yes for supportability.
