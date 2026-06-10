import type { FeatureCollection } from "geojson";

type NutsGeoJson = FeatureCollection & {
  features: Array<{
    properties: { NUTS_ID: string; NUTS_NAME: string };
    geometry: GeoJSON.Geometry;
  }>;
};

const NUTS_GEO_KEY = "connected-nuts-geo-load";

function buildNutsLookups(geo: NutsGeoJson) {
  const names = new Map<string, string>();
  const ids = new Set<string>();
  for (const feature of geo.features) {
    const id = feature.properties.NUTS_ID;
    names.set(id, feature.properties.NUTS_NAME);
    ids.add(id);
  }
  return { names, ids };
}

export function useConnectedGeo() {
  const nutsGeo = useState<NutsGeoJson | null>("connected-nuts-geo", () => null);
  const nutsNameById = useState<Map<string, string> | null>("connected-nuts-name-by-id", () => null);
  const validNuts3Ids = useState<Set<string> | null>("connected-valid-nuts3-ids", () => null);

  const { pending, error } = useAsyncData(
    NUTS_GEO_KEY,
    async () => {
      if (nutsGeo.value && nutsNameById.value && validNuts3Ids.value) {
        return nutsGeo.value;
      }

      const module = await import("~/assets/geo/NUTS_RG_60M_2024_4326_LEVL_3.json");
      const geo = module.default as NutsGeoJson;
      const { names, ids } = buildNutsLookups(geo);

      nutsGeo.value = geo;
      nutsNameById.value = names;
      validNuts3Ids.value = ids;

      return geo;
    },
    {
      getCachedData(key, nuxtApp) {
        if (nutsGeo.value) return nutsGeo.value;
        return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key];
      },
    }
  );

  const regions = computed(() => nutsNameById.value ?? new Map<string, string>());

  function getNutsNameById(nutsId: string): string {
    return nutsNameById.value?.get(nutsId) ?? "Unknown";
  }

  return {
    nutsGeo,
    nutsNameById,
    validNuts3Ids,
    regions,
    pending,
    error,
    getNutsNameById,
  };
}
