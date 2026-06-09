<template>
  <div ref="el" class="h-full w-full bg-neutral-lightest">
      <svg v-if="isSvgReady" :width="width" :height="height" :viewBox="viewBox">
        <g :transform="`translate(0, ${chartPaddingTop})`">
        <!-- risk lines for each project -->
        <path
          v-for="link in riskLinkPaths"
          :key="link.key"
          :d="link.d"
          fill="none"
          :stroke="isRiskLinkHighlighted(link.projectId, link.risk) ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'"
          :stroke-width="isRiskLinkHighlighted(link.projectId, link.risk) ? '2' : '1'"
          :opacity="isRiskLinkHighlighted(link.projectId, link.risk) ? 1 : 0.2"
        />

        <!-- country ISO lines for each project -->
        <path
          v-for="link in countryLinkPaths"
          :key="link.key"
          :d="link.d"
          fill="none"
          :stroke="isProjectLinkHighlighted(link.projectId) ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'"
          :stroke-width="isProjectLinkHighlighted(link.projectId) ? '1' : '1'"
          :opacity="isProjectLinkHighlighted(link.projectId) ? 0.7 : 0.2"
        />

        <!-- projects: thin vertical line + hollow top dot + solid bottom dot -->
        <g v-for="project in projects" :key="'project-' + project.id">
          <line
            :x1="projectCenterX(project.id)"
            :y1="projectEndY(project)"
            :x2="projectCenterX(project.id)"
            :y2="projectStartY(project)"
            stroke="transparent"
            stroke-width="14"
            class="cursor-pointer"
            @mouseover="(e) => onProjectHover(e, project)"
            @mousemove="updateTooltipPosition"
            @mouseout="onProjectLeave"
            @click="emit('selectProject', project.id)"
          />

          <line
            :x1="projectCenterX(project.id)"
            :y1="projectEndY(project)"
            :x2="projectCenterX(project.id)"
            :y2="projectStartY(project)"
            :stroke="projectStroke(project.id)"
            :stroke-width="hoveredProjectId === project.id ? 2 : 1.5"
            class="pointer-events-none transition-all duration-300"
          />

          <circle
            v-show="hoveredProjectId === project.id"
            :cx="projectCenterX(project.id)"
            :cy="projectEndY(project)"
            :r="projectTopDotR + 4"
            fill="none"
            stroke="#1e63a2"
            stroke-width="1.5"
            class="pointer-events-none transition-opacity duration-300"
          />

          <circle
            :cx="projectCenterX(project.id)"
            :cy="projectEndY(project)"
            :r="projectTopDotR"
            fill="white"
            :stroke="projectStroke(project.id)"
            :stroke-width="hoveredProjectId === project.id ? 2 : 1"
            class="pointer-events-none transition-all duration-300"
          />

          <circle
            :cx="projectCenterX(project.id)"
            :cy="projectStartY(project)"
            :r="projectBottomDotR"
            :fill="projectStroke(project.id)"
            class="pointer-events-none transition-all duration-300"
          />
        </g>

        <!-- years labels on the left of the diagram -->
        <g>
          <text
            v-for="year in yearLabels"
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

        <!-- risks: thin vertical line + hollow top dot + solid bottom dot -->
        <g v-for="stack in riskStacks" :key="'risk-' + stack.riskLabel">
          <line
            :x1="riskCenterX(stack.riskLabel)"
            :y1="riskTopY(stack.count)"
            :x2="riskCenterX(stack.riskLabel)"
            :y2="riskBottomY()"
            stroke="transparent"
            stroke-width="14"
            class="cursor-pointer"
            @mouseover="(e) => onRiskHover(e, stack)"
            @mousemove="updateTooltipPosition"
            @mouseout="onRiskLeave"
          />

          <line
            :x1="riskCenterX(stack.riskLabel)"
            :y1="riskTopY(stack.count)"
            :x2="riskCenterX(stack.riskLabel)"
            :y2="riskBottomY()"
            :stroke="riskStroke(stack.riskLabel)"
            :stroke-width="hoveredRiskLabel === stack.riskLabel ? 2 : 1.5"
            class="pointer-events-none transition-all duration-300"
          />

          <circle
            v-show="hoveredRiskLabel === stack.riskLabel"
            :cx="riskCenterX(stack.riskLabel)"
            :cy="riskTopY(stack.count)"
            :r="projectTopDotR + 4"
            fill="none"
            stroke="#1e63a2"
            stroke-width="1.5"
            class="pointer-events-none transition-opacity duration-300"
          />

          <circle
            :cx="riskCenterX(stack.riskLabel)"
            :cy="riskTopY(stack.count)"
            :r="projectTopDotR"
            fill="white"
            :stroke="riskStroke(stack.riskLabel)"
            :stroke-width="hoveredRiskLabel === stack.riskLabel ? 2 : 1"
            class="pointer-events-none transition-all duration-300"
          />

          <circle
            :cx="riskCenterX(stack.riskLabel)"
            :cy="riskBottomY()"
            :r="projectBottomDotR"
            :fill="riskStroke(stack.riskLabel)"
            class="pointer-events-none transition-all duration-300"
          />

          <text
            :x="riskCenterX(stack.riskLabel)"
            :y="riskLabelY(stack.count, stack.riskLabel)"
            text-anchor="middle"
            class="pointer-events-none font-mono text-[7px] transition-colors duration-300"
            :class="isRiskHighlighted(stack.riskLabel) ? 'fill-gray-900' : 'fill-gray-500'"
          >
            <tspan
              v-for="(line, i) in riskLabelLines(stack.riskLabel)"
              :key="i"
              :x="riskCenterX(stack.riskLabel)"
              :dy="i === 0 ? 0 : 9"
            >
              {{ line }}
            </tspan>
          </text>
        </g>

        <!-- countries ISO small dots and labels -->
        <g>
          <circle
            v-for="country in entityRegionStacks"
            :key="'country-dot-' + country.regionIsoCode"
            :cx="countryCenterX(country)"
            :cy="entityBandTop"
            r="1.5"
            :class="isIsoHighlighted(country.regionIsoCode) ? 'fill-black' : 'fill-gray-300'"
            class="cursor-pointer"
            @mouseover="(e) => onCountryHover(e, country)"
            @mousemove="updateTooltipPosition"
            @mouseout="onCountryLeave"
          />

           <circle
            v-for="country in entityRegionStacks"
            :key="'country-dot-lower-' + country.regionIsoCode"
            :cx="countryCenterX(country)"
            :cy="entityBandBottom"
            r="1.5"
            :class="isIsoHighlighted(country.regionIsoCode) ? 'fill-black' : 'fill-gray-300'"
            class="cursor-pointer"
            @mouseover="(e) => onCountryHover(e, country)"
            @mousemove="updateTooltipPosition"
            @mouseout="onCountryLeave"
          />

          <g v-for="country in entityRegionStacks" :key="'country-label-g-' + country.regionIsoCode">
            <text
              v-if="country.count > 12"
              :x="countryCenterX(country)"
              :y="entityBandBottom"
              class="pointer-events-auto cursor-pointer text-[8px] font-mono transition-colors duration-300"
              :class="isIsoHighlighted(country.regionIsoCode) ? 'fill-gray-900' : 'fill-gray-300'"
              text-anchor="middle"
              dy="1rem"
              @mouseover="(e) => onCountryHover(e, country)"
              @mousemove="updateTooltipPosition"
              @mouseout="onCountryLeave"
            >
            {{ country.regionIsoCode }}
            </text>
          </g>
        </g>

        <!-- entities -->
        <g>
          <circle
            v-for="entity in entitiesWithStripPositions"
            :key="'entity-circle-' + entity.id"
            :cx="entity.radarX"
            :cy="entity.radarY"
            :r="entityDisplayRadius(entity)"
            :fill="organizationActivityTypeColorScale((entity as any).organization_activity_type_name)"
            class="transition-all duration-300 cursor-pointer"
            :class="[entityVisualClass(entity.id), isEntityInFundingRange(entity.id) ? 'cursor-pointer' : 'pointer-events-none']"
            :opacity="entityVisualOpacity(entity.id)"
            @mouseover="(e) => onEntityHover(e, entity)"
            @mousemove="updateTooltipPosition"
            @mouseout="onEntityLeave"
          />
        </g>
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
      <div v-if="tooltip.hint" class="mt-1.5 font-mono text-2xs tracking-[0.08em] text-neutral-dark">
        {{ tooltip.hint }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useElementSize } from '@vueuse/core'
  import { useTemplateRef } from 'vue'
  import * as d3 from "d3";
  import { CA_CAT_LIST } from "~/utils/connectedColors";
  import europeMap from "~/assets/data/europe.json";

  const isoToName = Object.fromEntries(
    europeMap.features.map((f: { properties: { ISO2: string; NAME: string } }) => [
      f.properties.ISO2,
      f.properties.NAME,
    ])
  );

  const el = useTemplateRef('el')
  const { width, height } = useElementSize(el)
  const isSvgReady = computed(() => width.value > 0 && height.value > 0);
  const viewBox = computed(() => `0 0 ${width.value} ${height.value}`);

  const linkVertical = d3.linkVertical();

  const legendReserve = computed(() => Math.max(88, height.value * 0.12));
  const chartPaddingTop = computed(() => Math.max(20, (height.value - legendReserve.value) * 0.05));
  const layoutHeight = computed(() => height.value - legendReserve.value - chartPaddingTop.value);
  const my = computed(() => layoutHeight.value / 8);
  // Cap tallest risk bar so two-line labels fit above the top dot (y grows downward).
  const riskBandTopY = computed(() => {
    const twoLineLabelHeight = 20;
    const gapAboveDot = 6;
    return twoLineLabelHeight + projectTopDotR + gapAboveDot;
  });
  const entityBandTop = computed(() => my.value * 4.25);
  const entityBandBottom = computed(() => my.value * 6.75);
  const chartPaddingX = computed(() => 56);
  const leftAxis = computed(() => chartPaddingX.value);
  const rightAxis = computed(() => width.value - chartPaddingX.value);

  const props = withDefaults(
    defineProps<{
      projects: any[];
      risks: any[];
      entities: any[];
      entityFundingMin?: number;
      entityFundingMax?: number;
    }>(),
    {
      entityFundingMin: 0,
      entityFundingMax: Number.POSITIVE_INFINITY,
    }
  );

  const emit = defineEmits<{
    selectProject: [id: string];
  }>();

  const minStartYear = computed(() => {
    return d3.min(props.projects, (d: any) => d.start_year) || new Date().getFullYear();
  });
  const maxEndYear = computed(() => {
    return d3.max(props.projects, (d: any) => d.end_year) || new Date().getFullYear();
  });
  const maxEntityTotalCost = computed(() => {
    return d3.max(props.entities, (d: any) => d.projectsTotalCost) || 1;
  });

  const entityFundingRadiusScale = computed(() => {
    return d3.scaleSqrt()
      .domain([0, maxEntityTotalCost.value])
      .range([2.5, 10.5]);
  });

  const yearLabels = computed(() => {
    const len = maxEndYear.value - minStartYear.value + 1;
    return Array.from({ length: len }, (_, i) => minStartYear.value + i);
  });

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

  const projectTopDotR = 4;
  const projectBottomDotR = 2;

  function projectCenterX(projectId: string) {
    return (scaleX.value(projectId) ?? 0) + scaleX.value.bandwidth() / 2;
  }

  function projectEndY(project: { end_year?: number | null }) {
    return scaleY.value(project.end_year ?? 0);
  }

  function projectStartY(project: { start_year?: number | null }) {
    return scaleY.value(project.start_year ?? 0);
  }

  function projectStroke(projectId: string) {
    return isProjectHighlighted(projectId) ? '#1E63A2' : '#9ca3af';
  }

  function riskCenterX(riskLabel: string) {
    return (scaleXRisksNew.value(riskLabel) ?? 0) + scaleXRisksNew.value.bandwidth() / 2;
  }

  function riskTopY(count: number) {
    return scaleYRisks.value(count);
  }

  function riskBottomY() {
    return scaleYRisks.value(0);
  }

  function riskStroke(riskLabel: string) {
    return isRiskHighlighted(riskLabel) ? '#1E63A2' : '#9ca3af';
  }

  function riskLabelLines(label: string): string[] {
    const words = label.trim().split(/\s+/);
    if (words.length <= 2) return [label];
    return [words.slice(0, 2).join(' '), words.slice(2).join(' ')];
  }

  function riskLabelY(count: number, label: string) {
    const base = riskTopY(count) - projectTopDotR - 6;
    return riskLabelLines(label).length > 1 ? base - 9 : base;
  }

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

  const scaleXRisksNew = computed(() => {
    return d3.scaleBand()
      .domain(riskStacks.value.map(d => d.riskLabel))
      .range([leftAxis.value, rightAxis.value])
      .padding(0.1);
  });

  const scaleYRisks = computed(() => {
    const maxCount = d3.max(riskStacks.value, (d) => d.count) || 0;
    return d3.scaleLinear()
      .domain([0, maxCount])
      .range([my.value, riskBandTopY.value]);
  });

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

  const organizationActivityTypeColorScale = computed(() => {
    return d3.scaleOrdinal<string, string>()
      .domain(entityTypes.value.map(d => d.activityType))
      .range(CA_CAT_LIST);
  });

  const entityRegionStacks = computed(() => {
    const stacks: Array<{ regionIsoCode: string; count: number; from: number; to: number }> = [];
    let currentCount = 0;
    entityRegions.value.forEach((regionObj) => {
      stacks.push({
        regionIsoCode: regionObj.regionIsoCode,
        count: regionObj.count,
        from: currentCount,
        to: currentCount + regionObj.count
      });
      currentCount += regionObj.count;
    });
    return stacks;
  });

  const regionStackByIso = computed(() => {
    const map = new Map<string, { regionIsoCode: string; count: number; from: number; to: number }>();
    entityRegionStacks.value.forEach((stack) => map.set(stack.regionIsoCode, stack));
    return map;
  });

  const scaleXEntityRegions = computed(() => {
    const maxCount = d3.max(entityRegionStacks.value, (d) => d.to) || 0;
    return d3.scaleLinear()
      .domain([0, maxCount])
      .range([leftAxis.value, rightAxis.value]);
  });

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

  const entitiesByProjectsCountStacks = computed(() => {
    const stacks: Array<{ projectsCount: number; count: number; from: number; to: number }> = [];
    let currentCount = 0;
    entitiesByProjectsCount.value.forEach((group) => {
      stacks.push({
        projectsCount: group.projectsCount,
        count: group.entitiesCount,
        from: currentCount,
        to: currentCount + group.entitiesCount
      });
      currentCount += group.entitiesCount;
    });
    return stacks;
  });

  const scaleYEntitiesByProjectsCount = computed(() => {
    const maxCount = d3.max(entitiesByProjectsCountStacks.value, (d) => d.to) || 0;
    return d3.scaleLinear()
      .domain([0, maxCount])
      .range([my.value * 4.5, my.value * 6.5]);
  });

  // Stable random jitter per entity — matches the old Math.random scatter without
  // re-shuffling on every resize/hover recompute.
  const entityJitterById = shallowRef(new Map<string, { jx: number; jy: number }>());

  watch(
    () => props.entities.map((e) => e.id).join(','),
    () => {
      const map = new Map<string, { jx: number; jy: number }>();
      props.entities.forEach((entity) => {
        map.set(entity.id, { jx: Math.random(), jy: Math.random() });
      });
      entityJitterById.value = map;
    },
    { immediate: true }
  );

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
          const minDist = a.radarRadius + b.radarRadius + 2;
          if (dist < minDist && dist > 0) {
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
      if (!moved) break;
    }
    return circles;
  };

  const entitiesWithStripPositions = computed(() => {
    const sxRegions = scaleXEntityRegions.value;
    const syProjectsCount = scaleYEntitiesByProjectsCount.value;
    const radiusScale = entityFundingRadiusScale.value;
    const jitterMap = entityJitterById.value;

    const circles = props.entities.map((entity) => {
      const regionStack = entityRegionStacks.value.find(
        (s) => s.regionIsoCode === (entity as any).related_region_iso_code
      );
      const projectsCountStack = entitiesByProjectsCountStacks.value.find(
        (s) => s.projectsCount === entity.projectsCount
      );

      const xFrom = sxRegions(regionStack?.from || 0);
      const xTo = sxRegions(regionStack?.to || 0);
      const xDelta = xTo - xFrom - 8;

      const yFrom = syProjectsCount(projectsCountStack?.from || 0);
      const yTo = syProjectsCount(projectsCountStack?.to || 0);
      const yDelta = yTo - yFrom;

      const jitter = jitterMap.get(entity.id) ?? { jx: 0.5, jy: 0.5 };

      return {
        ...entity,
        radarX: xFrom + jitter.jx * xDelta,
        radarY: yFrom + jitter.jy * yDelta,
        radarRadius: radiusScale(entity.projectsTotalCost ?? 0)
      };
    });

    return resolveCircleCollisions(circles);
  });

  const riskLinkPaths = computed(() => {
    if (!isSvgReady.value) return [];

    const sx = scaleX.value;
    const srx = scaleXRisksNew.value;
    const paths: Array<{ key: string; projectId: string; risk: string; d: string }> = [];

    const sy = scaleY.value;
    props.projects.forEach((project) => {
      const sourceX = (sx(project.id) ?? 0) + sx.bandwidth() / 2;
      const sourceY = sy(project.end_year ?? 0);
      (project.risks || []).forEach((risk: string) => {
        const targetX = (srx(risk) ?? 0) + srx.bandwidth() / 2;
        paths.push({
          key: `${project.id}-${risk}`,
          projectId: project.id,
          risk,
          d: linkVertical({
            source: [sourceX, sourceY],
            target: [targetX, riskBottomY()]
          }) || ''
        });
      });
    });

    return paths;
  });

  const countryLinkPaths = computed(() => {
    if (!isSvgReady.value) return [];

    const sx = scaleX.value;
    const sxRegions = scaleXEntityRegions.value;
    const sy = scaleY.value;
    const paths: Array<{ key: string; projectId: string; d: string }> = [];

    props.projects.forEach((project) => {
      const sourceX = (sx(project.id) ?? 0) + sx.bandwidth() / 2;
      const sourceY = sy(project.start_year ?? 0);
      (project.countriesIsoArray || []).forEach((countryIso: string) => {
        const stack = regionStackByIso.value.get(countryIso);
        const from = stack?.from || 0;
        const to = stack?.to || 0;
        const targetX = sxRegions(from) + (sxRegions(to) - sxRegions(from)) / 2;
        paths.push({
          key: `${project.id}-${countryIso}`,
          projectId: project.id,
          d: linkVertical({
            source: [sourceX, sourceY],
            target: [targetX, entityBandTop.value]
          }) || ''
        });
      });
    });

    return paths;
  });

  function countryCenterX(country: { from: number; to: number }) {
    const sx = scaleXEntityRegions.value;
    return sx(country.from) + (sx(country.to) - sx(country.from)) / 2;
  }

  const entityIdsByCountry = computed(() => {
    const map = new Map<string, string[]>();
    props.entities.forEach((entity) => {
      const iso = (entity as any).related_region_iso_code as string | undefined;
      if (!iso) return;
      if (!map.has(iso)) map.set(iso, []);
      map.get(iso)!.push(entity.id);
    });
    return map;
  });

  const countryNameByIso = computed(() => {
    const map = new Map<string, string>();
    props.entities.forEach((entity) => {
      const iso = (entity as any).related_region_iso_code as string | undefined;
      const name = (entity as any).address_country as string | undefined;
      if (iso && name && !map.has(iso)) map.set(iso, name);
    });
    return map;
  });

  function countryFullName(iso: string) {
    return isoToName[iso] || countryNameByIso.value.get(iso) || iso;
  }

  const hoveredProjectId = ref<string | null>(null);
  const hoveredRiskLabel = ref<string | null>(null);
  const hoveredEntityId = ref<string | null>(null);
  const overedProjectIds = ref<Set<string>>(new Set());
  const overedRiskLabels = ref<Set<string>>(new Set());
  const overedEntitiesIds = ref<Set<string>>(new Set());
  const overedIsoCodes = ref<Set<string>>(new Set());

  const noProjectHighlight = computed(() => overedProjectIds.value.size === 0);
  const noRiskHighlight = computed(() => overedRiskLabels.value.size === 0);
  const noEntityHighlight = computed(() => overedEntitiesIds.value.size === 0);
  const noIsoHighlight = computed(() => overedIsoCodes.value.size === 0);

  const isProjectHighlighted = (id: string) => noProjectHighlight.value || overedProjectIds.value.has(id);
  const isProjectLinkHighlighted = (id: string) =>
    !noProjectHighlight.value && overedProjectIds.value.has(id);
  const isRiskHighlighted = (risk: string) => noRiskHighlight.value || overedRiskLabels.value.has(risk);
  const isRiskLinkHighlighted = (projectId: string, risk: string) =>
    !noRiskHighlight.value
    && !noProjectHighlight.value
    && overedRiskLabels.value.has(risk)
    && overedProjectIds.value.has(projectId);
  const isIsoHighlighted = (iso: string) => noIsoHighlight.value || overedIsoCodes.value.has(iso);
  const isEntityHighlighted = (id: string) => noEntityHighlight.value || overedEntitiesIds.value.has(id);

  const entityFundingById = computed(() => {
    const map = new Map<string, number>();
    props.entities.forEach((entity) => {
      map.set(entity.id, entity.projectsTotalCost ?? 0);
    });
    return map;
  });

  const isEntityInFundingRange = (id: string) => {
    const cost = entityFundingById.value.get(id) ?? 0;
    return cost >= props.entityFundingMin && cost <= props.entityFundingMax;
  };

  const entityDisplayRadius = (entity: { id: string; radarRadius: number }) => {
    if (hoveredEntityId.value === entity.id) return entity.radarRadius * 1.8;
    if (!noEntityHighlight.value && overedEntitiesIds.value.has(entity.id)) return entity.radarRadius * 2.0;
    return entity.radarRadius;
  };

  const entityVisualOpacity = (id: string) => {
    if (!isEntityInFundingRange(id)) return 0.08;
    if (hoveredEntityId.value) {
      return hoveredEntityId.value === id ? 1 : 0.1;
    }
    if (!noEntityHighlight.value) {
      return overedEntitiesIds.value.has(id) ? 1 : 0.1;
    }
    return 1;
  };

  const entityVisualClass = (id: string) => {
    if (!isEntityInFundingRange(id)) return 'grayscale-100';
    const active = hoveredEntityId.value
      ? hoveredEntityId.value === id
      : isEntityHighlighted(id);
    return active ? 'grayscale-0' : 'grayscale-100';
  };

  const tooltip = ref({
    visible: false,
    x: 0,
    y: 0,
    title: '',
    subtitle: '',
    value: undefined as number | undefined,
    valueLabel: '',
    hint: '' as string | undefined
  });

  const showTooltip = (event: MouseEvent, data: { title: string; subtitle?: string; value?: number; valueLabel?: string; hint?: string }) => {
    tooltip.value = {
      visible: true,
      x: event.clientX + 10,
      y: event.clientY - 10,
      title: data.title,
      subtitle: data.subtitle || '',
      value: data.value,
      valueLabel: data.valueLabel || 'Value',
      hint: data.hint
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

  const onRiskHover = (
    event: MouseEvent,
    stack: { riskLabel: string; count: number }
  ) => {
    hoveredEntityId.value = null;
    hoveredProjectId.value = null;
    hoveredRiskLabel.value = stack.riskLabel;
    overRisks(stack.riskLabel);
    showTooltip(event, {
      title: stack.riskLabel,
      value: stack.count,
      valueLabel: 'Projects',
    });
  };

  const onRiskLeave = () => {
    outRisks();
    hideTooltip();
  };

  const onProjectHover = (event: MouseEvent, project: any) => {
    hoveredEntityId.value = null;
    hoveredRiskLabel.value = null;
    hoveredProjectId.value = project.id;
    overProjects(project.id);
    showTooltip(event, {
      title: project.acronym || project.title || project.id,
      subtitle: `${project.start_year || '?'} - ${project.end_year || '?'}`,
      value: project.total_cost,
      valueLabel: 'Total Cost',
      hint: 'Click for details'
    });
  };

  const onProjectLeave = () => {
    hoveredProjectId.value = null;
    outProjects();
    hideTooltip();
  };

  const onEntityHover = (event: MouseEvent, entity: any) => {
    if (!isEntityInFundingRange(entity.id)) return;
    hoveredProjectId.value = null;
    hoveredRiskLabel.value = null;
    hoveredEntityId.value = entity.id;
    overEntity(entity);
    showTooltip(event, {
      title: entity.short_name || entity.legal_name || entity.id,
      subtitle: entity.organization_activity_type_name,
      value: entity.projectsTotalCost,
      valueLabel: 'Total Cost'
    });
  };

  const onEntityLeave = () => {
    hoveredEntityId.value = null;
    outEntity();
    hideTooltip();
  };

  const overEntity = (entity: any) => {
    const projectIds = (entity.projects || []).map((p: { id: string }) => p.id);
    overedProjectIds.value = new Set(projectIds);
    overedEntitiesIds.value = new Set([entity.id]);

    const riskSet = new Set<string>();
    const isoSet = new Set<string>();
    if (entity.related_region_iso_code) {
      isoSet.add(entity.related_region_iso_code);
    }
    projectIds.forEach((pid: string) => {
      const prj = props.projects.find((p) => p.id === pid);
      if (!prj) return;
      (prj.risks || []).forEach((risk: string) => riskSet.add(risk));
      (prj.countriesIsoArray || []).forEach((iso: string) => isoSet.add(iso));
    });
    overedRiskLabels.value = riskSet;
    overedIsoCodes.value = isoSet;
  };

  const outEntity = () => {
    overedProjectIds.value = new Set();
    overedRiskLabels.value = new Set();
    overedEntitiesIds.value = new Set();
    overedIsoCodes.value = new Set();
  };

  const onCountryHover = (
    event: MouseEvent,
    country: { regionIsoCode: string; count: number }
  ) => {
    hoveredEntityId.value = null;
    hoveredProjectId.value = null;
    hoveredRiskLabel.value = null;
    const iso = country.regionIsoCode;
    overedIsoCodes.value = new Set([iso]);
    overedEntitiesIds.value = new Set(entityIdsByCountry.value.get(iso) || []);
    overedProjectIds.value = new Set();
    overedRiskLabels.value = new Set();
    showTooltip(event, {
      title: countryFullName(iso),
      subtitle: iso,
      value: country.count,
      valueLabel: 'Entities',
    });
  };

  const onCountryLeave = () => {
    overedIsoCodes.value = new Set();
    overedEntitiesIds.value = new Set();
    hideTooltip();
  };

  const overProjects = (prj: string) => {
    const myPrj = props.projects.find(p => p.id === prj);
    overedRiskLabels.value = new Set(myPrj?.risks || []);
    overedProjectIds.value = new Set([prj]);
    overedEntitiesIds.value = new Set(myPrj?.entities || []);
    overedIsoCodes.value = new Set(myPrj?.countriesIsoArray || []);
  };

  const outProjects = () => {
    overedRiskLabels.value = new Set();
    overedProjectIds.value = new Set();
    overedEntitiesIds.value = new Set();
    overedIsoCodes.value = new Set();
  };

  const overRisks = (risk: string) => {
    hoveredEntityId.value = null;
    hoveredProjectId.value = null;
    const myProjects = props.projects.filter(p => p.risks?.includes(risk));
    overedProjectIds.value = new Set(myProjects.map(p => p.id));
    overedRiskLabels.value = new Set([risk]);

    const isoSet = new Set<string>();
    const entitiesOutput = new Set<string>();
    myProjects.forEach(prj => {
      (prj.countriesIsoArray || []).forEach((iso: string) => isoSet.add(iso));
      (prj.entities || []).forEach((entId: string) => entitiesOutput.add(entId));
    });
    overedIsoCodes.value = isoSet;
    overedEntitiesIds.value = entitiesOutput;
  };

  const outRisks = () => {
    hoveredRiskLabel.value = null;
    overedProjectIds.value = new Set();
    overedRiskLabels.value = new Set();
    overedEntitiesIds.value = new Set();
    overedIsoCodes.value = new Set();
  };

</script>

<style scoped>

</style>
