import { localeCodeFromPath } from '~/utils/localeFromPath'

export default defineNuxtPlugin(() => {
  const { locale, setLocale } = useI18n()
  const route = useRoute()

  async function syncLocaleFromRoute(path = route.path) {
    const pathLocale = localeCodeFromPath(path)
    if (locale.value === pathLocale) return
    await setLocale(pathLocale)
  }

  syncLocaleFromRoute()

  watch(
    () => route.path,
    (path) => {
      syncLocaleFromRoute(path)
    },
  )
})
