<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";

definePageMeta({
  layout: false,
});

const { signIn, sendOtp, verifyOtp } = useAuth();
const route = useRoute();
const router = useRouter();

type AuthMode = "otp" | "password";
const step = ref<"form" | "otp">("form");
const activeTab = ref("signin");
const authMode = ref<AuthMode>(route.query.method === "password" ? "password" : "otp");
const email = ref("");
const name = ref("");
const otpCode = ref<number[]>([]);
const password = ref("");
const error = ref("");
const isSubmitting = ref(false);

const tabs: TabsItem[] = [
  { label: "Sign in", value: "signin" },
  { label: "Sign up", value: "signup" },
];

const COOLDOWN_SECONDS = 60;
const cooldownRemaining = ref(0);
let cooldownInterval: ReturnType<typeof setInterval> | null = null;

const returnTo = computed(() => {
  const param = route.query.returnTo;
  return typeof param === "string" ? param : "/";
});

const isValidEmail = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value),
);

const isSignUp = computed(() => activeTab.value === "signup");

function startCooldown() {
  cooldownRemaining.value = COOLDOWN_SECONDS;
  if (cooldownInterval) clearInterval(cooldownInterval);
  cooldownInterval = setInterval(() => {
    cooldownRemaining.value--;
    if (cooldownRemaining.value <= 0 && cooldownInterval) {
      clearInterval(cooldownInterval);
      cooldownInterval = null;
    }
  }, 1000);
}

function mapAuthError(err: any): string {
  const msg = err?.message?.toLowerCase() ?? "";
  if (msg.includes("rate") || msg.includes("too many"))
    return "Too many requests. Please wait a moment before trying again.";
  if (msg.includes("expired"))
    return "The code has expired. Please request a new one.";
  if (msg.includes("invalid") || msg.includes("otp"))
    return "Invalid code. Please check and try again.";
  return err?.message || "An unexpected error occurred. Please try again.";
}

function clearError() {
  error.value = "";
}

function switchToPassword() {
  authMode.value = "password";
  clearError();
  router.replace({ query: { ...route.query, method: "password" } });
}

function switchToOtp() {
  authMode.value = "otp";
  clearError();
  const { method: _, ...rest } = route.query;
  router.replace({ query: rest });
}

const handleSendOtp = async () => {
  clearError();

  if (!email.value) {
    error.value = "Please enter your email address.";
    return;
  }
  if (!isValidEmail.value) {
    error.value = "Please enter a valid email address.";
    return;
  }
  if (isSignUp.value && !name.value.trim()) {
    error.value = "Please enter your name.";
    return;
  }

  isSubmitting.value = true;
  try {
    const { error: otpError } = await sendOtp(
      email.value,
      isSignUp.value ? name.value.trim() : undefined,
    );
    if (otpError) {
      error.value = mapAuthError(otpError);
      return;
    }
    step.value = "otp";
    otpCode.value = [] as number[];
    startCooldown();
  } catch (err: unknown) {
    error.value =
      err instanceof Error ? err.message : "An unexpected error occurred.";
  } finally {
    isSubmitting.value = false;
  }
};

const handleVerifyOtp = async (code: number[]) => {
  clearError();
  const token = code.join("");
  if (token.length !== 6) return;

  isSubmitting.value = true;
  try {
    const { error: verifyError } = await verifyOtp(email.value, token);
    if (verifyError) {
      error.value = mapAuthError(verifyError);
      otpCode.value = [] as number[];
      return;
    }
    await router.push(returnTo.value);
  } catch (err: unknown) {
    error.value =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    otpCode.value = [] as number[];
  } finally {
    isSubmitting.value = false;
  }
};

const handleResend = async () => {
  if (cooldownRemaining.value > 0) return;
  clearError();
  isSubmitting.value = true;
  try {
    const { error: resendError } = await sendOtp(
      email.value,
      isSignUp.value ? name.value.trim() : undefined,
    );
    if (resendError) {
      error.value = mapAuthError(resendError);
      return;
    }
    startCooldown();
  } catch (err: unknown) {
    error.value =
      err instanceof Error ? err.message : "An unexpected error occurred.";
  } finally {
    isSubmitting.value = false;
  }
};

const handlePasswordLogin = async () => {
  clearError();
  if (!email.value || !password.value) {
    error.value = "Please enter both email and password.";
    return;
  }

  isSubmitting.value = true;
  try {
    const { data, error: signInError } = await signIn(
      email.value,
      password.value,
    );
    if (signInError) {
      error.value = signInError.message || "Invalid email or password.";
      return;
    }
    if (data) {
      await router.push(returnTo.value);
    }
  } catch (err: unknown) {
    error.value =
      err instanceof Error ? err.message : "An unexpected error occurred.";
  } finally {
    isSubmitting.value = false;
  }
};

