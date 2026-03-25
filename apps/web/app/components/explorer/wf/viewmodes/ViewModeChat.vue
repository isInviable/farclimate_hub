<template>
  <div class="flex flex-col h-[80vh] bg-white rounded-lg shadow">
    <div v-if="showExamples && exampleQuestions.length" class="mb-4">
      <div class="font-semibold text-sm text-neutral-700 mb-2">
        Example questions:
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="(q, idx) in exampleQuestions"
          :key="idx"
          variant="subtle"
          color="primary"
          @click="askExample(q)"
        >
          {{ q }}
        </UButton>
      </div>
    </div>
    <div class="flex-1 min-h-0 overflow-y-auto mb-4">
      <UChatMessages
        :messages="messages"
        :status="status"
        should-auto-scroll
        class="min-h-0"
      >
        <template #content="{ parts, role }">
          <template v-for="(part, index) in parts" :key="index">
            <!-- SDK-internal markers; not meant for display (were shown via JSON fallback before). -->
            <template v-if="part.type === 'step-start'" />
            <template v-else-if="part.type === 'text'">
              <div
                v-if="role === 'assistant'"
                class="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1"
                v-html="md.render(part.text)"
              />
              <span v-else class="whitespace-pre-wrap">{{ part.text }}</span>
            </template>
            <pre
              v-else-if="part.type === 'reasoning'"
              class="text-xs bg-neutral-100 text-neutral-700 p-2 rounded mt-2 whitespace-pre-wrap"
            >{{ "text" in part ? part.text : "" }}</pre>
            <pre
              v-else-if="part.type === 'tool-invocation'"
              class="text-xs bg-neutral-100 text-neutral-700 p-2 rounded mt-2"
            >{{ JSON.stringify((part as { toolInvocation?: unknown }).toolInvocation, null, 2) }}</pre>
            <div
              v-else-if="typeof part.type === 'string' && part.type.startsWith('tool-')"
              class="text-xs bg-neutral-100 text-neutral-700 p-2 rounded mt-2 font-mono"
            >
              {{ JSON.stringify(part, null, 2) }}
            </div>
            <!-- Omit other protocol parts (e.g. future step markers) from the UI. -->
            <template v-else />
          </template>
        </template>
        <template #indicator>
          <div
            class="px-2 py-1 rounded-lg bg-neutral-800 text-white text-sm animate-pulse"
          >
            AI is typing…
          </div>
        </template>
      </UChatMessages>
    </div>
    <form class="flex gap-2 items-end" @submit.prevent="onSubmit">
      <UInput
        v-model="input"
        placeholder="Type your message..."
        class="flex-1"
        :disabled="status === 'streaming' || status === 'submitted'"
      />
      <UButton
        type="submit"
        variant="solid"
        color="neutral"
        :disabled="
          status === 'streaming' || status === 'submitted' || !input.trim()
        "
      >
        Send
      </UButton>
    </form>
    <div v-if="errorText" class="text-red-500 mt-2">{{ errorText }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Chat } from "@ai-sdk/vue";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt();

const { t } = useI18n();

const showExamples = ref(true);

const exampleQuestions = computed(() => [
  t("chat.example1"),
  t("chat.example2"),
  t("chat.example3"),
  t("chat.example4"),
  t("chat.example5"),
]);

const props = defineProps({
  hits: {
    type: Array,
    default: () => [],
  },
  document: {
    type: Object,
    default: null,
  },
});

const extractedDocuments = computed(() => {
  if (props.document) {
    return [
      "Success limitations: " +
        props.document.success_limitations +
        " Solutions: " +
        props.document.solutions +
        " Keywords: " +
        props.document.keywords +
        "Stakeholders Participation: " +
        props.document.stakeholder_participation +
        "Cost Benefict" +
        props.document.cost_benefit +
        "lifetime" +
        props.document.lifetime +
        "full text: " +
        props.document.fulltext +
        "articleId: " +
        props.document.id,
    ];
  }
  if (props.hits?.length) {
    return props.hits.map(
      (hit: any) =>
        "Success limitations: " +
        hit.document.success_limitations +
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
        "full text: " +
        hit.document.fulltext +
        "articleId: " +
        hit.id
    );
  }
  return [];
});

const chatContainer = ref<HTMLElement | null>(null);

const input = ref("");

const chat = new Chat({});

const messages = computed(() => chat.messages);
const status = computed(() => chat.status);
const errorText = computed(() => {
  const e = chat.error;
  if (e == null) return "";
  return e instanceof Error ? e.message : String(e);
});

function onSubmit(event?: Event) {
  event?.preventDefault?.();
  const text = input.value.trim();
  if (!text) return;

  chat.sendMessage(
    { text },
    {
      body: {
        documents: extractedDocuments.value,
      },
    }
  );

  input.value = "";
}

function askExample(question: string) {
  showExamples.value = false;
  input.value = question;
  onSubmit();
}
</script>
