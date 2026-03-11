## Context

`knowledge.summary` tiene cuatro columnas tipo `TEXT[]` usadas para filtrado: `sectors`, `climate_impacts`, `adaptation_approaches`, `keywords`. Ya existen índices GIN para consultas `&&` / `@>`. El frontend necesita listar los valores únicos de cada una con su conteo para mostrar filtros facetados (como en la captura: Sector con Agriculture 67, Forestry 45, etc.) y además comparar **conteo en resultados actuales** vs **conteo en toda la base de datos** para mostrar el porcentaje de información disponible que representa cada resultado.

La búsqueda actual usa `get_all_documents`, `hybrid_search` y `get_documents_by_ids`; el conjunto de documentos "actual" es el de los hits devueltos por la búsqueda (o por un filtrado posterior). No hay hoy ningún endpoint de agregación por facetas.

## Goals / Non-Goals

**Goals:**
- Exponer facets (valor único + conteo) para los cuatro campos de array, con conteos **globales** (toda la tabla) y opcionalmente **sobre un conjunto de document IDs** (resultados de búsqueda).
- Formato estable (p. ej. por categoría: `{ value, count }[]` ordenado por count descendente) para que el frontend pueda calcular porcentajes (count_result_set / count_global).
- Idempotencia del pipeline: nuevo SQL ejecutable sobre DB vacía o existente, sin romper el orden actual de migraciones.

**Non-Goals:**
- No definir en este change el diseño visual de la barra de progreso ni los textos de la UI; solo la disponibilidad de los datos.
- No implementar filtrado por tags en la búsqueda (eso será un change posterior que consumirá estos facets).

## Decisions

### Decisión 1: Una sola función con parámetro opcional `doc_ids`

Una función `knowledge.get_filter_facets(doc_ids uuid[] DEFAULT NULL)` que:
- Si `doc_ids` es NULL o vacío: calcula conteos solo sobre toda la tabla (global).
- Si `doc_ids` tiene valores: calcula además los conteos restringidos a `summary.document_id = ANY(doc_ids)`.

**Alternativa:** Dos funciones separadas (`get_filter_facets_global()` y `get_filter_facets_for_documents(doc_ids)`). Rechazada para evitar duplicar la lógica de unnest/aggregation y mantener una sola firma que el frontend puede llamar una vez con los IDs actuales y obtener ambos bloques si se desea (ver decisión 2).

### Decisión 2: Respuesta con ambos bloques cuando se pasan `doc_ids`

Cuando se invoca con `doc_ids` no vacío, la función devuelve **dos conjuntos** de facetas en la misma respuesta:
- `global`: conteos sobre toda la base (siempre útiles para el porcentaje).
- `for_result_set`: conteos sobre el subconjunto dado.

Así el frontend hace una sola llamada tras obtener los hit IDs (p. ej. de `/api/search`) y puede pintar tanto las barras de "en resultados" como el porcentaje respecto al total. Cuando no se pasan `doc_ids`, solo se devuelve `global` (o `for_result_set` vacío/equivalent).

**Alternativa:** Devolver solo `for_result_set` y que el cliente llame dos veces (una sin IDs para global, otra con IDs). Rechazada porque implica dos round-trips y más lógica en el cliente; un solo response con ambos es más simple para la UI de "porcentaje disponible".

### Decisión 3: Formato de retorno JSONB

La función devuelve un único valor JSONB con estructura fija, por ejemplo:

```json
{
  "global": {
    "sectors": [{ "value": "Agriculture", "count": 342 }],
    "climate_impacts": [...],
    "adaptation_approaches": [...],
    "keywords": [...]
  },
  "for_result_set": {
    "sectors": [{ "value": "Agriculture", "count": 67 }],
    ...
  }
}
```

Cada lista ordenada por `count` descendente. Si no se pasan `doc_ids`, `for_result_set` puede ser un objeto vacío o con listas vacías.

**Alternativa:** Retorno en forma de tabla (filas por facet value + scope). Rechazada porque el cliente tendría que reensamblar por categoría y por scope; JSONB permite un contrato estable y fácil de consumir desde Nuxt/TS.

### Decisión 4: Implementación en SQL con `unnest` + `GROUP BY`

Para cada campo array se usa `unnest(campo) AS val` sobre `knowledge.summary` (opcionalmente filtrado por `document_id = ANY(doc_ids)`), `GROUP BY val`, `COUNT(*)`, ordenado por count descendente. Con ~10K filas es eficiente; los índices GIN no se usan para esta agregación pero el coste es bajo.

### Decisión 5: Wrapper público y opción de endpoint HTTP

- Crear `public.get_filter_facets(doc_ids uuid[] DEFAULT NULL)` que delegue a `knowledge.get_filter_facets` (mismo patrón que `get_all_documents` y `hybrid_search`) para que PostgREST/Supabase lo expongan.
- Dejar como opcional un handler en `apps/web/server/api/` (p. ej. `facets.post.ts`) que reciba body `{ doc_ids?: string[] }`, llame a la RPC y devuelva el JSON. Si el frontend llama directamente a Supabase, no es estrictamente necesario; si se quiere ocultar Supabase detrás del servidor Nuxt, el endpoint centraliza la llamada.

## Risks / Trade-offs

- **[Riesgo] Tamaño de respuesta** → Con muchas etiquetas únicas el JSON puede crecer. Mitigación: límite razonable por categoría (p. ej. top 200 por count) si en el futuro se observan problemas; no obligatorio en la primera versión.
- **[Trade-off]** Solo se facetan los cuatro campos de array; no se incluyen otros atributos (p. ej. `geographic_characterisation`) en este change.

## Migration Plan

1. Añadir fichero SQL en `packages/db/sql/` (p. ej. `13_get_filter_facets.sql`) con la función en `knowledge` y el wrapper en `public`.
2. Registrar el fichero en `create-tables.ts`.
3. Despliegue: ejecutar el pipeline de creación de tablas/funciones; no hay migración de datos.
4. Rollback: `DROP FUNCTION` de las dos funciones (público y knowledge) si fuera necesario.
