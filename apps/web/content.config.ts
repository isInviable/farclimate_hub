import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const dimensionSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.string(),
})

const sectorCardSchema = z.object({
  title: z.string(),
  description: z.string(),
  image: z.string(),
  titleClass: z.string(),
  sector: z.string(),
  buttonLabel: z.string(),
})

const whyMattersItemSchema = z.object({
  text: z.string(),
  icon: z.string(),
})

const platformStepSchema = z.object({
  key: z.string(),
  title: z.string(),
  body: z.string(),
  cta: z.string(),
  image: z.string(),
  imageAlt: z.string(),
})

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

export const homeSchema = z.object({
  hero: z.object({
    titleLine1: z.string(),
    titleLine2: z.string(),
    subtitle: z.string(),
    cta: z.string(),
    scrollLabel: z.string(),
  }),
  sections: z.object({
    inspiration: z.object({
      number: z.string(),
      title: z.string(),
      intro: z.string(),
      problemSpace: z.object({
        title: z.string(),
        description: z.string(),
      }),
      dimensions: z.array(dimensionSchema),
      sectors: z.object({
        title: z.string(),
        description: z.string(),
        cards: z.array(sectorCardSchema),
      }),
    }),
    whyMatters: z.object({
      number: z.string(),
      title: z.string(),
      intro: z.string(),
      items: z.array(whyMattersItemSchema),
    }),
    platform: z.object({
      number: z.string(),
      title: z.string(),
      steps: z.array(platformStepSchema),
    }),
    recipe: z.object({
      number: z.string(),
      title: z.string(),
      intro: z.string(),
      image: z.string(),
      imageAlt: z.string(),
    }),
  }),
})

export const footerSchema = z.object({
  newsletter: z.object({
    description: z.string(),
    emailPlaceholder: z.string(),
    subscribe: z.string(),
    consent: z.string(),
  }),
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
