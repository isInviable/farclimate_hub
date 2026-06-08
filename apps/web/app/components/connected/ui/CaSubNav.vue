<template>
  <div
    class="sticky top-0 z-30 flex overflow-y-hidden items-center overflow-x-auto border-b border-neutral-darkest bg-neutral-lightest px-7"
  >
    <span class="mr-6 shrink-0 font-mono text-2xs font-bold tracking-[0.2em] text-neutral-dark">
      CONNECTED ACTION
    </span>
    <nav class="flex">
      <NuxtLinkLocale
        v-for="item in connectedNav"
        :key="item.to"
        :to="item.to"
        class="flex h-[50px] items-center gap-2 whitespace-nowrap border-b-2 px-4 transition-colors"
        :class="
          isActive(item.to)
            ? 'border-neutral-darkest text-neutral-darkest'
            : 'border-transparent text-neutral-dark hover:text-neutral-darkest'
        "
      >
        <span class="text-[13px] leading-none">{{ item.glyph }}</span>
        <span
          class="font-mono text-[11px] tracking-[0.05em]"
          :class="isActive(item.to) ? 'font-bold' : 'font-medium'"
        >
          {{ item.label.toUpperCase() }}
        </span>
      </NuxtLinkLocale>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { connectedNav } from "../connectedNav";

const route = useRoute();

function normalize(p: string): string {
  return p.replace(/\/+$/, "") || "/";
}

// Strip the non-default locale prefix (es / it) so active-state matches the
// canonical `/connected/...` routes regardless of the current locale.
function stripLocale(p: string): string {
  return p.replace(/^\/(es|it)(?=\/|$)/, "") || "/";
}

function isActive(to: string): boolean {
  const cur = normalize(stripLocale(route.path));
  const target = normalize(to);
  // The Overview index must match exactly (otherwise it shadows every child).
  if (target === "/connected") return cur === "/connected";
  return cur === target || cur.startsWith(`${target}/`);
}
</script>
