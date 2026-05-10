<template>
  <div
    class="flex min-h-0 flex-1 flex-col border border-neutral-darkest border-r-4 border-r-neutral-darkest bg-neutral-lightest"
  >
    <div v-if="showExamples && exampleQuestions.length" class="mb-4 px-3 pt-3">
      <div
        class="mb-2 font-mono text-xs font-bold uppercase tracking-wide text-neutral-dark"
      >
        {{ $t("chat.exampleQuestionsLabel") }}
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="(q, idx) in exampleQuestions"
          :key="idx"
          variant="outline"
          color="neutral"
          size="sm"
          class="rounded-none border-neutral-darkest font-mono text-xs font-bold uppercase tracking-wide text-neutral-darkest"
          :ui="{
            base: 'rounded-none ring-neutral-darkest',
          }"
          @click="askExample(q)"
        >
          {{ q }}
        </UButton>
      </div>
    </div>
    <div
      class="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 pb-2"
    >
      <UChatMessages
        :messages="messages"
        :status="status"
        should-auto-scroll
        :user="chatUserPreset"
        :assistant="chatAssistantPreset"
        :ui="{
          root: 'min-h-0 w-full flex flex-none flex-col gap-5 px-0',
        }"
        class="min-h-0"
      >
        <template #leading="{ message }">
          <div
            class="flex size-8 shrink-0 items-center justify-center border border-neutral-darkest font-mono text-xs font-bold uppercase tracking-wide"
            :class="
              message.role === 'user'
                ? 'bg-neutral-darkest text-neutral-lightest'
                : 'bg-neutral-lightest text-neutral-darkest'
            "
          >
            {{ message.role === "user" ? "YOU" : "AI" }}
          </div>
        </template>
        <template #content="{ parts, role }">
          <template v-for="(part, index) in parts" :key="index">
            <template v-if="part.type === 'step-start'" />
            <template v-else-if="part.type === 'text'">
              <CapturableBlock
                v-if="role === 'assistant'"
                pin-kind="chat_response"
                :title="$t('pins.capture.chatResponseTitle')"
                :payload="chatResponsePayload(part.text, index)"
                :preview="part.text"
                source-view="chat"
                :chrome="false"
              >
                <div
                  class="prose prose-sm max-w-none text-neutral-darkest [&_a]:text-trust-blue-darkest [&_p]:my-1 [&_code]:rounded-none"
                  v-html="md.render(part.text)"
                />
              </CapturableBlock>
              <span
                v-else
                class="whitespace-pre-wrap text-base leading-relaxed text-neutral-lightest"
                >{{ part.text }}</span
              >
            </template>
            <pre
              v-else-if="part.type === 'reasoning'"
              class="mt-2 whitespace-pre-wrap border border-neutral-darkest bg-neutral-lighter p-2 font-mono text-xs text-neutral-dark"
            >{{ "text" in part ? part.text : "" }}</pre>
            <pre
              v-else-if="part.type === 'tool-invocation'"
              class="mt-2 border border-neutral-darkest bg-neutral-lighter p-2 font-mono text-xs text-neutral-dark"
            >{{ JSON.stringify((part as { toolInvocation?: unknown }).toolInvocation, null, 2) }}</pre>
            <div
              v-else-if="typeof part.type === 'string' && part.type.startsWith('tool-')"
              class="mt-2 border border-neutral-darkest bg-neutral-lighter p-2 font-mono text-xs text-neutral-dark"
            >
              {{ JSON.stringify(part, null, 2) }}
            </div>
            <template v-else />
          </template>
        </template>
        <template #indicator>
          <div
            class="border border-neutral-darkest bg-neutral-lighter px-3 py-2 font-mono text-xs font-bold uppercase tracking-wide text-neutral-darkest"
          >
            {{ $t("chat.typing") }}
          </div>
        </template>
      </UChatMessages>
    </div>
    <form
      class="mx-3 mb-3 flex min-h-14 items-stretch border border-neutral-darkest bg-neutral-lightest"
      @submit.prevent="onSubmit"
    >
      <UInput
        v-model="input"
        variant="none"
        size="lg"
        :placeholder="$t('chat.inputPlaceholder')"
        class="min-w-0 flex-1"
        :disabled="status === 'streaming' || status === 'submitted'"
        :ui="{
          root: 'w-full min-w-0 flex-1',
          base: 'rounded-none border-0 bg-transparent py-4 ps-5 pe-3 text-base leading-relaxed text-neutral-darkest shadow-none ring-0 placeholder:text-neutral-dark focus-visible:ring-0',
        }"
      />
      <UButton
        type="submit"
        variant="solid"
        color="primary"
        class="self-stretch rounded-none px-5 font-mono text-xs font-bold uppercase tracking-wide hover:brightness-95"
        :disabled="
          status === 'streaming' || status === 'submitted' || !input.trim()
        "
      >
        {{ $t("chat.submit") }}
      </UButton>
    </form>
    <div v-if="errorText" class="px-3 pb-2 text-sm text-red-600">
      {{ errorText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { Chat } from "@ai-sdk/vue";
import MarkdownIt from "markdown-it";
import CapturableBlock from "../../CapturableBlock.vue";

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

/**
 * User row: flex-row-reverse + justify-start packs [bubble][YOU] toward the physical right
 * (justify-end would pack toward the wrong edge when direction is reversed).
 */
const chatUserPreset = {
  side: "right" as const,
  variant: "naked" as const,
  ui: {
    container:
      "ms-auto flex w-fit max-w-2xl flex-row-reverse items-start justify-start gap-3.5 pb-8",
    content:
      "min-h-0 w-auto max-w-lg rounded-none border border-neutral-darkest bg-neutral-darkest px-5 py-3.5 text-base leading-relaxed text-neutral-lightest",
    leading: "mt-0 shrink-0",
  },
};

const chatAssistantPreset = {
  side: "left" as const,
  variant: "naked" as const,
  ui: {
    container: "flex w-fit max-w-2xl flex-row items-start justify-start gap-3.5 pb-8",
    content:
      "!w-auto max-w-lg min-h-0 rounded-none border border-neutral-darkest bg-neutral-lighter px-5 py-3.5 text-base leading-relaxed text-neutral-darkest",
    leading: "mt-0 shrink-0",
  },
};

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

function chatResponsePayload(text: string, index: number) {
  return {
    markdown: text,
    text,
    messagePartIndex: index,
    role: "assistant",
    sourceView: "chat",
  };
}
</script>
