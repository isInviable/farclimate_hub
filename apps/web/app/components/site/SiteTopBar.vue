<script setup lang="ts">
withDefaults(defineProps<{
  mode?: 'home' | 'bar'
}>(), {
  mode: 'bar',
})

const { toggle } = useSiteNav()
</script>

<template>
  <div>
    <div
      v-if="mode === 'home'"
      class="sticky top-0 z-30 flex h-14 items-center justify-end gap-3 bg-adapt-paper px-4 lg:hidden"
    >
      <SiteLocaleSwitcher />
      <SiteSessionButton />
      <button
        type="button"
        class="inline-flex size-9 items-center justify-center text-adapt-ink"
        :aria-label="$t('siteNav.open')"
        @click="toggle"
      >
        <UIcon name="i-lucide-menu" class="size-6" />
      </button>
    </div>

    <div
      v-if="mode === 'home'"
      class="absolute top-4 left-6 z-30 hidden items-center gap-3 lg:flex"
    >
      <SiteLocaleSwitcher />
      <SiteSessionButton />
    </div>

    <div
      v-else
      class="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-adapt-ink bg-white px-4"
    >
      <NuxtLinkLocale to="/" class="font-adapt-heavy text-lg leading-none tracking-tight text-adapt-orange">
        ADAPTARIUM
      </NuxtLinkLocale>
      <div class="flex-1" />
      <SiteLocaleSwitcher />
      <SiteSessionButton />
      <button
        type="button"
        class="inline-flex size-9 items-center justify-center text-adapt-ink"
        :aria-label="$t('siteNav.open')"
        @click="toggle"
      >
        <UIcon name="i-lucide-menu" class="size-6" />
      </button>
    </div>
  </div>
</template>
