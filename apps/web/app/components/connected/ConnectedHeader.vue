<template>
  <header class="text-white w-full">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-0">
      <!-- Title row -->
      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-8 min-w-0 bg-trust-blue-darkest px-8 py-4" >
          <h1 class="font-display font-bold text-5xl leading-tight">
            {{ currentItem?.label ?? "Connected" }}
          </h1>
          <p
            v-if="currentItem?.description"
            class="font-mono text-base text-white/70 mt-1"
          >
            {{ currentItem.description }}
          </p>
        </div>

        <!-- Navigation tabs -->
        <nav
          class="col-span-4 flex items-end border-b border-white/20 gap-0 flex-col"
        >
          <NuxtLinkLocale
            v-for="item in connectedNav"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-4 px-4 py-1.5 font-mono text-sm whitespace-nowrap border-b-2 -mb-px transition-colors uppercase"
            :class="
              isActive(item.to)
                ? 'text-neutral-800 border-b-trust-blue-darkest'
                : 'border-transparent text-neutral-800 '
            "
          >
            <UIcon v-if="item.icon" :name="item.icon" class="size-4 shrink-0" />
            {{ item.label }}
          </NuxtLinkLocale>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { connectedNav } from "./connectedNav";

const route = useRoute();

const currentItem = computed(() =>
  connectedNav.find(
    (item) => route.path === item.to || route.path.startsWith(item.to + "/"),
  ),
);

function isActive(to: string): boolean {
  return route.path === to || route.path.startsWith(to + "/");
}
</script>
