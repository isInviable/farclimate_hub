/**
 * Read/write user preferences from `human.profiles.preferences` JSONB column.
 * All writes are fire-and-forget — failures are logged but never block the UI.
 */
export function useProfilePreferences() {
  const supabase = useSupabaseClient();
  const { isAuthenticated } = useAccess();

  async function getPreferences(): Promise<Record<string, unknown> | null> {
    if (!isAuthenticated.value) return null;
    try {
      const { data, error } = await supabase
        .schema("human")
        .from("profiles")
        .select("preferences")
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return (data.preferences as Record<string, unknown>) ?? {};
    } catch (e) {
      console.error("[useProfilePreferences] Failed to read preferences", e);
      return null;
    }
  }

  /**
   * Merge a single key into `preferences` JSONB (read-modify-write).
   * Non-blocking: call without await. Errors are logged to console.
   */
  function setPreference(key: string, value: unknown): void {
    if (!isAuthenticated.value) return;
    (async () => {
      try {
        const current = await getPreferences();
        if (current === null) return; // no profile row — skip silently
        const merged = { ...current, [key]: value };
        const { error } = await supabase
          .schema("human")
          .from("profiles")
          .update({ preferences: merged as unknown as Record<string, unknown> })
          .not("id", "is", null);
        if (error) throw error;
      } catch (e) {
        console.error("[useProfilePreferences] Failed to write preference", key, e);
      }
    })();
  }

  async function getLastProjectId(): Promise<string | null> {
    const prefs = await getPreferences();
    if (!prefs) return null;
    const id = prefs.lastProjectId;
    return typeof id === "string" ? id : null;
  }

  function setLastProjectId(id: string): void {
    setPreference("lastProjectId", id);
  }

  return {
    getPreferences,
    setPreference,
    getLastProjectId,
    setLastProjectId,
  };
}
