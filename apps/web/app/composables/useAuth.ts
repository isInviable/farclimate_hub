import type { User, Session } from "@supabase/supabase-js";
import { useSupabaseClient } from "./useSupabaseClient";

export const useAuth = () => {
  const supabase = useSupabaseClient();
  const user = useState<User | null>("auth_user", () => null);
  const session = useState<Session | null>("auth_session", () => null);
  const loading = useState<boolean>("auth_loading", () => true);

  // On client, sync session from localStorage when a component using auth mounts.
  // This fixes the case where SSR sent null and the plugin ran before hydration
  // so the UI showed "demo mode" until state was updated.
  if (import.meta.client) {
    onMounted(async () => {
      await initAuth();
    });
  }

  // Initialize auth state (reads from Supabase client, which uses localStorage in the browser)
  const initAuth = async () => {
    try {
      loading.value = true;
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      session.value = currentSession;
      user.value = currentSession?.user ?? null;

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, newSession) => {
        session.value = newSession;
        user.value = newSession?.user ?? null;
      });
    } catch (error) {
      console.error("Error initializing auth:", error);
      session.value = null;
      user.value = null;
    } finally {
      loading.value = false;
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      loading.value = true;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      session.value = data.session;
      user.value = data.user;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      loading.value = false;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      loading.value = true;
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      session.value = null;
      user.value = null;

      return { error: null };
    } catch (error: any) {
      return { error };
    } finally {
      loading.value = false;
    }
  };

  // Refresh the active session so new JWT claims become visible to the app.
  const refreshSession = async () => {
    try {
      loading.value = true;
      const {
        data: { session: refreshedSession, user: refreshedUser },
        error,
      } = await supabase.auth.refreshSession();

      if (error) throw error;

      session.value = refreshedSession;
      user.value = refreshedUser ?? refreshedSession?.user ?? null;

      return { data: { session: refreshedSession, user: refreshedUser }, error: null };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      loading.value = false;
    }
  };

  // Check if user is authenticated
  const isAuthenticated = computed(() => !!user.value);

  return {
    user: readonly(user),
    session: readonly(session),
    loading: readonly(loading),
    isAuthenticated,
    initAuth,
    signIn,
    signOut,
    refreshSession,
  };
};
