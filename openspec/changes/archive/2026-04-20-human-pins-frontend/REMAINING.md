# Post-archive follow-ups (human-pins-frontend)

This change was archived before the full spec was implemented. Use this list when opening a new change or fixing bugs.

## Incomplete tasks (from `tasks.md`)

### 2.5 — Board CRUD + reorder

- **Create / edit / delete on the pinboard** (Nuxt UI): add pin, edit title/body/note, delete without going only through explorer unpin.
- **Reorder:** drag-and-drop or up/down controls wired to existing `reorderPins()` in `usePinsSupabase`.

**Already in place:** create from explorer (`Pin` / `usePin`), notes via `updatePin` on popover close, delete via unpin.

### 3.1 (optional polish)

- Enumerate **all** `body_kind` values you expect in i18n (`pins.kinds.*`) if you add new kinds.

### 4. Optional

- **4.1** Playwright or component test: pin list with mocked Supabase.
- **4.2** Full image flow: server copy to `human-pin-images`, storage delete on pin delete (stub exists at `server/api/pins/copy-image.post.ts`).

## Known issues / QA (to triage)

- Re-test after archive: **pin board UX**, **public board**, **explorer deep link** (`?document=`), **selection → ActionBar modals**, **i18n** on `/es` routes.
- File any regressions as a new OpenSpec change or issues with concrete repro steps.

## Canonical spec

- Live capability spec: `openspec/specs/human-pins-frontend/spec.md`
