import type { Collections } from '@nuxt/content'

type AboutCollection = 'about_en' | 'about_es' | 'about_it'
type AboutDocument =
  | Collections['about_en']
  | Collections['about_es']
  | Collections['about_it']

function aboutCollectionFor(locale: string): AboutCollection {
  if (locale === 'es') return 'about_es'
  if (locale === 'it') return 'about_it'
  return 'about_en'
}

export async function useAboutContent() {
  const { locale } = useI18n()

  const { data: about } = await useAsyncData<AboutDocument | null>(
    () => `about-content-${locale.value}`,
    async () => {
      const collection = aboutCollectionFor(locale.value) as keyof Collections
      let doc = (await queryCollection(collection).first()) as AboutDocument | null
      if (!doc && locale.value !== 'en') {
        doc = (await queryCollection('about_en').first()) as AboutDocument | null
      }
      return doc
    },
    { watch: [locale] }
  )

  return { about: about as Ref<AboutDocument | null> }
}
