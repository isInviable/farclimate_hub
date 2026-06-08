<template>
  <div ref="el" class="h-full w-full bg-warm-neutral-100">
    <svg :width="width" :height="height" :viewBox="viewBox">
      <!-- graticule -->
       <g>
        <path
          :d="pathGenerator(graticule) || ''"
          fill="none"
          class="stroke-[#d8d0c6]"
          stroke-width="0.5"
          stroke-dasharray="2 2"
        />
       </g>

      <!-- world shapes-->
      <g>
        <path
          v-for="feature in world_shapes.features"
          :key="feature.id"
          :id="feature.id"
          :d="pathGenerator(feature as any) || ''"
          class="fill-[#e7e1d8]"
          stroke="none"
          :opacity="hidenFeatures.includes(feature.id) ? 0 : 1"
        />
      </g>

       <!-- nuts shapes-->
      <g>
        <path
            v-for="feature in props.nuts_shapes.features"
            :key="feature.properties.NUTS_ID"
            :d="pathGenerator(feature as any) || ''"
         
            class="stroke-[#cfc7bd]  transition-colors duration-100 "
            :class="props.selectedNutsIds?.includes(feature.properties.NUTS_ID) 
                      ? 'fill-trust-blue-darkest cursor-pointer' 
                      : props.activeRegions?.has(feature.properties.NUTS_ID) 
                        ? 'fill-neutral-lightest cursor-pointer hover:fill-trust-blue-light' 
                        : 'fill-[#f2ece4]'"
            stroke-width="0.5"
            stroke-opacity="0.5"
            
            @mouseover="overNuts(feature.properties.NUTS_ID)"
            @mouseleave="overNuts('')"
            @click="clickNuts(feature.properties.NUTS_ID)"
        />
      </g>

      <!-- entities points  -->
      <g>
        <circle
          v-for="entity in entitiesWithGeolocation"
          :key="entity.id"
          :cx="entity.geoX"
          :cy="entity.geoY"
          :r="entity.r"
          :fill="entity.color"
          stroke="none"
          class="pointer-events-none transitions duration-300"
          :class="props.activeEntities?.has(entity.id) ? 'opacity-100' : 'opacity-10 grayscale'"
          
        />
      </g>
    </svg>
  </div>
</template>

<script lang="ts" setup>
  import { useElementSize } from '@vueuse/core'
  import { useTemplateRef } from 'vue'
  import * as d3 from "d3";
  import type { GeoProjection, GeoPath } from "d3";

  const el = useTemplateRef('el')
  const { width, height } = useElementSize(el)
  // calculate viewBox dimensions based on width and height
  const viewBox = computed(() => `0 0 ${width.value} ${height.value}`);

  // d3 geo stuff
  // import nuts_shapes from "~/assets/geo/NUTS_RG_60M_2024_4326.json";
  // import nuts_shapes from "~/assets/geo/NUTS_RG_60M_2024_4326_LEVL_3.json";
  // NUTS_RG_60M_2024_4326_LEVL_3.json
  import world_shapes from "~/assets/geo/world-110m.json";

  const projection = computed((): GeoProjection => {
    return d3
        .geoConicEquidistant()
        .center([10, 52])
        .parallels([43, 62])
        .scale(1000)
        .translate([width.value / 2, height.value / 2]);
    });

  const pathGenerator = computed((): GeoPath => {
    return d3.geoPath().projection(projection.value);
  });

  const hidenFeatures = ['ESP', 'ITA', 'FRA', 'PRT', 'GRC', 'MLT','CYP','TUR','NOR','ISL','FIN','SWE','DNK','IRL','GER','BEL','NLD','LUX','CHE','AUT','SVN','HRV','BIH','SRB','MNE','ALB','MKD','ROU','BGR','HUN','CZE','SVK','POL','LTU','LVA','EST',];

  // map graticule
  //const graticule = d3.geoGraticule10();
  const graticule = d3.geoGraticule().step([5, 5])();

  const props = defineProps<{
    entities: Array<any>;
    overedNutsId?: string | null;
    nuts_shapes?: any;
    activeNutsId?: string | null;
    selectedNutsIds?: Array<string>;
    activeRegions?: Set<string>;
    activeEntities?: Set<string>;
  }>();

  // emit updateNutsId event
  const emit = defineEmits<{
    (e: 'updateNutsId', nutsId: string | null): void;
    (e: 'updateActiveNutsId', nutsId: string | null): void;
  }>();

  const overNuts = (nutsId: string) => {
    emit('updateNutsId', nutsId);
  };   
  
  const clickNuts = (nutsId: string) => {
    if(nutsId === props.activeNutsId) {
      // deactivate
      emit('updateActiveNutsId', '');
      return;
    }
    emit('updateActiveNutsId', nutsId);
  };

  // collision resolution function
  const resolveCircleCollisions = (circles: any[], maxIterations = 100) => {
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
          const minDist = a.r + b.r + 1; // minimum distance = r + 2
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

  // get max value for projectsTotal cost to scale radius
  const maxProjectsTotalCost = computed(() => {
    return Math.max(
      ...(props.entities ?? []).map((entity) => entity.projectsTotalCost || 0)
    );
  });

  // a d3 scale POW to map projectsTotalCost to radius size
  const projectsTotalCostScale = computed(() => {
    return d3.scalePow()
      .exponent(0.5)
      .domain([0, maxProjectsTotalCost.value || 1])
      .range([1.5, 7]); // radius range from 2 to 5 pixels
  });

  // get max value for projectsCount to scale color hue
  const maxProjectsCount = computed(() => {
    return Math.max(
      ...(props.entities ?? []).map((entity) => entity.projectsCount || 0)
    );
  });

  // a d3 scale linear to map projectsCount to color hue
  const projectsCountHueScale = computed(() => {
    return d3.scaleLinear()
      .domain([0, maxProjectsCount.value || 1])
      .range([0, 360]); // hue range from 0 to 360 degrees
  });

  const linearColorScale = computed(() => {
    return d3.scaleLinear<string>()
      .domain([0, maxProjectsCount.value || 1])
      .range(["#9cc0db", "#13497c"]); // trust-blue light → deep
  });

  // process props.entities to log their geolocations
  // add geolocation as array of [lat, lon]
  const entitiesWithGeolocation = computed(() => {
    const entities = props.entities.map((entity) => {
      if (entity.address_geolocation) {
        const [lat, lon] = entity.address_geolocation.split(',').map((coord: string) => parseFloat(coord));
        const projectedCoords = projection.value([lon, lat]) || [0, 0];
        return {
          ...entity,
          geolocationArray: [lat, lon],
          geoX: projectedCoords[0] + Math.random()*2 -1, // add random jitter to x
          geoY: projectedCoords[1] + Math.random()*2 -1, // add random jitter to y
          r: projectsTotalCostScale.value(entity.projectsTotalCost || 0),
          color: linearColorScale.value(entity.projectsCount || 0)
        };
      } else {
        return {
          ...entity,
          geolocationArray: null,
          geoX: 0,
          geoY: 0,
          r: projectsTotalCostScale.value(entity.projectsTotalCost || 0),
          color: linearColorScale.value(entity.projectsCount || 0)
        };
      }
    });
    
    // Apply collision resolution only to entities with valid geolocation
    const validEntities = entities.filter(e => e.geolocationArray !== null);
    const invalidEntities = entities.filter(e => e.geolocationArray === null);
    
    return [...resolveCircleCollisions(validEntities), ...invalidEntities];
  }); 

</script>

<style>

</style>