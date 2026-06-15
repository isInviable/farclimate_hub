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
        title="Could not load organization"
        :description="error.message"
      />

      <div v-else-if="detail" class="flex max-h-[65vh] flex-col gap-6 overflow-y-auto pr-1">
        <section v-if="addressLines.length" class="space-y-1">
          <h3 class="font-mono text-2xs font-bold tracking-[0.16em] text-neutral-dark">ADDRESS</h3>
          <p class="text-sm leading-relaxed text-neutral-darkest">
            <span v-for="(line, index) in addressLines" :key="index" class="block">{{ line }}</span>
          </p>
        </section>

        <section v-if="regionLines.length" class="space-y-1">
          <h3 class="font-mono text-2xs font-bold tracking-[0.16em] text-neutral-dark">REGION</h3>
          <p class="text-sm text-neutral-darkest">
            <span v-for="(line, index) in regionLines" :key="index" class="block">{{ line }}</span>
          </p>
        </section>

        <section class="grid grid-cols-2 gap-3 border border-neutral-lighter p-4">
          <div>
            <span class="block font-mono text-2xs tracking-[0.12em] text-neutral-dark">PROJECTS</span>
            <span class="text-sm text-neutral-darkest">{{ detail.projectCount }}</span>
          </div>
          <div>
            <span class="block font-mono text-2xs tracking-[0.12em] text-neutral-dark">VAT</span>
            <span class="text-sm text-neutral-darkest">{{ detail.entity.vatNumber || '—' }}</span>
          </div>
          <div>
            <span class="block font-mono text-2xs tracking-[0.12em] text-neutral-dark">TOTAL FUNDING</span>
            <span class="text-sm text-neutral-darkest">{{ formatCurrency(totalFunding) }}</span>
          </div>
          <div>
            <span class="block font-mono text-2xs tracking-[0.12em] text-neutral-dark">EC CONTRIBUTION</span>
            <span class="text-sm text-neutral-darkest">{{ formatCurrency(totalEcContribution) }}</span>
          </div>
        </section>

        <section v-if="detail.projects.length" class="space-y-2">
          <h3 class="font-mono text-2xs font-bold tracking-[0.16em] text-neutral-dark">
            PROJECTS ({{ detail.projects.length }})
          </h3>
          <div class="max-h-48 overflow-y-auto border border-neutral-lighter">
            <div
              v-for="project in detail.projects"
              :key="project.projectId"
              class="border-b border-neutral-lighter px-3 py-2 last:border-b-0"
            >
              <div class="text-sm font-medium text-neutral-darkest">
                {{ project.title || project.acronym || project.projectId }}
              </div>
              <div class="mt-0.5 flex flex-wrap gap-x-3 font-mono text-2xs text-neutral-dark">
                <span v-if="project.acronym">{{ project.acronym }}</span>
                <span v-if="project.type">{{ project.type }}</span>
                <span v-if="project.startDate || project.endDate">
                  {{ formatDate(project.startDate) }} – {{ formatDate(project.endDate) }}
                </span>
                <span v-if="project.totalCost != null">{{ formatCurrency(project.totalCost) }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap justify-end gap-2">
        <UButton variant="ghost" color="neutral" @click="open = false">
          Close
        </UButton>
        <UButton
          v-if="websiteUrl"
          color="neutral"
          variant="outline"
          icon="i-heroicons-globe-alt"
          :to="websiteUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          Website
        </UButton>
        <UButton
          v-if="portalUrl"
          color="primary"
          icon="i-heroicons-arrow-top-right-on-square"
          :to="portalUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          View on EU Portal
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { CordisEntityDetail } from '~/types/cordis';
import { getFundingTendersOrganizationUrl } from '~/utils/cordisLinks';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  entityId: string | null;
}>();

const detail = ref<CordisEntityDetail | null>(null);
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
  if (!detail.value) return 'Organization';
  return detail.value.entity.legalName || detail.value.entity.shortName || detail.value.entity.id;
});

const modalDescription = computed(() => {
  if (!detail.value) return undefined;
  const parts = [
    detail.value.entity.shortName && detail.value.entity.shortName !== modalTitle.value
      ? detail.value.entity.shortName
      : null,
    detail.value.entity.organizationActivityType,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : undefined;
});

const addressLines = computed(() => {
  if (!detail.value) return [];
  const { addressStreet, addressPostalCode, addressCity, addressCountry } = detail.value.entity;
  const lines: string[] = [];
  if (addressStreet) lines.push(addressStreet);
  const cityLine = [addressPostalCode, addressCity].filter(Boolean).join(' ');
  if (cityLine) lines.push(cityLine);
  if (addressCountry) lines.push(addressCountry);
  return lines;
});

const regionLines = computed(() => {
  if (!detail.value) return [];
  const {
    relatedRegionName,
    relatedRegionNutsCode,
    relatedRegionIsoCode,
    relatedNutsCodeNutsCode,
  } = detail.value.entity;
  const lines: string[] = [];
  if (relatedRegionName) lines.push(relatedRegionName);
  const nutsLine = [relatedRegionNutsCode, relatedNutsCodeNutsCode].filter(Boolean).join(' · ');
  if (nutsLine) lines.push(nutsLine);
  if (relatedRegionIsoCode) lines.push(relatedRegionIsoCode);
  return lines;
});

const totalFunding = computed(() =>
  detail.value?.projects.reduce((sum, p) => sum + (p.totalCost ?? 0), 0) ?? 0,
);

const totalEcContribution = computed(() =>
  detail.value?.projects.reduce((sum, p) => sum + (p.ecContribution ?? 0), 0) ?? 0,
);

const portalUrl = computed(() => {
  const id = detail.value?.entity.id;
  return id ? getFundingTendersOrganizationUrl(id) : null;
});

const websiteUrl = computed(() => {
  const url = detail.value?.entity.addressUrl?.trim();
  return url || null;
});

async function loadDetail(id: string) {
  pending.value = true;
  error.value = null;
  detail.value = null;

  try {
    detail.value = await fetchEntityDetail(id);
  } catch (e) {
    error.value = e instanceof Error ? e : new Error('Failed to load organization');
  } finally {
    pending.value = false;
  }
}

watch(
  () => [open.value, props.entityId] as const,
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
