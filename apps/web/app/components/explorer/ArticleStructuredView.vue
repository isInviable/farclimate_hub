<template>
  <div class="flex gap-8">
    <!-- Main content -->
    <div :class="showIndex ? 'flex-1' : 'flex-1 max-w-4xl mx-auto'">
      <!-- Top Table of Contents for sidebar mode -->
      <div v-if="!showIndex && parsedSections.length > 0" class="mb-6">
        <div class="bg-white rounded-lg shadow border border-gray-100 p-4">
          <p class="font-bold text-xs px-2 py-2 mb-4">{{ $t('common.tableOfContents') || 'Table of Contents' }}</p>
          <ul class="space-y-2">
            <li v-for="(section, idx) in parsedSections" :key="'toc-top-' + idx">
              <a :href="'#' + getSectionId(section.title)" class="flex items-center gap-2 text-gray-700 hover:text-sky-600 transition-colors">
                <Icon v-if="section.icon" :name="section.icon" class="text-lg text-sky-500" />
                <span class="truncate">{{ section.title }}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div v-if="loading" class="flex items-center gap-2 text-sky-600">
        <span class="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-500"></span>
        <span>{{ $t('common.loading') }}</span>
      </div>
      <div v-else-if="error" class="text-red-500">
        <div>{{ error }}</div>
        <button @click="fetchStructured" class="mt-2 px-3 py-1 bg-sky-100 text-sky-700 rounded hover:bg-sky-200">{{ $t('common.retry') }}</button>
      </div>
      <div v-else-if="markdown">
        <template v-if="parsedSections.length > 0">
          <div v-for="(section, idx) in parsedSections" :key="idx" :id="getSectionId(section.title)" class="mb-8">
            <div class="bg-white rounded-lg border border-gray-200 shadow p-6 flex flex-col gap-2">
              <div class="flex items-center gap-3 mb-2">
                <Icon v-if="section.icon" :name="section.icon" class="text-3xl text-sky-600" />
                <h2 class="text-2xl font-bold text-gray-900">{{ section.title }}</h2>
              </div>
              <div class="prose prose-md max-w-none text-gray-800" v-html="md.render(section.content)" />
            </div>
          </div>
        </template>
        <template v-else>
          <div class="bg-white rounded-lg border border-gray-200 shadow p-6 flex flex-col gap-2">
            <div class="prose prose-md max-w-none text-gray-800" v-html="md.render(markdown)" />
          </div>
        </template>
      </div>
      <div v-else class="text-gray-500 italic">{{ $t('common.noData') }}</div>
    </div>
    <!-- Section Index -->
    <aside v-if="showIndex" class="w-64 hidden lg:block">
      <div class="sticky top-8">
        <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-100 text-xs">
          <p class="font-bold text-xs px-2 py-2 mb-4">{{ $t('common.tableOfContents') || 'Table of Contents' }}</p>
          <ul class="space-y-2">
            <li v-for="(section, idx) in parsedSections" :key="'toc-' + idx">
              <a :href="'#' + getSectionId(section.title)" class="flex items-center gap-2 text-gray-700 hover:text-sky-600 transition-colors">
                <Icon v-if="section.icon" :name="section.icon" class="text-lg text-sky-500" />
                <span class="truncate">{{ section.title }}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import MarkdownIt from 'markdown-it';

const props = defineProps({
  fulltext: { type: String, required: true },
  language: { type: String, required: true },
  documentId: { type: [String, Number], required: true },
  showIndex: { type: Boolean, default: true },
});

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
const loading = ref(false);
const error = ref('');
const markdown = ref('');

const sectionIcons = {
  'Context': 'mdi:earth',
  'Challenges': 'mdi:alert-circle-outline',
  'Policy context': 'mdi:scale-balance',
  'Legal aspects': 'mdi:gavel',
  'Objectives': 'mdi:target',
  'Solution(s) implemented': 'mdi:lightbulb-on-outline',
  'Implementation phases and timeline': 'mdi:timeline-clock-outline',
  'Success and limiting factors': 'mdi:star-check-outline',
  'Benefits': 'mdi:hand-coin-outline',
  'Lessons learnt': 'mdi:book-open-outline',
  'Transferability': 'mdi:swap-horizontal',
  'SDGs': 'mdi:earth-box',
};

// Improved markdown section parsing
const parsedSections = computed(() => {
  if (!markdown.value) return [];
  // Match both ## and ### headers, but treat ## as main sections
  const regex = /^##\s+(.+)$/gm;
  const matches = [...markdown.value.matchAll(regex)];
  if (!matches.length) return [];
  const sections = [];
  let lastIndex = 0;
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const title = match[1].trim();
    const start = match.index;
    const end = i + 1 < matches.length ? matches[i + 1].index : markdown.value.length;
    const content = markdown.value.slice(start + match[0].length, end).trim();
    const icon = sectionIcons[title] || null;
    sections.push({ title, content, icon });
    lastIndex = end;
  }
  return sections;
});

function getSectionId(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

async function fetchStructured() {
  if (!props.fulltext) return;
  loading.value = true;
  error.value = '';
  markdown.value = '';
  try {
    const res = await $fetch('/api/structureArticle', {
      method: 'POST',
      body: { fulltext: props.fulltext, language: props.language, documentId: props.documentId },
    });
    markdown.value = res.markdown;
  } catch (e) {
    error.value = e?.message || 'Failed to structure article.';
  } finally {
    loading.value = false;
  }
}

onMounted(fetchStructured);
watch(() => [props.fulltext, props.language, props.documentId], fetchStructured);
</script>

<style scoped>
.prose-lg h2 {
  font-size: 2rem;
  margin-top: 2.5rem;
  margin-bottom: 1.25rem;
  color: #0f172a;
  font-weight: 700;
  display: flex;
  align-items: center;
}
.prose-lg ul, .prose-lg ol {
  margin-bottom: 1.5rem;
}
.mb-10 {
  margin-bottom: 2.5rem;
}
</style> 