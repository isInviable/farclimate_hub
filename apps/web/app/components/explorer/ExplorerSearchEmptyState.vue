<template>
  <div
    class="col-span-full flex flex-col items-center justify-center py-16 text-center"
    role="status"
  >
    <div
      class="mb-5 flex size-20 items-center justify-center rounded-full border border-neutral-darkest bg-neutral-lighter"
      aria-hidden="true"
    >
      <UIcon :name="icon" class="size-10 text-neutral-dark" />
    </div>
    <h3 class="font-display text-xl font-bold text-neutral-darkest">
      {{ heading }}
    </h3>
    <p class="mt-2 max-w-md text-neutral-dark">
      {{ body }}
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  variant: "text" | "filters" | "generic";
  searchTerm?: string;
}>();

const { t } = useI18n();

const icon = "i-heroicons-magnifying-glass";

const heading = computed(() => {
  if (props.variant === "text") {
    return t("explorer.searchEmpty.textTitle", {
      term: props.searchTerm?.trim() || "",
    });
  }
  if (props.variant === "filters") {
    return t("explorer.searchEmpty.filtersTitle");
  }
  return t("explorer.searchEmpty.genericTitle");
});

const body = computed(() => {
  if (props.variant === "text") {
    return t("explorer.searchEmpty.textTip");
  }
  if (props.variant === "filters") {
    return t("explorer.searchEmpty.filtersTip");
  }
  return t("explorer.searchEmpty.genericTip");
});
</script>
