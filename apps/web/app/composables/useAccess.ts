/**
 * Central access-state API for the platform.
 * Derives demo vs authenticated mode from Supabase session and provides
 * a shared guard for persistence actions. Extensible for future elevated roles (e.g. connected_admin).
 *
 * Persistence guard usage:
 * - `promptAuthForPersistence(context)` — modal-first for user-initiated explorer actions (pin, board).
 * - `requireAuthForPersistence(returnPath?)` — redirect to login for direct URLs and programmatic writes.
 */

export type AccessMode = "demo" | "authenticated";

export type AuthPromptContext = "pin" | "board" | "generic";

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

const authPromptOpen = ref(false);
const authPromptContext = ref<AuthPromptContext>("generic");
const authPromptReturnPath = ref("/");

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

function resolveReturnPath(route: ReturnType<typeof useRoute>, returnPath?: string): string {
  if (returnPath) return returnPath;
  const fullPath = route?.fullPath;
  return fullPath && fullPath !== "/login" ? fullPath : "/";
}

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

  const authPromptLoginLink = computed(() => {
    const path = authPromptReturnPath.value || "/";
    return `/login?returnTo=${encodeURIComponent(path)}`;
  });

  /**
   * Modal-first guard for user-initiated persistence entry points.
   * Returns true when authenticated; otherwise opens the auth-required modal and returns false.
   */
  const promptAuthForPersistence = (
    context: AuthPromptContext = "generic",
    returnPath?: string,
  ): boolean => {
    if (isAuthenticated.value) return true;
    authPromptContext.value = context;
    authPromptReturnPath.value = resolveReturnPath(route, returnPath);
    authPromptOpen.value = true;
    return false;
  };

  function closeAuthPrompt() {
    authPromptOpen.value = false;
  }

  /**
   * Guard for persistence actions. If the user is in demo mode, redirects to login
   * with returnTo and returns false. If authenticated, returns true so the action can proceed.
   * @param returnPath - Optional path to return to after login; defaults to current route.
   */
  const requireAuthForPersistence = (returnPath?: string): boolean => {
    if (isAuthenticated.value) return true;
    const current = resolveReturnPath(route, returnPath);
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
    promptAuthForPersistence,
    authPromptOpen,
    authPromptContext,
    authPromptReturnPath,
    authPromptLoginLink,
    closeAuthPrompt,
  };
};
