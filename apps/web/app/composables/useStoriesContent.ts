import type { Collections } from '@nuxt/content'

type StoriesIndexCollection = 'stories_index_en' | 'stories_index_es' | 'stories_index_it'
type StoryCollection = 'story_en' | 'story_es' | 'story_it'

function storiesIndexCollectionFor(locale: string): StoriesIndexCollection {
  if (locale === 'es') return 'stories_index_es'
  if (locale === 'it') return 'stories_index_it'
  return 'stories_index_en'
}

function storyCollectionFor(locale: string): StoryCollection {
  if (locale === 'es') return 'story_es'
  if (locale === 'it') return 'story_it'
  return 'story_en'
}

function storyStemFor(locale: string, slug: string) {
  const prefix = locale === 'en' ? 'en' : locale
  return `${prefix}/stories/${slug}`
}

async function fetchStoryBySlug(collection: keyof Collections, locale: string, slug: string) {
  let doc = await queryCollection(collection).where('slug', '=', slug).first()
  if (!doc) {
    doc = await queryCollection(collection).where('stem', '=', storyStemFor(locale, slug)).first()
  }
  if (!doc) {
    const all = await queryCollection(collection).all()
    doc =
      all.find(
        (item) =>
          item.slug === slug
          || item.stem === storyStemFor(locale, slug)
          || item.stem?.endsWith(`/stories/${slug}`)
      ) ?? null
  }
  return doc
}

export async function useStoriesIndexContent() {
  const { locale } = useI18n()

  const { data: storiesIndex } = await useAsyncData(
    () => `stories-index-${locale.value}`,
    async () => {
      const collection = storiesIndexCollectionFor(locale.value) as keyof Collections
      let doc = await queryCollection(collection).first()
      if (!doc && locale.value !== 'en') {
        doc = await queryCollection('stories_index_en').first()
      }
      return doc
    },
    { watch: [locale] }
  )

  return { storiesIndex }
}

export async function useStoryContent(slug: MaybeRefOrGetter<string>) {
  const { locale } = useI18n()
  const slugRef = computed(() => toValue(slug))

  const { data: story } = await useAsyncData(
    () => `story-${locale.value}-${slugRef.value}`,
    async () => {
      const collection = storyCollectionFor(locale.value) as keyof Collections
      let doc = await fetchStoryBySlug(collection, locale.value, slugRef.value)
      if (!doc && locale.value !== 'en') {
        doc = await fetchStoryBySlug('story_en', 'en', slugRef.value)
      }
      return doc
    },
    { watch: [locale, slugRef] }
  )

  return { story }
}
