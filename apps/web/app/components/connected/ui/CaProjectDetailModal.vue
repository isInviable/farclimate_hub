<template>
  <UModal
    v-model:open="open"
    :title="modalTitle"
    :description="modalDescription"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <div v-if="pending" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="size-8 animate-spin text-trust-blue-darkest" />
      </div>

      <UAlert
        v-else-if="error"
        color="error"
        variant="subtle"
        title="Could not load project"
        :description="error.message"
      />

      <div v-else-if="detail" class="flex max-h-[65vh] flex-col gap-6 overflow-y-auto pr-1">
        <p v-if="detail.project.teaser" class="text-sm leading-relaxed text-neutral-darkest">
          {{ detail.project.teaser }}
        </p>

        <section v-if="detail.risks.length" class="space-y-2">
          <h3 class="font-mono text-2xs font-bold tracking-[0.16em] text-neutral-dark">RISKS</h3>
          <div class="flex flex-wrap gap-1.5">
            <UBadge
              v-for="risk in detail.risks"
              :key="risk.id"
              color="neutral"
              variant="subtle"
              size="sm"
            >
              {{ risk.name }}
            </UBadge>
          </div>
        </section>

        <section v-if="detail.themes.length" class="space-y-2">
          <h3 class="font-mono text-2xs font-bold tracking-[0.16em] text-neutral-dark">THEMES</h3>
          <div class="flex flex-wrap gap-1.5">
            <UBadge
              v-for="theme in detail.themes"
              :key="theme.id"
              color="primary"
              variant="subtle"
              size="sm"
            >
              {{ theme.name }}
            </UBadge>
          </div>
        </section>

        <section v-if="keywordTags.length" class="space-y-2">
          <h3 class="font-mono text-2xs font-bold tracking-[0.16em] text-neutral-dark">KEYWORDS</h3>
          <div class="flex flex-wrap gap-1.5">
            <UBadge
              v-for="keyword in keywordTags"
              :key="keyword"
              color="neutral"
              variant="outline"
              size="sm"
            >
              {{ keyword }}
            </UBadge>
          </div>
        </section>

        <section class="grid grid-cols-2 gap-3 border border-neutral-lighter p-4">
          <div>
            <span class="block font-mono text-2xs tracking-[0.12em] text-neutral-dark">START</span>
            <span class="text-sm text-neutral-darkest">{{ formatDate(detail.project.startDate) }}</span>
          </div>
          <div>
            <span class="block font-mono text-2xs tracking-[0.12em] text-neutral-dark">END</span>
            <span class="text-sm text-neutral-darkest">{{ formatDate(detail.project.endDate) }}</span>
          </div>
          <div>
            <span class="block font-mono text-2xs tracking-[0.12em] text-neutral-dark">DURATION</span>
            <span class="text-sm text-neutral-darkest">
              {{ detail.project.duration != null ? `${detail.project.duration} months` : '—' }}
            </span>
          </div>
          <div>
            <span class="block font-mono text-2xs tracking-[0.12em] text-neutral-dark">TOTAL COST</span>
            <span class="text-sm text-neutral-darkest">{{ formatCurrency(detail.project.totalCost) }}</span>
          </div>
          <div class="col-span-2">
            <span class="block font-mono text-2xs tracking-[0.12em] text-neutral-dark">EC MAX CONTRIBUTION</span>
            <span class="text-sm text-neutral-darkest">{{ formatCurrency(detail.project.ecMaxContribution) }}</span>
          </div>
        </section>

        <section v-if="detail.entities.length" class="space-y-2">
          <h3 class="font-mono text-2xs font-bold tracking-[0.16em] text-neutral-dark">
            PARTICIPANTS ({{ detail.entities.length }})
          </h3>
          <div class="max-h-48 overflow-y-auto border border-neutral-lighter">
            <div
              v-for="entity in detail.entities"
              :key="entity.id"
              class="cursor-pointer border-b border-neutral-lighter px-3 py-2 last:border-b-0 transition-colors hover:bg-neutral-lighter/60"
              @click="emit('selectEntity', entity.id)"
            >
              <div class="text-sm font-medium text-neutral-darkest">
                {{ entity.legalName || entity.shortName || entity.id }}
              </div>
              <div class="mt-0.5 flex flex-wrap gap-x-3 font-mono text-2xs text-neutral-dark">
                <span v-if="entity.addressCountry">{{ entity.addressCountry }}</span>
                <span v-if="entity.type">{{ entity.type }}</span>
              </div>
            </div>
          </div>
        </section>

        <section v-if="detail.products.length" class="space-y-2">
          <h3 class="font-mono text-2xs font-bold tracking-[0.16em] text-neutral-dark">
            PRODUCTS ({{ detail.products.length }})
          </h3>
          <div class="max-h-40 overflow-y-auto border border-neutral-lighter">
            <div
              v-for="product in detail.products"
              :key="product.id"
              class="border-b border-neutral-lighter px-3 py-2 last:border-b-0"
            >
              <div class="text-sm text-neutral-darkest">
                {{ product.title || product.id }}
              </div>
              <div
                v-if="product.detailsPublishedYear || product.typeTitle"
                class="mt-0.5 font-mono text-2xs text-neutral-dark"
              >
                <span v-if="product.detailsPublishedYear">{{ product.detailsPublishedYear }}</span>
                <span v-if="product.detailsPublishedYear && product.typeTitle"> · </span>
                <span v-if="product.typeTitle">{{ product.typeTitle }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton variant="ghost" color="neutral" @click="open = false">
          Close
        </UButton>
        <UButton
          v-if="cordisUrl"
          color="primary"
          icon="i-heroicons-arrow-top-right-on-square"
          :to="cordisUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          View on CORDIS
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { CordisProjectDetail } from '~/types/cordis';
import { getCordisProjectUrl, parseCordisKeywords } from '~/utils/cordisLinks';

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  selectEntity: [id: string];
}>();

const props = defineProps<{
  projectId: string | null;
}>();

const detail = ref<CordisProjectDetail | null>(null);
const pending = ref(false);
const error = ref<Error | null>(null);

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number | null) => {
  if (value == null) return '—';
  return currencyFormatter.format(value);
};

const formatDate = (value: string | null) => {
  if (!value) return '—';
  const year = value.substring(0, 4);
  const month = value.substring(5, 7);
  const day = value.substring(8, 10);
  if (year && month && day) return `${day}/${month}/${year}`;
  if (year) return year;
  return value;
};

const modalTitle = computed(() => {
  if (!detail.value) return 'Project';
  return detail.value.project.title || detail.value.project.acronym || detail.value.project.id;
});

const modalDescription = computed(() => {
  if (!detail.value?.project.acronym) return undefined;
  return detail.value.project.acronym;
});

const keywordTags = computed(() =>
  detail.value ? parseCordisKeywords(detail.value.project.keywords) : [],
);

const cordisUrl = computed(() => {
  const cordisId = detail.value?.project.cordisId;
  return cordisId ? getCordisProjectUrl(cordisId) : null;
});

async function loadDetail(id: string) {
  pending.value = true;
  error.value = null;
  detail.value = null;

  try {
    detail.value = await fetchProjectDetail(id);
  } catch (e) {
    error.value = e instanceof Error ? e : new Error('Failed to load project');
  } finally {
    pending.value = false;
  }
}

watch(
  () => [open.value, props.projectId] as const,
  ([isOpen, id]) => {
    if (isOpen && id) {
      loadDetail(id);
    }
    if (!isOpen) {
      detail.value = null;
      error.value = null;
    }
  },
  { immediate: true },
);
</script>
