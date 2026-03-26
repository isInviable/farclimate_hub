## 1. Profile Preferences Composable

- [x] 1.1 Create `apps/web/app/composables/useProfilePreferences.ts`
- [x] 1.2 Implement `getPreferences()` — SELECT `preferences` from `human.profiles` where `id = auth.uid()`; return `null` for unauthenticated users
- [x] 1.3 Implement `setPreference(key, value)` — JSONB merge-update via `preferences || jsonb_build_object(key, value)`; fire-and-forget with console error logging
- [x] 1.4 Implement convenience helpers: `getLastProjectId()` → reads `preferences.lastProjectId`; `setLastProjectId(id)` → calls `setPreference`

## 2. Update Project Initialization

- [x] 2.1 In `useProjectsStore.initialize()`, after fetching projects and checking localStorage, add fallback to `getLastProjectId()` from profile preferences
- [x] 2.2 When the profile-based ID is used, also update localStorage so the next load is instant
- [x] 2.3 Keep the existing final fallback to the first project by `updated_at DESC`

## 3. Persist on Project Switch / Create

- [x] 3.1 In `useProjectsStore.switchToProject()`, call `setLastProjectId(projectId)` after updating localStorage
- [x] 3.2 In `useProjectsStore.createProject()`, call `setLastProjectId(created.id)` after updating localStorage
- [x] 3.3 Ensure both writes are non-blocking (do not await the profile preference write in the UI path)

## 4. Verification

- [x] 4.1 Confirm that on first load with empty localStorage, the correct last-used project loads from the profile
- [x] 4.2 Confirm that switching projects updates both localStorage and `human.profiles.preferences`
- [x] 4.3 Confirm demo mode users are unaffected (no DB queries, no errors)
