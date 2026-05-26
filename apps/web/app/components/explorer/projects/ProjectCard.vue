<template>
  <article
    class="group relative cursor-pointer border border-neutral-darkest bg-neutral-white transition-shadow duration-200 hover:shadow-md"
    :class="{
      'ring-2 ring-primary-600 ring-offset-2 ring-offset-neutral-lightest':
        isCurrent,
    }"
    @click="onCardClick"
  >
    <UBadge
      v-if="isCurrent"
      class="pointer-events-none absolute -right-2 -top-2 rounded-none border-0 font-mono uppercase tracking-[0.12em]"
      color="primary"
      variant="solid"
      size="sm"
    >
      Current
    </UBadge>

    <div class="p-6">
      <div class="mb-4 flex items-start justify-between gap-2">
        <h3
          class="min-w-0 flex-1 font-display text-lg font-bold text-neutral-darkest truncate"
          :title="project.name"
        >
          {{ project.name }}
        </h3>
        <div data-project-card-menu @click.stop>
          <UDropdownMenu :items="menuItems" :ui="{ content: 'w-48' }">
            <UButton
              variant="ghost"
              color="neutral"
              size="sm"
              icon="i-heroicons-ellipsis-vertical"
              class="opacity-0 transition-opacity group-hover:opacity-100"
            />
          </UDropdownMenu>
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex items-center text-neutral-dark">
          <UIcon name="mdi:pin" class="mr-2 size-4 shrink-0 text-primary-600" />
          <span class="font-mono text-xs font-medium tracking-wide">
            {{ pinCount }}
            {{ pinCount === 1 ? "pin" : "pins" }}
          </span>
        </div>
        <div class="flex items-center text-neutral-dark">
          <UIcon
            name="i-heroicons-calendar"
            class="mr-2 size-4 shrink-0 text-neutral-dark"
          />
          <span class="font-mono text-2xs tracking-wide">
            Created {{ formatExplorerRelativeDate(project.created_at) }}
          </span>
        </div>
        <div class="flex items-center text-neutral-dark">
          <UIcon
            name="i-heroicons-clock"
            class="mr-2 size-4 shrink-0 text-neutral-dark"
          />
          <span class="font-mono text-2xs tracking-wide">
            Updated {{ formatExplorerRelativeDate(project.updated_at) }}
          </span>
        </div>
      </div>

      <div class="mt-4 border-t border-neutral-lighter pt-4">
        <UButton
          variant="outline"
          color="primary"
          size="sm"
          icon="i-heroicons-arrow-right"
          class="min-h-9 w-full justify-center font-mono text-2xs uppercase tracking-widest"
          @click.stop="goToExplorer"
        >
          {{ isCurrent ? $t('projects.card.goToExplorerCurrent') : $t('projects.card.goToExplorer') }}
        </UButton>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Project } from "~/types/projects";
import { formatExplorerRelativeDate } from "~/utils/formatExplorerRelativeDate";

const props = defineProps<{
  project: Project;
  pinCount: number;
  isCurrent: boolean;
  menuItems: DropdownMenuItem[][];
}>();

const projectsStore = useProjectsStore();
const localePath = useLocalePath();

/** Switch project when needed, then open the climate explorer (same path i18n as header links). */
async function goToExplorer() {
  if (!props.isCurrent) {
    projectsStore.switchToProject(props.project.id);
  }
  await navigateTo(localePath("/explorer/explorer"));
}

function onCardClick(ev: MouseEvent) {
  const target = ev.target as HTMLElement | null;
  if (target?.closest("[data-project-card-menu]")) return;
  void goToExplorer();
}
</script>
