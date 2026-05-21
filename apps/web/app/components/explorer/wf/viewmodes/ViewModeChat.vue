<template>
  <div
    class="flex h-full min-h-0 flex-1 flex-col border border-neutral-darkest border-r-4 border-r-neutral-darkest bg-neutral-lightest"
  >
    <div
      v-if="messages.length"
      class="flex shrink-0 justify-end border-b border-neutral-darkest px-3 py-2"
    >
      <UButton
        type="button"
        size="sm"
        color="neutral"
        variant="outline"
        icon="i-lucide-bookmark"
        class="rounded-none font-mono text-xs font-bold uppercase tracking-wide"
        :disabled="!canSaveConversation"
        :loading="conversationPinSaving"
        @click="openConversationPin"
      >
        {{ $t("chat.saveConversation") }}
      </UButton>
    </div>

    <div
      v-if="showExamples && exampleQuestions.length"
      class="mb-4 shrink-0 px-3 pt-3"
    >
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
        :should-scroll-to-bottom="true"
        :user="chatUserPreset"
        :assistant="chatAssistantPreset"
        :ui="{
          root: 'min-h-0 w-full flex flex-col gap-5 px-0',
        }"
        class="min-h-0 w-full"
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
        <template #content="{ parts, role, message }">
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
          <ChatMessageCitations
            v-if="chatMode === 'corpus' && role === 'assistant' && message"
            :citations="citationsForMessage(message)"
            :loading="citationsLoadingForMessage(message)"
            @open-article="(uid) => emit('open-article', uid)"
          />
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
      class="mx-3 mb-3 flex min-h-14 shrink-0 items-stretch border border-neutral-darkest bg-neutral-lightest"
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
    <div v-if="errorText" class="shrink-0 px-3 pb-2 text-sm text-red-600">
      {{ errorText }}
    </div>

    <PinCaptureDialog
      v-model:open="conversationPinDialogOpen"
      body-kind="chat"
      :title="conversationPinDialogTitle"
      :preview="conversationPinPreview"
      :saving="conversationPinSaving"
      :error="conversationPinError"
      @save="saveConversationPin"
      @cancel="conversationPinError = null"
    />
  </div>
</template>

<script setup lang="ts">
import { Chat } from "@ai-sdk/vue";
import MarkdownIt from "markdown-it";
import CapturableBlock from "../../CapturableBlock.vue";
import PinCaptureDialog from "../../PinCaptureDialog.vue";
import ChatMessageCitations from "./ChatMessageCitations.vue";
import type { ExplorerChatUIMessage, ChatCitation } from "~/types/chat";
import {
  buildCatalogFromDocument,
  buildCatalogFromHits,
  buildDocumentBlobsFromCatalog,
  inferChatMode,
} from "~/utils/chatCatalog";
import {
  buildConversationPinData,
  conversationPinTitle,
  serializeChatMessages,
} from "~/utils/chatPin";

const md = new MarkdownIt();

const { t } = useI18n();
const { pinCapture } = usePin();

const emit = defineEmits<{
  "open-article": [documentUid: string];
}>();

const showExamples = ref(true);

const exampleQuestions = computed(() => [
  t("chat.example1"),
  t("chat.example2"),
  t("chat.example3"),
  t("chat.example4"),
  t("chat.example5"),
]);

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

const chatMode = computed(() =>
  inferChatMode(props.document as Record<string, unknown> | null, props.hits),
);

const catalog = computed(() => {
  if (props.document) {
    return buildCatalogFromDocument(
      props.document as Record<string, unknown>,
    );
  }
  return buildCatalogFromHits(props.hits);
});

const documentBlobs = computed(() =>
  buildDocumentBlobsFromCatalog(
    catalog.value,
    props.hits,
    props.document as Record<string, unknown> | null,
  ),
);

const input = ref("");

const chat = new Chat<ExplorerChatUIMessage>({});

const messages = computed(() => chat.messages);
const status = computed(() => chat.status);
const errorText = computed(() => {
  const e = chat.error;
  if (e == null) return "";
  return e instanceof Error ? e.message : String(e);
});

const canSaveConversation = computed(
  () =>
    messages.value.length > 0 &&
    status.value !== "streaming" &&
    status.value !== "submitted",
);

const conversationPinDialogOpen = ref(false);
const conversationPinSaving = ref(false);
const conversationPinError = ref<string | null>(null);

const conversationPinDialogTitle = computed(() => {
  const excerpt = conversationPinTitle(messages.value);
  if (excerpt) return `${t("pins.capture.conversationTitle")} — ${excerpt}`;
  return t("pins.capture.conversationTitle");
});

const conversationPinPreview = computed(() => {
  const serialized = serializeChatMessages(messages.value);
  return serialized
    .map((m) => `${m.role}: ${m.text}`)
    .join("\n\n")
    .slice(0, 2000);
});

function citationsForMessage(message: ExplorerChatUIMessage): ChatCitation[] {
  const part = message.parts?.find((p) => p.type === "data-citations");
  if (part && part.type === "data-citations" && part.data?.citations) {
    return part.data.citations;
  }
  return [];
}

function citationsLoadingForMessage(message: ExplorerChatUIMessage): boolean {
  if (chatMode.value !== "corpus") return false;
  if (message.role !== "assistant") return false;
  if (citationsForMessage(message).length > 0) return false;
  const last = messages.value[messages.value.length - 1];
  if (!last || last.id !== message.id) return false;
  return status.value === "streaming" || status.value === "submitted";
}

function onSubmit(event?: Event) {
  event?.preventDefault?.();
  const text = input.value.trim();
  if (!text) return;

  showExamples.value = false;

  chat.sendMessage(
    { text },
    {
      body: {
        mode: chatMode.value,
        catalog: catalog.value,
        documents: documentBlobs.value,
      },
    },
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

function openConversationPin() {
  conversationPinError.value = null;
  conversationPinDialogOpen.value = true;
}

async function saveConversationPin(note: string) {
  conversationPinSaving.value = true;
  conversationPinError.value = null;
  try {
    const id = await pinCapture({
      bodyKind: "chat",
      title: conversationPinDialogTitle.value,
      data: buildConversationPinData({
        messages: messages.value,
        mode: chatMode.value,
      }),
      notes: note,
      sourceDocumentUid: null,
      location: null,
    });
    if (!id) {
      conversationPinError.value = "Could not save pin";
      return;
    }
    conversationPinDialogOpen.value = false;
  } finally {
    conversationPinSaving.value = false;
  }
}
</script>
