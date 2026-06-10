<template>
  <article class="absolute left-3 top-3 z-10 flex max-h-[calc(100%-24px)] w-[300px] flex-col gap-2 overflow-y-auto">
    <SidePanel
      title="Risks"
      :tot="riskOptions.length"
      :count_active="panelActiveRisks.size"
      :count_selected="selectedRisks.length"
    >
      <template #help>
        <CaHelp title="Risks" :w="260">
          Shows projects tagged with a climate risk. The map highlights entities on those projects.
          Select several risks to include projects with <strong>any</strong> of them (OR).
          Combined with themes, projects, entities, or regions using <strong>AND</strong>.
          Blue bar: matching items. Pink bar: your selections.
        </CaHelp>
      </template>
      <template #content>
        <ul>
          <li
            v-for="risk in riskOptions"
            :key="risk.id"
            class="cursor-pointer border-b border-neutral-lighter py-1 transition-colors duration-200"
            :class="[
              !selectableRisks.has(risk.name) ? 'opacity-40 text-neutral-dark' : 'hover:bg-warm-neutral-100',
              selectedRisks.includes(risk.name) ? 'bg-trust-blue-lightest font-semibold text-trust-blue-darkest' : '',
            ]"
            @click="toggleRisk(risk.name)"
          >
            {{ risk.name }}
          </li>
        </ul>
      </template>
    </SidePanel>

    <SidePanel
      title="Themes"
      :tot="themeOptions.length"
      :count_active="panelActiveThemes.size"
      :count_selected="selectedThemes.length"
    >
      <template #help>
        <CaHelp title="Themes" :w="260">
          Same logic as risks, but for project themes. Multiple themes use OR within this list.
          Narrow further by combining with risks or other filters (AND across filter types).
        </CaHelp>
      </template>
      <template #content>
        <ul>
          <li
            v-for="theme in themeOptions"
            :key="theme.id"
            class="cursor-pointer border-b border-neutral-lighter py-1 transition-colors duration-200"
            :class="[
              !selectableThemes.has(theme.name) ? 'opacity-40 text-neutral-dark' : 'hover:bg-warm-neutral-100',
              selectedThemes.includes(theme.name) ? 'bg-trust-blue-lightest font-semibold text-trust-blue-darkest' : '',
            ]"
            @click="toggleTheme(theme.name)"
          >
            {{ theme.name }}
          </li>
        </ul>
      </template>
    </SidePanel>

    <SidePanel
      title="Projects"
      :tot="projectsWithSimpleEntities.length"
      :count_active="activeProjects.size"
      :count_selected="selectedProjects.length"
    >
      <template #help>
        <CaHelp title="Projects" :w="260">
          Filter directly by project. Selecting multiple projects includes any of them (OR).
          Entities shown are all organisations on the matching projects, not only project leads.
        </CaHelp>
      </template>
      <template #content>
        <UInput
          v-model="projectSearch"
          icon="i-heroicons-magnifying-glass"
          size="sm"
          placeholder="Search projects…"
          class="mb-2"
        />
        <ul v-if="displayedProjects.length">
          <li
            v-for="project in displayedProjects"
            :key="project.id"
            class="cursor-pointer border-b border-neutral-lighter py-1 transition-colors duration-200"
            :class="[
              !selectableProjects.has(project.id) ? 'opacity-40 text-neutral-dark' : 'hover:bg-warm-neutral-100',
              selectedProjects.includes(project.id) ? 'bg-trust-blue-lightest font-semibold text-trust-blue-darkest' : '',
            ]"
            @click="toggleProject(project.id)"
          >
            {{ project.acronym || project.title || project.id }}
          </li>
        </ul>
        <p v-else class="py-2 text-neutral-dark">No matches</p>
      </template>
    </SidePanel>

    <SidePanel
      title="Entities"
      :tot="entitiesWithProjects.length"
      :count_active="activeEntities.size"
      :count_selected="selectedEntities.length"
    >
      <template #help>
        <CaHelp title="Entities" :w="260">
          Selecting an organisation filters via its projects: all entities on those projects stay visible.
          Use map <strong>Entities</strong> mode to hover dots for details or click to select.
        </CaHelp>
      </template>
      <template #content>
        <UInput
          v-model="entitySearch"
          icon="i-heroicons-magnifying-glass"
          size="sm"
          placeholder="Search entities…"
          class="mb-2"
        />
        <ul v-if="displayedEntities.length">
          <li
            v-for="entity in displayedEntities"
            :key="entity.id"
            class="cursor-pointer border-b border-neutral-lighter py-1 transition-colors duration-200"
            :class="[
              !activeEntities.has(entity.id) ? 'opacity-40 text-neutral-dark' : 'hover:bg-warm-neutral-100',
              selectedEntities.includes(entity.id) ? 'bg-trust-blue-lightest font-semibold text-trust-blue-darkest' : '',
            ]"
            @click="toggleEntity(entity.id)"
          >
            {{ entity.short_name || entity.legal_name || entity.id }}
            <p class="text-2xs text-neutral-dark">
              Projects: {{ entity.projectsCount }} | Total Cost: {{ entity.projectsTotalCost }}
            </p>
          </li>
        </ul>
        <p v-else class="py-2 text-neutral-dark">No matches</p>
      </template>
    </SidePanel>
  </article>
</template>

<script setup lang="ts">
import type { AuxClimateRisk, AuxTheme } from "~/types/cordis";
import type { EntityWithProjects, ProjectWithSimpleEntities } from "~/types/connectedCordis";
import { matchesSearch, sortByRelevance } from "~/utils/sortFilterList";

const props = defineProps<{
  riskOptions: AuxClimateRisk[];
  themeOptions: AuxTheme[];
  projectsWithSimpleEntities: ProjectWithSimpleEntities[];
  entitiesWithProjects: EntityWithProjects[];
  activeProjects: Set<string>;
  selectableProjects: Set<string>;
  activeEntities: Set<string>;
  selectableRisks: Set<string>;
  selectableThemes: Set<string>;
  panelActiveRisks: Set<string>;
  panelActiveThemes: Set<string>;
  selectedProjects: string[];
  selectedRisks: string[];
  selectedThemes: string[];
  selectedEntities: string[];
  toggleRisk: (name: string) => void;
  toggleTheme: (name: string) => void;
  toggleProject: (id: string) => void;
  toggleEntity: (id: string) => void;
}>();

const projectSearch = ref("");
const entitySearch = ref("");

const displayedProjects = computed(() => {
  const sorted = sortByRelevance(props.projectsWithSimpleEntities, {
    isActive: (project) => props.selectableProjects.has(project.id),
    isSelected: (project) => props.selectedProjects.includes(project.id),
    label: (project) => project.acronym || project.title || project.id,
  });

  return sorted.filter((project) =>
    matchesSearch(
      projectSearch.value,
      project.acronym,
      project.title,
      project.id
    )
  );
});

const displayedEntities = computed(() => {
  const sorted = sortByRelevance(props.entitiesWithProjects, {
    isActive: (entity) => props.activeEntities.has(entity.id),
    isSelected: (entity) => props.selectedEntities.includes(entity.id),
    label: (entity) => entity.short_name || entity.legal_name || entity.id,
  });

  return sorted.filter((entity) =>
    matchesSearch(
      entitySearch.value,
      entity.short_name,
      entity.legal_name,
      entity.id
    )
  );
});
</script>
