export type SiteNavItem = {
  key: string
  to: string
  labelKey: string
  bgClass: string
  textClass: string
}

/**
 * Temporary demo targets for Skills and Connected Action.
 * Revert steps: docs/demo-external-prototypes.md
 */
export const demoSkillsUrl = 'https://adaptarium-skills.pages.dev/skills/'
export const demoConnectedUrl = 'https://connected-action-v2.pages.dev/connected/'

/** Single source for the public-site section menu. Class strings are literal so Tailwind can see them. */
export const siteNavItems: SiteNavItem[] = [
  {
    key: 'solutions',
    to: '/explorer/explorer',
    labelKey: 'siteNav.solutions',
    bgClass: 'bg-adapt-orange',
    textClass: 'text-adapt-ink',
  },
  {
    key: 'howTo',
    to: '/how-to',
    labelKey: 'siteNav.howTo',
    bgClass: 'bg-adapt-blue',
    textClass: 'text-white',
  },
  {
    key: 'stories',
    to: '/stories',
    labelKey: 'siteNav.stories',
    bgClass: 'bg-adapt-aqua',
    textClass: 'text-adapt-ink',
  },
  {
    key: 'training',
    to: demoSkillsUrl,
    labelKey: 'siteNav.training',
    bgClass: 'bg-adapt-brown',
    textClass: 'text-white',
  },
  {
    key: 'network',
    to: demoConnectedUrl,
    labelKey: 'siteNav.network',
    bgClass: 'bg-adapt-yellow',
    textClass: 'text-adapt-ink',
  },
  {
    key: 'about',
    to: '/about',
    labelKey: 'siteNav.about',
    bgClass: 'bg-adapt-mist',
    textClass: 'text-adapt-ink',
  },
]

export const siteNavHomeItem: SiteNavItem = {
  key: 'home',
  to: '/',
  labelKey: 'siteNav.home',
  bgClass: 'bg-adapt-mist',
  textClass: 'text-adapt-ink',
}
