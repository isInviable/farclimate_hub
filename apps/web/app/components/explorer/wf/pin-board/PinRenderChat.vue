<template>
  <div class="space-y-3">
    <p v-if="!messages.length" class="text-sm text-neutral-500 italic">
      {{ $t("pins.chatEmpty") }}
    </p>

    <template v-else-if="preview">
      <div
        v-for="(m, i) in previewMessages"
        :key="messageKey(m, i)"
        class="space-y-1"
      >
        <div
          class="text-xs font-semibold uppercase tracking-wide text-neutral-500"
        >
          {{ senderLabel(m) }}
        </div>
        <div
          class="prose prose-sm max-w-none text-neutral-800 [&_p]:my-0.5 [&_a]:text-trust-blue-darkest line-clamp-3 overflow-hidden"
          v-html="renderMarkdown(textOf(m))"
        />
      </div>
      <p
        v-if="showViewFullHint"
        class="font-mono text-xs font-bold uppercase tracking-wide text-neutral-dark"
      >
        {{ $t("pins.chatViewFull", { count: messages.length }) }}
      </p>
    </template>

    <template v-else>
      <div
        v-for="(m, i) in messages"
        :key="messageKey(m, i)"
        class="rounded-lg border border-neutral-100 px-3 py-2 text-sm"
        :class="bubbleClass(m)"
      >
        <div
          class="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500"
        >
          {{ senderLabel(m) }}
        </div>
        <div
          class="prose prose-sm max-w-none text-neutral-900 [&_p]:my-1 [&_a]:text-trust-blue-darkest [&_code]:rounded-none"
          v-html="renderMarkdown(textOf(m))"
        />
        <ul
          v-if="citationsForMessage(m, i).length"
          class="mt-2 flex flex-col gap-1 border-t border-neutral-100 pt-2"
        >
          <li
            v-for="(c, ci) in citationsForMessage(m, i)"
            :key="c.documentUid + ci"
          >
            <UButton
              type="button"
              variant="link"
              color="primary"
              size="xs"
              class="h-auto justify-start px-0 py-0 text-left font-normal"
              @click.stop="openCitation(c.documentUid)"
            >
              {{ c.title }}
            </UButton>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from "markdown-it";
import type { ChatCitation } from "~/types/chat";

const md = new MarkdownIt({ breaks: true, linkify: true });

const props = withDefaults(
  defineProps<{
    data: Record<string, unknown>
    /** When true, show a short excerpt for pinboard cards. */
    preview?: boolean
  }>(),
  { preview: true },
);

const { t } = useI18n();
const localePath = useLocalePath();

const PREVIEW_MESSAGE_LIMIT = 2;

interface RawMsg {
  id?: string
  role?: string
  sender?: string
  text?: string
  content?: string
}

const messages = computed((): RawMsg[] => {
  const raw = props.data.messages;
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is RawMsg => x != null && typeof x === "object");
});

const previewMessages = computed(() =>
  messages.value.slice(0, PREVIEW_MESSAGE_LIMIT),
);

const citationsByMessageId = computed((): Record<string, ChatCitation[]> => {
  const raw = props.data.citationsByMessageId;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, ChatCitation[]> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!Array.isArray(value)) continue;
    const list = value.filter(
      (c): c is ChatCitation =>
        !!c &&
        typeof c === "object" &&
        typeof (c as ChatCitation).documentUid === "string" &&
        typeof (c as ChatCitation).title === "string",
    );
    if (list.length) out[key] = list;
  }
  return out;
});

const citationsByIndex = computed((): Record<number, ChatCitation[]> => {
  const raw = props.data.citationsByMessageId;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const assistantIndices: number[] = [];
  messages.value.forEach((m, i) => {
    const r = (m.role || "").toLowerCase();
    if (r === "assistant" || r === "model") assistantIndices.push(i);
  });
  const keys = Object.keys(raw);
  const out: Record<number, ChatCitation[]> = {};
  keys.forEach((key, ki) => {
    const idx = assistantIndices[ki];
    if (idx === undefined) return;
    const value = raw[key];
    if (!Array.isArray(value)) return;
    const list = value as ChatCitation[];
    if (list.length) out[idx] = list;
  });
  return out;
});

const showViewFullHint = computed(() => messages.value.length > 0);

function renderMarkdown(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return md.render(trimmed);
}

function messageKey(m: RawMsg, index: number): string {
  return m.id?.trim() || `msg-${index}`;
}

function citationsForMessage(m: RawMsg, index: number): ChatCitation[] {
  const id = m.id?.trim();
  if (id && citationsByMessageId.value[id]?.length) {
    return citationsByMessageId.value[id];
  }
  return citationsByIndex.value[index] ?? [];
}

function textOf(m: RawMsg): string {
  if (typeof m.text === "string") return m.text;
  if (typeof m.content === "string") return m.content;
  return "";
}

function senderLabel(m: RawMsg): string {
  const r = (m.role || "").toLowerCase();
  if (r === "assistant" || r === "model") return t("pins.chatSenderAssistant");
  if (r === "user" || r === "human") return t("pins.chatSenderYou");
  if (typeof m.sender === "string" && m.sender.trim()) return m.sender.trim();
  if (r) return r;
  return t("pins.chatSenderMessage");
}

function bubbleClass(m: RawMsg): string {
  const r = (m.role || "").toLowerCase();
  if (r === "assistant" || r === "model")
    return "bg-sky-50 border-sky-100 ml-0 mr-4";
  if (r === "user" || r === "human")
    return "bg-neutral-50 border-neutral-200 ml-4 mr-0";
  return "bg-white border-neutral-100";
}

function openCitation(documentUid: string) {
  const uid = documentUid.trim();
  if (!uid) return;
  void navigateTo(
    localePath({ path: "/explorer/explorer", query: { document: uid } }),
  );
}
</script>
