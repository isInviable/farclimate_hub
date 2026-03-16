# Hybrid Search: Future Improvements

Fecha: 2026-03-16

## Contexto

Se ha revisado la implementación actual de búsqueda híbrida del proyecto:

- API principal en `apps/web/server/api/search.ts`
- RPC y funciones SQL en `packages/db/sql`
- Especificaciones en `openspec/specs`

La conclusión general de la revisión es que la arquitectura actual es buena y razonable para Supabase:

- La lógica principal de ranking híbrido vive en SQL/RPC.
- Se usa `pgvector` para búsqueda semántica y `tsvector` + GIN para keyword search.
- La fusión con `RRF` está bien planteada.
- Hay separación clara entre búsqueda, facetas e hidratación de documentos.
- El parámetro `match_threshold` es una mejora útil frente a ejemplos más simples.

No se han detectado problemas críticos que justifiquen cambios inmediatos. Esta nota recoge mejoras recomendadas para una fase posterior, cuando la implementación ya esté más madura o el corpus crezca.

## Resumen ejecutivo

La implementación actual sigue un enfoque sólido para una aplicación basada en Supabase. No parece necesario replantear la arquitectura base. Las mejoras futuras deberían centrarse en:

1. Mover parte del filtrado por facetas al nivel SQL/RPC.
2. Verificar la coherencia entre la firma pública RPC y la API real.
3. Revisar el tuning de `pgvector` si el corpus aumenta.
4. Mejorar la calidad del ranking keyword con pesos por campo.
5. Mantener y consolidar el modo `keyword` como fallback explícito.

## Action Points y recomendaciones

### 1. Integrar facetas activas dentro de la búsqueda SQL

Estado actual:

- La búsqueda híbrida recupera candidatos primero.
- Después, `search.ts` aplica el filtrado por facetas en servidor usando `get_summary_facet_arrays`.
- Para compensar, se hace overfetch de candidatos (`limit * 3`, con tope).

Ventajas del diseño actual:

- Implementación sencilla.
- Menos complejidad en la SQL principal.
- Fácil de iterar y depurar.

Desventajas:

- Riesgo de perder resultados relevantes si los filtros son restrictivos y el documento no entra en el top-N inicial.
- La heurística de overfetch no escala de forma robusta.
- Añade viajes extra a la base de datos y lógica adicional en la capa API.

Recomendación futura:

- Evaluar una versión de `hybrid_search` que acepte filtros de facetas activos y los aplique en DB antes del ranking final, o al menos en la generación del conjunto de candidatos.

Action points:

- Diseñar una variante de `hybrid_search` con filtros opcionales por `sectors`, `climate_impacts`, `adaptation_approaches` y `keywords`.
- Comparar recall y precisión frente al enfoque actual con filtros selectivos.
- Revisar si el endpoint de facetas puede reutilizar parte del mismo conjunto filtrado para reducir duplicación de trabajo.

### 2. Verificar la coherencia entre `search.ts` y `public.hybrid_search`

Estado actual:

- La API `search.ts` envía `match_threshold` al llamar a `hybrid_search`.
- En la revisión del SQL consolidado, el wrapper `public.hybrid_search` parece no exponer ese parámetro en su firma actual.

Riesgo:

- Puede existir una desalineación entre el código de la API, el SQL consolidado y la base de datos realmente desplegada.
- Si en producción funciona, probablemente la BD real ya no coincide exactamente con el fichero SQL consolidado.

Recomendación futura:

- Hacer una comprobación explícita del contrato real de la función RPC desplegada en Supabase y alinearlo con las specs y con `packages/db/sql`.

Action points:

- Verificar la firma efectiva de `public.hybrid_search` en la base de datos desplegada.
- Confirmar que `match_threshold` está soportado extremo a extremo.
- Añadir una comprobación de consistencia entre specs, SQL consolidado y ruta API cuando se retome esta área.

### 3. Revisar el tuning de `pgvector` si crece el corpus

Estado actual:

- Se usa índice `IVFFlat` con `lists = 10`.
- Las specs indican que ese tuning está pensado para un corpus pequeño, aproximadamente del orden de cientos de documentos.

Ventajas del diseño actual:

- Suficiente para el tamaño actual.
- Simple de operar.
- Alineado con una primera implementación razonable en Supabase.

Desventajas futuras:

- El tuning actual no es necesariamente adecuado para miles o decenas de miles de documentos.
- Puede degradarse el equilibrio entre recall, latencia y coste.
- El comportamiento real dependerá del tamaño del corpus y de la distribución semántica.

Recomendación futura:

- Revisar la estrategia de indexación y tuning cuando el corpus crezca y haya datos reales de uso.

Action points:

- Medir latencia y calidad de resultados con un corpus mayor.
- Revisar `lists` de IVFFlat y valorar otras opciones de indexación soportadas por pgvector/Supabase si aplican en ese momento.
- Documentar un criterio de retuning ligado al tamaño del corpus y al tráfico real.

### 4. Mejorar la rama keyword con pesos por campo

Estado actual:

- El FTS se apoya principalmente en `knowledge.fulltext.fts`.
- Esto simplifica el modelo pero trata gran parte del texto como una masa homogénea.

Oportunidad:

- En buscadores más finos, `title`, `subtitle` o `summary` suelen pesar más que el cuerpo completo.
- Eso mejora búsquedas donde el término clave aparece en zonas de alta señal semántica.

Recomendación futura:

- Evaluar un `tsvector` ponderado por campos o una estrategia equivalente que favorezca coincidencias en `title`, `subtitle` y `summary`.

Action points:

- Diseñar una alternativa de FTS con pesos por campo.
- Comparar resultados de consultas reales frente al `fts` actual.
- Mantener la simplicidad actual si la mejora en relevancia no compensa la complejidad añadida.

### 5. Mantener el modo `keyword` como fallback explícito

Estado actual:

- La API permite `mode: "keyword"`.
- También hay fallback automático a keyword si falla la generación de embeddings o falla la rama híbrida.

Valor del enfoque actual:

- Es un buen mecanismo de resiliencia.
- Facilita depuración.
- Permite priorizar coincidencias exactas cuando el caso de uso lo necesita.

Recomendación futura:

- Mantener este modo como parte deliberada de la arquitectura, no solo como parche temporal.

Action points:

- Conservar `keyword` como modo soportado y documentado.
- Definir mejor cuándo conviene exponerlo en UI o usarlo internamente.
- Usarlo como referencia para comparar relevancia frente al híbrido en tests manuales o benchmarks.

## Qué no parece necesario cambiar ahora

- No hace falta replantear la arquitectura base de búsqueda híbrida.
- No parece necesario sacar la búsqueda fuera de Supabase a un motor externo en esta fase.
- No hay señales de un problema crítico de diseño que obligue a rehacer el sistema actual.

## Criterio para retomar este documento

Tiene sentido volver a esta lista cuando ocurra una o varias de estas condiciones:

- El corpus crezca lo suficiente como para notar límites de latencia o recall.
- Aparezcan consultas con facetas activas que pierdan resultados relevantes.
- Se quiera subir el nivel de calidad del ranking keyword.
- Se detecten inconsistencias entre specs, SQL consolidado y entorno desplegado.
- Se quiera preparar la búsqueda para una fase más productiva o con mayor volumen.

## Decisión actual

Por ahora, mantener la implementación actual y posponer cambios. La arquitectura es válida. Las mejoras anteriores quedan registradas como backlog técnico de evolución.
