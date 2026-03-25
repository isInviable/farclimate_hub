/** Max chars sent as LLM context for custom compare (title, subtitle, summary, recipe sections). */
export const GRID_COMPARE_CONTEXT_MAX = 6000

/** Max articles sent to the LLM per batch (grid: all visible, or checkbox selection if any). */
export const GRID_AI_SUMMARY_MAX_ARTICLES = 30

/** Dropdown values that map to recipe `ingredients` keys (see knowledge-recipe spec). */
export const GRID_COMPARE_RECIPE_KEY_BY_SELECT: Record<string, string> = {
  cost_benefit: 'economic_data',
  implementation_time: 'implementation_phases',
  lifetime: 'benefits',
  stakeholder_participation: 'who_is_involved',
  success_limitations: 'success_and_limiting',
}

const RECIPE_KEYS_FOR_CUSTOM: string[] = [
  'context_summary',
  'challenges',
  'objectives',
  'solutions_implemented',
  'economic_data',
  'implementation_phases',
  'who_is_involved',
  'success_and_limiting',
  'benefits',
  'policy_context',
  'legal_aspects',
  'lessons_learnt',
  'transferability',
]

export type GridCompareSelectValue =
  | 'subtitle'
  | 'cost_benefit'
  | 'implementation_time'
  | 'lifetime'
  | 'stakeholder_participation'
  | 'success_limitations'
  | 'custom'

export interface GridCompareDocument {
  title?: string
  subtitle?: string
  summary?: string
  recipe_ingredients?: Record<string, string> | null
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, max - 1)}…`
}

/** Bounded text for a predefined property row (recipe section only). */
export function resolvePropertySourceText(
  document: GridCompareDocument,
  selectValue: string
): string {
  const key = GRID_COMPARE_RECIPE_KEY_BY_SELECT[selectValue]
  if (!key) return ''
  const raw = document.recipe_ingredients?.[key]
  return typeof raw === 'string' ? raw.trim() : ''
}

/** Fallback snippet when recipe section is empty (no fulltext). */
export function fallbackSnippetForProperty(document: GridCompareDocument): string {
  const sub = (document.subtitle ?? '').trim()
  const sum = (document.summary ?? '').trim()
  if (sub && sum) return `${sub}\n\n${sum}`
  return sub || sum || ''
}

/**
 * Custom compare: title + subtitle + summary + non-empty recipe sections, capped.
 * Does not include `fulltext`.
 */
export function buildCustomCompareContext(document: GridCompareDocument): string {
  const parts: string[] = []
  const title = (document.title ?? '').trim()
  const subtitle = (document.subtitle ?? '').trim()
  const summary = (document.summary ?? '').trim()
  if (title) parts.push(`Title: ${title}`)
  if (subtitle) parts.push(`Subtitle: ${subtitle}`)
  if (summary) parts.push(`Summary:\n${summary}`)

  const recipe = document.recipe_ingredients
  if (recipe && typeof recipe === 'object') {
    for (const key of RECIPE_KEYS_FOR_CUSTOM) {
      const v = recipe[key]
      if (typeof v === 'string' && v.trim()) {
        parts.push(`## ${key.replace(/_/g, ' ')}\n${v.trim()}`)
      }
    }
  }

  return truncate(parts.join('\n\n'), GRID_COMPARE_CONTEXT_MAX)
}

/** Stable short hash for cache keys (djb2). */
export function hashPrompt(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i)
  }
  return (h >>> 0).toString(36)
}
