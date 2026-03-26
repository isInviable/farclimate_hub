## Context

Currently `useProjectsStore.initialize()` reads the current project ID from `localStorage` (key `farclimate-current-project-id`). On first load — or when localStorage is cleared, or on a new device — the value is `null`, so the store falls back to the first project ordered by `updated_at`. If that project has the default name "Unnamed Project", the header shows exactly that.

The `human.profiles` table already has a `preferences jsonb` column (default `'{}'`) with RLS allowing authenticated users to SELECT and UPDATE their own row. The profile is auto-created on sign-up via a trigger. This column is the natural home for a `lastProjectId` preference.

## Goals / Non-Goals

**Goals:**
- Eliminate the "Unnamed Project" flash by loading the user's actual last-used project on first render.
- Persist the current project selection in the database so it roams across devices/browsers.
- Keep localStorage as a fast synchronous cache for same-device revisits.

**Non-Goals:**
- Full user-preferences framework (only `lastProjectId` for now; the JSONB column is extensible later).
- Migrating any existing localStorage keys to the profile.
- Persisting view mode, filters, or other explorer state (handled separately by saved-searches feature).

## Decisions

### D1 — Store preference in existing `preferences` JSONB vs. dedicated column
**Choice:** Write `{ "lastProjectId": "<uuid>" }` into the existing `human.profiles.preferences` JSONB column.
**Rationale:** No migration needed; the column exists with `'{}'` default and is updateable via RLS. Adding a dedicated column would require a migration for a single scalar value.
**Alternative considered:** New `last_project_id uuid` column on `human.profiles` — rejected to avoid an unnecessary migration for a single key-value pair.

### D2 — Composable vs. inline Supabase calls
**Choice:** New `useProfilePreferences()` composable that wraps read/write to `human.profiles.preferences`.
**Rationale:** Reusable for future preferences (theme, locale, etc.). Keeps `useProjectsSupabase` focused on project CRUD.

### D3 — Initialization waterfall: localStorage → profile → fallback
**Choice:** Three-tier fallback in `initialize()`:
1. `localStorage` (sync, instant) — covers same-device return visits.
2. `human.profiles.preferences.lastProjectId` (async, 1 query) — covers new device / cleared storage.
3. First project by `updated_at DESC` — last resort.

**Rationale:** localStorage avoids an extra DB round-trip on the happy path. The profile query only fires when localStorage misses, which is the exact case where the bug manifests.

### D4 — Write strategy: dual-write on every switch
**Choice:** Every project switch writes to both localStorage (sync) and `human.profiles.preferences` (async, fire-and-forget).
**Rationale:** Keeps both stores consistent without a background sync job. The profile write is non-blocking — if it fails, the user just loses cross-device roaming but the UI is unaffected.

## Risks / Trade-offs

- **[Race on concurrent tabs]** → Two tabs switching projects simultaneously could produce inconsistent profile writes. Mitigation: last-write-wins is acceptable for a single preference; no conflict resolution needed.
- **[Extra query on first cold load]** → One additional SELECT to `human.profiles` when localStorage is empty. Mitigation: query is by PK with RLS, sub-10 ms; happens once per session.
- **[Stale localStorage]** → If a project is deleted from another device, localStorage may reference a now-deleted ID. Mitigation: `validateCurrentProjectId()` already handles this — it falls back to the first available project.
