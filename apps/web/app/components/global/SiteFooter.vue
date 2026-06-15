<template>
  <footer v-if="footer" class="bg-neutral-900 text-neutral-50 py-20">
    <div class="container mx-auto max-w-7xl px-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-16">
        <div>
          <NuxtLinkLocale to="/" class="inline-block">
            <img src="/img/logo.svg" alt="Transformation HUB" class="h-9 brightness-0 invert" />
          </NuxtLinkLocale>
        </div>
        <div>
          <p class="font-mono font-semibold mb-4">{{ footer.mainMenu.title }}</p>
          <ul class="space-y-2 font-mono text-sm">
            <li v-for="link in footer.mainMenu.links" :key="link.label">
              <NuxtLinkLocale v-if="link.to" :to="link.to">{{ link.label }}</NuxtLinkLocale>
              <a
                v-else-if="link.href"
                :href="link.href"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ link.label }}
              </a>
              <span v-else>{{ link.label }}</span>
            </li>
          </ul>
        </div>
        <div>
          <p class="font-mono font-semibold mb-4">{{ footer.followUs.title }}</p>
          <ul class="space-y-2 font-mono text-sm">
            <li >
              <a href="https://farclimate-project.eu" target="_blank" rel="noopener noreferrer">FARCLIMATE Project</a>
            </li>
            <li v-for="link in footer.followUs.links" :key="link.label">
              <a :href="link.href" target="_blank" rel="noopener noreferrer">{{ link.label }}</a>
            </li>
            
          </ul>
        </div>
      </div>
      <div
        class="mt-10 border-t border-neutral-50/20 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-sm"
      >
        <a
          v-if="footer.copyrightHref"
          :href="footer.copyrightHref"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ footer.copyright }}
        </a>
        <p v-else>{{ footer.copyright }}</p>
        <div class="flex flex-wrap gap-6 underline">
          <a
            v-for="item in footer.legal"
            :key="item.label"
            :href="item.href ?? '#'"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ item.label }}
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script lang="ts" setup>
const { footer } = await useFooterContent()
</script>
