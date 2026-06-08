<script setup>
import { max, scaleQuantile, scaleLinear } from "d3";
import * as geo from "d3-geo";
import { useElementSize } from "@vueuse/core";
import europeMap from "~/assets/data/europe.json";

const isoToName = Object.fromEntries(
  europeMap.features.map((f) => [f.properties.ISO2, f.properties.NAME])
);

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  colorsScale: {
    type: Array,
    default: () => [
      "#e8eff6",
      "#d2e0ec",
      "#bbd0e3",
      "#9cc0db",
      "#78a1c7",
      "#4b82b5",
      "#1e63a2",
      "#13497c",
    ],
  },
  colors: {
    type: Object,
    default: () => ({
      default: "#1e63a2",
      active: "#100007",
      gray: "#ede7df",
    }),
  },
  formatter: {
    type: Function,
    default: (d) => d,
  },
  externalHoveredItemId: {
    type: String,
    default: null,
  },
  highLightSelectedRegionId: {
    type: String,
    default: null,
  },
  hasFilteredData: {
    type: Boolean,
    default: false,
  },
  activeFilter: {
    type: Object,
    default: null,
  },
  showDownloadBtn: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "Entities per Country",
  },
  subtitle: {
    type: String,
    default: "",
  },
});

const emits = defineEmits(["_click"]);

const svgContainer = ref(null);
const svg = ref(null);
const { width: availableWidth } = useElementSize(svgContainer);

const viewBoxWidth = 1080 * 2;
const viewBoxHeight = 720;

const canvasWidth = computed(() => availableWidth.value);
const canvasHeight = 500;

const titleHeight = 96;
const topLabelHeight = 0;
const padding = { top: 24, right: 60, bottom: 24, left: 60 };
const xAxisHeight = 96;
const mapWidth = 1000;
const mapHeight = 580;
const contentStartY = titleHeight + topLabelHeight;

const onlyValuesArray = computed(() => {
  return props.data.map((d) => parseFloat(d.count || 0));
});

const colorScale = computed(() => {
  return scaleQuantile()
    .domain([0, max(onlyValuesArray.value) || 1])
    .range(props.colorsScale);
});

const widthScale = computed(() => {
  const maxValue = max(onlyValuesArray.value) || 1;
  const barChartWidth = viewBoxWidth / 2 - padding.right;
  return scaleLinear()
    .domain([0, maxValue * 1.2])
    .range([0, (barChartWidth * 2) / 3.5]);
});

const barSpacing = 4;

const availableHeightForBars = computed(() => {
  return viewBoxHeight  ;
});

// Map projection and path
const geoPath = ref(geo.geoPath());
const projection = ref(null);
const pathAndData = ref([]);
const nonEuropeanCountries = ref([]);

// Separate European and non-European countries
const europeanCountries = computed(() => {
  return props.data.filter((d) => {
    const iso2 = d.id;
    return europeMap.features.some((f) => f.properties.ISO2 === iso2);
  });
});

const europeanCountriesForChart = computed(() => {
  return europeanCountries.value
    .map((d) => ({
      ...d,
      label: isoToName[d.id] || d.label || d.id,
      name: isoToName[d.id] || d.name || d.label || d.id,
    }))
    .sort((a, b) => (b.count || 0) - (a.count || 0));
});

const nonEuropeanData = computed(() => {
  return props.data.filter((d) => {
    const iso2 = d.id;
    return !europeMap.features.some((f) => f.properties.ISO2 === iso2);
  });
});

watchEffect(() => {
  if (europeMap && props.data.length > 0) {
    resetProjection();
    buildPathAndData();
    buildNonEuropeanData();
  }
});

function resetProjection() {
  projection.value = geo.geoConicEquidistant();
  projection.value.fitSize([mapWidth, mapHeight], europeMap);
  geoPath.value.projection(projection.value);
}

function buildPathAndData() {
  pathAndData.value = europeMap.features.map((feature) => {
    const iso2 = feature.properties.ISO2;
    const countryName = feature.properties.NAME;
    const dataItem = props.data.find((d) => d.id === iso2);
    
    const value = dataItem
      ? props.hasFilteredData
        ? dataItem.count_f || 0
        : dataItem.count || 0
      : NaN;

    return {
      path: geoPath.value(feature),
      id: iso2,
      name: countryName,
      bounds: geoPath.value.bounds(feature),
      value,
      color: colorFromData(value),
      nonAvailableData: isNaN(value),
    };
  });
}

function buildNonEuropeanData() {
  nonEuropeanCountries.value = nonEuropeanData.value.map((d) => ({
    id: d.id,
    name: d.label || d.name || d.id,
    value: props.hasFilteredData ? d.count_f || 0 : d.count || 0,
  }));
}

function colorFromData(countValue) {
  if (isNaN(countValue)) return props.colors.gray;
  if (countValue === 0) return props.colors.gray;
  return colorScale.value(countValue);
}

// Interaction
const hoveredItemId = ref(null);
const hoverTextLabel = ref("");
const hoverTextFigure = ref("");
const vBarX = ref(-1);

function mouseoverHandler(event, geoid, isGlobal = false) {
  const pathAndDataObj = pathAndData.value.find((d) => d.id === geoid);
  if (pathAndDataObj && pathAndDataObj.nonAvailableData) {
    hoverTextLabel.value = "";
    hoverTextFigure.value = "";
    vBarX.value = -1;
    return;
  }
  
  if (pathAndDataObj) {
    hoveredItemId.value = geoid;
    hoverTextLabel.value = pathAndDataObj.name;
    hoverTextFigure.value = pathAndDataObj.value;
    vBarX.value = widthScale.value(pathAndDataObj.value);
  }
}

