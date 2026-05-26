import { mapKnowledgeRowToArticleDocument } from "../utils/knowledgeDocument";
import { createPublicKnowledgeSupabaseClient } from "../utils/knowledgeSupabase";

/**
 * GET /api/document-by-uid?uid=<stable document_uid>&lang=en
 * Resolves a knowledge document for explorer deep links (e.g. from pins).
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event);
  const raw =
    (q.uid as string) ||
    (q.document as string) ||
    (q.document_uid as string) ||
    "";
  const uid = typeof raw === "string" ? raw.trim() : "";
  if (!uid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing uid (use ?uid= or ?document=)",
    });
  }

  const lang = typeof q.lang === "string" && q.lang.trim() ? q.lang.trim() : "en";

  const supabase = createPublicKnowledgeSupabaseClient();
  const { data, error } = await supabase.rpc("get_document_by_uid", {
    p_document_uid: uid,
    filter_lang: lang,
  });

  if (error) {
    console.error("[document-by-uid]", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const row = rows[0];
  if (!row) {
    throw createError({
      statusCode: 404,
      statusMessage: "Document not found",
    });
  }

  return {
    document: mapKnowledgeRowToArticleDocument(row),
  };
});
