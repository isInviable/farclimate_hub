# Búsqueda híbrida y embeddings

Documentación del motor de búsqueda (FTS + semántico), opciones de depuración y compatibilidad de embeddings entre la base de datos y la API.

---

## 1. Cómo funciona la búsqueda

El endpoint `POST /api/search` combina:

- **Búsqueda por palabras clave (FTS)**: PostgreSQL full-text sobre `knowledge.fulltext` (columna `fts`), con `websearch_to_tsquery` y `ts_rank_cd`. Solo devuelve documentos que hacen match con los términos de la query.
- **Búsqueda semántica**: similitud por vectores (pgvector) sobre `knowledge.embeddings`, ordenada por distancia al embedding de la query.
- **Fusión RRF**: Reciprocal Rank Fusion une ambas listas con la fórmula `score = 1/(k + rank)` por cada rama, con pesos configurables.

Si la query no coincide con ningún documento por FTS, el resultado final es solo el orden semántico (todos los documentos con ese `lang`/`content_type`). Con pocos documentos (p. ej. 10) eso implica devolver **todos** con scores RRF muy similares (~0,017–0,02 cuando solo aporta la rama semántica).

Para evitar devolver resultados irrelevantes (p. ej. "laptop lollipop") se aplican **dos niveles de filtrado**:

1. **`match_threshold` (DB-level)**: Umbral de similitud coseno aplicado dentro de la función SQL `hybrid_search`. Filtra la CTE semántica *antes* del JOIN RRF. Sigue el mismo patrón que [`match_documents`](https://supabase.com/docs/guides/ai/semantic-search) de Supabase. Valor entre 0.0 (sin filtro, por defecto) y 1.0 (solo documentos idénticos). Un valor de 0.3 excluye documentos con cosine similarity < 0.3. La condición SQL es: `embedding <=> query_embedding < 1.0 - match_threshold`.
2. **`min_score` (server-level)**: Umbral sobre el score RRF compuesto, aplicado en `search.ts` después de recibir los resultados de la RPC. Por defecto `0.02`. Actúa como red de seguridad secundaria.

Con `match_threshold > 0`, Postgres excluye documentos semánticamente irrelevantes directamente en la base de datos (no se devuelven al servidor). Esto es más eficiente y arquitecturalmente correcto que filtrar solo en el servidor, especialmente con corpus grandes.

### Parámetros del body (POST /api/search)

| Parámetro            | Tipo    | Descripción |
|----------------------|---------|-------------|
| `query`              | string  | Texto de búsqueda. Si está vacío se devuelven todos los documentos (`get_all_documents`). |
| `lang`               | string  | Idioma (p. ej. `en`, `es`). Por defecto `en`. |
| `limit`              | number  | Máximo de resultados. Por defecto 30. |
| `mode`               | string  | `"hybrid"` (por defecto) o `"keyword"`. Con `keyword` no se genera embedding y solo se usa FTS. |
| `debug`              | boolean | Si `true`, la respuesta incluye `debug` con modo, pesos, `min_score`, conteos y por cada hit `keyword_rank` y `semantic_rank`. |
| `match_threshold`    | number  | Umbral de similitud coseno (0.0–1.0) aplicado en la CTE semántica de Postgres. Filtra documentos con `cosine_similarity < match_threshold` **antes** del RRF. Por defecto `0.0` (sin filtro). Valores recomendados: 0.2–0.4. |
| `min_score`          | number  | Umbral mínimo de score RRF (server-side). Solo se devuelven hits con `score >= min_score`. Por defecto `0.02`. Con `0` se desactiva. |
| `full_text_weight`    | number  | Peso de la rama FTS en la fusión RRF. Por defecto `2` (favorece coincidencias por términos). |
| `semantic_weight`     | number  | Peso de la rama semántica. Por defecto `1`. |
| `rrf_k`              | number  | Constante de suavizado RRF. Por defecto `50`. |

---

## 2. Depuración del motor de búsqueda

### 2.1 Modo solo keyword

Para aislar la rama FTS y ver si los resultados vienen solo de palabras clave:

```bash
curl -s -X POST http://localhost:3002/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"wildfires in hungary","lang":"en","limit":30,"mode":"keyword"}'
```

Si con `mode: "keyword"` obtienes el resultado esperado (p. ej. Tatabánya) y con `mode: "hybrid"` no, el problema está en el peso de la rama semántica o en la fusión RRF.

### 2.2 Respuesta de debug

Con `debug: true` la respuesta incluye:

- `debug.mode`: `"hybrid"` o `"keyword"`.
- `debug.match_threshold`: umbral de similitud coseno aplicado en la CTE semántica de Postgres.
- `debug.min_score`: umbral RRF aplicado en el servidor.
- `debug.filtered_count`: número de hits tras filtrar por `min_score`.
- `debug.total_before_filter`: número de hits devueltos por la RPC (ya filtrados por `match_threshold` en DB).
- `debug.full_text_weight`, `debug.semantic_weight`, `debug.rrf_k` (solo en híbrido).
- `debug.raw`: array de `{ id, title, score, keyword_rank, semantic_rank }` por hit (solo los que pasan el filtro).

Ejemplo:

```bash
curl -s -X POST http://localhost:3002/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"wildfires in hungary","lang":"en","limit":30,"debug":true}' | jq '.debug'
```

Si la mayoría de hits tienen `keyword_rank: null`, esos documentos solo aparecen por la rama semántica; subir `full_text_weight` o usar `mode: "keyword"` cuando quieras priorizar términos exactos.

### 2.3 Logs en servidor

Con `debug: true` el servidor escribe en consola los 3 primeros resultados (incl. `keyword_rank` y `semantic_rank`) para híbrido o keyword, lo que ayuda a depurar sin inspeccionar la respuesta HTTP.

### 2.4 Comprobar FTS en la base de datos

Para ver qué documentos hacen match por palabras clave (p. ej. en Supabase SQL Editor o `psql`):

```sql
-- Resultados solo keyword para la query
SELECT * FROM public.keyword_search('wildfires in hungary', 30, 'en');

-- Qué documentos contienen "wildfires" o "hungary" en el fulltext indexado
SELECT d.id, d.title,
       EXISTS (SELECT 1 FROM knowledge.fulltext f WHERE f.document_id = d.id AND f.lang = 'en' AND f.fts @@ websearch_to_tsquery('english', 'wildfires')) AS has_wildfires,
       EXISTS (SELECT 1 FROM knowledge.fulltext f WHERE f.document_id = d.id AND f.lang = 'en' AND f.fts @@ websearch_to_tsquery('english', 'hungary')) AS has_hungary
FROM knowledge.documents d;
```

### 2.5 Ajuste de pesos

- **Priorizar términos exactos**: `full_text_weight: 2` o `3`, `semantic_weight: 1` (o menor). Es el comportamiento por defecto actual.
- **Priorizar similitud conceptual**: `full_text_weight: 1`, `semantic_weight: 2`.
- **Solo keyword**: `mode: "keyword"` (no se usa embedding).

Referencia: [Building a RAG System with Supabase Hybrid Search and AI SDK](https://www.adarsha.dev/blog/rag-supabase-hybrid-search-ai-sdk).

### 2.6 Filtrado por similitud: match_threshold vs min_score

El tutorial de [Supabase Semantic Search](https://supabase.com/docs/guides/ai/semantic-search) usa un `match_threshold` directamente en la función SQL para excluir documentos por distancia coseno:

```sql
WHERE documents.embedding <=> query_embedding < 1 - match_threshold
```

El tutorial de [Supabase Hybrid Search](https://supabase.com/docs/guides/ai/hybrid-search) **no** incluye este filtro (es un ejemplo simplificado). Nuestra función `hybrid_search` lo añade como parámetro opcional `match_threshold`:

```sql
-- En la CTE semantic:
AND (match_threshold <= 0.0 OR e.embedding <=> query_embedding < 1.0 - match_threshold)
```

**Diferencia clave entre los dos niveles:**

| Filtro            | Dónde se aplica | Qué filtra                          | Default |
|-------------------|----------------|-------------------------------------|---------|
| `match_threshold` | DB (CTE semantic) | Distancia coseno bruta del embedding | 0.0     |
| `min_score`       | Server (search.ts) | Score RRF compuesto (keyword + semantic) | 0.02 |

**Con 1000+ documentos**, `match_threshold` es especialmente importante: reduce la cantidad de filas que entran en el RRF desde la CTE semántica, lo que mejora rendimiento y relevancia. Sin él, la CTE semántica siempre devuelve los N documentos más cercanos sin importar lo lejos que estén.

**Cómo tunear `match_threshold`:** Enviar queries con `debug: true` y sin threshold (default 0.0) para observar las distancias reales de los embeddings en tu corpus. Luego elegir un valor que excluya las distancias más altas (documentos irrelevantes) sin cortar los relevantes.

---

## 3. Embeddings: compatibilidad y verificación

La búsqueda semántica y la fusión híbrida requieren que los embeddings de la **query** (generados en `/api/search`) y los de los **documentos** (almacenados en `knowledge.embeddings`) usen el mismo modelo y dimensiones.

### 3.1 Configuración actual

| Origen        | Dónde                         | Modelo                 | Dimensiones | Task type          |
|---------------|-------------------------------|------------------------|------------|--------------------|
| Documentos     | `packages/db/src/embed.ts`    | gemini-embedding-001   | 768        | RETRIEVAL_DOCUMENT |
| Query (search)| `apps/web/server/api/search.ts`| gemini-embedding-001   | 768        | RETRIEVAL_QUERY    |
| Base de datos | `knowledge.embeddings`        | columna `model`        | `vector(768)` | —              |

Para RAG, Google recomienda usar **RETRIEVAL_DOCUMENT** para el corpus y **RETRIEVAL_QUERY** para la query; **SEMANTIC_SIMILARITY** no está pensado para retrieval.

### 3.2 Posibles errores de tamaño

Si la API de Gemini (o el AI SDK) devolviera vectores de otra dimensión (p. ej. 3072 por un bug en `outputDimensionality`):

- Al pasar ese vector a `hybrid_search(query_embedding::vector(768))` Postgres puede fallar o comportarse mal.
- El search API ahora **valida** que el embedding generado tenga longitud 768; si no, lanza un error claro.
- Si se usa un embedding en **caché** con longitud distinta de 768, se desactiva el híbrido y se usa solo búsqueda keyword (y se registra un warning en logs).

### 3.3 Verificar embeddings en la base de datos

El script `packages/db/scripts/verify-embeddings.mjs` comprueba que los embeddings almacenados sean compatibles con la API de búsqueda (768 dimensiones, modelo gemini-embedding-001).

Desde la raíz del repo:

```bash
node packages/db/scripts/verify-embeddings.mjs
```

El script:

- Comprueba la existencia y tipo de la columna `embedding` en `knowledge.embeddings`.
- Muestra una muestra de filas con `model`, `dimensions` y la longitud real del vector.
- Agrupa por `(model, dimensions)` y cuenta filas.
- Sale con código 1 si alguna fila tiene dimensiones o modelo distintos de los esperados.

Si en el pasado se generaron embeddings con otro modelo o dimensiones, hay que regenerarlos (p. ej. con `packages/db` o el pipeline que use `embed.ts`) y volver a ejecutar este script.

### 3.4 Variables de entorno (generación de documentos)

En `packages/db` la generación de embeddings usa:

- `GEMINI_EMBEDDING_MODEL`: por defecto `gemini-embedding-001`.
- `GEMINI_EMBEDDING_DIMENSIONS`: por defecto `768`.

Deben coincidir con lo que usa el search API y con el esquema `vector(768)` de la base de datos.
