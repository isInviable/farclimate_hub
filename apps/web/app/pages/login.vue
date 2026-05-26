<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";

definePageMeta({
  layout: false,
});

const { signIn, sendOtp, verifyOtp } = useAuth();
const { t } = useI18n();
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

const tabs = computed<TabsItem[]>(() => [
  { label: t("auth.tabs.signIn"), value: "signin" },
  { label: t("auth.tabs.signUp"), value: "signup" },
]);

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
    return t("auth.errors.rateLimit");
  if (msg.includes("expired")) return t("auth.errors.expired");
  if (msg.includes("invalid") || msg.includes("otp"))
    return t("auth.errors.invalidOtp");
  return err?.message || t("auth.errors.unexpected");
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
    error.value = t("auth.validation.emailRequired");
    return;
  }
  if (!isValidEmail.value) {
    error.value = t("auth.validation.emailInvalid");
    return;
  }
  if (isSignUp.value && !name.value.trim()) {
    error.value = t("auth.validation.nameRequired");
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
      err instanceof Error ? err.message : t("auth.errors.unexpected");
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
      err instanceof Error ? err.message : t("auth.errors.unexpected");
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
      err instanceof Error ? err.message : t("auth.errors.unexpected");
  } finally {
    isSubmitting.value = false;
  }
};

const handlePasswordLogin = async () => {
  clearError();
  if (!email.value || !password.value) {
    error.value = t("auth.validation.emailPasswordRequired");
    return;
  }

  isSubmitting.value = true;
  try {
    const { data, error: signInError } = await signIn(
      email.value,
      password.value,
    );
    if (signInError) {
      error.value = signInError.message || t("auth.errors.invalidCredentials");
      return;
    }
    if (data) {
      await router.push(returnTo.value);
    }
  } catch (err: unknown) {
    error.value =
      err instanceof Error ? err.message : t("auth.errors.unexpected");
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
          <template v-if="step === 'otp'">{{ $t('auth.headings.checkEmail') }}</template>
          <template v-else-if="authMode === 'password'">{{ $t('auth.headings.signIn') }}</template>
          <template v-else>{{ $t('auth.headings.welcome') }}</template>
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <template v-if="step === 'otp'">
            {{ $t('auth.subtitle.otpSent', { email }) }}
          </template>
          <template v-else-if="authMode === 'password'">
            {{ $t('auth.subtitle.password') }}
          </template>
          <template v-else>
            {{ $t('auth.subtitle.demo') }}
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
              {{ $t('auth.otp.verifying') }}
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
              {{ $t('auth.otp.changeEmail') }}
            </UButton>
            <UButton
              variant="link"
              size="sm"
              :disabled="cooldownRemaining > 0 || isSubmitting"
              @click="handleResend"
            >
              {{
                cooldownRemaining > 0
                  ? $t('auth.otp.resendIn', { seconds: cooldownRemaining })
                  : $t('auth.otp.resendCode')
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
              <UFormField :label="$t('auth.fields.email')" name="pwd-email" required>
                <UInput
                  v-model="email"
                  type="email"
                  :placeholder="$t('auth.fields.emailPlaceholder')"
                  :disabled="isSubmitting"
                  autocomplete="email"
                  size="lg"
                  class="w-full"
                />
              </UFormField>

              <UFormField :label="$t('auth.fields.password')" name="password" required>
                <UInput
                  v-model="password"
                  type="password"
                  :placeholder="$t('auth.fields.passwordPlaceholder')"
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
                {{ $t('auth.actions.signIn') }}
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
            {{ $t('auth.actions.signInWithCode') }}
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
                :label="$t('auth.fields.name')"
                name="name"
                required
              >
                <UInput
                  v-model="name"
                  type="text"
                  :placeholder="$t('auth.fields.namePlaceholder')"
                  :disabled="isSubmitting"
                  autocomplete="name"
                  size="lg"
                  class="w-full"
                />
              </UFormField>

              <UFormField :label="$t('auth.fields.email')" name="email" required class="w-full">
                <UInput
                  v-model="email"
                  type="email"
                  :placeholder="$t('auth.fields.emailPlaceholder')"
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
                {{ isSignUp ? $t('auth.actions.createAccount') : $t('auth.actions.continue') }}
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
            {{ $t('auth.actions.signInWithPassword') }}
          </UButton>
        </div>
      </template>

      <div class="text-center">
        <NuxtLinkLocale
          to="/"
          class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          {{ $t('auth.backToHome') }}
        </NuxtLinkLocale>
      </div>
    </div>
  </div>
</template>
