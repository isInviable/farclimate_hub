<template>
  <div ref="mapContainer" class=" absolute w-full h-full z-20">
    <!-- hidden vennContainer 
      <div ref="vennContainer" class="hidden w-1/2 h-full fixed left-[30%]"></div>
      -->

    <svg ref="mapHolder" :width="canvasWidth" :height="canvasHeight">
      <!-- main diag holder -->
      <g
        :opacity="
          props.viewMode === 'map' ||
          props.viewMode === 'bubble' ||
          props.viewMode === 'gantt'
            ? 1
            : 0
        "
      >
        <!-- graticule holder -->
        <g id="grid">
          <path
            v-if="props.showMap"
            :d="pathGenerator(graticule())"
            fill="none"
            :stroke="fillColor"
            stroke-width="1"
            class="graticule"
          />
        </g>

        <!-- areas holder -->
        <g id="areas">
          <circle
            v-for="(c, i) in circlesArray"
            :key="i"
            :cx="canvasWidth * 0.55"
            :cy="canvasHeight / 2"
            :r="canvasHeight / 3 + (i * canvasHeight) / 12"
            fill="none"
            opacity="1"
            stroke="#bababa"
            stroke-width="1"
            stroke-dasharray="2,2"
            class="area"
          />
        </g>

        <!-- countries holder -->
        <g id="countries">
          <path
            v-for="(feature, i) in worldGeoJson.features"
            :key="i"
            :id="feature.id"
            :d="pathGenerator(feature)"
            fill="#000"
            :stroke="fillColor"
            stroke-width="1"
            :opacity="feature.id === 'ATA' ? 0 : 0.1"
            class="country"
          />
        </g>

        <!-- gantt lines holder -->
        <g id="ganttLines">
          <line
            v-for="(d, i) in mapDataR"
            :key="i"
            :x1="getGanttRadialLoc(1975, i).x"
            :y1="getGanttRadialLoc(1975, i).y"
            :x2="getGanttRadialLoc(1975, i).x"
            :y2="getGanttRadialLoc(1975, i).y"
            stroke="#00cc00"
            stroke-width="1"
            :opacity="d.implementation_years.showBoth ? 0 : 0"
            class="gantt-line"
          />
        </g>

        <!-- gantt labels holder -->
        <g id="ganttLabels">
          <text
            v-for="(year, i) in ganttLabels"
            :key="i"
            :x="canvasWidth * 0.55 + ganttRadius(year) * Math.cos(-Math.PI / 2)"
            :y="canvasHeight / 2 + ganttRadius(year) * Math.sin(-Math.PI / 2)"
            text-anchor="middle"
            alignment-baseline="central"
            font-size="9"
            opacity="0"
            fill="#bababa"
            dy="-0.75em"
            class="gantt-label font-mono"
          >
            {{ year }}
          </text>
        </g>

        <!-- dots holder -->
        <g id="dots">
          <circle
            v-for="(location, i) in mapDataR"
            :key="i"
            :cx="location.geoX"
            :cy="location.geoY"
            r="1"
            :fill="dotColor"
            opacity="1"
            class="dot"
            @mouseover="
              (e) => {
                const me = d3.select(e.target);
                me.attr('fill', 'orange');
                // get data for the hovered dot
                const data = me.data()[0];
                emitDisplayTitle(data.title || 'No title available');
              }
            "
            @mouseout="
              (e) => {
                const me = d3.select(e.target);
                me.attr('fill', dotColor);
                emitDisplayTitle('');
              }
            "
          />
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup>
// import * as venn from "venn.js";
import { UMAP } from "umap-js";
import * as d3 from "d3";
import smallestEnclosingCircle from "smallest-enclosing-circle";

// import local geojson
import worldGeoJson from "@/assets/geo/ne_110m_land.json";

// const vennContainer = ref(null)
const mapContainer = ref(null);
const mapHolder = ref(null);
// SVG size and viewBox
import { useElementSize } from "@vueuse/core";
import { map } from "zod";

const { width: availableWidth, height: availableHeight } =
  useElementSize(mapContainer);
const canvasWidth = computed(() => {
  return availableWidth.value;
});
const canvasHeight = computed(() => {
  return availableHeight.value;
});

const fillColor = "#dedede";
const dotColor = "#0d9488";

