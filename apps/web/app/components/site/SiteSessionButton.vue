<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { isDemoMode, signOut } = useAccess()

const loginLink = computed(() => {
  const returnTo = route.fullPath && route.fullPath !== '/login' ? route.fullPath : '/'
  return `/login?returnTo=${encodeURIComponent(returnTo)}`
})

async function handleLogout() {
  await signOut()
  await router.push('/')
}
</script>

<template>
  <NuxtLink
    v-if="isDemoMode"
    :to="loginLink"
    class="inline-flex h-9 items-center bg-adapt-orange px-3 font-adapt-keyword text-sm tracking-wide text-adapt-ink"
  >
    {{ $t('auth.signIn') }}
  </NuxtLink>
  <button
    v-else
    type="button"
    class="inline-flex h-9 items-center border border-adapt-ink bg-white px-3 font-adapt-keyword text-sm tracking-wide text-adapt-ink"
    @click="handleLogout"
  >
    {{ $t('auth.logOut') }}
  </button>
</template>
