<template>
  <g>
    <!-- Clip path for scrolling -->
    <defs>
      <clipPath :id="clipPathId">
        <rect
          :x="0"
          :y="0"
          :width="screenWidth"
          :height="availableHeightForBars"
        />
      </clipPath>
    </defs>

    <!-- Scroll arrows -->
    <g v-if="needsScroll">
      <!-- Top arrow -->
      <g
        :transform="`translate(${screenWidth - 24}, -32)`"
        :opacity="canScrollUp ? 1 : 0.3"
        :style="{ cursor: canScrollUp ? 'pointer' : 'not-allowed' }"
        @click="scrollUp"
      >
        <circle
          cx="0"
          cy="0"
          r="24"
          fill="transparent"
          stroke="#000"
          stroke-width="4"
        />
        <path
          d="M -10 4 L 0 -10 L 10 4"
          fill="none"
          stroke="#000"
          stroke-width="8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>

      <!-- Bottom arrow -->
      <g
        :transform="`translate(${screenWidth - 24}, ${availableHeightForBars + 32})`"
        :opacity="canScrollDown ? 1 : 0.3"
        :style="{ cursor: canScrollDown ? 'pointer' : 'not-allowed' }"
        @click="scrollDown"
      >
        <circle
          cx="0"
          cy="0"
          r="24"
          fill="transparent"
          stroke="#000"
          stroke-width="4"
        />
        <path
          d="M -10 -4 L 0 10 L 10 -4"
          fill="none"
          stroke="#333"
          stroke-width="5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
    </g>

    <!-- bars container with clip and transform -->
    <g :clip-path="needsScroll ? `url(#${clipPathId})` : ''">
      <g
        :transform="`translate(0, ${scrollOffset})`"
        class="scroll-container"
      >
        <!-- bars -->
        <g
          v-for="(bar, i) in data"
          :key="bar.id || bar.label"
          :transform="`translate(0, ${i * spaceBetweenBars})`"
        >
          <text
            text-anchor="end"
            :x="screenWidth"
            :y="spaceBetweenBars"
            dy="-0.5em"
            class="chart_label cursor-pointer hover:font-bold"
            :style="externalHoveredItemId === (bar.id || bar.iso) ? 'font-weight: bold' : ''"
            @mouseenter="onMouseover($event, bar, true)"
            @mouseleave="onMouseout($event)"
            @click="onClick($event, bar.id || bar.iso)"
          >
            {{ bar.label }}
          </text>

          <rect
            :x="0"
            :y="4"
            :data-id="bar.label"
            :height="spaceBetweenBars - 8"
            :width="widthScale(bar.count || 0)"
            :fill="
              highLightSelectedRegionId !== (bar.id || bar.iso)
                ? hasFilteredData
                  ? colors.gray
                  : colorScale(bar.count || 0)
                : colors.active
            "
            class="stroke-white stroke-2 hover:brightness-110 cursor-pointer transition-all duration-300"
            :class="[externalHoveredItemId === (bar.id || bar.iso) ? 'brightness-110' : '']"
            @mouseenter="onMouseover($event, bar, true)"
            @mouseleave="onMouseout($event)"
            @click="onClick($event, bar.id || bar.iso)"
          />

          <!-- filtered bar -->
          <rect
            v-if="hasFilteredData"
            :x="0"
            :y="4"
            :data-id="bar.label"
            :height="spaceBetweenBars - 8"
            :width="widthScale(bar.count_f || 0)"
            :fill="colors.active"
            class="hover:brightness-75 transition-all duration-300"
            @mouseover="onMouseover($event, bar, false)"
            @mouseleave="onMouseout($event)"
            @click="onClick($event, bar.id || bar.iso)"
          />

          <text
            text-anchor="start"
            :x="widthScale(bar.count || 0)"
            :y="spaceBetweenBars"
            dy="-0.666em"
            dx="1em"
            class="chart_hor_value"
          >
            {{ bar.count }}
          </text>

          <!-- line below -->
          <line
            :x1="0"
            :y1="spaceBetweenBars"
            :x2="screenWidth"
            :y2="spaceBetweenBars"
            stroke="#ccc"
            stroke-width="1"
            stroke-dasharray="3 1"
          />
        </g>
      </g>
    </g>
  </g>

  <!-- x axis -->
  <g
    id="axis"
    :transform="`translate(0, ${
      viewBoxHeight - xAxisHeight - padding.bottom - titleHeight - 128
    })`"
  >
    <g>
      <rect
        v-for="(d, i) in colorScale.range()"
        :key="i"
        :fill="colorScale.range()[i]"
        :x="i * ((screenWidth * 2) / 3.5 / colorScale.range().length)"
        y="-12"
        :width="(screenWidth * 2) / 3.5 / colorScale.range().length"
        height="8"
      />
    </g>

    <!-- axis ticks -->
    <g
      v-for="(d, i) in widthScale.nice().ticks(colorScale.range().length)"
      :key="i"
      :transform="`translate(${widthScale(d)}, 0)`"
    >
      <line x1="0" y1="0" x2="0" :y2="12" stroke="gray" stroke-width="1" />
      <text x="0" y="36" dy="1.2em" text-anchor="middle" class="chart_tick">
        {{ formatter(d) }}
      </text>
    </g>
  </g>
</template>

<script setup>
import { max, scaleQuantile } from "d3";

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
    default: () => ({ active: "#0082e1", inactive: "#f5f500" }),
  },
  viewBoxWidth: {
    type: Number,
    required: true,
  },
  viewBoxHeight: {
    type: Number,
    required: true,
  },
  screenWidth: {
    type: Number,
    required: true,
  },
  screenHeight: {
    type: Number,
    required: true,
  },
  formatter: {
    type: Function,
    default: (d) => d,
  },
  externalHoveredItemId: {
    type: String,
    default: null,
  },
  widthScale: {
    type: Function,
    required: true,
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
});

const padding = { top: 60, right: 60, bottom: 60, left: 60 };
const xAxisHeight = 96;
const titleHeight = 96;

const onlyValuesArray = computed(() => {
  return props.data.map((d) => parseFloat(d.count || 0));
});

const colorScale = computed(() => {
  return scaleQuantile()
    .domain([0, max(onlyValuesArray.value) || 1])
    .range(props.colorsScale);
});

const spaceBetweenBars = computed(() => 48);

// Generate unique ID for clipPath
const clipPathId = ref(`barChartClip-${Math.random().toString(36).substr(2, 9)}`);

// Scroll functionality
const scrollStep = computed(() => spaceBetweenBars.value * 2);

const totalHeightNeeded = computed(() => {
  return props.data.length * spaceBetweenBars.value;
});

const availableHeightForBars = computed(() => {
  const xAxisYPosition = props.viewBoxHeight - xAxisHeight - padding.bottom - titleHeight - 128;
  return Math.max(0, xAxisYPosition - 12);
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

function scrollUp() {
  if (!canScrollUp.value) return;
  const newOffset = scrollOffset.value + scrollStep.value;
  scrollOffset.value = Math.min(0, newOffset);
  if (scrollOffset.value < 0 && Math.abs(scrollOffset.value) <= scrollStep.value) {
    scrollOffset.value = 0;
  }
}

function scrollDown() {
  if (!canScrollDown.value) return;
  const newOffset = scrollOffset.value - scrollStep.value;
  scrollOffset.value = Math.max(maxScrollOffset.value, newOffset);
  if (scrollOffset.value > maxScrollOffset.value && Math.abs(scrollOffset.value - maxScrollOffset.value) <= scrollStep.value) {
    scrollOffset.value = maxScrollOffset.value;
  }
}

watch(() => props.data.length, () => {
  scrollOffset.value = 0;
});

const emits = defineEmits(["_mouseover", "_mouseout", "_click"]);

function onMouseover(event, barObject, isGlobal) {
  if (isGlobal && props.hasFilteredData) return;
  emits("_mouseover", barObject.id || barObject.iso, isGlobal);
}

function onMouseout(event) {
  emits("_mouseout");
}

function onClick(event, id) {
  emits("_click", id);
}
</script>

<style lang="css" scoped>
.scroll-container {
  transition: transform 0.3s ease-in-out;
}

.chart_label {
  font-size: 1.5em;
  fill: #000;
}

.chart_hor_value {
  font-size: 1.25em;
  fill: #000;
}

.chart_tick {
  font-size: 1em;
  fill: #666;
}
</style>
