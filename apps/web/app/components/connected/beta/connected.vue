<template>
  <div ref="el" class="h-full w-full bg-neutral-lightest">
      <svg :width="width" :height="height" :viewBox="viewBox">
        <defs>
          <filter id="dropShadow" x="0" y="0" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="black" flood-opacity="0.5" />
          </filter>
        </defs>

        <!-- references 
        <g>
          <line
            v-for="(i,index) in StritesHeightStacked"
            :key="i"
            :x1="leftAxis "
            :y1="my * i"
            :x2="rightAxis"
            :y2=" my * i"
            stroke="rgba(0,0,0,0.1)"
            stroke-dasharray="2 2"
            
          />
          

          <line
            :key="'v1'"
            :x1="leftAxis "
            :y1="0"
            :x2="leftAxis "
            :y2="height "
            stroke="rgba(0,0,0,0.15)"
            stroke-dasharray="2 2"
          />
         

          <line
            :key="'v1'"
            :x1="rightAxis "
            :y1="0"
            :x2="rightAxis "
            :y2="height "
            stroke="rgba(0,0,0,0.15)"
            stroke-dasharray="2 2"
          />
        </g>
-->

        <!-- one circle for each project as mini circle lower-->
        <circle
            v-for="project in projects"
            :key="'circle-' + project.id"
            :cx="(scaleX(project.id) ?? 0) + scaleX.bandwidth() / 2"
            :cy="my * 3.5"
            :r="1.5"
            :class="overedProjectIds.includes(project.id) || overedProjectIds.length == 0 ? 'fill-black' : 'fill-gray-300'"
          
        />

        <!-- risk lines for each project -->
        <g 
            v-for="project in projects"
            :key="'risk-line-' + project.id"
          >
            <path
              v-for="risk in project.risks || []"
              :key="project.id + '-' + risk"
              :d="d3.linkVertical()({
                source: [(scaleX(project.id) ?? 0) + scaleX.bandwidth() / 2, my*2 ],
                target: [(scaleXRisksNew(risk) ?? 0) + scaleXRisksNew.bandwidth() / 2, my]
              }) || ''"
              fill="none"
              :stroke="(overedRiskLabels.includes(risk) && overedProjectIds.includes(project.id)) ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'"
              :stroke-width="(overedRiskLabels.includes(risk) && overedProjectIds.includes(project.id)) ? '2' : '1'"
            />
        </g>

       

          <!-- country ISO lines for each project -->
          <g 
            v-for="project in projects"
            :key="'country-line-' + project.id" 
          >
            <path
              v-for="countryIso in project.countriesIsoArray || []"
              :key="project.id + '-' + countryIso"
              :d="d3.linkVertical()({
                source: [(scaleX(project.id) ?? 0) + scaleX.bandwidth() / 2, my * 3.5],
                target: [scaleXEntityRegions(entityRegionStacks.find(s => s.regionIsoCode === countryIso)?.from || 0) + (scaleXEntityRegions(entityRegionStacks.find(s => s.regionIsoCode === countryIso)?.to || 0) - scaleXEntityRegions(entityRegionStacks.find(s => s.regionIsoCode === countryIso)?.from || 0))/2, my * 4.5]
              }) || ''"
              fill="none"
              :stroke="overedProjectIds.includes(project.id) ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'"
              :stroke-width="overedProjectIds.includes(project.id) ? '2' : '1'"
              :opacity="overedProjectIds.includes(project.id) ? '1' : '0.2'"
            />
          </g>


       
        <!-- projects  -->
        <g>
         

          <!-- lower rect -->
          <rect
            v-for="project in projects"
            :key="project.id"
            :x="scaleX(project.id)"
            :y="scaleY(project.end_year ?? 0) - scaleX.bandwidth()/2"
            :width="scaleX.bandwidth()"
            :height="scaleY(project.start_year ?? 0) - scaleY(project.end_year ?? 0) + scaleX.bandwidth()/2"
            :class="overedProjectIds.includes(project.id) || overedProjectIds.length == 0 ? 'fill-[#1E63A2]' : 'fill-gray-300'"
            class="cursor-pointer transition-colors duration-300"
            stroke="black"
            stroke-width="1"
            :rx="scaleX.bandwidth()/2"
            @mouseover="(e) => { overProjects(project.id); showTooltip(e, { title: project.acronym || project.title || project.id, subtitle: `${project.start_year || '?'} - ${project.end_year || '?'}`, value: project.total_cost, valueLabel: 'Total Cost' }) }"
            @mousemove="updateTooltipPosition"
            @mouseout="() => { outProjects(); hideTooltip() }"
          />
         
          <!-- one circle for each project at endYear y -->
          <circle
            v-for="project in projects"
            :key="'circle-end-' + project.id"
            :cx="(scaleX(project.id) ?? 0) + scaleX.bandwidth() / 2"
            :cy="scaleY(project.end_year ?? 0)"
            :r="scaleX.bandwidth()/2"         
            class="fill-white stroke-black stroke-1"
          />  

           <!-- one circle for each project as mini circle upper-->
          <circle
            v-for="project in projects"
            :key="'circle-' + project.id"
            :cx="(scaleX(project.id) ?? 0) + scaleX.bandwidth() / 2"
            :cy="my * 2"
            :r="1.5"
            :class="overedProjectIds.includes(project.id) || overedProjectIds.length == 0 ? 'fill-black' : 'fill-gray-300'"
          />
          
        </g>

        <!-- years lables on the left of the diagram -->
        <g>
          <text
            v-for="year in Array.from({ length: maxEndYear - minStartYear + 1 }, (_, i) => minStartYear + i)"
            :key="'label-' + year"
            :x="leftAxis"
            :y="scaleY(year) + 4"
            class="text-[9px] fill-gray-400 font-mono"
            text-anchor="end"
            dx="-0.5rem"
          >
            {{ year }}
          </text>
        </g>

        <!-- risks cilinders -->
         <g>
           
          <circle
            v-for="(stack, index) in riskStacks"
            :key="'risk-circle-' + stack.riskLabel"
            :cx="(scaleXRisksNew(stack.riskLabel) ?? 0) + scaleXRisksNew.bandwidth() / 2"
            :cy="scaleYRisks(0)"
            :r="scaleX.bandwidth()/2"     
            :class="overedRiskLabels.includes(stack.riskLabel) || overedRiskLabels.length == 0 ? 'fill-white stroke-black' : 'fill-gray-300'"
            class="transition-colors duration-300 cursor-pointer"
            stroke-width="1"
            @mouseover="(e) => { overRisks(stack.riskLabel); showTooltip(e, { title: stack.riskLabel, value: stack.count, valueLabel: 'Projects' }) }"
            @mousemove="updateTooltipPosition"
            @mouseout="() => { outRisks(); hideTooltip() }"
          />
   

          <!-- a rounded rect connecting the two circles-->
            <rect
                v-for="(stack, index) in riskStacks"
                :key="'risk-rect-' + stack.riskLabel"
                :x="(scaleXRisksNew(stack.riskLabel) ?? 0) + scaleXRisksNew.bandwidth() / 2 - scaleX.bandwidth()/2"
                :y="scaleYRisks(stack.count) - scaleX.bandwidth()/2"
                :width="scaleX.bandwidth()"
                :height="(scaleYRisks(0) - scaleYRisks(stack.count)) + scaleX.bandwidth()"
                :rx="scaleX.bandwidth()/2"
                :class="overedRiskLabels.includes(stack.riskLabel) || overedRiskLabels.length == 0 ? 'fill-[#1E63A2]' : 'fill-gray-100'"
                class="transition-colors duration-300 stroke-black cursor-pointer"
                @mouseover="(e) => { overRisks(stack.riskLabel); showTooltip(e, { title: stack.riskLabel, value: stack.count, valueLabel: 'Projects' }) }"
                @mousemove="updateTooltipPosition"
                @mouseout="() => { outRisks(); hideTooltip() }"
            />

        <!-- top circle same x y according to new scaleY for risks and risks count-->
            <circle
                 v-for="(stack, index) in riskStacks"
                :key="'risk-circle-top-' + stack.riskLabel"
                :cx="(scaleXRisksNew(stack.riskLabel) ?? 0) + scaleXRisksNew.bandwidth() / 2"
                :cy="scaleYRisks(stack.count)"
                :r="scaleX.bandwidth()/2"     
                :class="overedRiskLabels.includes(stack.riskLabel) || overedRiskLabels.length == 0 ? 'fill-white ' : 'fill-white'"
                class="transition-colors duration-300 stroke-black cursor-pointer"
                stroke-width="1"
                @mouseover="(e) => { overRisks(stack.riskLabel); showTooltip(e, { title: stack.riskLabel, value: stack.count, valueLabel: 'Projects' }) }"
                @mousemove="updateTooltipPosition"
                @mouseout="() => { outRisks(); hideTooltip() }"
            />


            
         </g>


        <!-- countries ISO small dots and labels -->
        <g>
          <circle
            v-for="country in entityRegionStacks"
            :key="'country-dot-' + country.regionIsoCode"
            :cx="scaleXEntityRegions(country.from) + (scaleXEntityRegions(country.to) - scaleXEntityRegions(country.from))/2"
            :cy="my * 4.5"
            r="1.5"
            :class="overedIsoCodes.includes(country.regionIsoCode) || overedIsoCodes.length == 0 ? 'fill-black' : 'fill-gray-300'"
            class="cursor-pointer"
            @mouseover="(e) => showTooltip(e, { title: country.regionIsoCode, value: country.count, valueLabel: 'Entities' })"
            @mousemove="updateTooltipPosition"
            @mouseout="hideTooltip"
          />

          <!-- lower dots for countries-->
           <circle
            v-for="country in entityRegionStacks"
            :key="'country-dot-lower-' + country.regionIsoCode"
            :cx="scaleXEntityRegions(country.from) + (scaleXEntityRegions(country.to) - scaleXEntityRegions(country.from))/2"
            :cy="my * 6"
            r="1.5"
            :class="overedIsoCodes.includes(country.regionIsoCode) || overedIsoCodes.length == 0 ? 'fill-black' : 'fill-gray-300'"
            class="cursor-pointer"
            @mouseover="(e) => showTooltip(e, { title: country.regionIsoCode, value: country.count, valueLabel: 'Entities' })"
            @mousemove="updateTooltipPosition"
            @mouseout="hideTooltip"
          />

          <g v-for="country in entityRegionStacks">
            <text
              v-if="country.count > 12"
              :key="'country-label-' + country.regionIsoCode"
              :x="scaleXEntityRegions(country.from) + (scaleXEntityRegions(country.to) - scaleXEntityRegions(country.from))/2"
              :y="my*6"
              class="text-[8px]  font-mono"
              :class="overedIsoCodes.includes(country.regionIsoCode) || overedIsoCodes.length == 0 ? 'fill-gray-600' : 'fill-gray-300'"
              text-anchor="middle"
              dy="1rem"
            >
            {{ country.regionIsoCode }}
            </text>
          </g>
        </g>

        <!-- entities -->
        <g filter="url(#dropShadow)">
          <circle
            v-for="entity in entitiesWithStripPositions"
            :key="'entity-circle-' + entity.id"
            :cx="entity.radarX"
            :cy="entity.radarY"
            :r="overedEntitiesIds.includes(entity.id) ? entity.radarRadius * 2 : entity.radarRadius"
            :fill="organizationActivityTypeColorScale((entity as any).organization_activity_type_name)"
            class="transition-all duration-300 cursor-pointer"
            :class="overedEntitiesIds.includes(entity.id) || overedEntitiesIds.length == 0 ? 'grayscale-0' : 'grayscale-100 opacity-10'"
            @mouseover="(e) => showTooltip(e, { title: (entity as any).short_name || (entity as any).legal_name || entity.id, subtitle: (entity as any).organization_activity_type_name, value: (entity as any).projectsTotalCost, valueLabel: 'Total Cost' })"
            @mousemove="updateTooltipPosition"
            @mouseout="hideTooltip"
          />
        </g>
      </svg>
    
    <!-- Tooltip -->
    <div 
      v-if="tooltip.visible"
      class="fixed z-50 border border-neutral-darkest bg-neutral-lightest p-2 text-sm shadow-lg pointer-events-none"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      <div class="font-mono text-xs font-bold uppercase tracking-[0.06em] text-neutral-darkest">{{ tooltip.title }}</div>
      <div v-if="tooltip.subtitle" class="mt-1 text-xs text-neutral-dark">{{ tooltip.subtitle }}</div>
      <div v-if="tooltip.value !== undefined" class="mt-1">
        <span class="font-medium">{{ tooltip.valueLabel }}: {{ typeof tooltip.value === 'number' ? tooltip.value.toLocaleString() : tooltip.value }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useElementSize } from '@vueuse/core'
  import { useTemplateRef } from 'vue'
  import * as d3 from "d3";
  import { CA_CAT_LIST } from "~/utils/connectedColors";

  const el = useTemplateRef('el')
  const { width, height } = useElementSize(el)
  // calculate viewBox dimensions based on width and height
  const viewBox = computed(() => `0 0 ${width.value} ${height.value}`);

  // SVG save functionality
  const saveSVG = () => {
    if (!el.value) return;
    
    const svgElement = el.value.querySelector('svg');
    if (!svgElement) return;
    
    // Clone the SVG to avoid modifying the original
    const svgClone = svgElement.cloneNode(true) as SVGElement;
    
    // Add XML declaration and namespace
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    // Create CSS styles for the classes used in the SVG
    const cssStyles = `
      .fill-gray-300 { fill: #d1d5db; }
      .fill-gray-400 { fill: #9ca3af; }
      .fill-gray-500 { fill: #6b7280; }
      .fill-gray-600 { fill: #4b5563; }
      .fill-gray-900 { fill: #111827; }
      .fill-white { fill: #ffffff; }
      .fill-black { fill: #000000; }
      .stroke-gray-200 { stroke: #e5e7eb; }
      .stroke-gray-400 { stroke: #9ca3af; }
      .stroke-black { stroke: #000000; }
      .text-9px { font-size: 9px; }
      .text-8px { font-size: 8px; }
      .text-10px { font-size: 10px; }
      .font-mono { font-family: ui-monospace, SFMono-Regular, "SF Mono", monospace; }
      .cursor-pointer { cursor: pointer; }
      .transition-colors { transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out; }
      .transition-all { transition: all 0.15s ease-in-out; }
      .duration-300 { transition-duration: 0.3s; }
      .grayscale-0 { filter: grayscale(0); }
      .grayscale-100 { filter: grayscale(1); }
      .opacity-10 { opacity: 0.1; }
      .hover\\:stroke-gray-400:hover { stroke: #9ca3af; }
      .stroke-1 { stroke-width: 1px; }
    `;
    
    // Create style element
    const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleElement.textContent = cssStyles;
    
    // Insert style at the beginning of SVG
    svgClone.insertBefore(styleElement, svgClone.firstChild);
    
    // Create the SVG content
    const svgContent = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgClone.outerHTML;
    
    // Create and download the file
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `connected-diagram-${new Date().toISOString().slice(0, 10)}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  // Keyboard event handler
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 's' || event.key === 'S') {
      event.preventDefault();
      saveSVG();
    }
  };

  // variables for dimensions
  const my = computed(() => height.value / 8); // stripes height module

  // Horizontal chart bounds — use nearly the full container width (the old
  // (width - height) / 2 margins assumed a square viewport and left huge
  // empty gutters on wide screens).
  const chartPaddingX = computed(() => 56);
  const leftAxis = computed(() => chartPaddingX.value);
  const rightAxis = computed(() => width.value - chartPaddingX.value);


  const StripesHeight = [1,1,1.5,1,1.5,1,1]
  const StritesHeightStacked = computed(() => {
    const stacks: number[] = [];
    let currentHeight = 0;
    StripesHeight.forEach((h) => {
      currentHeight += h;
      stacks.push(currentHeight);
    });
    return stacks;
  });

  const props = defineProps<{
    projects: any[];
    risks: any[];
    entities: any[];
  }>();

  // minimum start year and maximum end year from projects prop
  const minStartYear = computed(() => {
    return d3.min(props.projects, (d: any) => d.start_year) || new Date().getFullYear();
  });
  const maxEndYear = computed(() => {
    return d3.max(props.projects, (d: any) => d.end_year) || new Date().getFullYear();
  });
  // max total_cost from projects prop
  const maxTotalCost = computed(() => {
    return d3.max(props.projects, (d: any) => d.total_cost) || 0;
  });

  // an horizontal scaleX for projects: starting at (width-height)/2 ending at width -  (width-height)/2
  const scaleY = computed(() => {
    return d3.scaleLinear()
      .domain([minStartYear.value, maxEndYear.value])
      .range([my.value * 3.5, my.value * 2]);
  });

  const scaleX = computed(() => {
    return d3.scaleBand()
      .domain(props.projects.map((d) => d.id))
      .range([leftAxis.value, rightAxis.value])
      .padding(0.25);
  });

  const thisYear = new Date().getFullYear();

  // loop props.risks to get stacked count values (from, to)
  const riskStacks = computed(() => {
    const stacks: Array<{ riskLabel: string; count: number; from: number; to: number }> = [];
    let currentCount = 0;
    
    props.risks.forEach((riskObj) => {
      const riskLabel = riskObj.risk;
      const count = riskObj.count;
      
      stacks.push({ 
        riskLabel, 
        count, 
        from: currentCount, 
        to: currentCount + count 
      });
      
      currentCount += count;
    });
    
    return stacks;
  });

  // an horizontal scaleX, for risks, from 0 to max count
  const scaleXRisks = computed(() => {
    const maxCount = d3.max(riskStacks.value, (d) => d.to) || 0;
    return d3.scaleLinear()
      .domain([0, maxCount])
      .range([leftAxis.value, rightAxis.value]);
  });

    const scaleXRisksNew = computed(() => {
        return d3.scaleBand()
        .domain(riskStacks.value.map(d => d.riskLabel))
        .range([leftAxis.value, rightAxis.value])
        .padding(0.1);
    });

    // a new scaleY for risks
    // from 0 to max count in props.risks
    // from my to my/2 (max)
    const scaleYRisks = computed(() => {
        const maxCount = d3.max(riskStacks.value, (d) => d.count) || 0;
        return d3.scaleLinear()
        .domain([0, maxCount])
        .range([ my.value, my.value/2 ]);
    });


  // local data processing
  // get max projectsTotalCost from entities prop
  const maxEntitiesProjectsTotalCost = computed(() => {
    return d3.max(props.entities, (d) => d.projectsTotalCost) || 0;
  });

  // get unique organization_activity_type_name from entities prop with entities count
  const entityTypes = computed(() => {
    const typeCountMap = new Map<string, number>();
    props.entities.forEach((entity: any) => {
      if (entity.organization_activity_type_name) {
        const currentCount = typeCountMap.get(entity.organization_activity_type_name) || 0;
        typeCountMap.set(entity.organization_activity_type_name, currentCount + 1);
      }
    });
    
    return Array.from(typeCountMap.entries()).map(([activityType, count]) => ({
      activityType,
      count
    })).sort((a, b) => b.count - a.count);
  });

  // same as for entitity types but for related_region_iso_code property
  const entityRegions = computed(() => {
    const regionCountMap = new Map<string, number>();
    props.entities.forEach((entity: any) => {
      if (entity.related_region_iso_code) {
        const currentCount = regionCountMap.get(entity.related_region_iso_code) || 0;
        regionCountMap.set(entity.related_region_iso_code, currentCount + 1);
      }
    }); 
    
    return Array.from(regionCountMap.entries()).map(([regionIsoCode, count]) => ({
      regionIsoCode,
      count
    })).sort((a, b) => b.count - a.count);
  });

  // get max count value from entityTypes and entityRegions
  const maxEntityTypeCount = computed(() => {
    return d3.max(entityTypes.value, (d) => d.count) || 0;
  });

  const maxEntityRegionCount = computed(() => {
    return d3.max(entityRegions.value, (d) => d.count) || 0;
  }); 

   // a d3 color scale for entity organizationActivityType
   const organizationActivityTypeColorScale = computed(() => {
      return d3.scaleOrdinal<string, string>()
        .domain(entityTypes.value.map(d => d.activityType))
        .range(CA_CAT_LIST);
  });

  // as for riskStacks
  // a computed function to get entityRegions stacked count values (from, to)
  const entityRegionStacks = computed(() => {
    const stacks: Array<{ regionIsoCode: string; count: number; from: number; to: number }> = [];
    let currentCount = 0; 
    entityRegions.value.forEach((regionObj) => {
      const regionIsoCode = regionObj.regionIsoCode;
      const count = regionObj.count;
      
      stacks.push({ 
        regionIsoCode, 
        count, 
        from: currentCount, 
        to: currentCount + count 
      });
      
      currentCount += count;
    });
    return stacks;
  });

  // a scaleLinear X for entityRegions from 0 to entities.length
  const scaleXEntityRegions = computed(() => {
    const maxCount = d3.max(entityRegionStacks.value, (d) => d.to) || 0;
    return d3.scaleLinear()
      .domain([0, maxCount])
      .range([leftAxis.value, rightAxis.value]);
  });

  // entities grouped by JUST projectsCount 
  const entitiesByProjectsCount = computed(() => {
    const groupMap = new Map<number, string[]>();
    props.entities.forEach((entity) => {
      const projectsCount = entity.projectsCount || 0;
      if (!groupMap.has(projectsCount)) {
        groupMap.set(projectsCount, []);
      }
      groupMap.get(projectsCount)?.push(entity.id);
    });
    return Array.from(groupMap.entries()).map(([projectsCount, entities]) => ({
      projectsCount,
      entities,
      entitiesCount: entities.length
    })).sort((a, b) => b.projectsCount - a.projectsCount);
  });

  // as for entityRegionStacks
  // a computed function to get entities by projectsCount stacks values (from, to)
  const entitiesByProjectsCountStacks = computed(() => {
    const stacks: Array<{ projectsCount: number; count: number; from: number; to: number }> = [];
    let currentCount = 0; 
    entitiesByProjectsCount.value.forEach((group) => {
      const projectsCount = group.projectsCount;
      const count = group.entitiesCount;
      
      stacks.push({ 
        projectsCount, 
        count, 
        from: currentCount, 
        to: currentCount + count 
      });
      
      currentCount += count;
    });
    return stacks;
  });

  // a scaleLinear Y for entities by projectsCount from 0 to entities.length
  const scaleYEntitiesByProjectsCount = computed(() => {
    const maxCount = d3.max(entitiesByProjectsCountStacks.value, (d) => d.to) || 0;
    return d3.scaleLinear()
      .domain([0, maxCount])
      .range([ my.value*4.5, my.value*6 ]);
  });

  const resolveCircleCollisions = (circles: any[], maxIterations = 100) => {
  let moved;
  for (let iter = 0; iter < maxIterations; iter++) {
    moved = false;
    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const a = circles[i];
        const b = circles[j];
        const dx = b.radarX - a.radarX;
        const dy = b.radarY - a.radarY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.radarRadius + b.radarRadius + 2; // add some padding
        if (dist < minDist && dist > 0) {
          // Overlap detected, move each circle away from the other
          const overlap = (minDist - dist) / 2;
          const ox = (dx / dist) * overlap;
          const oy = (dy / dist) * overlap;
          a.radarX -= ox;
          a.radarY -= oy;
          b.radarX += ox;
          b.radarY += oy;
          moved = true;
        }
      }
    }
    if (!moved) break; // Stop if no circles were moved
  }
  return circles;
  };

  // assign stripX and stripY to entities
  // x by entityRegionStacks
  // y by entitiesByProjectsCountStacks
  const entitiesWithStripPositions = computed(() => {
    const circles = props.entities.map((entity) => {

      const regionStack = entityRegionStacks.value.find(s => s.regionIsoCode === (entity as any).related_region_iso_code);

      const projectsCountStack = entitiesByProjectsCountStacks.value.find(s => s.projectsCount === entity.projectsCount);

      let xFrom = scaleXEntityRegions.value(regionStack?.from || 0);
      let xTo = scaleXEntityRegions.value(regionStack?.to || 0);
      let xDelta = xTo - xFrom -8;

      let yFrom = scaleYEntitiesByProjectsCount.value(projectsCountStack?.from || 0);
      let yTo = scaleYEntitiesByProjectsCount.value(projectsCountStack?.to || 0);
      let yDelta = yTo - yFrom;

      return {
        ...entity,

        radarX: xFrom + Math.random () * xDelta,
        radarY: yFrom + Math.random () * yDelta,  
        radarRadius: 2 + (entity.projectsTotalCost/ maxTotalCost.value * 7)
      };
    });
    // return circles;
     return resolveCircleCollisions(circles);
  });








  // UI variables and functions
  const overedProjectIds = ref<string[]>([]);
  const overedRiskLabels = ref<string[]>([]);
  const overedEntitiesIds = ref<string[]>([]);
  const overedIsoCodes = ref<string[]>([]);

  // Tooltip state
  const tooltip = ref({
    visible: false,
    x: 0,
    y: 0,
    title: '',
    subtitle: '',
    value: undefined as number | undefined,
    valueLabel: ''
  });

  const showTooltip = (event: MouseEvent, data: { title: string; subtitle?: string; value?: number; valueLabel?: string }) => {
    tooltip.value = {
      visible: true,
      x: event.clientX + 10,
      y: event.clientY - 10,
      title: data.title,
      subtitle: data.subtitle || '',
      value: data.value,
      valueLabel: data.valueLabel || 'Value'
    };
  };

  const hideTooltip = () => {
    tooltip.value.visible = false;
  };

  const updateTooltipPosition = (event: MouseEvent) => {
    if (tooltip.value.visible) {
      tooltip.value.x = event.clientX + 10;
      tooltip.value.y = event.clientY - 10;
    }
  };

  const overProjects = (prj:string) => {
    overedRiskLabels.value = props.projects.find(p => p.id == prj)?.risks || [];
    overedProjectIds.value = [prj];
    overedEntitiesIds.value = props.entities.filter(e => e.projects?.includes(prj)).map(e => e.id);

    const myPrj = props.projects.find(p => p.id == prj);
    if (myPrj) {
     overedIsoCodes.value = myPrj.countriesIsoArray || [];
     overedEntitiesIds.value = myPrj.entities || [];
    } 

  };

  const outProjects = () => {
    overedRiskLabels.value = [];
    overedProjectIds.value = [];
    overedEntitiesIds.value = [];
    overedIsoCodes.value = [];
  };

  const overRisks = (risk:string) => {
    overedProjectIds.value = props.projects.filter(p => p.risks?.includes(risk)).map(p => p.id);
    overedRiskLabels.value = [risk];

    const myProjects = props.projects.filter(p => p.risks?.includes(risk));
    const isoSet = new Set<string>();

    let entitiesOutput = new Set<string>();

    myProjects.forEach(prj => {
      (prj.countriesIsoArray || []).forEach((iso: string) => isoSet.add(iso));
      (prj.entities || []).forEach((entId: string) => entitiesOutput.add(entId));
    });
    overedIsoCodes.value = Array.from(isoSet);
    overedEntitiesIds.value = Array.from(entitiesOutput);
  };

  const outRisks = () => {
    overedProjectIds.value = [];
    overedRiskLabels.value = [];
    overedEntitiesIds.value = [];
    overedIsoCodes.value = [];
  };

</script>

<style scoped>

</style>