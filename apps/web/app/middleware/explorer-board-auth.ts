export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, initAuth, loading } = useAccess();

  if (loading.value) {
    await initAuth();
  }

  if (loading.value) {
    await new Promise<void>((resolve) => {
      const unwatch = watch(loading, (isLoading) => {
        if (!isLoading) {
          unwatch();
          resolve();
        }
      });
    });
  }

  if (!isAuthenticated.value) {
    const returnTo = to.fullPath || "/explorer/board";
    return navigateTo(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
});
