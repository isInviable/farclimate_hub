export default defineNuxtPlugin({
  name: 'auth',
  enforce: 'pre',
  async setup() {
    const { initAuth } = useAuth();
    await initAuth();
  },
});
