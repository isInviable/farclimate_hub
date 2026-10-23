<script setup lang="ts">
const route = useRoute()
const { items, homeItem, isActive, open, close } = useSiteNav()

watch(() => route.fullPath, () => {
  close()
})
</script>

<template>
  <UModal
    v-model:open="open"
    :title="$t('siteNav.open')"
    :close="false"
    :ui="{ content: 'w-full max-w-md rounded-none p-0 ring-0 shadow-xl divide-y-0' }"
  >
    <template #content>
      <nav :aria-label="$t('siteNav.open')">
        <div class="relative" :class="[homeItem.bgClass, homeItem.textClass]">
          <NuxtLinkLocale
            :to="homeItem.to"
            class="block px-12 py-5 text-center font-adapt-keyword text-2xl tracking-wide uppercase"
          >
            {{ $t(homeItem.labelKey) }}
          </NuxtLinkLocale>
          <button
            type="button"
            class="absolute top-1/2 right-4 -translate-y-1/2 font-adapt-keyword text-3xl leading-none"
            :aria-label="$t('siteNav.close')"
            @click="close"
          >
            ×
          </button>
        </div>
        <NuxtLinkLocale
          v-for="item in items"
          :key="item.key"
          :to="item.to"
          class="block px-6 py-5 text-center font-adapt-keyword text-2xl tracking-wide uppercase"
          :class="[
            item.bgClass,
            item.textClass,
            isActive(item.to) ? 'outline-4 outline-offset-[-8px] outline-adapt-ink' : '',
          ]"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          {{ $t(item.labelKey) }}
        </NuxtLinkLocale>
      </nav>
    </template>
  </UModal>
</template>
