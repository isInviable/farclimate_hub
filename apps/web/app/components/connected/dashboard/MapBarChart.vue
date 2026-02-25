<script setup>
import { max, scaleQuantile, scaleLinear } from "d3";
import * as geo from "d3-geo";
import { useElementSize } from "@vueuse/core";
import europeMap from "~/assets/data/europe.json";

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  colorsScale: {
    type: Array,
    default: () => [
      "#dbebff",
      "#c2dffc",
      "#a8d3f8",
      "#8ec6f5",
      "#74baf1",
      "#59aded",
      "#3d9fe9",
      "#1f91e5",
      "#0082e1",
    ],
  },
  colors: {
    type: Object,
    default: () => ({
      default: "#0082e1",
      active: "#F9B401",
      gray: "#E6E6E6",
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
});

const emits = defineEmits(["_click"]);

const svgContainer = ref(null);
const svg = ref(null);
const { width: availableWidth } = useElementSize(svgContainer);

const viewBoxWidth = 1080 * 2;
const viewBoxHeight = 1080;

const canvasWidth = computed(() => availableWidth.value);
const canvasHeight = computed(() => availableWidth.value / 2);

const titleHeight = 96;
const padding = { top: 48, right: 60, bottom: 60, left: 60 };
const xAxisHeight = 96;
const mapWidth = 1200;
const mapHeight = 800;

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

const spaceBetweenBars = computed(() => 48);

const availableHeightForBars = computed(() => {
  return viewBoxHeight - xAxisHeight - titleHeight - padding.top - padding.bottom - 128;
});

const totalHeightNeeded = computed(() => {
  return props.data.length * spaceBetweenBars.value;
});

const needsScroll = computed(() => {
  return totalHeightNeeded.value > availableHeightForBars.value;
});

const scrollOffset = ref(0);
const maxScrollOffset = computed(() => {
  if (!needsScroll.value) return 0;
  const maxOffset = availableHeightForBars.value - totalHeightNeeded.value;
  return Math.floor(Math.min(0, maxOffset));
});

const canScrollUp = computed(() => {
  return needsScroll.value && scrollOffset.value < 0;
});

const canScrollDown = computed(() => {
  return needsScroll.value && scrollOffset.value > maxScrollOffset.value;
});

const scrollStep = computed(() => spaceBetweenBars.value * 2);

function scrollUp() {
  if (!canScrollUp.value) return;
  const newOffset = scrollOffset.value + scrollStep.value;
  scrollOffset.value = Math.min(0, newOffset);
}

function scrollDown() {
  if (!canScrollDown.value) return;
  const newOffset = scrollOffset.value - scrollStep.value;
  scrollOffset.value = Math.max(maxScrollOffset.value, newOffset);
}

watch(() => props.data.length, () => {
  scrollOffset.value = 0;
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
  <div ref="svgContainer" class="w-full relative bg-white border-gray-50 border-2">
    <svg
      ref="svg"
      class=""
      :width="canvasWidth"
      :height="canvasHeight"
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
        </g>

        <!-- space for labeling above map -->
        <g
          :transform="`translate(${viewBoxWidth / 2 - padding.left}, ${
            titleHeight + titleHeight / 2 + 10
          })`"
        >
          <text
            class="text-[2.75em] antialiased"
            :x="vBarX"
            dx="0.5em"
            dy="0.2em"
            text-anchor="start"
          >
            {{ hoverTextLabel }}
          </text>

          <text
            class="text-5xl font-bold"
            :x="vBarX"
            dx="-0.5em"
            dy="0.25em"
            text-anchor="end"
          >
            {{ hoverTextFigure }}
          </text>
        </g>

        <!-- fixed horizontal line -->
        <line
          :x1="0"
          :y1="titleHeight"
          :x2="viewBoxWidth - padding.left - padding.right"
          :y2="titleHeight"
          stroke="#ccc"
          stroke-width="1"
          stroke-dasharray="3 1"
        />

        <!-- Map section -->
        <g
          :transform="`translate(-${padding.left*3}, ${titleHeight + 96})`"
          class="chart-content"
        >
          <DashboardMapPathSingle
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
          :transform="`translate(${mapWidth - 400}, ${mapHeight + titleHeight + 96 - 150})`"
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
          :transform="`translate(${viewBoxWidth / 2}, ${titleHeight + 96})`"
        >
          <DashboardMiniBarChartMap
            :data="europeanCountries.sort((a, b) => (b.count || 0) - (a.count || 0))"
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
            :y1="titleHeight * -1"
            :y2="700"
            stroke="#F9B401"
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
  font-size: 2.75em;
  font-weight: 300;
  fill: #000;
}
</style>
