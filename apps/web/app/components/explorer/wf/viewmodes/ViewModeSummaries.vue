<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <div class="text-sm text-gray-600">AI Generated Summaries</div>
    </div>
    <!-- Loading Spinner -->
    <div
      v-if="waiting"
      class="mt-8 flex flex-col items-center justify-center space-y-4"
    >
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"
      ></div>
      <p class="text-gray-600">Generating AI summaries...</p>
    </div>
    <!-- Summaries Content -->
    <div v-else-if="summaries" class="overflow-y-auto">
      <div
        v-for="summary in summaries"
        :key="summary.title"
        class="mb-8 p-4 border rounded-lg bg-white grid grid-cols-6 gap-2"
      >
        <div class="col-span-4">
          <h3 class="text-lg font-bold mb-2">{{ summary.title }}</h3>
          <div
            class="prose mb-4 prose-sm"
            v-html="md.render(summary.description)"
          ></div>
        </div>
        <div
          v-if="summary.relatedArticles && summary.relatedArticles.length"
          class="col-span-2"
        >
          <uCollapsible>
            <uButton
            class="group justify-end items-end"
            block
              :label="summary.relatedArticles.length + ' related articles' "
              trailing-icon="i-lucide-chevron-down"
              :ui="{
                trailingIcon:
                  'group-data-[state=open]:rotate-180 transition-transform duration-200',
              }"
              variant="subtle"
              color="neutral"
            />
            <template #content>
              <div class="space-y-2 pt-2">
                <div
                  v-for="articleId in summary.relatedArticles"
                  :key="articleId"
                  class="p-2 hover:bg-gray-50 rounded cursor-pointer text-sm"
                  @click="handleArticleClick(articleId)"
                >
                  {{ getArticleTitle(articleId) }}
                </div>
              </div>
            </template>
          </uCollapsible>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-gray-500 mt-8">
      No summaries available. Please perform a search first.
    </div>
  </div>
</template>
<script setup>
import { ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import MarkdownIt from "markdown-it";

const { locale } = useI18n();

const props = defineProps({
  hits: {
    type: Array,
    default: () => [],
  },
  searchQuery: {
    type: String,
    default: "",
  },
  selectedTags: {
    type: Object,
    default: () => ({}),
  },
});

const md = new MarkdownIt();
const summaries = ref(null);
const waiting = ref(false);

const extractedDocuments = computed(() => {
  if (!props.hits?.length) return [];
  return props.hits.map(
    (hit) =>
      "Challenges: " +
      hit.document.challenges +
      " Objectives: " +
      hit.document.objectives +
      " Solutions: " +
      hit.document.solutions +
      " Keywords: " +
      hit.document.keywords +
      "Stakeholders Participation: " +
      hit.document.stakeholder_participation +
      "Cost Benefict" +
      hit.document.cost_benefit +
      "lifetime" +
      hit.document.lifetime +
      "articleId: " +
      hit.id
  );
});

const getArticleTitle = (articleId) => {
  const hit = props.hits.find((hit) => hit.id === articleId);
  return hit?.document.title;
};

const emit = defineEmits(["article-click"]);
function handleArticleClick(articleId) {
  emit("article-click", articleId);
}

async function generateSummaries() {
  if (!extractedDocuments.value.length) {
    summaries.value = null;
    return;
  }
  const allTags = [
    ...props.selectedTags.keywords,
    ...props.selectedTags.adaptation_approaches,
    ...props.selectedTags.climate_impacts,
  ].join(",");

  waiting.value = true;
  console.log(props.searchQuery);
  try {
    const response = await $fetch("/api/getAiResponse", {
      method: "POST",
      body: {
        documents: extractedDocuments.value,
        prompt: "summarize the following documents",
        cacheId: props.searchQuery + allTags + "|" + locale.value,
        locale: locale.value,
      },
    });
    summaries.value = response.response;
  } catch (error) {
    console.error("Error generating summaries:", error);
    summaries.value = null;
  } finally {
    waiting.value = false;
  }
}

watch(
  () => [props.hits, locale.value],
  ([newHits]) => {
    if (newHits && newHits.length) {
      generateSummaries();
    } else {
      summaries.value = null;
    }
  },
  { immediate: true, deep: true }
);
</script>
