import { runSummarizePropertyItem } from '../utils/propertySummaryLlm'

/** Keep in sync with `GRID_AI_SUMMARY_MAX_ARTICLES` in `app/composables/gridCompareSource.ts`. */
const MAX_ITEMS = 30
/** Parallel LLM calls; tune down if provider rate-limits. */
const MAX_CONCURRENCY = 10

type BatchItem = { id: string; text: string; cacheId: string }

type BatchResultOk = {
  id: string
  cacheId: string
  ok: true
  response: { summary: string; data: string }
  timestamp: string
}

type BatchResultErr = {
  id: string
  cacheId: string
  ok: false
  error: string
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return []
  const results = new Array<R>(items.length)
  let next = 0

  async function worker(): Promise<void> {
    for (;;) {
      const i = next++
      if (i >= items.length) return
      results[i] = await fn(items[i]!, i)
    }
  }

  const n = Math.min(limit, items.length)
  await Promise.all(Array.from({ length: n }, () => worker()))
  return results
}

/**
 * POST /api/summarizePropertyBatch
 * One HTTP request; server runs one LLM call per item in parallel (capped).
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const mode: 'property' | 'custom' =
    body?.mode === 'custom' ? 'custom' : 'property'
  const property = typeof body?.property === 'string' ? body.property : ''
  console.log('property', property);
  const userPrompt =
    typeof body?.userPrompt === 'string' ? body.userPrompt.trim() : ''
  const rawItems = body?.items

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Body must include non-empty items: array',
    })
  }

  if (rawItems.length > MAX_ITEMS) {
    throw createError({
      statusCode: 400,
      message: `At most ${MAX_ITEMS} items per batch`,
    })
  }

  if (mode === 'property' && !property) {
    throw createError({
      statusCode: 400,
      message: 'Missing required field: property (for mode property)',
    })
  }

  if (mode === 'custom' && !userPrompt) {
    throw createError({
      statusCode: 400,
      message: 'Missing or empty required field: userPrompt (for mode custom)',
    })
  }

  const items: BatchItem[] = []
  for (const row of rawItems) {
    const id = typeof row?.id === 'string' ? row.id : ''
    const text = typeof row?.text === 'string' ? row.text : ''
    const cacheId = typeof row?.cacheId === 'string' ? row.cacheId : ''
    if (!id || !cacheId) {
      throw createError({
        statusCode: 400,
        message: 'Each item must include id and cacheId strings',
      })
    }
    items.push({ id, text, cacheId })
  }

  const results = await mapWithConcurrency(
    items,
    MAX_CONCURRENCY,
    async (item): Promise<BatchResultOk | BatchResultErr> => {
      const trimmed = item.text.trim()
      if (!trimmed) {
        return {
          id: item.id,
          cacheId: item.cacheId,
          ok: false,
          error: 'empty text',
        }
      }
      try {
        const out = await runSummarizePropertyItem({
          mode,
          text: item.text,
          property: mode === 'property' ? property : undefined,
          userPrompt: mode === 'custom' ? userPrompt : undefined,
          cacheId: item.cacheId,
        })
        return {
          id: item.id,
          cacheId: item.cacheId,
          ok: true,
          response: out.response,
          timestamp: out.timestamp,
        }
      } catch (e) {
        return {
          id: item.id,
          cacheId: item.cacheId,
          ok: false,
          error: e instanceof Error ? e.message : 'Unknown error',
        }
      }
    }
  )

  return { results }
})
