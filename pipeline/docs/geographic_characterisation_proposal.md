# Propuesta: estructura de `geographic_characterisation`

## Resumen del problema

El bloque `.geochar` en Climate-ADAPT no tiene un orden fijo de secciones ni las mismas secciones en todas las páginas. El esquema actual usa `nth-of-type(1), (2), (3)` y asume un orden fijo, por lo que se asignan mal (por ejemplo "Atlantic" acaba en `countries` en vez de en biogeographical regions).

## Casos revisados (HTML real)

| governance_level | Archivo   | Estructura dentro de `.geochar` |
|------------------|-----------|----------------------------------|
| **Transnational** | page_0    | Solo primer `<p>` (continent): "Europe". Un h5 "Health impact:" (no es geografía). |
| **Local**         | page_1    | Primer `<p>`: Europe. Luego h5+p: Macro-Transnational region → Atlantic Area, Biogeographical regions → Atlantic, Countries → Ireland, Sub Nationals → Southern and Eastern (IE), City → Kerry County. |
| **Sub National**  | page_2    | Primer `<p>`: Europe. Luego: Macro-Transnational region → North West Europe, Countries → Belgium, Sub Nationals → Prov. West-Vlaanderen (BE)..., Health impact: (presente). Sin Biogeographical, sin City. |
| **National**      | page_13   | Primer `<p>`: Europe. Luego: Macro-Transnational region → Baltic Sea..., Biogeographical regions → Alpine, Boreal, Continental, Countries → Sweden. Sin Sub Nationals, sin City. |

### Etiquetas h5 que aparecen en `.geochar`

- Siempre: primer `<p>` = **continent** (ej. "Europe").
- Según el caso (orden y presencia variables):
  - `Macro-Transnational region:` → región macro-transnacional
  - `Biogeographical regions:` → regiones biogeográficas
  - `Countries:` → países
  - `Sub Nationals:` → subnacional (regiones, provincias)
  - `City:` → ciudad o área local
  - `Health impact:` → impacto en salud (metadato que a veces va dentro de .geochar; se puede ignorar aquí o mapear a otro campo si se desea)

Conclusión: **no se puede usar posición (nth-of-type)**; hay que identificar cada valor por el **texto del h5** y tomar el `<p>` (o `<span>`) siguiente.

---

## Estructura JSON propuesta para `geographic_characterisation`

Un único objeto con todas las claves posibles. Las que no existan en el HTML se dejan como `null` o se omiten (según preferencia de consumo).

```json
{
  "geographic_characterisation": {
    "continent": "Europe",
    "macro_transnational_region": "Atlantic Area",
    "biogeographical_regions": "Atlantic",
    "countries": "Ireland",
    "sub_nationals": "Southern and Eastern (IE)",
    "city": "Kerry County"
  }
}
```

- **continent** (string): siempre el texto del primer `<p>` dentro de `.geochar`. En los ejemplos siempre "Europe".
- **macro_transnational_region** (string | null): valor del `<p>` que sigue al h5 "Macro-Transnational region:".
- **biogeographical_regions** (string | null): valor del `<p>` que sigue al h5 "Biogeographical regions:".
- **countries** (string | null): valor del `<p>` que sigue al h5 "Countries:" (luego se puede partir por comas si se quiere array en otro nivel).
- **sub_nationals** (string | null): valor del `<p>` que sigue al h5 "Sub Nationals:".
- **city** (string | null): valor del `<p>` que sigue al h5 "City:".

**health_impact** se guarda en un **campo aparte** en el JSON extraído y en `knowledge.summary.health_impact` (no dentro del JSONB de geographic_characterisation).

Los valores son strings tal como vienen en el HTML (por ejemplo "Ireland", "Alpine, Boreal, Continental"). Si en la base de datos o en el front se necesitan arrays (p. ej. países o regiones como lista), la división por comas se puede hacer en el paso de augment o en el loader.

---

## Implementación sugerida

1. **Esquema**: quitar del schema actual los subcampos de `geographic_characterisation` que usan `nth-of-type`, y en su lugar extraer el bloque `.geochar` como un único fragmento (por ejemplo un campo tipo "html" o "text" del contenedor `.geochar`), **o** dejar de extraer geographic_characterisation desde el schema.
2. **Post-procesado en `extract_from_html.py`**: después de la extracción por schema, para cada página:
   - Obtener el HTML del nodo `.geochar` (o el texto ya extraído del bloque).
   - Parsear dentro de ese HTML: localizar cada `<h5>...</h5>` y el siguiente hermano `<p>` (o `<span>`).
   - Mapear por el texto del h5 (normalizado, sin los dos puntos finales):
     - `"Macro-Transnational region"` → `macro_transnational_region`
     - `"Biogeographical regions"` → `biogeographical_regions`
     - `"Countries"` → `countries`
     - `"Sub Nationals"` → `sub_nationals`
     - `"City"` → `city`
   - El primer `<p>` del bloque (antes de cualquier h5) → `continent`.
   - `"Health impact"` → campo de primer nivel `health_impact` (columna `knowledge.summary.health_impact`).
3. **Compatibilidad con `packages/db`**: en `knowledge.summary` el campo `geographic_characterisation` ya es JSONB; el loader hace `sql.json(geo)` con el objeto que venga del JSON. Cualquier objeto con las claves anteriores es válido; no hace falta cambiar migraciones.

**Implementado:** post-procesado en `extract_from_html.py` (parse_geochar_from_html), esquema sin nested geographic_characterisation, columna `health_impact` en `knowledge.summary` y en los wrappers públicos (15_add_health_impact_to_summary.sql, 11_public_search_wrappers.sql), y push-climate-adapt actualizado para escribir `health_impact`.
