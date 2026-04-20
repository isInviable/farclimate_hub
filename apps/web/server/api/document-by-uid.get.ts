import { createClient } from "@supabase/supabase-js";
import { mapKnowledgeRowToArticleDocument } from "../utils/knowledgeDocument";

function getSupabaseClient() {
  const config = useRuntimeConfig();
  const url = config.public.supabaseUrl as string;
  const key =
    (config.supabaseServiceRoleKey as string) ||
    (config.public.supabasePublishableKey as string);
  return createClient(url, key);
}

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

  const supabase = getSupabaseClient();
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
