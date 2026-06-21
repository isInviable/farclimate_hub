import { runSummarizePropertyItem } from '../utils/propertySummaryLlm'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const mode: 'property' | 'custom' =
      body?.mode === 'custom' ? 'custom' : 'property'
    const textRaw = typeof body?.text === 'string' ? body.text : ''
    const property = typeof body?.property === 'string' ? body.property : ''
    const userPrompt =
      typeof body?.userPrompt === 'string' ? body.userPrompt.trim() : ''
    const cacheId = typeof body?.cacheId === 'string' ? body.cacheId : ''
    const locale = typeof body?.locale === 'string' ? body.locale : undefined

    if (!textRaw.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Missing or empty required field: text',
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

    try {
      return await runSummarizePropertyItem({
        mode,
        text: textRaw,
        property: mode === 'property' ? property : undefined,
        userPrompt: mode === 'custom' ? userPrompt : undefined,
        cacheId,
        locale,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate summary'
      if (
        msg.includes('Missing') ||
        msg.includes('empty required')
      ) {
        throw createError({ statusCode: 400, message: msg })
      }
      if (msg.includes('Model did not return')) {
        throw createError({ statusCode: 500, message: msg })
      }
      throw err
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    console.error('Error in AI response:', error)
    throw createError({
      statusCode: 500,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to generate property summary',
    })
  }
})
