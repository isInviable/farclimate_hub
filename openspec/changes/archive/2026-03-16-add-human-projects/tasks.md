## 1. Supabase setup pipeline integration

- [x] 1.1 Add a new ordered SQL file in `packages/supabase-setup/sql/` (next numeric prefix) for human project provisioning.
- [x] 1.2 In that SQL file, create `human.projects` with direct ownership (`owner_user_id uuid not null references auth.users(id) on delete cascade`) and minimal project metadata fields.
- [x] 1.3 Confirm the bootstrap runner picks up the new file by lexical order and that `pnpm supabase:bootstrap` executes it successfully.

## 2. Ownership-based RLS for authenticated CRUD

- [x] 2.1 Enable RLS on `human.projects`.
- [x] 2.2 Add owner-only `insert` policy requiring `owner_user_id = auth.uid()`.
- [x] 2.3 Add owner-only `select` policy requiring `owner_user_id = auth.uid()`.
- [x] 2.4 Add owner-only `update` policy requiring `owner_user_id = auth.uid()` in both `using` and `with check`.
- [x] 2.5 Add owner-only `delete` policy requiring `owner_user_id = auth.uid()`.
- [x] 2.6 Verify no `anon` access path and no broad authenticated policy that allows cross-user project access.

## 3. Validation and documentation

- [x] 3.1 Add SQL validation checks proving project policies enforce owner-only CRUD predicates.
- [x] 3.2 Add validation showing `anon` cannot create/read/update/delete `human.projects`.
- [x] 3.3 Update `packages/supabase-setup/README.md` with the human project bootstrap step and resulting access behavior.
- [x] 3.4 Update relevant docs with project ownership semantics as the first workspace root entity in the human domain.
