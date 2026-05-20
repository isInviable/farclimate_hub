<script setup lang="ts">
defineProps<{
  members: Array<{ name: string; role: string; avatar: string }>
  stats: Array<{ value: string; label: string; description: string }>
}>()
</script>

<template>
  <section class="bg-neutral-darkest text-neutral-lightest py-16 px-6 md:px-20">
    <div class="max-w-7xl mx-auto flex flex-col gap-12">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div
          v-for="(member, i) in members"
          :key="i"
          class="flex flex-col items-center gap-3 text-center"
        >
          <UAvatar :src="member.avatar" :alt="member.name" size="3xl" />
          <p class="font-mono text-sm">{{ member.name }}</p>
          <p class="font-mono text-xs text-neutral-light">{{ member.role }}</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div v-for="(stat, i) in stats" :key="i">
          <p class="font-display font-bold text-5xl text-grounded-green-dark">{{ stat.value }}</p>
          <p class="font-mono text-sm font-bold mt-2">{{ stat.label }}</p>
          <p class="font-mono text-xs text-neutral-light mt-1">{{ stat.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
