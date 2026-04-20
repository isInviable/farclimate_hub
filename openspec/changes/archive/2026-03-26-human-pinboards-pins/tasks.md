## 1. SQL schema and trigger (`packages/supabase-setup`)

- [x] 1.1 Add `packages/supabase-setup/sql/06_human_pinboards_pins.sql` creating `human.pinboards` (`id`, `project_id` unique FK → `human.projects` `ON DELETE CASCADE`, timestamps) with `COMMENT ON` and index on `project_id` as needed
- [x] 1.2 In the same file, create `human.pins` with nullable `source_document_uid`, `source_title_snapshot`, `body_kind` (text NOT NULL), `body` (jsonb NOT NULL), `user_note`, `sort_order` (int default 0), FK `pinboard_id` → `human.pinboards` `ON DELETE CASCADE`, timestamps, indexes on `pinboard_id`, `body_kind`, partial index on `source_document_uid` where not null
- [x] 1.3 Add `CHECK` constraint on `human.pins.body` for `v = 1` and presence of `data` (adjust if Postgres jsonb syntax needs `jsonb_typeof` guards)
- [x] 1.4 Add `CHECK` (trim(`body_kind`) <> '') or equivalent for non-empty `body_kind`
- [x] 1.5 Implement `human.ensure_pinboard_for_project` trigger `AFTER INSERT` on `human.projects` inserting one `human.pinboards` row; document idempotency if re-run on existing DB
- [x] 1.6 Enable RLS on `human.pinboards` and `human.pins`; add owner policies (select/insert/update/delete) via `human.projects.owner_user_id = auth.uid()`; verify cascade delete scenario under RLS
- [x] 1.7 Grant `authenticated` appropriate table privileges; `revoke` from `anon`/`public` on new tables; add validation `DO` block mirroring `04_human_projects.sql` style for RLS presence
- [x] 1.8 Optional: `updated_at` triggers reusing `human.set_projects_updated_at` pattern or dedicated functions for pinboards/pins

## 2. Storage (`human-pin-storage`)

- [x] 2.1 Add `packages/supabase-setup/sql/07_human_pin_storage.sql` (or merge into 06 if preferred) inserting `storage.buckets` row for `human-pin-images` with file size and MIME limits documented in comments
- [x] 2.2 Create `storage.objects` policies for path prefix = `auth.uid()` / owner-scoped layout; document object key convention `{uid}/{pin_id}/...` or chosen layout in README
- [x] 2.3 Document in README any dashboard step if bucket cannot be fully SQL-provisioned on hosted Supabase

## 3. Documentation

- [x] 3.1 Update `packages/supabase-setup/README.md` with new SQL file(s), pinboard auto-creation, pin RLS summary, storage bucket name, and beta limits (512 KiB body, 10k pins, 20 MiB image)

## 4. Backend tests (demo / test user)

- [x] 4.1 Add Vitest integration tests (e.g. under `apps/web/tests/human/` or `packages/supabase-setup/tests/`) that skip when env vars missing; document required vars (`SUPABASE_URL`, demo user credentials, optional `SUPABASE_SERVICE_ROLE_KEY` for teardown)
- [x] 4.2 Test: after insert into `human.projects` as user A, exactly one `human.pinboards` row exists for that `project_id`
- [x] 4.3 Test: user A CRUD on `human.pins` for their pinboard succeeds
- [x] 4.4 Test: user B cannot select or mutate user A’s pins or pinboards
- [x] 4.5 Test: `anon` key cannot read `human.pins` / `human.pinboards`
- [x] 4.6 Test: owner deletes project and cascaded pinboard/pins are removed (or verify count zero)
- [ ] 4.7 Optional: storage upload under owner prefix + delete object on pin delete (requires bucket + service setup in CI)

## 5. Wire-up and verification

- [x] 5.1 Run `pnpm supabase:bootstrap` against a dev database and smoke-test with Supabase Studio or SQL as owner vs non-owner
- [x] 5.2 Run new tests locally with demo user; add `pnpm` script if useful (e.g. `test:human-pins`)

## 6. Post-merge / OpenSpec housekeeping

- [x] 6.1 After implementation, archive change per project OpenSpec workflow and promote specs to `openspec/specs/` if required by your process
