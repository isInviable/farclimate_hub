## Shipped scope (reference)

- [x] Shared apply saved search state (`applySavedSearchFilters.ts`) + `FilterManager` consume pending + apply signal.
- [x] Pinboard: fetch `human.saved_searches`, sidebar **Saved searches**, grid cards (`PinBoardSavedSearchCard`), section under **All**.
- [x] `SavedSearchMenu` i18n and optional `variant` (`list-only` unused on action bar in final product).
- [x] **Explorer floating action bar** (`ActionBarExplorer`): no `SavedSearchMenu` / no saved-search duplicate UI (explicit product decision; archived spec).

## Original checklist (superseded)

Earlier tasks referenced `saved_search` pins and add-to-pinboard; those were dropped in favour of table-backed pinboard listing. Manual QA: save search → appears on pinboard → Run search; delete from board or menu → list stays aligned.
