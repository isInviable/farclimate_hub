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

export default defineContentConfig({
  collections: {
    home_en: homeCollection('en'),
    home_es: homeCollection('es'),
    home_it: homeCollection('it'),
    footer_en: footerCollection('en'),
    footer_es: footerCollection('es'),
    footer_it: footerCollection('it'),
  },
})