function mouseoutHandler() {
  hoverTextLabel.value = "";
  hoverTextFigure.value = "";
  vBarX.value = -1;
  hoveredItemId.value = null;
}

function clickHandler(event, geoid) {
  const pathAndDataObj = pathAndData.value.find((d) => d.id === geoid);
  if (pathAndDataObj && !pathAndDataObj.nonAvailableData) {
    emits("_click", {
      type: "country",
      datum: pathAndDataObj,
    });
  }
}

function onBarClick(iso) {
  emits("_click", { type: "country", datum: { id: iso } });
}

function onNonEuropeanClick(country) {
  emits("_click", { type: "country", datum: country });
}
</script>

<template>
  <div ref="svgContainer" class="w-full relative bg-neutral-lightest border border-neutral-darkest">
    <svg
      ref="svg"
      class=""
      :width="canvasWidth"
      :height="canvasHeight"
      style="height: 500px;"
      :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`"
    >
      <g
        :transform="`translate(${padding.left},${padding.top})`"
        class="chart-content"
      >
        <!-- title -->
        <g>
          <text text-anchor="start" x="0%" y="1em" class="chart_h1">
            {{ props.title }}
          </text>
          <text
            v-if="props.subtitle"
            text-anchor="start"
            x="0%"
            y="2.6em"
            class="chart_subtitle"
          >
            {{ props.subtitle }}
          </text>
        </g>

        <!-- fixed horizontal lines -->
       

        <!-- space for labeling above bars -->
        <g
          :transform="`translate(${viewBoxWidth / 2 - padding.left}, ${
            topLabelHeight + topLabelHeight / 2 + 10
          })`"
        >
          <text
            class="text-3xl antialiased"
            :x="vBarX"
            dx="0.5em"
            dy="0.2em"
            text-anchor="start"
          >
            {{ hoverTextLabel }}
          </text>

          <text
            class="text-3xl font-bold"
            :x="vBarX"
            dx="0em"
            dy="0.25em"
            text-anchor="end"
          >
            {{ hoverTextFigure }}
          </text>
        </g>

        <!-- Map section -->
        <g
          :transform="`translate(-${padding.left * 3}, ${contentStartY})`"
          class="chart-content"
        >
          <MapPathSingle
            v-for="geoObj in pathAndData"
            :id="geoObj.id"
            :key="geoObj.id"
            :d="geoObj.path"
            :color="
              highLightSelectedRegionId === geoObj.id
                ? colors.active
                : hoveredItemId === geoObj.id
                ? colors.active
                : geoObj.color
            "
            :hovered-color="colors.active"
            :show-hover-state="!geoObj.nonAvailableData"
            :show-stroke-hovered="true"
            stroke-hovered-color="black"
            @_mouseover="mouseoverHandler($event, geoObj.id)"
            @_mouseout="mouseoutHandler"
            @_click="clickHandler($event, geoObj.id)"
          />
        </g>

        <!-- Non-European countries as squares in bottom right -->
        <g
          v-if="nonEuropeanCountries.length > 0"
          :transform="`translate(${mapWidth - 320}, ${mapHeight + contentStartY - 120})`"
        >
          <text
            x="0"
            y="-10"
            class="text-sm fill-gray-600"
            text-anchor="start"
          >
            Other Countries:
          </text>
          <g
            v-for="(country, i) in nonEuropeanCountries"
            :key="country.id"
            :transform="`translate(${(i % 4) * 50}, ${Math.floor(i / 4) * 50})`"
            @click="onNonEuropeanClick(country)"
            class="cursor-pointer"
          >
            <rect
              width="40"
              height="40"
              :fill="
                highLightSelectedRegionId === country.id
                  ? colors.active
                  : hoveredItemId === country.id
                  ? colors.active
                  : colorScale(country.value)
              "
              stroke="#fff"
              stroke-width="1"
            />
            <text
              x="20"
              y="25"
              text-anchor="middle"
              class="text-xs fill-black pointer-events-none"
            >
              {{ country.name.substring(0, 3) }}
            </text>
          </g>
        </g>

        <!-- Bar chart section -->
        <g
          :transform="`translate(${viewBoxWidth / 2}, ${contentStartY + barSpacing})`"
        >
          <MiniBarChartMap
            :data="europeanCountriesForChart"
            :colors-scale="colorsScale"
            :colors="colors"
            :view-box-width="viewBoxWidth / 2 "
            :view-box-height="viewBoxHeight"
            :screen-width="viewBoxWidth / 2 - padding.right * 2"
            :screen-height="availableHeightForBars"
            :external-hovered-item-id="hoveredItemId"
            :width-scale="widthScale"
            :high-light-selected-region-id="highLightSelectedRegionId"
            :has-filtered-data="hasFilteredData"
            :active-filter="activeFilter"
            @_mouseover="(geoid) => mouseoverHandler('', geoid, true)"
            @_mouseout="() => mouseoutHandler()"
            @_click="(geoid) => clickHandler('', geoid)"
          />
          
          <!-- vertical line following the mouse -->
          <line
            v-show="vBarX > 0"
            :y1="-(contentStartY + barSpacing - titleHeight)"
            :y2="availableHeightForBars"
            stroke="#100007"
            stroke-width="3"
            :x1="vBarX"
            :x2="vBarX"
          />
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.chart_h1 {
  font-size: 1.7em;
  font-weight: 700;
  fill: #100007;
  font-family: "Martian Mono", monospace;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.chart_subtitle {
  font-size: 0.95em;
  fill: #666;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
</style>
