// Legacy export for backward compatibility
// New code should use useSupabaseClient() composable instead
import { useSupabaseClient } from "~/composables/useSupabaseClient";

export const supabase = useSupabaseClient();
