# Consolidated knowledge schema (delta)

---

## MODIFIED Requirements

### Requirement: Function signatures remain unchanged

All function signatures (parameter names, types, defaults, return types) SHALL be identical to the current versions **except** that `public.get_all_documents` and `public.get_documents_by_ids` MAY be extended with an additional nullable return column `recipe_ingredients jsonb` sourced from `knowledge.recipe.ingredients` for `filter_lang`, so that document-fetching clients receive pipeline recipe data in the same call. All other functions listed in the consolidated schema spec (including `knowledge.hybrid_search`, `public.hybrid_search`, `public.keyword_search`, etc.) SHALL keep their parameter lists and return column sets unchanged.

#### Scenario: hybrid_search signature unchanged

- **WHEN** `knowledge.hybrid_search` is called with the same parameters as before

- **THEN** it SHALL return the same column set (`id`, `document_uid`, `title`, `score`, `keyword_rank`, `semantic_rank`) with the same types

#### Scenario: public.hybrid_search wrapper unchanged

- **WHEN** `public.hybrid_search` is called via PostgREST with a text embedding parameter

- **THEN** it SHALL cast to `vector(768)` and delegate to `knowledge.hybrid_search` exactly as before

#### Scenario: get_documents_by_ids exposes recipe_ingredients

- **WHEN** `public.get_documents_by_ids` is invoked with a language for which a `knowledge.recipe` row exists

- **THEN** each returned row SHALL include `recipe_ingredients` equal to that row’s `ingredients` object, or NULL when no recipe exists for that `(document_id, lang)`
