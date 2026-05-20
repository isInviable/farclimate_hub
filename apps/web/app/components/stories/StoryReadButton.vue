<script setup lang="ts">
defineProps<{
  label: string
  to: string
}>()
</script>

<template>
  <UFieldGroup>
    <UButton
      color="neutral"
      variant="solid"
      class="bg-neutral-darkest text-neutral-lightest font-mono text-sm uppercase"
      :to="to"
    >
      {{ label }}
    </UButton>
    <UButton
      color="neutral"
      variant="solid"
      class="bg-grounded-green-dark text-neutral-lightest"
      :to="to"
      :aria-label="label"
    >
      <UIcon name="material-symbols:arrow-forward" class="size-6" />
    </UButton>
  </UFieldGroup>
</template>
