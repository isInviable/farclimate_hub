## Context

`knowledge.summary` almacena los atributos estructurados extraídos de documentos en forma de arrays de texto (`TEXT[]`): `sectors`, `climate_impacts`, `adaptation_approaches` y `keywords`. Estos campos están marcados como "Filterable array fields" en el propio DDL.

El pipeline de setup (`packages/db/src/create-tables.ts`) ejecuta ficheros SQL en orden numérico. Actualmente llega hasta `11_public_search_wrappers.sql`. Los ficheros SQL usan `IF NOT EXISTS` / `CREATE OR REPLACE` para ser seguros ante re-ejecuciones. El proyecto tiene ya precedente con índices `IF NOT EXISTS`: el índice GIN para full-text search (`fulltext_fts_idx`) y el índice ivfflat para embeddings vectoriales (`embeddings_embedding_idx`).

Hay actualmente ~10 documentos de test. Se esperan miles en producción.

## Goals / Non-Goals

**Goals:**
- Añadir índices GIN en `sectors`, `climate_impacts`, `adaptation_approaches` y `keywords` de `knowledge.summary`
- El script es idempotente: seguro en DB vacía, en DB con datos, y en re-ejecuciones
- Seguir la convención de numeración existente (`12_...sql`) para mantener el orden reproducible

**Non-Goals:**
- No modificar el schema de la tabla (ninguna columna cambia)
- No crear índices en otros campos de `knowledge.summary` (p.ej. JSONB, location)
- No cambiar la lógica de búsqueda ni los wrappers de PostgREST en esta fase

## Decisions

### Decisión 1: Un solo fichero SQL para los 4 índices

Se concentran los 4 `CREATE INDEX IF NOT EXISTS` en un único `12_add_gin_indexes.sql`, en lugar de un fichero por índice.

**Alternativa considerada**: un fichero por índice (mayor granularidad de rollback). Rechazada por overhead innecesario: los 4 índices son atómicamente relacionados, y el precedente del proyecto (p.ej. `08_add_fts_column.sql`) es agrupar cambios relacionados.

### Decisión 2: `IF NOT EXISTS` obligatorio

Todos los `CREATE INDEX` usan `IF NOT EXISTS`. Esto garantiza que el script del pipeline puede ejecutarse:
- Desde cero (DB vacía, tabla recién creada)
- Sobre una DB ya existente que cargó documentos antes de que estos índices existieran
- En re-ejecuciones repetidas del pipeline sin errores

**Alternativa considerada**: usar `DROP INDEX IF EXISTS ... ; CREATE INDEX ...`. Rechazada porque el DROP en una DB con datos provoca un rebuild completo innecesario. Con `IF NOT EXISTS` se preservan los índices existentes.

### Decisión 3: `gin_array_ops` implícito (operador por defecto para TEXT[])

Para `TEXT[]` el operador GIN por defecto de Postgres es `array_ops`, que soporta `&&` (overlap), `@>` (contains) y `<@` (contained by). No se especifica explícitamente porque el tipo TEXT[] ya lo resuelve correctamente.

### Decisión 4: Añadir a `create-tables.ts`

El nuevo fichero se añade al array de `runSqlFiles(...)` en `create-tables.ts`. Es el único punto de entrada del pipeline de setup y mantiene el orden correcto.

## Risks / Trade-offs

- **[Riesgo] Build time del índice en DB grande** → En 10K-100K filas un `CREATE INDEX` sobre arrays pequeños tarda segundos. Con `IF NOT EXISTS` no hay overhead en re-ejecuciones.
- **[Riesgo] El índice GIN usa más espacio en disco** → Para arrays de texto cortos (~5-10 elementos por fila) el overhead es muy pequeño comparado con los embeddings vectoriales ya existentes. Sin impacto práctico.
- **[Trade-off] No se indexa `keywords`** → Los keywords son más ruidosos y menos útiles para filtrado facetado en la UI. Se incluyen igualmente porque el coste es mínimo y pueden usarse en el futuro.

## Migration Plan

1. Añadir `12_add_gin_indexes.sql` con los 4 `CREATE INDEX IF NOT EXISTS`
2. Añadir el fichero al array de `create-tables.ts`
3. En producción: ejecutar `npx tsx src/create-tables.ts` (o el equivalente del pipeline). Los índices se crean sin afectar datos existentes.
4. **Rollback**: `DROP INDEX IF EXISTS knowledge.summary_sectors_gin, ...` — inmediato y sin pérdida de datos.
