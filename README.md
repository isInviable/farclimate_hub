# FARCLIMATE — Data pipelines

**Al reabrir el repo:** empieza por [`docs/README.md`](docs/README.md) (mapa del proyecto, trabajo pendiente, y qué comando corre cada cosa). CORDIS / Connected Action: [`docs/cordis-pipeline.md`](docs/cordis-pipeline.md). Cómo arrancar el Hub: [`docs/getting-started.md`](docs/getting-started.md).

Carga de estudios de caso de Climate-ADAPT hasta la base de datos. Lista ordenada de pasos; el detalle de cada uno está en el README del proyecto correspondiente.

## Proceso de carga (Climate-ADAPT → base de datos)

1. **Tener un CSV con URLs** — Primera columna "About" con la URL de cada caso. La fuente por defecto es `pipeline/data-5.csv`. Ver `pipeline/README.md`.
2. **Descargar HTML** — Ejecutar `fetch_html.py`; lee el CSV y guarda el HTML en `pipeline/source_html/`. Ver `pipeline/README.md`.
3. **Generar esquema de extracción** — Opcional si ya tienes `extraction_schema_generated.json`. Script `generate_extraction_schema.py`. Ver `pipeline/README.md`.
4. **Extraer JSON desde HTML** — Ejecutar `extract_from_html.py`; produce un JSON por página en `pipeline/extracted/`. Ver `pipeline/README.md`.
5. **Aumentar con IA** — Ejecutar `augment_with_ai.py`; geocodificación, años, campos preprocesados. Salida en `pipeline/augmented/`. Ver `pipeline/README.md`.
6. **Traducir** — Ejecutar `translate_augmented.py`; genera archivos de traducción (p. ej. `*_es.json`) en `pipeline/augmented/`. Ver `pipeline/README.md`.
7. **Cargar en la base de datos** — Desde `packages/db`: `pnpm db:push`. Lee `pipeline/augmented/`, inserta o actualiza documentos y genera embeddings. Ver `packages/db/README.md`.

**Dos casos:**  
- **Base de datos ya existe** (tu caso: cargar 100 ítems en vez de 10): solo necesitas los pasos 1–6 para los nuevos ítems y luego el paso 7 (`db:push`). No hace falta `db:create`.  
- **Base de datos nueva**: antes del paso 7 ejecuta una vez `pnpm db:create` en `packages/db` para crear el esquema; después `db:push`.

## Proceso de carga (CORDIS / Connected Action)

Los visualizadores de Connected Action leen tablas `public` (`projects_cordis`, `entities_cordis`, …). El pipeline está en `packages/cordis`. Lista por defecto: catálogo Mission 2026 (65 proyectos). Ver `packages/cordis/README.md`.

1. **`pnpm cordis:download`** — XML desde CORDIS a `packages/cordis/data/downloads/`. Omite los proyectos ya descargados; usa `--refresh` para volver a bajarlos todos.
2. **`pnpm cordis:parse`** — CSV en `packages/cordis/data/csv/`. Los riesgos climáticos y los temas principales vienen de `data/project_climate_risks.csv` y `data/project_main_themes.csv` (extraídos del PDF del catálogo), no de palabras clave.
3. **`pnpm cordis:drift`** — solo lectura: qué diferencias hay entre la base de datos y `packages/cordis/sql/` + `taxonomy.ts`. Aquí aparecen los cambios hechos a mano en Supabase, para confirmarlos e incorporarlos al repo.
4. **`pnpm cordis:push --dry-run`** — hace el upsert en una transacción, escribe el registro de cambios en `packages/cordis/data/audit_output/` y deshace todo. Revísalo antes de continuar.
5. **`pnpm cordis:push`** — lo mismo, confirmado. Upsert por `cordis_id` (conserva UUIDs y `products_custom`).
6. **`pnpm cordis:audit`** — solo lectura: comprueba que la base de datos coincide con el XML y con los CSV del catálogo.

`pnpm cordis:create` es solo para bases nuevas y exige un modo explícito: `--tables-only` (seguro) o
`--with-rls` (**nunca** contra producción; ver `packages/cordis/README.md`).

No apuntes `DATABASE_URL` a producción salvo que quieras refrescar el catálogo.

---

- **Carpeta `0_source_datasets`**: no se usa en el código actual; solo está en `.gitignore` como carpeta de datos fuente opcional.
