<template>
  <header
    :class="mode ? 'absolute left-0 right-0 top-0 z-20' : 'relative z-20 w-full'"
  >
    <div
      :class="
        mode
          ? 'bg-linear-to-t from-transparent to-black/60'
          : 'bg-neutral-lightest border-b border-neutral-darkest'
      "
    >
      <div class="flex items-center h-16 md:h-20 px-6 gap-3">
        <NuxtLinkLocale to="/" class="font-display font-bold text-xl shrink-0 flex items-center gap-2">
          <img src="/img/icono-farclimate.png" alt="Logo" class="h-7"  />
          <div class="font-display font-bold text-xs leading-tight" v-if="!mode">
            FarClimate <br /> Transformation Hub
          </div>
        </NuxtLinkLocale>

        <nav
          class="hidden md:flex items-center gap-10 text-[13px] font-mono ml-6"
          :class="mode ? 'text-neutral-lightest' : 'text-neutral-darkest'"
        >
          <NuxtLinkLocale to="/explorer/">Solutions</NuxtLinkLocale>
          <NuxtLinkLocale to="/stories">Stories</NuxtLinkLocale>
          <NuxtLinkLocale to="/skills">Skills</NuxtLinkLocale>
          <NuxtLinkLocale to="/connected/dashboard">Connected Action</NuxtLinkLocale>
          <NuxtLinkLocale to="#about">About</NuxtLinkLocale>
        </nav>

        <div class="flex-1" />

        <!-- Language Switcher (segmented EN/ES) -->
        <div
          class="hidden sm:inline-flex items-stretch h-9 border"
          :class="mode ? 'border-neutral-lightest' : 'border-neutral-darkest'"
        >
          <button
            v-for="loc in availableLocales"
            :key="loc.code"
            type="button"
            @click="switchLanguage(loc.code)"
            :class="[
              'px-2.5 flex items-center font-mono uppercase text-2xs font-bold tracking-widest transition-colors',
              currentLocale === loc.code
                ? mode
                  ? 'bg-neutral-lightest text-neutral-darkest'
                  : 'bg-neutral-darkest text-neutral-lightest'
                : mode
                  ? 'bg-transparent text-neutral-lightest/70 hover:text-neutral-lightest'
                  : 'bg-transparent text-neutral-dark hover:text-neutral-darkest',
            ]"
          >
            {{ loc.code.toUpperCase() }}
          </button>
        </div>

        <!-- Demo / user info -->
        <template v-if="isDemoMode">
          <NuxtLinkLocale
            :to="explorerLoginLink"
            class="inline-flex items-center gap-2 h-9 px-3 border transition-colors"
            :class="
              mode
                ? 'border-neutral-lightest text-neutral-lightest hover:bg-neutral-lightest/10'
                : 'border-neutral-darkest text-neutral-darkest hover:bg-neutral-darkest/5'
            "
          >
            <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4" />
            <span class="font-mono uppercase text-2xs font-bold tracking-[0.12em]">Sign in</span>
          </NuxtLinkLocale>
        </template>
        <template v-else>
          <span
            class="hidden lg:inline font-mono text-2xs truncate max-w-[160px]"
            :class="mode ? 'text-neutral-lightest/80' : 'text-neutral-dark'"
            :title="user?.email"
          >
            {{ user?.email }}
          </span>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 h-9 px-2 transition-colors"
            :class="
              mode
                ? 'text-neutral-lightest/80 hover:text-neutral-lightest'
                : 'text-neutral-dark hover:text-neutral-darkest'
            "
            @click="handleLogout"
          >
            <span class="font-mono uppercase text-2xs font-bold tracking-[0.14em]">Log out</span>
            <UIcon name="mdi:arrow-top-right" class="w-3.5 h-3.5" />
          </button>
        </template>
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { useAccess } from "~/composables/useAccess";

const props = withDefaults(
  defineProps<{
    mode?: boolean;
  }>(),
  {
    mode: false,
  }
);

const { isDemoMode, user, signOut } = useAccess();
const route = useRoute();
const router = useRouter();

const explorerLoginLink = computed(() => {
  const returnTo =
    route?.fullPath && route.fullPath !== "/login"
      ? route.fullPath
      : "/explorer/explorer";
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
});

async function handleLogout() {
  await signOut();
  await router.push("/explorer/explorer");
}

const { locale, locales } = useI18n();
const switchLocalePath = useSwitchLocalePath();

const currentLocale = computed(() => locale.value);
const availableLocales = computed(() => locales.value);

function switchLanguage(localeCode: "en" | "es") {
  const path = switchLocalePath(localeCode);
  if (path) {
    navigateTo(path);
  }
}
</script>
