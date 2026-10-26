import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const storyAuthorSchema = z.object({
  name: z.string(),
  organization: z.string(),
  avatar: z.string(),
})

const storyCardSchema = z.object({
  slug: z.string(),
  tag: z.string(),
  title: z.string(),
  date: z.string(),
  readTime: z.string(),
  author: storyAuthorSchema,
  excerpt: z.string(),
  image: z.string(),
  readLabel: z.string(),
})

const storyDetailHeroSchema = z.object({
  backLabel: z.string(),
  tags: z.array(z.string()),
  title: z.string(),
  subtitle: z.string(),
  date: z.string(),
  readTime: z.string(),
  author: storyAuthorSchema,
  backgroundImage: z.string(),
})

const storyMetaBarSchema = z.object({
  shareLabel: z.string(),
  items: z.array(
    z.object({
      icon: z.string(),
      label: z.string(),
    })
  ),
})

const storyShowcaseSectionSchema = z.object({
  id: z.string(),
  number: z.string(),
  title: z.string(),
  overview: z
    .object({
      period: z.object({ label: z.string(), value: z.string() }),
      status: z.object({ label: z.string(), value: z.string() }),
      participants: z.object({
        label: z.string(),
        logos: z.array(z.string()),
      }),
      mapImage: z.string(),
      mapAlt: z.string(),
      paragraphs: z.array(z.string()),
    })
    .optional(),
  gallery: z
    .object({
      images: z.array(
        z.object({
          src: z.string(),
          alt: z.string(),
        })
      ),
    })
    .optional(),
  stats: z
    .object({
      stats: z.array(
        z.object({
          value: z.string(),
          label: z.string(),
          description: z.string(),
          accentClass: z.string().optional(),
        })
      ),
    })
    .optional(),
  dataTable: z
    .object({
      headers: z.array(z.string()),
      rows: z.array(z.array(z.string())),
    })
    .optional(),
  quote: z
    .object({
      quote: z.string(),
      attribution: z.string(),
    })
    .optional(),
  linkList: z
    .object({
      links: z.array(
        z.object({
          label: z.string(),
          href: z.string().optional(),
        })
      ),
      columns: z.union([z.literal(1), z.literal(2)]).optional(),
    })
    .optional(),
  team: z
    .object({
      members: z.array(
        z.object({
          name: z.string(),
          role: z.string(),
          avatar: z.string(),
        })
      ),
      stats: z.array(
        z.object({
          value: z.string(),
          label: z.string(),
          description: z.string(),
        })
      ),
    })
    .optional(),
  donuts: z
    .object({
      donuts: z.array(
        z.object({
          value: z.number(),
          label: z.string(),
        })
      ),
    })
    .optional(),
  timeline: z
    .object({
      years: z.array(z.string()),
      activeYear: z.string(),
      mapImage: z.string().optional(),
    })
    .optional(),
})

const storyShowcaseSchema = z.object({
  metaBar: storyMetaBarSchema,
  sections: z.array(storyShowcaseSectionSchema),
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
    title: z.string(),
    subtitle: z.string(),
    backgroundImage: z.string(),
  }),
  cards: z.array(storyCardSchema),
})

export const storySchema = z.object({
  slug: z.string(),
  hero: storyDetailHeroSchema,
  comingSoon: z.string().optional(),
  showcase: storyShowcaseSchema.optional(),
})

function homeCollection(locale: string) {
  return defineCollection({
    type: 'data',
    source: {
      include: `${locale}/home.json`,
      cwd: 'content',
    },
    schema: homeSchema,
  })
}

function howToCollection(locale: string) {
  return defineCollection({
    type: 'data',
    source: {
      include: `${locale}/how-to.json`,
      cwd: 'content',
    },
    schema: howToSchema,
  })
}

function footerCollection(locale: string) {
  return defineCollection({
    type: 'data',
    source: {
      include: `${locale}/footer.json`,
      cwd: 'content',
    },
    schema: footerSchema,
  })
}

function storiesIndexCollection(locale: string) {
  return defineCollection({
    type: 'data',
    source: {
      include: `${locale}/stories-index.json`,
      cwd: 'content',
    },
    schema: storiesIndexSchema,
  })
}

function storyCollection(locale: string) {
  return defineCollection({
    type: 'data',
    source: {
      include: `${locale}/stories/*.json`,
      cwd: 'content',
    },
    schema: storySchema,
  })
}

const aboutPageSchema = z.object({
  heroImage: z.string().optional(),
  heroImageAlt: z.string().optional(),
})

function aboutCollection(locale: string) {
  return defineCollection({
    type: 'page',
    source: {
      include: `${locale}/about.md`,
      cwd: 'content',
    },
    schema: aboutPageSchema,
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
    story_en: storyCollection('en'),
    story_es: storyCollection('es'),
    story_it: storyCollection('it'),
    about_en: aboutCollection('en'),
    about_es: aboutCollection('es'),
    about_it: aboutCollection('it'),
  },
})
