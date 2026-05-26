import type { SupabaseClient } from "@supabase/supabase-js"
import { mapKnowledgeRowToArticleDocument } from "./knowledgeDocument"
import { createPublicKnowledgeSupabaseClient } from "./knowledgeSupabase"

export function knowledgeClientForExport(): SupabaseClient {
  return createPublicKnowledgeSupabaseClient()
}

/**
 * Loads a knowledge document row by stable `document_uid` for archive embedding.
 * Returns mapped article JSON suitable for `articles/<uid>.json`, or null if not found.
 */
export async function fetchArticleJsonByDocumentUid(
  documentUid: string,
  lang = "en"
): Promise<Record<string, unknown> | null> {
  const uid = documentUid.trim()
  if (!uid) return null

  const supabase = knowledgeClientForExport()
  const { data, error } = await supabase.rpc("get_document_by_uid", {
    p_document_uid: uid,
    filter_lang: lang,
  })

  if (error) {
    console.warn("[pinboard-export] get_document_by_uid failed:", error.message)
    return null
  }

  const rows = (data ?? []) as Record<string, unknown>[]
  const row = rows[0]
  if (!row) return null

  const doc = mapKnowledgeRowToArticleDocument(row as Record<string, any>)
  return JSON.parse(JSON.stringify(doc)) as Record<string, unknown>
}
