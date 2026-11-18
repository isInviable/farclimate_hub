import type { Collections } from '@nuxt/content'

type HowToCollection = 'how_to_en' | 'how_to_es' | 'how_to_it'

function howToCollectionFor(locale: string): HowToCollection {
  if (locale === 'es') return 'how_to_es'
  if (locale === 'it') return 'how_to_it'
  return 'how_to_en'
}

export async function useHowToContent() {
  const { locale } = useI18n()

  const { data: howTo } = await useAsyncData(
    () => `how-to-content-${locale.value}`,
    async () => {
      const collection = howToCollectionFor(locale.value) as keyof Collections
      let doc = await queryCollection(collection).first()
      if (!doc && locale.value !== 'en') {
        doc = await queryCollection('how_to_en').first()
      }
      return doc
    },
    { watch: [locale] }
  )

  return { howTo }
}
