## Why

El explorador necesita un endpoint de facets (valores únicos + conteos) para los filtros por sectores, impactos climáticos, enfoques de adaptación y palabras clave, tal como muestra la UI con barras y números. Además, la interfaz debe poder comparar **cuánto hay en la base de datos total** frente a **cuánto hay en los resultados actuales de búsqueda/filtrado**, para mostrar qué porcentaje de la información disponible en cada categoría está representado en los resultados (por ejemplo: "Agriculture: 67 de 342 total, 19,6%").

## What Changes

- Nueva función en base de datos `get_filter_facets()` (o equivalente en `knowledge` + wrapper en `public`) que devuelva para cada campo facetado (`sectors`, `climate_impacts`, `adaptation_approaches`, `keywords`) la lista de valores únicos con su conteo.
- La respuesta debe incluir **conteos globales** (sobre toda la tabla `knowledge.summary`) y, cuando se indique un conjunto de documentos (p. ej. IDs de los resultados de búsqueda), **conteos sobre ese subconjunto**, para que el frontend pueda calcular y mostrar el porcentaje (resultados vs total).
- Opcionalmente, un endpoint HTTP en la app web (p. ej. `/api/facets`) que llame a esa función y exponga la misma información, si se quiere centralizar la llamada a Supabase en el servidor.
- Formato de salida estable y documentado (p. ej. por categoría: array de `{ value, count }` ordenado por count descendente).

## Capabilities

### New Capabilities

- `filter-facets`: Endpoint/capacidad que expone facets (valores únicos + conteos) para los campos de array filtrables de `knowledge.summary`, incluyendo conteos globales y conteos sobre un conjunto de documentos opcional para permitir en la UI el cálculo de porcentaje (resultados vs base de datos total).

### Modified Capabilities

<!-- None -->

## Impact

- **`packages/db/sql/`**: nuevo fichero de migración para la función de facets (y su wrapper público si aplica).
- **`packages/db/src/create-tables.ts`**: incluir el nuevo SQL en el orden de ejecución.
- **Frontend**: consumirá la respuesta de facets (global + por result set) para pintar los filtros y el porcentaje; no se especifica en este change el diseño visual, solo la disponibilidad de los datos.
- **Opcional**: `apps/web/server/api/` — nuevo handler (p. ej. `facets.ts`) que llame a la función de facets y devuelva el mismo formato.
