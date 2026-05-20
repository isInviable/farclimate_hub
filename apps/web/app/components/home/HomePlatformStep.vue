<template>
  <div
    class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-16"
    :class="reverse ? 'md:[&>*:first-child]:order-2' : ''"
  >
    <div class="flex justify-center">
      <img
        :src="image"
        :alt="imageAlt"
        class="max-h-[460px] w-full max-w-md object-contain"
        loading="lazy"
      />
    </div>
    <div class="flex flex-col gap-6">
      <h3 class="typo-h4 text-neutral-900">{{ title }}</h3>
      <p class="font-mono text-lg text-neutral-900">{{ body }}</p>
      <UFieldGroup>
        <UButton
          color="neutral"
          variant="solid"
          class="bg-neutral-900 text-neutral-50 font-mono text-sm uppercase"
          :to="ctaTo"
        >
          {{ cta }}
        </UButton>
        <UButton
          color="neutral"
          variant="solid"
          class="bg-grounded-green-dark text-neutral-50"
          :to="ctaTo"
          :aria-label="cta"
        >
          <UIcon name="material-symbols:arrow-forward" class="size-6" />
        </UButton>
      </UFieldGroup>
    </div>
  </div>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    title: string
    body: string
    cta: string
    image: string
    imageAlt: string
    reverse?: boolean
    ctaTo?: string
  }>(),
  {
    reverse: false,
    ctaTo: '#recipe',
  }
)
</script>
