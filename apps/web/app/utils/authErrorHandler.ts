import type { PostgrestError } from "@supabase/supabase-js";

export const isAuthError = (error: any): boolean => {
  if (!error) return false;
  
  // Check for Supabase auth errors
  if (error.message) {
    const message = error.message.toLowerCase();
    return (
      message.includes("jwt") ||
      message.includes("auth") ||
      message.includes("unauthorized") ||
      message.includes("permission denied") ||
      message.includes("row-level security") ||
      message.includes("new row violates row-level security")
    );
  }

  // Check for PostgrestError
  if ((error as PostgrestError).code) {
    const code = (error as PostgrestError).code;
    return code === "PGRST301" || code === "42501"; // Permission denied codes
  }

  // Check status code
  if (error.status === 401 || error.status === 403) {
    return true;
  }

  return false;
};

export const handleAuthError = (error: any, router: any) => {
  if (isAuthError(error)) {
    // Redirect to login with return path
    const currentPath = router.currentRoute.value.fullPath;
    router.push(`/login?returnTo=${encodeURIComponent(currentPath)}`);
    return true;
  }
  return false;
};