const props = defineProps({
  showMap: {
    type: Boolean,
    default: true,
  },
  mapData: {
    type: Array,
    default: () => [],
  },
  uniqueBiogeographicalRegions: {
    type: Array,
    default: () => [],
  },
  viewMode: {
    type: String,
    default: "bubble", // 'map' , 'bubble', 'gantt'
  },
});

// emit display title
const emit = defineEmits(["displayThisTitle"]);
// funtion to emit on mouseOver dot
const emitDisplayTitle = (title) => {
  // console.log('emitDisplayTitle', title);
  emit("displayThisTitle", title);
};

// reactive variable for prop dummyData: used to update venn sets
const mapDataR = ref([]);
// const dotsDataVenn = ref([]);

// watch mapdata
watch(
  () => props.mapData,
  (newVal) => {
    if (newVal && newVal.length > 0) {
      // console.log('props.mapData changed:', newVal);
      // update mapDataR
      updateMapData(newVal);
      // mapDataR.value = newVal;
    }
  }
);

// watch uniqueBiogeographicalRegions
watch(
  () => props.uniqueBiogeographicalRegions,
  (newVal) => {
    if (newVal && newVal.length > 0) {
      // console.log('props.uniqueBiogeographicalRegions changed:', newVal);
      // update circlesArray

      circlesArray.value = newVal.map((region, i) => {
        return {
          x: canvasWidth.value * 0.55,
          y: canvasHeight.value / 2,
          radius: canvasHeight.value / 3 + (i * canvasHeight.value) / 12,
          region: region,
        };
      });
      updateCirclesArray();

      // updateCiclesArray();
    }
  }
);

// watch viewMode
watch(
  () => props.viewMode,
  (newVal) => {
    // console.log('props.viewMode changed:', newVal);
    if (newVal === "map") {
      // to geo locations transition
      dotsToGeo(1000);
    } else if (newVal === "bubble") {
      // to phyllotaxis transition
      dotsToUmap(1000);
    } else if (newVal === "gantt") {
      // to umap transition
      // dotsToUmap(1000);
      // dotsToPhyllotaxis(1000);
      // dotsToGantt(1000);
      dotsToRadialGantt(1000);
    }
  }
);

// normalize function for UMAP
const normalizeV = (vec) => {
  const norm = Math.sqrt(vec.reduce((sum, x) => sum + x * x, 0));
  return vec.map((x) => x / norm);
};

// fix circles collisions
const resolveCircleCollisions = (circles, maxIterations = 100) => {
  let moved;
  for (let iter = 0; iter < maxIterations; iter++) {
    moved = false;
    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const a = circles[i];
        const b = circles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.r + b.r + 1;
        if (dist < minDist && dist > 0) {
          // Overlap detected, move each circle away from the other
          const overlap = (minDist - dist) / 2;
          const ox = (dx / dist) * overlap;
          const oy = (dy / dist) * overlap;
          a.x -= ox;
          a.y -= oy;
          b.x += ox;
          b.y += oy;
          moved = true;
        }
      }
    }
    if (!moved) break; // Stop if no circles were moved
  }
  return circles;
};

// fix geo coord
const resolveCircleGeoCollisions = (circles, maxIterations = 100) => {
  let moved;
  for (let iter = 0; iter < maxIterations; iter++) {
    moved = false;
    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const a = circles[i];
        const b = circles[j];
        const dx = b.geoX - a.geoX;
        const dy = b.geoY - a.geoY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.r + b.r + 1;
        if (dist < minDist && dist > 0) {
          // Overlap detected, move each circle away from the other
          const overlap = (minDist - dist) / 2;
          const ox = (dx / dist) * overlap;
          const oy = (dy / dist) * overlap;
          a.geoX -= ox;
          a.geoY -= oy;
          b.geoX += ox;
          b.geoY += oy;
          moved = true;
        }
      }
    }
    if (!moved) break; // Stop if no circles were moved
  }
  return circles;
};

