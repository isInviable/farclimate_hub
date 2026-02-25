<template>
  <div class="relative w-full h-full">
    <div ref="map-container" class="w-full h-full"></div>
    <div
      id="static-map"
      class="flex flex-row justify-center"
      v-if="!isMapLoaded"
    >
      <div>Loading...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { FeatureCollection, Feature, Point } from "geojson";

const mapContainer = useTemplateRef("map-container");
const config = useRuntimeConfig();
const MAPBOX_ACCESS_TOKEN = config.public.mapbox.accessToken;

const isMapLoaded = ref(false);
const mapRef = shallowRef<mapboxgl.Map | null>(null);

interface LocationPoint {
  label: string;
  location: {
    lat: number;
    lon: number;
  };
  articleId: string;
}

interface Props {
  points: LocationPoint[];
  fitToBounds: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'pinClick', articleId: string): void;
}>();

const center: [number, number] = [10.347306753029532, 50.022992288945396];
const zoom = 5;

const formatedDataForMap = computed<FeatureCollection<Point>>(() => {
  return {
    type: "FeatureCollection",
    features: props.points
      .filter((point) => {
        return (
          typeof point.location.lat === "number" &&
          point.location.lat >= -90 &&
          point.location.lat <= 90 &&
          typeof point.location.lon === "number" &&
          point.location.lon >= -180 &&
          point.location.lon <= 180
        );
      })
      .map((point): Feature<Point> => {
        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [point.location.lon, point.location.lat],
          },
          properties: {
            label: point.label,
            articleId: point.articleId,
          },
        };
      }),
  };
});

watch(
  formatedDataForMap,
  (newVal) => {
    if (mapRef.value) {
      const source: mapboxgl.GeoJSONSource = mapRef.value.getSource(
        "points"
      ) as mapboxgl.GeoJSONSource;
      source.setData(formatedDataForMap.value);
      fitMapToBounds();
    }
  },
  { immediate: false }
);

function fitMapToBounds() {
  if (!mapRef.value) return;
  const features = formatedDataForMap.value.features;
  if (features.length === 0) return;

  mapRef.value.setProjection("equalEarth");
  const coordinates = features.map((feature) => feature.geometry.coordinates);
  const lngs = coordinates.map((coord) => coord[0]);
  const lats = coordinates.map((coord) => coord[1]);

  const bounds = new mapboxgl.LngLatBounds(
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)]
  );

  mapRef.value.fitBounds(bounds, {
    padding: 50,
  });
}

onMounted(() => {
  if (!mapContainer.value) return;

  mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
  mapRef.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: "mapbox://styles/mapbox/light-v11",
    center: center,
    zoom: zoom,
    maxZoom: 15,
    minZoom: 1,
  });

  mapRef.value.on("load", () => {
    if (!mapRef.value) return;

    mapRef.value.addControl(new mapboxgl.NavigationControl(), "top-left");
    mapRef.value.scrollZoom.disable();

    mapRef.value.addSource("points", {
      type: "geojson",
      data: formatedDataForMap.value,
    });

    mapRef.value.addLayer({
      id: "points",
      type: "circle",
      source: "points",
      paint: {
        "circle-color": "#00bba7",
        "circle-radius": 6,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
      },
    });

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: true,
    });

    mapRef.value.on("mouseenter", "points", (e) => {
      if (!mapRef.value || !e.features || e.features.length === 0) return;
      mapRef.value.getCanvas().style.cursor = "pointer";

      const feature = e.features[0];
      if (feature.geometry.type !== 'Point') return;

      const coordinates = feature.geometry.coordinates.slice();
      const label = feature.properties?.label;
      if (!label) return;

      popup
        .setLngLat(coordinates as [number, number])
        .setHTML(`<div>${label}</div>`)
        .addTo(mapRef.value);
    });

    mapRef.value.on("mouseleave", "points", () => {
      if (!mapRef.value) return;
      mapRef.value.getCanvas().style.cursor = "";
      popup.remove();
    });

    mapRef.value.on("click", "points", (e) => {
      if (!e.features || e.features.length === 0) return;
      const articleId = e.features[0].properties?.articleId;
      if (articleId) {
        emit('pinClick', articleId);
      }
    });

    if (props.fitToBounds) {
      fitMapToBounds();
    }
    else {
      //center the map on the first point
      const firstPoint = formatedDataForMap.value.features[0];
      if (firstPoint) {
        mapRef.value?.flyTo({
          center: firstPoint.geometry.coordinates as [number, number],
        });
      }
    }
    isMapLoaded.value = true;
  });
});
</script>

<style scoped>
#static-map {
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: -1;
  top: 0;
  left: 0;
}
</style>
