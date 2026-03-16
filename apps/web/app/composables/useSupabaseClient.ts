import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Client used in the browser only; uses localStorage so session survives reloads. */
let clientBrowser: SupabaseClient | null = null;
/** Client used on the server (SSR/middleware); no session persistence. */
let clientServer: SupabaseClient | null = null;

/**
 * Returns a Supabase client. In the browser the client uses localStorage for auth
 * (persistSession: true) so the session is restored on reload. On the server the
 * client has no storage and does not persist sessions.
 * @see https://supabase.com/docs/reference/javascript/auth-api
 */
export const useSupabaseClient = (): SupabaseClient => {
  const config = useRuntimeConfig();
  const supabaseUrl = config.public.supabaseUrl;
  const supabaseKey = config.public.supabasePublishableKey;

  if (import.meta.client) {
    if (clientBrowser) return clientBrowser;
    clientBrowser = createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: window.localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
    return clientBrowser;
  }

  if (clientServer) return clientServer;
  clientServer = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  return clientServer;
};
