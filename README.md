# FARCLIMATE — Data pipelines

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

---

- **Carpeta `0_source_datasets`**: no se usa en el código actual; solo está en `.gitignore` como carpeta de datos fuente opcional.