const updateCirclesArray = () => {
  // 1: region circles
  let rCircles = props.uniqueBiogeographicalRegions.map((region, i) => {
    // console.log('region ..........', region);
    const dotByRegion = mapDataR.value.filter((d) =>
      d.regions.includes(region)
    );
    const pointsArray = dotByRegion.map((d) => ({ x: d.x, y: d.y }));
    const circle = smallestEnclosingCircle(pointsArray);
    // circle: { x: centerX, y: centerY, r: radius }

    return {
      x: circle ? circle.x : canvasWidth.value * 0.55,
      y: circle ? circle.y : canvasHeight.value / 2,
      radius: circle
        ? circle.r
        : canvasHeight.value / 3 + (i * canvasHeight.value) / 12,
      region: region,
      year: i < ganttLabels.value.length ? ganttLabels.value[i] : null, // add year if available
    };
  });

  /*
 circlesArray.value = props.uniqueBiogeographicalRegions.map((region, i) => {
    // console.log('region ..........', region);
    const dotByRegion = mapDataR.value.filter(d => d.regions.includes(region));
    const pointsArray = dotByRegion.map(d => ({ x: d.x, y: d.y }));
    const circle = smallestEnclosingCircle(pointsArray);
    // circle: { x: centerX, y: centerY, r: radius }

    return {  
      x: circle ? circle.x : canvasWidth.value * 0.55,
      y: circle ? circle.y : canvasHeight.value / 2,
      radius: circle ? circle.r : canvasHeight.value / 3 + i * canvasHeight.value / 12,
      region: region
    };
  });
  */

  // add YY gantt circles
  if (ganttLabels.value.length > rCircles.length) {
    for (let i = rCircles.length; i < ganttLabels.value.length; i++) {
      rCircles.push({
        x: canvasWidth.value * 0.55,
        y: canvasHeight.value / 2,
        radius: canvasHeight.value / 3 + (i * canvasHeight.value) / 12,
        region: "none",
        year: ganttLabels.value[i],
      });
    }

    /*
    const ganttCircles = ganttLabels.value.map((year, i) => {
      return {
        x: canvasWidth.value * 0.55 + ganttRadius.value(year) * Math.cos(ganttAngle.value(i)),
        y: canvasHeight.value / 2 + ganttRadius.value(year) * Math.sin(ganttAngle.value(i)),
        radius: ganttRadius.value(year),
        year: year
      };
    });
    */

    // rCircles = rCircles.concat(ganttCircles);
  }

  circlesArray.value = rCircles;

  // console.log('circlesArray updated:', circlesArray.value);
};

// add extra circles for gantt chart -> region none / YYlabelValue

const currentYear = new Date().getFullYear();
const minGanttYear = ref(1975); // minimum year for gantt chart
const maxGanttYear = ref(2030); // maximum year for gantt chart

// gantt labels as computed property
const ganttLabels = computed(() => {
  const startFrom = Math.floor(minGanttYear.value / 5) * 5; // round down to nearest 5
  const endAt = Math.ceil(maxGanttYear.value / 5) * 5; // round up to nearest 5
  const years = [];
  for (let year = startFrom; year <= endAt; year += 5) {
    years.push(year);
  }
  return years;
});

