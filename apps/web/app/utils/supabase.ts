// Deprecated: legacy entry point for Supabase.
// New code should use the `useSupabaseClient()` composable directly
// inside Nuxt setup, plugins, or server handlers.
//
// This file intentionally only re-exports the composable so that
// importing it never triggers Nuxt composables at module-evaluation time.
export { useSupabaseClient } from "~/composables/useSupabaseClient";
