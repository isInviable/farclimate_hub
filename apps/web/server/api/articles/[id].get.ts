import { isDocumentUuid, mapKnowledgeRowToArticleDocument } from '../../utils/knowledgeDocument'
import { createPublicKnowledgeSupabaseClient } from '../../utils/knowledgeSupabase'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  const q = getQuery(event)
  const lang = typeof q.lang === 'string' && q.lang ? q.lang : 'en'

  if (!id || typeof id !== 'string') {
    throw createError({ statusCode: 400, message: 'Document id is required' })
  }

  const trimmed = id.trim()
  if (!isDocumentUuid(trimmed)) {
    throw createError({ statusCode: 400, message: 'Invalid document id' })
  }

  const supabase = createPublicKnowledgeSupabaseClient()

  const { data: rows, error: rpcError } = await supabase.rpc('get_documents_by_ids', {
    doc_ids: [trimmed],
    filter_lang: lang,
  })

  if (rpcError) {
    console.error('[articles/id] get_documents_by_ids failed:', rpcError)
    throw createError({ statusCode: 502, message: rpcError.message })
  }

  const row = rows?.[0] as Record<string, unknown> | undefined
  if (!row) {
    throw createError({ statusCode: 404, message: 'Document not found' })
  }

  return mapKnowledgeRowToArticleDocument(row as Record<string, any>)
})
