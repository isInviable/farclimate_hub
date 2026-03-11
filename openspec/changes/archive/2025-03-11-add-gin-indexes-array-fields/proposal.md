## Why

Las columnas `sectors`, `climate_impacts`, `adaptation_approaches` y `keywords` de `knowledge.summary` son arrays de texto (`TEXT[]`) que se usarán para filtrado facetado en el explorador. Actualmente no tienen índices GIN, lo que significa que cualquier consulta con `&&` o `@>` hace un sequential scan. Con la base de datos en crecimiento hacia miles de documentos, y con el objetivo de filtrar por tags desde el servidor (combinando con búsqueda vectorial), estos índices son necesarios antes de implementar la capa de filtrado.

## What Changes

- Se añaden 4 índices GIN a `knowledge.summary` para los campos de arrays filtrables: `sectors`, `climate_impacts`, `adaptation_approaches`, `keywords`.
- Los índices se crean con `IF NOT EXISTS` para ser idempotentes y seguros en bases de datos vacías o parcialmente cargadas.
- Se añade un nuevo fichero SQL al pipeline (`12_add_gin_indexes.sql`) que sigue la convención de numeración existente.
- El script de aplicación del pipeline (`packages/db`) puede ejecutarse desde cero o sobre una DB existente sin efectos adversos.

## Capabilities

### New Capabilities

- `array-field-gin-indexes`: Índices GIN en los cuatro campos de arrays filtrables de `knowledge.summary`, habilitando queries `&&` y `@>` eficientes para filtrado facetado por sectores, impactos climáticos, enfoques de adaptación y palabras clave.

### Modified Capabilities

<!-- No hay cambios de requisitos en specs existentes -->

## Impact

- **`packages/db/sql/`**: nuevo fichero `12_add_gin_indexes.sql`
- **`packages/db/`**: el script de setup/push debe incluir este nuevo fichero en el orden de ejecución
- Sin cambios en la API, schema de tablas, o código de frontend
- Transparente para registros existentes y para bases de datos vacías
