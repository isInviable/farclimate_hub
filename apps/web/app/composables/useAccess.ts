/**
 * Central access-state API for the platform.
 * Derives demo vs authenticated mode from Supabase session and provides
 * a shared guard for persistence actions. Extensible for future elevated roles (e.g. connected_admin).
 *
 * Persistence guard usage (requireAuthForPersistence):
 * - Admin routes: already gated by admin.auth middleware and per-page isAuthenticated checks.
 * - Human-domain writes (future): when adding server-side APIs for pins, projects, preferences, etc.,
 *   call requireAuthForPersistence() (or requireAuthForPersistence(returnPath)) before the write.
 */

export type AccessMode = "demo" | "authenticated";

/** Reserved for future RBAC; not used in baseline. */
export type PlatformRole = "connected_admin";

type PlatformJwtClaims = {
  user_role?: PlatformRole;
  app_metadata?: {
    role?: PlatformRole;
    user_role?: PlatformRole;
    connected_admin?: boolean;
  };
};

const decodeJwtClaims = (accessToken?: string | null): PlatformJwtClaims => {
  if (!accessToken) {
    return {};
  }

  try {
    const [, payload] = accessToken.split(".");
    if (!payload) {
      return {};
    }

    if (typeof globalThis.atob !== "function") {
      return {};
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const decoded = JSON.parse(globalThis.atob(padded)) as PlatformJwtClaims;

    return decoded;
  } catch {
    return {};
  }
};

export const useAccess = () => {
  const { user, session, loading, isAuthenticated, initAuth, signIn, signOut, refreshSession } =
    useAuth();
  const route = useRoute();

  /** True when there is no valid session — user is browsing in demo mode. */
  const isDemoMode = computed(() => !session.value?.user);

  /** Current access mode for UI and gating. */
  const accessMode = computed<AccessMode>(() =>
    isAuthenticated.value ? "authenticated" : "demo"
  );

  const jwtClaims = computed(() => decodeJwtClaims(session.value?.access_token));

  /** Role is sourced from the access token so custom auth-hook claims are visible client-side. */
  const role = computed<PlatformRole | undefined>(() => {
    return (
      jwtClaims.value.user_role ??
      jwtClaims.value.app_metadata?.user_role ??
      jwtClaims.value.app_metadata?.role
    );
  });

  const isConnectedAdmin = computed(() => role.value === "connected_admin");

  /**
   * Guard for persistence actions. If the user is in demo mode, redirects to login
   * with returnTo and returns false. If authenticated, returns true so the action can proceed.
   * @param returnPath - Optional path to return to after login; defaults to current route.
   */
  const requireAuthForPersistence = (returnPath?: string): boolean => {
    if (isAuthenticated.value) return true;
    const current = returnPath ?? (route?.fullPath && route.fullPath !== "/login" ? route.fullPath : "/");
    navigateTo(`/login?returnTo=${encodeURIComponent(current)}`);
    return false;
  };

  return {
    user: readonly(user),
    session: readonly(session),
    loading: readonly(loading),
    isAuthenticated,
    isDemoMode,
    accessMode,
    role,
    isConnectedAdmin,
    initAuth,
    signIn,
    signOut,
    refreshSession,
    requireAuthForPersistence,
  };
};
