<template>
  <div class="flex flex-col gap-6 max-w-4xl">
    <CapturableBlock
      :label="$t('summaryHeaders.contactPersons')"
      icon="mdi:account-box-outline"
      pin-kind="contact"
      source-view="summary"
      :payload="contactPinPayload"
      :preview="contactText"
      :chrome="false"
    >
      <div
        v-if="contactText"
        class="prose prose-lg max-w-none"
        v-html="md.render(contactText)"
      />
      <p v-else class="text-sm text-muted">
        {{ emptyContactsLabel }}
      </p>
    </CapturableBlock>

    <CapturableBlock
      :label="$t('summaryHeaders.websites')"
      icon="mdi:web"
      pin-kind="website"
      source-view="summary"
      :payload="websitePinPayload"
      :preview="websiteUrl ?? ''"
      :capture-enabled="!!websiteUrl"
      :chrome="false"
    >
      <ul v-if="websiteUrls.length > 0" class="list-disc pl-5 space-y-1">
        <li v-for="url in websiteUrls" :key="url">
          <a
            :href="url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary-600 underline break-all text-sm"
          >
            {{ url }}
          </a>
        </li>
      </ul>
      <p v-else class="text-sm text-muted">
        {{ emptyWebsitesLabel }}
      </p>
    </CapturableBlock>

    <CapturableBlock
      :label="$t('summaryHeaders.scientificReferences')"
      icon="mdi:book-open-outline"
      pin-kind="reference"
      source-view="summary"
      :payload="referencesPinPayload"
      :preview="referencesText"
      :capture-enabled="!!referencesText"
      :chrome="false"
    >
      <div
        v-if="referencesText"
        class="prose prose-lg max-w-none"
        v-html="md.render(referencesText)"
      />
      <p v-else class="text-sm text-muted">
        {{ emptyReferencesLabel }}
      </p>
    </CapturableBlock>

    <UAlert
      v-if="isFullyEmpty"
      color="neutral"
      variant="subtle"
      icon="i-lucide-info"
      :title="emptySlideTitle"
      :description="emptySlideDescription"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import MarkdownIt from "markdown-it";
import CapturableBlock from "../CapturableBlock.vue";

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

const { t: $t } = useI18n();

const props = defineProps<{
  document: Record<string, unknown> & {
    contact?: string | null;
    references?: string | null;
    websites?: { url?: string | string[] } | null;
  };
}>();

const contactText = computed<string>(() => {
  const raw = props.document?.contact;
  return typeof raw === "string" ? raw.trim() : "";
});

const referencesText = computed<string>(() => {
  const raw = props.document?.references;
  return typeof raw === "string" ? raw.trim() : "";
});

const websiteUrls = computed<string[]>(() => {
  const raw = props.document?.websites?.url;
  if (Array.isArray(raw)) {
    return raw.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
  }
  if (typeof raw === "string" && raw.trim()) return [raw.trim()];
  return [];
});

const websiteUrl = computed<string | null>(
  () => websiteUrls.value[0] ?? null,
);

const isFullyEmpty = computed<boolean>(
  () =>
    !contactText.value &&
    websiteUrls.value.length === 0 &&
    !referencesText.value,
);

const contactPinPayload = computed(() => ({
  markdown: contactText.value,
  sourceView: "summary",
}));

const websitePinPayload = computed(() => ({
  url: websiteUrl.value ?? "",
  markdown: websiteUrls.value.join("\n"),
  sourceView: "summary",
}));

const referencesPinPayload = computed(() => ({
  markdown: referencesText.value,
  sourceView: "summary",
}));

const emptyContactsLabel = computed(() => $t("article.contacts.empty"));
const emptyWebsitesLabel = computed(() => $t("article.websites.empty"));
const emptyReferencesLabel = computed(() => $t("article.references.empty"));
const emptySlideTitle = computed(() => $t("article.contacts.allEmptyTitle"));
const emptySlideDescription = computed(() => $t("article.contacts.allEmptyDescription"));
</script>
