<template>
  
  <div v-if="!isFullyEmpty" class="mx-auto grid max-w-6xl grid-cols-1 gap-10 pt-9 lg:grid-cols-2 lg:gap-16">
    <!-- Left: contacts + websites (React SummaryContacts left column) -->
    <section class="min-w-0">
      <h3
        class="border-b border-neutral-lighter pb-2 font-mono text-2xs font-bold uppercase tracking-widest text-neutral-dark"
      >
        {{ $t("summaryHeaders.contactPersons") }}
      </h3>
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
          class="mt-3.5 border-t border-neutral-darkest pt-3.5"
        >
          <div
            class="prose prose-sm max-w-none text-neutral-darkest prose-headings:mb-2 prose-headings:font-display prose-headings:text-xl prose-headings:font-semibold prose-headings:text-neutral-darkest prose-p:my-2 prose-p:font-sans prose-p:text-base prose-a:text-trust-blue-darkest prose-strong:text-neutral-darkest"
            v-html="md.render(contactText)"
          />
        </div>
        <p
          v-else
          class="mt-3.5 border-t border-neutral-darkest pt-3.5 text-sm text-neutral-dark"
        >
          {{ emptyContactsLabel }}
        </p>
      </CapturableBlock>

      <h3
        class="mt-10 border-b border-neutral-lighter pb-2 font-mono text-2xs font-bold uppercase tracking-widest text-neutral-dark"
      >
        {{ $t("summaryHeaders.websites") }}
      </h3>
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
        <ul
          v-if="websiteUrls.length > 0"
          class="mt-3.5 divide-y divide-neutral-lighter border-t border-neutral-darkest pt-3.5"
        >
          <li v-for="url in websiteUrls" :key="url" class="py-3.5 first:pt-0">
            <a
              :href="url"
              target="_blank"
              rel="noopener noreferrer"
              class="break-all text-sm text-trust-blue-darkest underline-offset-2 hover:underline"
            >
              {{ url }}
            </a>
          </li>
        </ul>
        <p
          v-else
          class="mt-3.5 border-t border-neutral-darkest pt-3.5 text-sm text-neutral-dark"
        >
          {{ emptyWebsitesLabel }}
        </p>
      </CapturableBlock>
    </section>

    <!-- Right: references (React SummaryContacts right column) -->
    <section class="min-w-0">
      <h3
        class="border-b border-neutral-lighter pb-2 font-mono text-2xs font-bold uppercase tracking-widest text-neutral-dark"
      >
        {{ $t("summaryHeaders.scientificReferences") }}
      </h3>
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
          class="mt-3.5 border-t border-neutral-darkest pt-3.5"
        >
          <div
            class="prose prose-sm max-w-none text-neutral-darkest prose-headings:mb-2 prose-headings:font-display prose-headings:text-xl prose-headings:font-semibold prose-headings:text-neutral-darkest prose-p:my-2 prose-p:font-sans prose-p:text-base prose-a:text-trust-blue-darkest prose-ol:mt-0 prose-ul:mt-0 prose-li:my-0 prose-li:border-b prose-li:border-neutral-lighter prose-li:py-3 prose-li:marker:font-mono prose-li:marker:text-xs prose-li:marker:text-neutral-dark prose-li:last:border-b-0"
            v-html="md.render(referencesText)"
          />
        </div>
        <p
          v-else
          class="mt-3.5 border-t border-neutral-darkest pt-3.5 text-sm text-neutral-dark"
        >
          {{ emptyReferencesLabel }}
        </p>
      </CapturableBlock>
    </section>
  </div>
  <UAlert
    v-else
    color="neutral"
    variant="subtle"
    icon="i-lucide-info"
    :title="emptyTitle"
    :description="emptyDescription"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import MarkdownIt from "markdown-it";
import CapturableBlock from "../CapturableBlock.vue";
import DecorativeCorner from "./DecorativeCorner.vue";

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
const emptyTitle = computed(() => $t("article.contacts.allEmptyTitle"));
const emptyDescription = computed(() =>
  $t("article.contacts.allEmptyDescription"),
);
</script>
