## Why

When an authenticated user first loads the explorer, the header always shows "Unnamed Project" because the current-project selection is stored only in `localStorage` — which is device-local and lost on browser-data clears. The `human.profiles.preferences` JSONB column already exists but is empty. Persisting the last-used project ID there makes project selection survive across devices and sessions.

## What Changes

- **Read/write `lastProjectId` in `human.profiles.preferences`** — a new lightweight composable (`useProfilePreferences`) wraps SELECT/UPDATE on the existing `preferences` JSONB column.
- **Update `useProjectsStore.initialize()`** — on startup, try localStorage first (fast), then fall back to `preferences.lastProjectId` from the profile, then to the most-recently-updated project. This eliminates the "Unnamed Project" flash.
- **Write preference on project switch** — whenever the user switches or creates a project, persist the new ID to both localStorage (for immediate next load) and `human.profiles.preferences` (for cross-device durability).
- **No new database tables or migrations** — the `preferences jsonb` column on `human.profiles` is already in production.

## Capabilities

### New Capabilities
- `profile-preferences`: Read and write user preferences from the existing `human.profiles.preferences` JSONB column, starting with `lastProjectId`.

### Modified Capabilities
- `frontend-projects-supabase`: The project initialization flow changes to read the last-used project from the user profile when localStorage is empty, and to persist the selection back to the profile on every switch.

## Impact

- **Composables** — new `useProfilePreferences.ts` in `apps/web/app/composables/`.
- **Store** — `apps/web/app/stores/projects.ts` (`initialize`, `switchToProject`, `createProject`) gain async calls to read/write profile preferences.
- **Composable** — `useProjectsSupabase.ts` gets thin wrappers (`getRemoteLastProjectId`, `setRemoteLastProjectId`).
- **No DB changes** — uses existing `human.profiles` table and `preferences` column.
- **No breaking changes** — localStorage continues to work as a fast cache; the profile preference is a durable fallback.
