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
    }
  ],
  devtools: {
    enabled: true
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
      mapbox: {
        accessToken: process.env.NUXT_PUBLIC_MAPBOX_API_KEY || ''
      }
    }
  },
  routeRules: {
    '/': { prerender: true }
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
    colorMode: false
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
