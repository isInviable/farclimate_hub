<template>
  <aside
    class="summary-main-left flex w-full max-w-[260px] flex-col gap-[22px] overflow-y-auto pr-1 min-h-0"
  >
    <div v-if="implementationYearsLabel">
      <p
        class="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted"
      >
        {{ $t("summaryHeaders.date") }}
      </p>
      <p
        class="font-display mt-1 text-[15px] font-normal leading-snug text-neutral-darkest"
      >
        {{ implementationYearsLabel }}
      </p>
    </div>

    <div v-if="geographicLines.length > 0">
      <p
        class="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted"
      >
        {{ $t("summaryLeft.geographic") }}
      </p>
      <p
        class="font-display mt-1 text-[15px] font-normal leading-snug whitespace-pre-line text-neutral-darkest"
      >
        {{ geographicLines.join("\n") }}
      </p>
    </div>

    <div v-if="biogeographicalTags.length > 0">
      <p
        class="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted"
      >
        {{ $t("summaryLeft.bioregion") }}
      </p>
      <div class="mt-2 flex flex-wrap gap-2">
        <span
          v-for="tag in biogeographicalTags"
          :key="tag"
          class="inline-block rounded-full border border-neutral-darkest px-3.5 py-1.5 font-mono text-[11px] font-semibold tracking-[0.04em] text-neutral-darkest"
        >
          {{ tag }}
        </span>
      </div>
    </div>

    <div>
      <p
        class="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted"
      >
        {{ $t("summaryLeft.authors") }}
      </p>
      <p
        class="font-display mt-1 text-[15px] font-normal leading-snug text-neutral-darkest"
      >
        {{ authorsLine }}
      </p>
    </div>

    <div>
      <p
        class="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted"
      >
        {{ $t("summaryLeft.source") }}
      </p>
      <p
        class="font-display mt-1 text-[15px] font-normal leading-snug whitespace-pre-line text-neutral-darkest"
      >
        {{ sourceLine }}
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  document: Record<string, unknown> & {
    geographic_characterisation?: Record<string, unknown> | null;
    implementation_years?: { start_year?: string | number; end_year?: string | number };
  };
}>();

const { t } = useI18n();

function firstNonEmptyString(...candidates: unknown[]): string {
  for (const v of candidates) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

const implementationYearsLabel = computed<string>(() => {
  const start = props.document?.implementation_years?.start_year;
  const end = props.document?.implementation_years?.end_year;
  if (!start && !end) return "";
  if (start && end && start !== end) return `${start} – ${end}`;
  return String(start ?? end ?? "");
});

const geographicLines = computed<string[]>(() => {
  const geo = props.document?.geographic_characterisation;
  if (!geo || typeof geo !== "object" || Array.isArray(geo)) return [];
  const entries: string[] = [];
  for (const key of ["city", "sub_nationals", "countries", "continent"] as const) {
    const value = (geo as Record<string, unknown>)[key];
    const normalized = normalizeGeoToString(value);
    if (normalized) entries.push(normalized);
  }
  return entries;
});

const biogeographicalTags = computed<string[]>(() => {
  const geo = props.document?.geographic_characterisation;
  if (!geo || typeof geo !== "object" || Array.isArray(geo)) return [];
  const value = (geo as Record<string, unknown>)["biogeographical_regions"];
  return normalizeGeoToArray(value);
});

const authorsLine = computed(() => {
  const d = props.document as Record<string, unknown>;
  return (
    firstNonEmptyString(d.authors, d.details_authors) ||
    t("summaryLeft.authorsFallback")
  );
});

const sourceLine = computed(() => {
  const d = props.document as Record<string, unknown>;
  return (
    firstNonEmptyString(d.source_organization, d.source_org, d.publisher) ||
    t("summaryLeft.sourceFallback")
  );
});

function normalizeGeoToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean)
      .join(", ");
  }
  return "";
}

function normalizeGeoToArray(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean);
  }
  return [];
}
</script>
