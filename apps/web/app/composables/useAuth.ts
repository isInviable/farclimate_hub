import type { User, Session } from "@supabase/supabase-js";
import { useSupabaseClient } from "./useSupabaseClient";

export const useAuth = () => {
  const supabase = useSupabaseClient();
  const user = useState<User | null>("auth_user", () => null);
  const session = useState<Session | null>("auth_session", () => null);
  const loading = useState<boolean>("auth_loading", () => true);

  // Initialize auth state
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
  };
};
