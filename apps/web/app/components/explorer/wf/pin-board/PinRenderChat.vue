<template>
  <div class="space-y-3">
    <p v-if="!messages.length" class="text-sm text-neutral-500 italic">
      {{ $t("pins.chatEmpty") }}
    </p>
    <div
      v-for="(m, i) in messages"
      :key="i"
      class="rounded-lg px-3 py-2 text-sm border border-neutral-100"
      :class="bubbleClass(m)"
    >
      <div class="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">
        {{ senderLabel(m) }}
      </div>
      <div class="whitespace-pre-wrap text-neutral-900">
        {{ textOf(m) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: Record<string, unknown>
}>();

interface RawMsg {
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

function textOf(m: RawMsg): string {
  if (typeof m.text === "string") return m.text;
  if (typeof m.content === "string") return m.content;
  return "";
}

function senderLabel(m: RawMsg): string {
  const r = (m.role || "").toLowerCase();
  if (r === "assistant" || r === "model") return "Assistant";
  if (r === "user" || r === "human") return "You";
  if (typeof m.sender === "string" && m.sender.trim()) return m.sender.trim();
  if (r) return r;
  return "Message";
}

function bubbleClass(m: RawMsg): string {
  const r = (m.role || "").toLowerCase();
  if (r === "assistant" || r === "model")
    return "bg-sky-50 border-sky-100 ml-0 mr-4";
  if (r === "user" || r === "human")
    return "bg-neutral-50 border-neutral-200 ml-4 mr-0";
  return "bg-white border-neutral-100";
}
</script>
