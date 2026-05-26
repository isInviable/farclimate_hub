import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { createError } from "h3"

/**
 * Supabase client for read-only access to public knowledge RPCs/tables.
 * Uses the publishable (anon) key — same access anonymous search/article views get.
 * Do not use the service role here: it is not granted on schema `knowledge`.
 */
export function createPublicKnowledgeSupabaseClient(): SupabaseClient {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl as string
  const key = config.public.supabasePublishableKey as string
  if (!url || !key) {
    throw createError({
      statusCode: 500,
      message: "Supabase publishable configuration is missing (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)",
    })
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}
