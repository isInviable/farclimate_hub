// https://nuxt.com/docs/api/configuration/nuxt-config
// import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxtjs/google-fonts',
    '@nuxtjs/i18n',
    '@vueuse/nuxt',
    '@pinia/nuxt'
  ],
  components: [
    {
      path: '~/components/explorer',
      pathPrefix: false
    },
    {
      path: '~/components/connected',
      pathPrefix: false
    },
    {
      path: '~/components/global',
      pathPrefix: false
    },
    {
      path: '~/components/home',
      pathPrefix: false
    },
    {
      path: '~/components/skills',
      pathPrefix: false
    }
  ],
  devtools: {
    enabled: true
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    podcastArtifactBucket: process.env.NUXT_PODCAST_ARTIFACT_BUCKET || 'human-artifacts',
    podcastSummarizeModel: process.env.NUXT_PODCAST_SUMMARIZE_MODEL || 'gemini-3.1-flash-lite-preview',
    googleTtsApiKey: process.env.GOOGLE_TTS_API_KEY || process.env.NUXT_GOOGLE_TTS_API_KEY || '',
    podcastTtsLanguageCode: process.env.NUXT_PODCAST_TTS_LANGUAGE_CODE || 'en-US',
    podcastTtsVoiceName: process.env.NUXT_PODCAST_TTS_VOICE_NAME || '',
    podcastTtsSsmlGender: process.env.NUXT_PODCAST_TTS_SSML_GENDER || 'NEUTRAL',
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
      mapbox: {
        accessToken: process.env.NUXT_PUBLIC_MAPBOX_API_KEY || ''
      }
    }
  },
  routeRules: {
    '/': { prerender: true },
    '/connected/**': { ssr: false, },
    '/explorer/**': { ssr: false, }
  },
  compatibilityDate: '2025-01-15',
  vite: {
    // plugins: [tailwindcss()],
    resolve: {
      alias: {
        'venn.js': path.resolve(__dirname, './node_modules/venn.js/build/venn.js')
      }
    }
  },
  eslint: {
    config: {
      stylistic: false
      // {
      // commaDangle: 'never',
      // braceStyle: '1tbs'

      // }
    }
  },
   ui: {
    colorMode: false,
    
  },
  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'es', name: 'Español', file: 'es.json' }
    ],
    langDir: 'locales/',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    }
  }
})
