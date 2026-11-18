<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const route = useRoute()

const availableLocales = computed(() => locales.value)

async function switchLanguage(localeCode: 'en' | 'es' | 'it') {
  const path = switchLocalePath(localeCode)
  if (!path) return
  if (locale.value !== localeCode) {
    await setLocale(localeCode)
  }
  if (route.path !== path) {
    await navigateTo(path)
  }
}
</script>

<template>
  <div class="inline-flex h-9 items-stretch border border-adapt-ink bg-white">
    <button
      v-for="loc in availableLocales"
      :key="loc.code"
      type="button"
      class="px-2.5 font-adapt-keyword text-sm tracking-wide transition-colors"
      :class="
        locale === loc.code
          ? 'bg-adapt-ink text-white'
          : 'bg-white text-adapt-ink hover:bg-adapt-sand'
      "
      :aria-current="locale === loc.code ? 'true' : undefined"
      @click="switchLanguage(loc.code as 'en' | 'es' | 'it')"
    >
      {{ loc.code.toUpperCase() }}
    </button>
  </div>
</template>
