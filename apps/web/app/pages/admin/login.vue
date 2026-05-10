<script setup lang="ts">
definePageMeta({
  layout: false,
});

const { signIn, signOut, initAuth, refreshSession, loading, isAuthenticated, isConnectedAdmin } =
  useAccess();
const route = useRoute();
const router = useRouter();

const email = ref("");
const password = ref("");
const error = ref("");
const isSubmitting = ref(false);
const isRefreshingAccess = ref(false);

const returnTo = computed(() => {
  const returnToParam = route.query.returnTo;
  return typeof returnToParam === "string" ? returnToParam : "/admin";
});

const reason = computed(() => {
  const reasonParam = route.query.reason;
  return typeof reasonParam === "string" ? reasonParam : "";
});

const roleMessage = computed(() =>
  reason.value === "connected-admin-required"
    ? "This account is signed in, but it does not have Connected Action admin access."
    : ""
);

onMounted(async () => {
  if (loading.value) {
    await initAuth();
  }

  if (isAuthenticated.value && isConnectedAdmin.value) {
    await router.replace(returnTo.value);
  }
});

const refreshAdminAccess = async () => {
  error.value = "";
  isRefreshingAccess.value = true;

  try {
    const { error: refreshError } = await refreshSession();
    if (refreshError) {
      error.value = refreshError.message || "Unable to refresh admin access right now.";
      return;
    }

    if (isConnectedAdmin.value) {
      await router.push(returnTo.value);
      return;
    }

    error.value =
      "This session still does not include connected admin access. If access was just granted, sign out and sign back in.";
  } finally {
    isRefreshingAccess.value = false;
  }
};

const handleSignOut = async () => {
  await signOut();
};

const handleLogin = async () => {
  error.value = "";
  isSubmitting.value = true;

  try {
    if (!email.value || !password.value) {
      error.value = "Please enter both email and password";
      return;
    }

    const { data, error: signInError } = await signIn(
      email.value,
      password.value
    );

    if (signInError) {
      error.value =
        signInError.message || "Invalid email or password. Please try again.";
      return;
    }

    if (!isConnectedAdmin.value) {
      error.value =
        "This account can sign in, but it does not have Connected Action admin access.";
      return;
    }

    if (data) {
      await router.push(returnTo.value);
    }
  } catch (err: any) {
    error.value = err.message || "An unexpected error occurred";
  } finally {
    isSubmitting.value = false;
  }
};

// Handle Enter key press
const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === "Enter" && !isSubmitting.value) {
    handleLogin();
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="max-w-md w-full space-y-8 p-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Login
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Sign in to access the admin panel
        </p>
      </div>

      <UCard>
        <form @submit.prevent="handleLogin" @keypress="handleKeyPress">
          <div class="space-y-4">
            <UAlert
              v-if="roleMessage"
              color="warning"
              variant="soft"
              :title="roleMessage"
              description="Only connected_admin users can enter this area."
            />

            <UFormField label="Email" name="email" required>
              <UInput
                v-model="email"
                type="email"
                placeholder="your@email.com"
                :disabled="isSubmitting"
                autocomplete="email"
                size="lg"
              />
            </UFormField>

            <UFormField label="Password" name="password" required>
              <UInput
                v-model="password"
                type="password"
                placeholder="Enter your password"
                :disabled="isSubmitting"
                autocomplete="current-password"
                size="lg"
              />
            </UFormField>

            <UAlert
              v-if="error"
              color="error"
              variant="soft"
              :title="error"
              class="mt-4"
            />

            <UButton
              type="submit"
              block
              size="lg"
              :loading="isSubmitting"
              :disabled="isSubmitting"
              class="mt-6"
            >
              Sign In
            </UButton>

            <UButton
              v-if="isAuthenticated && !isConnectedAdmin"
              type="button"
              block
              variant="soft"
              color="neutral"
              :loading="isRefreshingAccess"
              :disabled="isSubmitting || isRefreshingAccess"
              @click="refreshAdminAccess"
            >
              Refresh admin access
            </UButton>

            <UButton
              v-if="isAuthenticated && !isConnectedAdmin"
              type="button"
              block
              variant="ghost"
              color="neutral"
              :disabled="isSubmitting || isRefreshingAccess"
              @click="handleSignOut"
            >
              Sign out and switch account
            </UButton>
          </div>
        </form>
      </UCard>

      <div class="text-center">
        <NuxtLinkLocale
          to="/"
          class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          ← Back to home
        </NuxtLinkLocale>
      </div>
    </div>
  </div>
</template>