const updateMapData = (newVal) => {
  console.log("updating data for mapDataR and UMAP ......");
  mapDataR.value = newVal;

  // Sample data: 139 points in 16D space
  // an array of UMAPdimensions
  const umapDimensions = mapDataR.value.map((d) => d.UMAPdimensions);
  // console.log('umapDimensions', umapDimensions);
  const normalizedData = umapDimensions.map(normalizeV);
  // console.log('normalizedData', normalizedData);
  // configure UMAP
  const umap = new UMAP({
    nComponents: 2, // Project to 2D
    nNeighbors: 3, // Adjust based on data size
    minDist: 0.1, // Controls clustering 0.1
    metric: "cosine", // Use cosine distance (angular)
  });

  // Step 3: Fit UMAP and transform data
  const embedding = umap.fit(normalizedData);
  embedding.forEach((point, index) => {
    // Assign the UMAP coordinates back to the original data
    mapDataR.value[index].umapX = point[0];
    mapDataR.value[index].umapY = point[1];
  });
  // console.log('UMAP embedding', embedding);

  // assign x and y coordinates according to scaleX and scaleY
  mapDataR.value.forEach((d, i) => {
    d.x = scaleX.value(d.umapX);
    d.y = scaleY.value(d.umapY);
    d.r = 3 + d.group * 2; // radius for circles

    d.geoX =
      parseFloat(projection.value([d.lng, d.lat])[0].toFixed(2)) +
      Math.random() * 0.01; // add some random offset to avoid overlapping
    d.geoY =
      parseFloat(projection.value([d.lng, d.lat])[1].toFixed(2)) +
      Math.random() * 0.01; // add some random offset to avoid overlapping
  });

  // modify x and y to avoid circles overlapping
  mapDataR.value = resolveCircleCollisions(mapDataR.value);
  mapDataR.value = resolveCircleGeoCollisions(mapDataR.value);

  // data for gantt chart
  // find minimum start year from implementation_year object
  // filter out null or undefined values

  const validYY = mapDataR.value.filter(
    (d) =>
      d.implementation_years &&
      d.implementation_years.start_year &&
      d.implementation_years.end_year
  );
  console.log("validYY", validYY);

  // find minimum start year and maximum end year from valid implementation years
  const minStartYear = Math.min(
    ...validYY.map((d) => parseInt(d.implementation_years.start_year))
  );
  let maxEndYear = Math.max(
    ...validYY.map((d) => parseInt(d.implementation_years.end_year))
  );
  console.log("minStartYear:", minStartYear, "maxEndYear:", maxEndYear);
  // limit maxEndYear to 2030
  maxEndYear = Math.min(maxEndYear, 2030);

  minGanttYear.value = Math.max(minStartYear, 1975); // ensure minGanttYear is at least 1975
  maxGanttYear.value = Math.min(maxEndYear, currentYear + 5); // ensure maxGanttYear is at most YY + 5

  // const missingStartYears = mapDataR.value.filter(d => d.implementation_years && !d.implementation_years.start_year);
  // console.log('missing start years', missingStartYears);

  // const missingEndYears = mapDataR.value.filter(d => d.implementation_years && !d.implementation_years.end_year);
  // console.log('missing end years', missingEndYears);

  // const noYY = mapDataR.value.filter(d => !d.implementation_years);
  // console.log('no implementation_years', noYY);

  // update mapDataR with gantt chart data
  // if NO YY -> display min and max at YYminStartYear
  // if NO end year -> display max at current year
  // if NO start year -> display min at current year

  mapDataR.value.forEach((d) => {
    if (!d.implementation_years) {
      d.implementation_years = {
        start_year: minGanttYear.value,
        end_year: maxGanttYear.value,
        showBoth: false,
      };
    } else {
      if (!d.implementation_years.start_year) {
        d.implementation_years.start_year = minGanttYear.value;
        d.implementation_years.end_year =
          parseInt(d.implementation_years.end_year) || currentYear;
        d.implementation_years.showBoth = false;
        // limit end year to current year + 5
        d.implementation_years.end_year = Math.min(
          d.implementation_years.end_year,
          currentYear + 5
        );
      } else if (!d.implementation_years.end_year) {
        d.implementation_years.start_year =
          parseInt(d.implementation_years.start_year) || currentYear;
        d.implementation_years.end_year = currentYear;
        d.implementation_years.showBoth = false;
        // limit start_year to 1975
        d.implementation_years.start_year = Math.max(
          d.implementation_years.start_year,
          1975
        );
      } else {
        d.implementation_years.showBoth = true;
        d.implementation_years.start_year =
          parseInt(d.implementation_years.start_year) || currentYear;
        d.implementation_years.end_year =
          parseInt(d.implementation_years.end_year) || currentYear;
        // limit start year and end year to range
        d.implementation_years.start_year = Math.max(
          d.implementation_years.start_year,
          minGanttYear.value
        );
        d.implementation_years.end_year = Math.min(
          d.implementation_years.end_year,
          maxGanttYear.value
        );
      }
    }
  });

  // sort mapDataR by implementation_years.start_year
  /*
  mapDataR.value.sort((a, b) => {
    return (a.implementation_years.start_year || minStartYear) - (b.implementation_years.start_year || minStartYear);
  });
  */

  // sort mapDataR by implementation_years.
  mapDataR.value.sort((a, b) => {
    return (
      (a.implementation_years.end_year || currentYear) -
      (b.implementation_years.end_year || currentYear)
    );
  });

  console.log("mapDataR .....................", mapDataR.value);
};

// D3 scales
// scaleX and scaleY for UMAP coordinates
const UMAPPadding = 64;
const scaleX = computed(() => {
  return d3
    .scaleLinear()
    .domain(d3.extent(mapDataR.value, (d) => d.umapX))
    .range([
      canvasWidth.value / 3 + UMAPPadding,
      (canvasWidth.value / 5) * 4 - UMAPPadding,
    ]);
});
const scaleY = computed(() => {
  return d3
    .scaleLinear()
    .domain(d3.extent(mapDataR.value, (d) => d.umapY))
    .range([
      canvasHeight.value * 0.8 + UMAPPadding,
      canvasHeight.value * 0.2 - UMAPPadding,
    ]); // Invert Y-axis for SVG coordinates
});

