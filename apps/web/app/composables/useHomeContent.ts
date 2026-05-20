import type { Collections } from '@nuxt/content'

type HomeCollection = 'home_en' | 'home_es' | 'home_it'
type FooterCollection = 'footer_en' | 'footer_es' | 'footer_it'

function homeCollectionFor(locale: string): HomeCollection {
  if (locale === 'es') return 'home_es'
  if (locale === 'it') return 'home_it'
  return 'home_en'
}

function footerCollectionFor(locale: string): FooterCollection {
  if (locale === 'es') return 'footer_es'
  if (locale === 'it') return 'footer_it'
  return 'footer_en'
}

export async function useHomeContent() {
  const { locale } = useI18n()

  const { data: home } = await useAsyncData(
    () => `home-content-${locale.value}`,
    async () => {
      const collection = homeCollectionFor(locale.value) as keyof Collections
      let doc = await queryCollection(collection).first()
      if (!doc && locale.value !== 'en') {
        doc = await queryCollection('home_en').first()
      }
      return doc
    },
    { watch: [locale] }
  )

  return { home }
}

export async function useFooterContent() {
  const { locale } = useI18n()

  const { data: footer } = await useAsyncData(
    () => `footer-content-${locale.value}`,
    async () => {
      const collection = footerCollectionFor(locale.value) as keyof Collections
      let doc = await queryCollection(collection).first()
      if (!doc && locale.value !== 'en') {
        doc = await queryCollection('footer_en').first()
      }
      return doc
    },
    { watch: [locale] }
  )

  return { footer }
}
