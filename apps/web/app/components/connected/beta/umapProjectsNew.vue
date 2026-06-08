<template>
  <div ref="el" class="h-full w-full bg-neutral-lightest">
    <svg :width="width" :height="height" :viewBox="viewBox">
      <rect width="100%" height="100%" class="fill-neutral-lightest"/>

      <!-- shadows -->
      <rect
        v-for="(project, index) in umapVisualVariables" :key="index"
        :x="project.r*-1"
        :y="0"
        :width="project.r * 2"
        :height="(project.r * 2) + (Math.abs(scaleZ(project.entitiesCount) ) )"
        class="fill-gray-300 pointer-events-none"
        :rx="project.r"
        :transform="'translate(' + (project.x ) + ',' + (project.y + (scaleZ(project.entitiesCount) ) ) + ') rotate(-30)'"
      />

      <!-- half shadows-->
       <rect
        v-for="(project, index) in umapVisualVariables" :key="index"
        :x="project.r*-1"
        :y="0"
        :width="project.r * 2"
        :height="project.r"
        class="fill-gray-300 pointer-events-none"
       
        :transform="'translate(' + (project.x ) + ',' + (project.y + (scaleZ(project.entitiesCount)) ) + ') rotate(-30)'"
      />

      <!-- risk circles -->
      <circle
        v-for="(risk, i) in circlesArray"
        :key="i"
        :cx="risk.x"
        :cy="risk.y"
        :r="risk.r" 
        stroke-width="2" stroke-dasharray="4 4" 
        class="fill-transparent hover:fill-trust-blue-light/30 transition-all duration-300 stroke-neutral-dark cursor-pointer"
        @mouseover="(e) => { overRisk(risk.label); showTooltip(e, { title: risk.label, value: risk.count, valueLabel: 'Projects' }) }"
        @mousemove="updateTooltipPosition"
        @mouseout="() => { outRisk(); hideTooltip() }"
      />

      <!-- projects cylinders -->
       <g>

         

        <!-- rounded rects connecting top and base circles -->
        <rect
          v-for="(project, index) in umapVisualVariables" :key="index"
          :x="project.x - project.r"
          :y="project.y - project.r"
          :width="project.r * 2"
          :height="Math.abs(scaleZ(project.entitiesCount)) + project.r * 2"
          :rx="project.r"
          :class="(activeProjectsArray.includes(project.id) || !activeProjectsArray.length) ? 'fill-[#1E63A2]' : 'fill-gray-500'"
          class="transition-colors duration-300 cursor-pointer"
          @mouseover="(e) => showTooltip(e, getProjectTooltipData(project))"
          @mousemove="updateTooltipPosition"
          @mouseout="hideTooltip"
        />
         

        <!-- base circles -->
        <circle
          v-for="(project, index) in umapVisualVariables" :key="'circle-' + index"
          :cx="project.x"
          :cy="project.y"
          :r="project.r"
          :stroke="'black'"
          :stroke-width="'2'"
          :class="(activeProjectsArray.includes(project.id) || !activeProjectsArray.length) ? 'fill-white' : 'fill-gray-400'"
          class="transition-colors duration-300 cursor-pointer"
          @mouseover="(e) => showTooltip(e, getProjectTooltipData(project))"
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
      <div v-if="tooltip.value2 !== undefined" class="mt-1">
        <span class="font-medium">{{ tooltip.value2Label }}: {{ typeof tooltip.value2 === 'number' ? tooltip.value2.toLocaleString() : tooltip.value2 }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useElementSize } from '@vueuse/core'
  import { useTemplateRef } from 'vue'
  import * as d3 from "d3";
  import { UMAP } from 'umap-js';
  import smallestEnclosingCircle from 'smallest-enclosing-circle'

  const el = useTemplateRef('el')
  const { width, height } = useElementSize(el)
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
      .fill-white { fill: #ffffff; }
      .fill-black { fill: #000000; }
      .fill-transparent { fill: transparent; }
      .stroke-gray-200 { stroke: #e5e7eb; }
      .stroke-black { stroke: #000000; }
      .pointer-events-none { pointer-events: none; }
      .transition-colors { transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out; }
      .transition-all { transition: all 0.15s ease-in-out; }
      .duration-300 { transition-duration: 0.3s; }
      .hover\\:fill-gray-400\\/50:hover { fill: rgba(156, 163, 175, 0.5); }
      .fill-\\[\\#1E63A2\\] { fill: #1E63A2; }
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
    link.download = `umap-projects-${new Date().toISOString().slice(0, 10)}.svg`;
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


  // props
  const props = withDefaults(defineProps<{
    projects: Array<any>
    years?: Array<number>
    riskCircles?: Array<any>
    themeCircles?: Array<any>
  }>(), {
    years: () => [2020, 2021, 2022, 2023, 2024, 2025],
    riskCircles: () => [],
    themeCircles: () => []
  });

  // watch props.projects
  watch(() => props.projects, (newProjects: Array<any>) => {
    if (newProjects && newProjects.length > 0) {
      updateUmap(newProjects);
    }
  });

   // get max totalCost value
  const maxTotalCost = computed(() => {
    return Math.max(
      // ...(props.projects ?? []).map((project: any) => project.totalCost ?? 0)
      ...(props.projects ?? []).map((project: any) => project.totalCost ?? 0)
    );
  });

  // max total relative cost: max of project.totalCost / project.duration
  const maxTotalRelativeCost = computed(() => {
    return Math.max(
      ...(props.projects ?? []).map((project: any) => {
        if (project.duration && project.duration > 0) {
          return project.totalCost / project.duration;
        } else {
          return 0;
        }
      })
    );
  });

  const radiusScale = computed(() => {
    return d3.scaleSqrt()
      .domain([0, maxTotalRelativeCost.value])
      .range([0, 48]); // min and max radius
  });

  // normalize function for UMAP  
  const normalizeV = (vec: number[]) => {
    const norm = Math.sqrt(vec.reduce((sum, x) => sum + x * x, 0));
    return vec.map(x => x / norm);
  };

  // a reactive variable to hold visual variables from UMAP
  const umapVisualVariables = ref<any>(null);
  const umapPadding = computed(() => height.value * 0.333);

  // scale X and Y to fit in SVG
  const scaleX = computed(() => {
    if (!umapVisualVariables.value) return d3.scaleLinear().domain([-10, 10]).range([0, width.value]);
    const extent = d3.extent(umapVisualVariables.value, (d: any) => d.umapX as number);
    const domain = extent[0] !== undefined && extent[1] !== undefined ? extent : [-10, 10];
    return d3.scaleLinear().domain(domain).range([umapPadding.value, width.value - umapPadding.value]);
  });

  const scaleY = computed(() => {
    if (!umapVisualVariables.value) return d3.scaleLinear().domain([-10, 10]).range([umapPadding.value, height.value - umapPadding.value]);
    const extent = d3.extent(umapVisualVariables.value, (d: any) => d.umapY as number);
    const domain = extent[0] !== undefined && extent[1] !== undefined ? extent : [-10, 10];
    return d3.scaleLinear().domain(domain).range([umapPadding.value, height.value - umapPadding.value]);
  });

  // get maxvalue from entitiesCount in projects
  const maxEntitiesCount = computed(() => {
    return Math.max(
      ...(props.projects ?? []).map((project: any) => project.entitiesCount ?? 0)
    );
  });

  // create a linear scale as scaleZ from 0 to maxEntitiesCount to range 4 to 32
  const scaleZ = computed(() => {
    return d3.scaleLinear()
      .domain([0, maxEntitiesCount.value])
      .range([0, 64]);
  });

  // fix circles collisions
  const resolveCircleCollisions = (circles: any[], maxIterations = 100) => {
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
        const minDist = a.r + b.r +16; // add some padding
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
  }

  const updateUmap = (newProjects: Array<any>) => {
    // logic to update UMAP visualization
    umapVisualVariables.value  = newProjects;

    const umapDimensions = umapVisualVariables.value.map((d: any) => d.umapDimensions); 
    const normalizedData = umapDimensions.map((vec: number[]) => normalizeV(vec));
    // console.log("Normalized Data:", normalizedData);

    // 01: configure UMAP
    const umap = new UMAP({
      nComponents: 2,          // Project to 2D
      nNeighbors: 3,           // Adjust based on data size
      minDist: 0.1,            // Controls clustering 0.1
      // metric: 'cosine',        // Use cosine distance (angular)
    });

    // Step 3: Fit UMAP and transform data
    // const embedding = umap.fit(normalizedData);

    // step by step fitting
    const nEpochs = umap.initializeFit(normalizedData);
    for (let i = 0; i < nEpochs; i++) { umap.step();}
    const embedding = umap.getEmbedding();

    embedding.forEach((point, index) => {
      // Assign the UMAP coordinates back to the original data
      umapVisualVariables.value[index].umapX = point[0];
      umapVisualVariables.value[index].umapY = point[1];
    });
    
    umapVisualVariables.value.forEach((d:any, i:number) => {
      d.x = scaleX.value(d.umapX);
      d.y = scaleY.value(d.umapY);
      d.r = radiusScale.value((d.totalCost ?? 0) / (d.duration ?? 1));

      d.startYear = d.startDate ? new Date(d.startDate).getFullYear() : 0;
      d.endYear = d.endDate ? new Date(d.endDate).getFullYear() : 0;
    });

    // circle collisions
     umapVisualVariables.value = resolveCircleCollisions(umapVisualVariables.value);

     // sort by y descending
     umapVisualVariables.value.sort((a: any, b: any) => a.y - b.y);

  };

  // circles
  //  the array of circles objects as reactive variable
  const circlesArray = ref<Array<any>>([]);

  const updateRiskCircles = (newCircles: Array<any>) => {

    // loop newCircles labels
    // add a "count" property to each circle based on how many projects have that risk

    newCircles.forEach((circle) => {
      const prjArray = umapVisualVariables.value.filter((project: any) => 
        project.risks && project.risks.includes(circle.label)
      ).map((p: any) => p.id);

      circle.projects = prjArray;
      // for each project in prjArray
      // get its x,y from umapVisualVariables
      // add to each circle a "projectsLocs
      // formatted as array of objects { x: number, y: number}
      circle.projectsLocs = prjArray.map((prjId: string) => {
        const prj = umapVisualVariables.value.find((p: any) => p.id === prjId);
        return { x: prj.x,  y: prj.y };
      });

      circle.count = prjArray.length;
    });

   
    // filter by count > 0
    const filteredCircles = newCircles.filter(circle => circle.count > 0);  
    // loop filteredCircles 
    // for each circle, compute the smallest enclosing circle of its projectsLocs
    filteredCircles.forEach((circle) => {
      if (circle.projectsLocs && circle.projectsLocs.length > 0) {
        const sec = smallestEnclosingCircle(circle.projectsLocs);
        circle.x = sec.x;
        circle.y = sec.y;
        circle.r = sec.r + 16; // add some padding
      }
    });

    circlesArray.value = filteredCircles.sort((a, b) => b.r - a.r);
  };

  // a new function similar to updateRiskCircles but for themes
  const updateThemeCircles = (newCircles: Array<any>) => {  
    // loop newCircles labels
    // add a "count" property to each circle based on how many projects have that theme

    newCircles.forEach((circle) => {
      const prjArray = umapVisualVariables.value.filter((project: any) => 
        project.themes && project.themes.includes(circle.label)
      ).map((p: any) => p.id);

      circle.projects = prjArray;
      // for each project in prjArray
      // get its x,y from umapVisualVariables
      // add to each circle a "projectsLocs
      // formatted as array of objects { x: number, y: number}
      circle.projectsLocs = prjArray.map((prjId: string) => {
        const prj = umapVisualVariables.value.find((p: any) => p.id === prjId);
        return { x: prj.x,  y: prj.y };
      });

      circle.count = prjArray.length;
    });


    // filter by count > 0
    const filteredCircles = newCircles.filter(circle => circle.count > 0);  
    // loop filteredCircles 
    // for each circle, compute the smallest enclosing circle of its projectsLocs
    filteredCircles.forEach((circle) => {
      if (circle.projectsLocs && circle.projectsLocs.length > 0) {
        const sec = smallestEnclosingCircle(circle.projectsLocs);
        circle.x = sec.x;
        circle.y = sec.y;
        circle.r = sec.r + 16; // add some padding
      }
    });
    
    // sort filteredCircle by radius 
    filteredCircles.sort((a, b) => a.r - b.r);

    circlesArray.value = filteredCircles;
  };

  // UI variables
  const overedRisk = ref<string>('');
  const activeProjectsArray = ref<string[]>([]);

  // Tooltip state
  const tooltip = ref({
    visible: false,
    x: 0,
    y: 0,
    title: '',
    subtitle: '',
    value: undefined as number | undefined,
    valueLabel: '',
    value2: undefined as number | undefined,
    value2Label: ''
  });

  const showTooltip = (event: MouseEvent, data: { title: string; subtitle?: string; value?: number; valueLabel?: string; value2?: number; value2Label?: string }) => {
    tooltip.value = {
      visible: true,
      x: event.clientX + 10,
      y: event.clientY - 10,
      title: data.title,
      subtitle: data.subtitle || '',
      value: data.value,
      valueLabel: data.valueLabel || 'Value',
      value2: data.value2,
      value2Label: data.value2Label || ''
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

  const getProjectTooltipData = (project: any) => {
    const startYear = project.startDate ? new Date(project.startDate).getFullYear() : null;
    const endYear = project.endDate ? new Date(project.endDate).getFullYear() : null;
    const dateRange = startYear && endYear ? `${startYear} - ${endYear}` : startYear ? `${startYear}` : endYear ? `${endYear}` : '';
    
    return {
      title: project.label || project.title || project.acronym || project.id,
      subtitle: dateRange || undefined,
      value: project.totalCost,
      valueLabel: 'Total Cost',
      value2: project.entitiesCount,
      value2Label: 'Entities'
    };
  };

  const overRisk = (riskLabel: string) => {
    overedRisk.value = riskLabel;
    const circle = circlesArray.value.find(c => c.label === riskLabel);
    if (circle) {
      activeProjectsArray.value = circle.projects;
    }
    // console.log('Over risk:', riskLabel, 'Active projects:', activeProjectsArray.value);
  };

  const outRisk = () => {
    overedRisk.value = '';
    activeProjectsArray.value = [];
  };

  onMounted(() => {
    // Add keyboard event listener for SVG export (press "S")
    window.addEventListener('keydown', handleKeydown);

    updateUmap(props.projects);
    updateRiskCircles(props.riskCircles);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
</script>

<style>

</style>