// scales x and y for gantt chart
const ganttScaleX = computed(() => {
  let minYY =
    mapDataR.value.length > 0
      ? Math.min(
          ...mapDataR.value.map(
            (d) => d.implementation_years.start_year || 1975
          )
        )
      : 1975;
  let maxYY =
    mapDataR.value.length > 0
      ? Math.max(
          ...mapDataR.value.map((d) => d.implementation_years.end_year || 2030)
        )
      : 2030;

  // limit maxYY to 2030
  maxYY = Math.min(maxYY, 2030);
  // limit minYY to 1975
  minYY = Math.max(minYY, 1975);

  console.log("ganttScaleX minYY:", minYY, "maxYY:", maxYY);

  return d3
    .scaleLinear()
    .domain([minYY, maxYY])
    .range([
      canvasWidth.value / 3 + UMAPPadding,
      (canvasWidth.value / 5) * 4 - UMAPPadding,
    ]);
});

const ganttScaleY = computed(() => {
  return d3
    .scaleLinear()
    .domain([0, mapDataR.value.length > 0 ? mapDataR.value.length : 1])
    .range([
      canvasHeight.value * 0.8 + UMAPPadding,
      canvasHeight.value * 0.2 - UMAPPadding,
    ]); // Invert Y-axis for SVG coordinates
});

const ganttRadius = computed(() => {
  return d3
    .scaleLinear()
    .domain([minGanttYear.value, maxGanttYear.value])
    .range([canvasHeight.value / 10, canvasHeight.value / 2.5]); // Adjust radius range as needed
});

const ganttAngle = computed(() => {
  return d3
    .scaleLinear()
    .domain([0, mapDataR.value.length > 0 ? mapDataR.value.length : 1])
    .range([(Math.PI * 3) / 2, -Math.PI / 2]); // Full circle
});

// D3 GEO
const projection = computed(() => {
  return d3
    .geoConicConformal()
    .scale(1000) // Adjust scale for better visibility
    .center([4, 48]) // Center the map on the world
    .translate([canvasWidth.value / 2, canvasHeight.value / 2]); // Center the projection in the SVG
});

const pathGenerator = computed(() => {
  return d3.geoPath(projection.value);
});

const graticule = computed(() => {
  return d3.geoGraticule().step([5, 5]); // Set the step for the graticule lines
  // .extent([[0, -90], [360, 90]]); // Define the extent of the graticule
});

//  the array of circles objects as reactive variable
const circlesArray = ref([]);

// transitions functions
const allDots = computed(() => {
  return d3.select("#dots").selectAll(".dot").data(props.mapData);
});

const dotsFadeIn = () => {
  allDots.value
    .transition()
    .delay((d, i) => i * 10) // stagger the fade-in effect
    .duration(500)
    .attr("opacity", 1)
    .attr("r", (d, i) => 3 + d.group * 2); // adjust radius based on group
};

// dots to geo locations transition
const dotsToGeo = (duration = 1000) => {
  allDots.value
    .transition()
    .delay((d, i) => i * 10) // stagger the fade-in effect
    .duration(duration)
    // .attr('cx', (d, i) => projection.value([d.lng, d.lat])[0])
    // .attr('cy', (d, i) => projection.value([d.lng, d.lat])[1])
    .attr("cx", (d, i) => d.geoX)
    .attr("cy", (d, i) => d.geoY)
    .attr("r", (d, i) => 3 + d.group * 2); // adjust radius based on group

  // show graticule and countries
  d3.select("#grid")
    .selectAll(".graticule")
    .transition()
    .duration(duration)
    .attr("opacity", "1");

  d3.select("#countries")
    .selectAll(".country")
    .data(worldGeoJson.features)
    .transition()
    .duration(duration)
    .attr("opacity", (d, i) => {
      // hide Antarctica
      return d.id === "ATA" ? 0 : 0.1;
    });

  d3.select("#areas")
    .selectAll(".area")
    .data(circlesArray.value)
    .transition()
    .duration(duration)
    .attr("cx", (d, i) => canvasWidth.value * 0.55)
    .attr("cy", (d, i) => canvasHeight.value / 2)
    .attr(
      "r",
      (d, i) => canvasHeight.value / 3 + (i * canvasHeight.value) / 12
    );

  d3.select("#ganttLines")
    .selectAll(".gantt-line")
    .data(mapDataR.value)
    .transition()
    .duration(duration)
    .attr("x1", (d, i) => getGanttRadialLoc(1975, i).x)
    .attr("y1", (d, i) => getGanttRadialLoc(1975, i).y)
    .attr("x2", (d, i) => getGanttRadialLoc(1975, i).x)
    .attr("y2", (d, i) => getGanttRadialLoc(1975, i).y)
    .attr("opacity", (d, i) => (d.implementation_years.showBoth ? 0 : 0));

  // gantt labels
  d3.select("#ganttLabels")
    .selectAll(".gantt-label")
    .data(ganttLabels.value)
    .transition()
    .duration(duration)
    .attr("opacity", 0);
};

