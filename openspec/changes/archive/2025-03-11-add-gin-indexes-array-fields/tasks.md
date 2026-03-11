## 1. SQL Migration Script

- [x] 1.1 Crear `packages/db/sql/12_add_gin_indexes.sql` con `CREATE INDEX IF NOT EXISTS` para los 4 campos: `sectors`, `climate_impacts`, `adaptation_approaches`, `keywords` en `knowledge.summary`
- [x] 1.2 Verificar que los nombres de índice son descriptivos y consistentes con la convención del proyecto (e.g. `summary_sectors_gin`, `summary_climate_impacts_gin`, etc.)

## 2. Pipeline Setup

- [x] 2.1 Añadir `"12_add_gin_indexes.sql"` al array de `runSqlFiles(...)` en `packages/db/src/create-tables.ts`, después de `"11_public_search_wrappers.sql"`

## 3. Verificación

- [x] 3.1 Ejecutar `create-tables.ts` desde cero en una DB vacía y confirmar que los 4 índices existen (`\d knowledge.summary` en psql o query a `pg_indexes`)
- [x] 3.2 Ejecutar `create-tables.ts` una segunda vez y confirmar que no hay errores (idempotencia)
