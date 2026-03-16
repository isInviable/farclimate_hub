## Context

The platform now has `human.profiles` as the first durable human-domain entity and needs a first user-owned workspace container that can already be used independently. `human.projects` should be isolated by direct ownership (`owner_user_id -> auth.users.id`) and provisioned through `packages/supabase-setup` so fresh Supabase environments can be recreated deterministically.

## Goals / Non-Goals

**Goals:**
- Add `human.projects` as the root workspace container for user curation.
- Model ownership directly with `owner_user_id` referencing `auth.users(id)`.
- Enable authenticated users to create, list, update, and delete only their own project rows.
- Ensure `anon` has no project access.
- Deliver this through ordered SQL in `packages/supabase-setup/sql/` so `pnpm supabase:bootstrap` provisions it in new environments.

**Non-Goals:**
- Implementing child workspace entities (pins, annotations, collections, etc.).
- Defining advanced collaboration/sharing semantics across users.
- Introducing elevated-role exceptions for project ownership behavior.
- Coupling project identity to `knowledge` domain row identities.

## Decisions

1. **Projects live in `human` schema and are bootstrap-managed**
   - **Decision:** Add a new ordered setup SQL file (next numeric prefix) to create/alter `human.projects`.
   - **Rationale:** Keeps durable domain setup reproducible with existing bootstrap workflow.
   - **Alternative considered:** One-off SQL migration outside setup package; rejected due to environment drift risk.

2. **Direct ownership by auth user, not profile indirection**
   - **Decision:** Use `owner_user_id uuid not null references auth.users(id) on delete cascade`.
   - **Rationale:** `auth.users.id` remains canonical owner identity and avoids unnecessary joins/identity indirection.
   - **Alternative considered:** Ownership via `human.profiles.id`; rejected because ownership should remain directly anchored to auth users.

3. **Minimal but complete project shape**
   - **Decision:** Include core fields required for immediate usability (stable identifier, owner, basic metadata, timestamps) with conservative defaults.
   - **Rationale:** Enables immediate CRUD use without over-designing future workspace concerns.
   - **Alternative considered:** Full project settings/config schema now; deferred until feature requirements are concrete.

4. **Owner-only CRUD enforced by RLS**
   - **Decision:** Enable RLS and define owner-scoped policies for `insert`, `select`, `update`, and `delete` keyed on `owner_user_id = auth.uid()`.
   - **Rationale:** Implements standard Supabase ownership isolation with least privilege.
   - **Alternative considered:** API-layer only filtering; rejected because DB-level enforcement is required.

5. **No `anon` project access**
   - **Decision:** Restrict grants/policies so unauthenticated users cannot create/read/update/delete projects.
   - **Rationale:** Human-domain workspace data is user-owned persistence and must not be exposed to demo browsing.
   - **Alternative considered:** Read-only anon visibility; rejected as outside project ownership scope.

## Risks / Trade-offs

- **[Overly strict initial schema]** Future project metadata needs could require migrations. → **Mitigation:** Keep initial schema minimal and additive-friendly.
- **[Policy drift over time]** Later policy edits may accidentally broaden access. → **Mitigation:** Add bootstrap SQL validation checks against policy role/owner predicates.
- **[Ownership delete cascade]** Deleting an auth user deletes owned projects. → **Mitigation:** Align with account deletion semantics and document behavior.
- **[Bootstrap ordering conflicts]** New file ordering mistakes can break setup assumptions. → **Mitigation:** Use explicit numeric prefix and document sequence.

## Migration Plan

1. Add a new ordered SQL file in `packages/supabase-setup/sql/` for `human.projects`.
2. Create `human.projects` with direct owner FK to `auth.users`.
3. Enable RLS and add owner-only CRUD policies (`owner_user_id = auth.uid()`).
4. Apply grants/revokes to prevent `anon` or broad cross-user access paths.
5. Add SQL validation checks proving owner-only access shape and no `anon` policy exposure.
6. Validate by running `pnpm supabase:bootstrap` and confirming the new SQL step executes.
7. Rollback strategy:
   - drop project policies,
   - drop table,
   - remove setup SQL step if reverting the feature entirely.

## Open Questions

- Should project names be unique per owner in this initial phase?
- Should soft-delete be included now or deferred until project recovery requirements exist?
- Do we want `created_by`/`updated_by` audit columns in this first version?