// dots to phyllotaxis transition
const dotsToPhyllotaxis = (duration = 1000) => {
  allDots.value
    .transition()
    .delay((d, i) => i * 10) // stagger the fade-in effect
    .duration(duration)
    // .attr('cx', (d, i) => i)
    // .attr('cy', (d, i) => i)
    .attr("cx", (d, i) => setPhyllotaxis(i).x)
    .attr("cy", (d, i) => setPhyllotaxis(i).y);
  // .attr('r', (d, i) => 3) // adjust radius based on group

  d3.select("#grid")
    .selectAll(".graticule")
    .transition()
    .duration(duration)
    .attr("opacity", "0");

  d3.select("#countries")
    .selectAll(".country")
    .transition()
    .duration(duration)
    .attr("opacity", "0");

  // move areas to values
  d3.select("#areas")
    .selectAll(".area")
    .data(circlesArray.value)
    .transition()
    .duration(duration)
    .attr("cx", (d, i) => d.x)
    .attr("cy", (d, i) => d.y)
    .attr("r", (d, i) => d.radius);
};

const dotsToUmap = (duration = 1000) => {
  allDots.value
    .transition()
    .delay((d, i) => i * 10) // stagger the fade-in effect
    .duration(duration)
    .attr("cx", (d, i) => d.x)
    .attr("cy", (d, i) => d.y)
    .attr("r", (d, i) => d.r);

  d3.select("#grid")
    .selectAll(".graticule")
    .transition()
    .duration(duration)
    .attr("opacity", "0");

  d3.select("#countries")
    .selectAll(".country")
    .transition()
    .duration(duration)
    .attr("opacity", "0");

  d3.select("#areas")
    .selectAll(".area")
    .data(circlesArray.value)
    .transition()
    .duration(duration)
    .attr("cx", (d, i) => d.x)
    .attr("cy", (d, i) => d.y)
    .attr("r", (d, i) => {
      if (d.region != "none") {
        // if region is none, use gantt radius
        return d.radius;
      } else {
        return canvasWidth.value * 2;
      }
      // return d.radius
    });

  // gantt lines
  d3.select("#ganttLines")
    .selectAll(".gantt-line")
    .data(mapDataR.value)
    .transition()
    .duration(duration)
    .attr("x1", (d, i) => getGanttRadialLoc(1975, i).x)
    .attr("y1", (d, i) => getGanttRadialLoc(1975, i).y)
    .attr("x2", (d, i) => getGanttRadialLoc(1975, i).x)
    .attr("y2", (d, i) => getGanttRadialLoc(1975, i).y)
    .attr("opacity", (d, i) => (d.implementation_years.showBoth ? 0 : 0));

  // gantt labels
  d3.select("#ganttLabels")
    .selectAll(".gantt-label")
    .data(ganttLabels.value)
    .transition()
    .duration(duration)
    .attr("opacity", 0);
};

const dotsToGantt = (duration = 1000) => {
  console.log(ganttScaleX.value.domain(), ganttScaleX.value.range());

  // current year

  allDots.value
    .transition()
    .delay((d, i) => i * 10) // stagger the fade-in effect
    .duration(duration)
    .attr("cx", (d, i) =>
      ganttScaleX.value(
        d.implementation_years.end_year > currentYear
          ? currentYear
          : d.implementation_years.end_year
      )
    )
    .attr("cy", (d, i) => ganttScaleY.value(i))
    .attr("r", (d, i) => d.r);

  d3.select("#grid")
    .selectAll(".graticule")
    .transition()
    .duration(duration)
    .attr("opacity", "0");

  d3.select("#countries")
    .selectAll(".country")
    .transition()
    .duration(duration)
    .attr("opacity", "0");

  /*
  d3.select('#areas').selectAll('.area').data(circlesArray.value)
    .transition()
    .duration(duration)
    .attr('cx', (d, i) => d.x)
    .attr('cy', (d, i) => d.y)
    .attr('r', (d, i) => d.radius)
    */
};

