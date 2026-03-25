import { createClient } from "@supabase/supabase-js";

/**
 * Returns `knowledge.recipe.ingredients` for one document + language.
 * Uses `get_documents_by_ids` first (same shape as /api/search); if `recipe_ingredients`
 * is missing (older RPC on the project), falls back to `knowledge.recipe` when REST exposes it.
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event);
  const documentId = typeof q.documentId === "string" ? q.documentId : "";
  const lang = typeof q.lang === "string" && q.lang ? q.lang : "en";

  if (!documentId) {
    throw createError({ statusCode: 400, message: "documentId query parameter is required" });
  }

  const config = useRuntimeConfig();
  const url = config.public.supabaseUrl as string;
  const key =
    (config.supabaseServiceRoleKey as string) || (config.public.supabasePublishableKey as string);
  const supabase = createClient(url, key);

  const { data: rows, error: rpcError } = await supabase.rpc("get_documents_by_ids", {
    doc_ids: [documentId],
    filter_lang: lang,
  });

  if (rpcError) {
    console.error("[document-recipe] get_documents_by_ids failed:", rpcError);
    throw createError({ statusCode: 502, message: rpcError.message });
  }

  const row = rows?.[0] as Record<string, unknown> | undefined;
  let recipeIngredients: unknown = row?.recipe_ingredients;

  if (recipeIngredients == null) {
    try {
      const { data: recipeRow, error: tableError } = await supabase
        .schema("knowledge")
        .from("recipe")
        .select("ingredients")
        .eq("document_id", documentId)
        .eq("lang", lang)
        .maybeSingle();

      if (!tableError && recipeRow?.ingredients != null) {
        recipeIngredients = recipeRow.ingredients;
      } else if (tableError) {
        console.warn("[document-recipe] knowledge.recipe fallback skipped:", tableError.message);
      }
    } catch (err) {
      console.warn("[document-recipe] knowledge.recipe fallback error:", err);
    }
  }

  return { recipe_ingredients: recipeIngredients ?? null };
});
