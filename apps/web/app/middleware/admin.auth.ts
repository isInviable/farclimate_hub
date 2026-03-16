export default defineNuxtRouteMiddleware(async (to, _from) => {
  const { isAuthenticated, isConnectedAdmin, initAuth, loading } = useAccess();

  // Initialize auth if not already done
  if (loading.value) {
    await initAuth();
  }

  // Wait for auth to finish loading
  if (loading.value) {
    await new Promise((resolve) => {
      const unwatch = watch(loading, (isLoading) => {
        if (!isLoading) {
          unwatch();
          resolve(undefined);
        }
      });
    });
  }

  // Check if user is authenticated
  if (!isAuthenticated.value) {
    // Store the intended destination
    const returnTo = to.fullPath;
    return navigateTo(`/admin/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  if (!isConnectedAdmin.value) {
    const returnTo = to.fullPath;
    return navigateTo(
      `/admin/login?returnTo=${encodeURIComponent(returnTo)}&reason=connected-admin-required`
    );
  }
});