const goBackToForm = () => {
  step.value = "form";
  clearError();
  otpCode.value = [] as number[];
};

watch(activeTab, () => {
  clearError();
});

onUnmounted(() => {
  if (cooldownInterval) clearInterval(cooldownInterval);
});
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"
  >
    <div class="max-w-md w-full space-y-8 p-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          <template v-if="step === 'otp'">Check your email</template>
          <template v-else-if="authMode === 'password'">Sign in</template>
          <template v-else>Welcome</template>
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <template v-if="step === 'otp'">
            We sent a 6-digit code to <strong>{{ email }}</strong>
          </template>
          <template v-else-if="authMode === 'password'">
            Sign in with your email and password.
          </template>
          <template v-else>
            In demo mode your browsing isn't saved. Sign in or create an account
            to save your work.
          </template>
        </p>
      </div>

      <!-- OTP verification step -->
      <UCard v-if="step === 'otp'">
        <div class="space-y-6">
          <div class="flex flex-col items-center gap-4">
            <UPinInput
              v-model="otpCode"
              :length="6"
              type="number"
              otp
              size="lg"
              placeholder="○"
              :disabled="isSubmitting"
              @complete="handleVerifyOtp"
            />

            <p v-if="isSubmitting" class="text-sm text-gray-500">
              Verifying…
            </p>
          </div>

          <UAlert
            v-if="error"
            color="error"
            variant="soft"
            :title="error"
          />

          <div class="flex items-center justify-between text-sm">
            <UButton
              variant="link"
              size="sm"
              :disabled="isSubmitting"
              @click="goBackToForm"
            >
              ← Change email
            </UButton>
            <UButton
              variant="link"
              size="sm"
              :disabled="cooldownRemaining > 0 || isSubmitting"
              @click="handleResend"
            >
              {{
                cooldownRemaining > 0
                  ? `Resend in ${cooldownRemaining}s`
                  : "Resend code"
              }}
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Password login (full-page replacement) -->
      <template v-else-if="authMode === 'password'">
        <UCard>
          <form @submit.prevent="handlePasswordLogin">
            <div class="space-y-4">
              <UFormField label="Email" name="pwd-email" required>
                <UInput
                  v-model="email"
                  type="email"
                  placeholder="your@email.com"
                  :disabled="isSubmitting"
                  autocomplete="email"
                  size="lg"
                  class="w-full"
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
                  class="w-full"
                />
              </UFormField>

              <UAlert
                v-if="error"
                color="error"
                variant="soft"
                :title="error"
              />

              <UButton
                type="submit"
                block
                size="lg"
                :loading="isSubmitting"
                :disabled="isSubmitting"
                class="mt-2"
              >
                Sign in
              </UButton>
            </div>
          </form>
        </UCard>

        <div class="text-center">
          <UButton
            variant="link"
            size="sm"
            color="neutral"
            @click="switchToOtp"
          >
            ← Sign in with email code instead
          </UButton>
        </div>
      </template>

      <!-- OTP form step (default) -->
      <template v-else>
        <UTabs
          v-model="activeTab"
          :items="tabs"
          :content="false"
          class="w-full"
        />

        <UCard>
          <form @submit.prevent="handleSendOtp">
            <div class="space-y-4">
              <UFormField
                v-if="isSignUp"
                label="Your name"
                name="name"
                required
              >
                <UInput
                  v-model="name"
                  type="text"
                  placeholder="How should we call you?"
                  :disabled="isSubmitting"
                  autocomplete="name"
                  size="lg"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Email" name="email" required class="w-full">
                <UInput
                  v-model="email"
                  type="email"
                  placeholder="your@email.com"
                  :disabled="isSubmitting"
                  autocomplete="email"
                  size="lg"
                  class="w-full"
                />
              </UFormField>

              <UAlert
                v-if="error"
                color="error"
                variant="soft"
                :title="error"
              />

              <UButton
                type="submit"
                block
                size="lg"
                :loading="isSubmitting"
                :disabled="isSubmitting"
                class="mt-2"
              >
                {{ isSignUp ? "Create account" : "Continue" }}
              </UButton>
            </div>
          </form>
        </UCard>

        <div class="text-center">
          <UButton
            variant="link"
            size="sm"
            color="neutral"
            @click="switchToPassword"
          >
            Sign in with password instead
          </UButton>
        </div>
      </template>

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