// dots to radial gantt transition
const getGanttRadialLoc = (year, i) => {
  const r = ganttRadius.value(year);
  const angle = ganttAngle.value(i);
  const x = canvasWidth.value * 0.55 + r * Math.cos(angle);
  const y = canvasHeight.value / 2 + r * Math.sin(angle);
  return { x, y };
};

const dotsToRadialGantt = (duration = 1000) => {
  allDots.value
    .transition()
    .delay((d, i) => i * 10) // stagger the fade-in effect
    .duration(duration)
    .attr(
      "cx",
      (d, i) =>
        getGanttRadialLoc(
          d.implementation_years.end_year > currentYear
            ? currentYear
            : d.implementation_years.end_year,
          i
        ).x
    )
    .attr(
      "cy",
      (d, i) =>
        getGanttRadialLoc(
          d.implementation_years.end_year > currentYear
            ? currentYear
            : d.implementation_years.end_year,
          i
        ).y
    );

  d3.select("#grid")
    .selectAll(".graticule")
    .transition()
    .duration(duration)
    .attr("opacity", "0");

  d3.select("#countries")
    .selectAll(".country")
    .transition()
    .duration(duration)
    .attr("opacity", "0");

  d3.select("#areas")
    .selectAll(".area")
    .data(circlesArray.value)
    .transition()
    .duration(duration)
    .attr("cx", (d, i) => canvasWidth.value * 0.55)
    .attr("cy", (d, i) => canvasHeight.value / 2)
    .attr("r", (d, i) => {
      let r = 1000;
      if (d.year && ganttRadius.value(d.year)) {
        r = ganttRadius.value(d.year);
      } else {
        r = canvasHeight.value / 3 + (i * canvasHeight.value) / 12;
      }
      return r;
    });

  // gantt lines
  d3.select("#ganttLines")
    .selectAll(".gantt-line")
    .data(mapDataR.value)
    .transition()
    .duration(duration)
    .attr(
      "x1",
      (d, i) => getGanttRadialLoc(d.implementation_years.start_year, i).x
    )
    .attr(
      "y1",
      (d, i) => getGanttRadialLoc(d.implementation_years.start_year, i).y
    )
    .attr(
      "x2",
      (d, i) => getGanttRadialLoc(d.implementation_years.end_year, i).x
    )
    .attr(
      "y2",
      (d, i) => getGanttRadialLoc(d.implementation_years.end_year, i).y
    )
    .attr("opacity", (d, i) => (d.implementation_years.showBoth ? 1 : 0));

  d3.select("#ganttLabels")
    .selectAll(".gantt-label")
    .data(ganttLabels.value)
    .transition()
    .duration(duration)
    .attr("opacity", 1);
};

const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ≈2.39996 radians
const setPhyllotaxis = (i) => {
  // const r = Math.sqrt(i) * h/2 // radius grows with the square root of the index
  const w = canvasWidth.value;
  const h = canvasHeight.value;

  const r = (Math.sqrt(i / props.mapData.length) * h) / 3;
  const theta = i * goldenAngle; // angle increases by the golden angle
  const x = w * 0.55 + r * Math.cos(theta); // x position
  const y = h / 2 + r * Math.sin(theta); // y position
  return { x, y };
};

onMounted(() => {
  // delay the initial fadeIn to ensure the map is rendered
  dotsToUmap(1000);
  // setTimeout(() => {
  //   // update dots display according to viewMode
  //   if (props.viewMode === "map") {
  //     dotsToGeo(0);
  //   } else if (props.viewMode === "bubble") {
  //     console.log("dotsToUmap");
  //     dotsToUmap(0);
  //   } else if (props.viewMode === "gantt") {
  //     dotsToRadialGantt(0);
  //   }
  //   dotsFadeIn();
  // }, 1000);
});

onBeforeUnmount(() => {});
</script>

<style scoped>
/* Ensures the map fills the screen */
.fixed.inset-0 {
  width: 100vw;
  height: 100vh;
}
</style>
