const PREFIX_LOCALES = new Set(['es', 'it'])

export type AppLocale = 'en' | 'es' | 'it'

export function localeCodeFromPath(path: string): AppLocale {
  const segment = path.split('/').filter(Boolean)[0]
  if (segment && PREFIX_LOCALES.has(segment)) {
    return segment as 'es' | 'it'
  }
  return 'en'
}
