<script setup lang="ts">
definePageMeta({
  layout: false,
});

const { signIn, loading } = useAuth();
const route = useRoute();
const router = useRouter();

const email = ref("");
const password = ref("");
const error = ref("");
const isSubmitting = ref(false);

const returnTo = computed(() => {
  const returnToParam = route.query.returnTo;
  return typeof returnToParam === "string" ? returnToParam : "/admin";
});

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

    if (data) {
      // Successfully logged in, redirect to intended page or admin
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
          </div>
        </form>
      </UCard>

      <div class="text-center">
        <NuxtLink
          to="/"
          class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          ← Back to home
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
