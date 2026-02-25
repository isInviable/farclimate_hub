<template>
  <div
    class="flex flex-col h-[80vh]  bg-white rounded-lg  shadow"
  >
    <!-- Example Questions -->
    <div v-if="showExamples && exampleQuestions.length" class="mb-4">
      <div class="font-semibold text-sm text-neutral-700 mb-2">Example questions:</div>
      <div class="flex flex-wrap gap-2">
        <uButton
          v-for="(q, idx) in exampleQuestions"
          :key="idx"
          @click="askExample(q)"
          variant="subtle"
          color="primary"
        >
          {{ q }}
        </uButton>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto mb-4 space-y-2" ref="chatContainer">
      <div
        v-for="(msg, idx) in messages"
        :key="msg.id || idx"
        :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
        class="flex"
      >
        <div
          :class="[
            'px-4 py-2 my-2 rounded-md',
            msg.role === 'user'
              ? 'bg-neutral-100 text-neutral-900 text-right ml-auto mr-2  max-w-[70%]'
              : 'bg-white border border-neutral-200 text-black mr-auto text-left ml-2 max-w-[90%]',
          ]"
        >
          <template v-for="(part, pidx) in msg.parts" :key="pidx">
            <span
              v-if="part.type === 'text'"
              v-html="md.render(part.text)"
            ></span>
            <span v-else-if="part.type === 'tool-invocation'">
              <pre class="text-xs bg-neutral-100 text-neutral-700 p-2 rounded mt-2">{{
                JSON.stringify(part.toolInvocation, null, 2)
              }}</pre>
            </span>
            <!-- Add more part types as needed -->
          </template>
        </div>
      </div>
      <div
        v-if="status === 'submitted' || status === 'streaming'"
        class="flex justify-start"
      >
        <div class="px-4 py-2 rounded-lg bg-neutral-800 text-white animate-pulse">
          AI is typing...
        </div>
      </div>
    </div>
    <form @submit.prevent="onSubmit" class="flex gap-2 items-end">
      <uInput
        v-model="input"
        placeholder="Type your message..."
        class="flex-1"
        :disabled="status === 'streaming' || status === 'submitted'"
      />
      <uButton
        type="submit"
        variant="solid"
        color="neutral"
        :disabled="
          status === 'streaming' || status === 'submitted' || !input.trim()
        "
        >Send</uButton
      >
    </form>
    <div v-if="error" class="text-red-500 mt-2">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, nextTick, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/vue";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt();

const { t } = useI18n();

const showExamples = ref(true);

const exampleQuestions = computed(() => [
  t('chat.example1'),
  t('chat.example2'),
  t('chat.example3'),
  t('chat.example4'),
  t('chat.example5'),
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
  // If a single document is provided, use it
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
  // Otherwise, use hits array
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

const { messages, input, handleSubmit, status, error } = useChat({
  api: "/api/chat",
});

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}

watch(messages, scrollToBottom, { deep: true });

function onSubmit(event?: Event) {
  handleSubmit(event, {
    body: {
      documents: extractedDocuments.value,
    },
  });
}

function askExample(question: string) {
  showExamples.value = false;
  input.value = question;
  onSubmit();
}
</script>

<style scoped>
.flex-1 {
  flex: 1 1 0%;
}
</style>
