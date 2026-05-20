<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string
    organization: string
    avatar: string
    variant?: 'default' | 'on-dark'
  }>(),
  { variant: 'default' }
)
</script>

<template>
  <div class="flex items-center gap-3">
    <UAvatar :src="avatar" :alt="name" size="md" class="size-10 shrink-0" />
    <div class="flex flex-col">
      <span
        class="font-mono text-sm font-medium"
        :class="variant === 'on-dark' ? 'text-neutral-lightest' : 'text-neutral-darkest'"
      >
        {{ name }}
      </span>
      <span
        class="font-mono text-xs font-bold"
        :class="variant === 'on-dark' ? 'text-neutral-lightest' : 'text-neutral-dark'"
      >
        {{ organization }}
      </span>
    </div>
  </div>
</template>
