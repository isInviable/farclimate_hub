import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const storyIndexCardSchema = z.object({
  slug: z.string(),
  name: z.string(),
  line: z.string(),
})

const introSegmentSchema = z.object({
  text: z.string(),
  keyword: z.boolean().optional(),
})

const homeCtaSchema = z.object({
  label: z.string(),
  to: z.string(),
  image: z.string(),
})

const homeGroupSchema = z.object({
  title: z.string(),
  items: z.array(z.string()),
})

export const homeSchema = z.object({
  hero: z.object({
    wordmark: z.array(z.string()),
    tagline: z.string(),
    taglineSecondary: z.string(),
    image: z.string(),
    imageAlt: z.string(),
    intro: z.array(introSegmentSchema),
    cta: homeCtaSchema,
  }),
  stats: z.object({
    image: z.string(),
    imageAlt: z.string(),
    items: z.array(
      z.object({
        prefix: z.string().optional(),
        value: z.string(),
        label: z.string(),
        highlight: z.boolean().optional(),
      })
    ),
  }),
  recipe: z.object({
    kicker: z.string(),
    title: z.string(),
    lead: z.string(),
    count: z.string(),
    body: z.string(),
    image: z.string(),
    imageAlt: z.string(),
    groups: z.array(homeGroupSchema),
    cta: homeCtaSchema,
  }),
  inspire: z.object({
    slides: z.array(
      z.object({
        image: z.string(),
        imageAlt: z.string(),
        title: z.string(),
        card: z.object({
          kicker: z.string(),
          body: z.string(),
          tone: z.enum(['blue', 'yellow', 'aqua']),
          image: z.string(),
          imageAlt: z.string(),
        }),
      })
    ),
  }),
  stories: z.object({
    image: z.string(),
    imageAlt: z.string(),
    lines: z.array(
      z.object({
        text: z.string(),
        highlight: z.boolean().optional(),
      })
    ),
    cta: homeCtaSchema,
  }),
})

export const howToSchema = z.object({
  intro: z.object({
    titleLines: z.array(z.string()),
    accent: z.string(),
    kickerLines: z.array(z.string()),
    before: z.string(),
    emphasis: z.string(),
    middle: z.string(),
    recipe: z.string(),
    after: z.string(),
  }),
  steps: z.array(
    z.object({
      key: z.string(),
      title: z.string(),
      body: z.string(),
      image: z.string(),
      imageAlt: z.string(),
    })
  ),
  cta: z.object({
    label: z.string(),
    to: z.string(),
    image: z.string(),
  }),
})

export const footerSchema = z.object({
  mainMenu: z.object({
    title: z.string(),
    links: z.array(
      z.object({
        label: z.string(),
        to: z.string().optional(),
        href: z.string().optional(),
      })
    ),
  }),
  followUs: z.object({
    title: z.string(),
    links: z.array(
      z.object({
        label: z.string(),
        href: z.string(),
      })
    ),
  }),
  copyright: z.string(),
  copyrightHref: z.string().optional(),
  legal: z.array(
    z.object({
      label: z.string(),
      href: z.string().optional(),
    })
  ),
})

export const storiesIndexSchema = z.object({
  hero: z.object({
    wordmark: z.array(z.string()),
    subtitle: z.string(),
    paragraphs: z.array(z.string()),
    image: z.string(),
  }),
  cards: z.array(storyIndexCardSchema),
})

const storyArticleChapterSchema = z.object({
  kicker: z.string().optional(),
  label: z.string(),
  question: z.string(),
  paragraphs: z.array(z.string()),
  audio: z
    .object({
      title: z.string(),
      src: z.string(),
    })
    .optional(),
  closing: z.array(z.string()).optional(),
})

export const storyArticleSchema = z.object({
  hero: z.object({
    wordmark: z.array(z.string()),
    subtitle: z.string(),
    name: z.string(),
    line: z.string(),
    portrait: z.string(),
    scene: z.string(),
  }),
  identity: z.object({
    theme: z.string(),
    name: z.string(),
    role: z.string(),
    place: z.string(),
  }),
  lead: z.object({
    question: z.string(),
    paragraphs: z.array(z.string()),
    quote: z.string(),
    afterQuote: z.array(z.string()),
    question2: z.string(),
    paragraphs2: z.array(z.string()),
  }),
  banner: z.object({
    image: z.string(),
    quote: z.string(),
  }),
  chapters: z.array(storyArticleChapterSchema),
})

export const storySchema = z.object({
  slug: z.string(),
})

function homeCollection(locale: string) {
  return defineCollection({
    type: 'data',
    source: `${locale}/home.json`,
    schema: homeSchema,
  })
}

function howToCollection(locale: string) {
  return defineCollection({
    type: 'data',
    source: `${locale}/how-to.json`,
    schema: howToSchema,
  })
}

function footerCollection(locale: string) {
  return defineCollection({
    type: 'data',
    source: `${locale}/footer.json`,
    schema: footerSchema,
  })
}

function storiesIndexCollection(locale: string) {
  return defineCollection({
    type: 'data',
    source: `${locale}/stories-index.json`,
    schema: storiesIndexSchema,
  })
}

function storyArticleCollection(locale: string) {
  return defineCollection({
    type: 'data',
    source: `${locale}/story-article.json`,
    schema: storyArticleSchema,
  })
}

function storyCollection(locale: string) {
  return defineCollection({
    type: 'data',
    source: `${locale}/stories/*.json`,
    schema: storySchema,
  })
}

const aboutAnswerSchema = z.object({
  key: z.string(),
  heading: z.string(),
  body: z.string(),
})

export const aboutSchema = z.object({
  title: z.string(),
  description: z.string(),
  hero: z.object({
    kickerLines: z.array(z.string()).length(2),
    wordLines: z.array(z.string()).length(4),
    hub: z.string(),
    image: z.string(),
    imageAlt: z.string(),
  }),
  answers: z.array(aboutAnswerSchema).length(3),
  audience: z.object({
    heading: z.string(),
    body: z.string(),
    image: z.string(),
    imageAlt: z.string(),
  }),
  metaphor: z.object({
    solution: z.string(),
    recipe: z.string(),
    nameLines: z.array(z.string()).length(2),
    body: z.string(),
    image: z.string(),
    imageAlt: z.string(),
  }),
})

function aboutCollection(locale: string) {
  return defineCollection({
    type: 'data',
    source: `${locale}/about.json`,
    schema: aboutSchema,
  })
}

export default defineContentConfig({
  collections: {
    home_en: homeCollection('en'),
    home_es: homeCollection('es'),
    home_it: homeCollection('it'),
    how_to_en: howToCollection('en'),
    how_to_es: howToCollection('es'),
    how_to_it: howToCollection('it'),
    footer_en: footerCollection('en'),
    footer_es: footerCollection('es'),
    footer_it: footerCollection('it'),
    stories_index_en: storiesIndexCollection('en'),
    stories_index_es: storiesIndexCollection('es'),
    stories_index_it: storiesIndexCollection('it'),
    story_article_en: storyArticleCollection('en'),
    story_article_es: storyArticleCollection('es'),
    story_article_it: storyArticleCollection('it'),
    story_en: storyCollection('en'),
    story_es: storyCollection('es'),
    story_it: storyCollection('it'),
    about_en: aboutCollection('en'),
    about_es: aboutCollection('es'),
    about_it: aboutCollection('it'),
  },
})
