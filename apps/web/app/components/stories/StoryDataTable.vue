<script setup lang="ts">
defineProps<{
  headers: string[]
  rows: string[][]
}>()
</script>

<template>
  <div class="overflow-x-auto border border-neutral">
    <table class="w-full text-left font-mono text-sm">
      <thead>
        <tr class="bg-neutral-darkest text-neutral-lightest">
          <th
            v-for="(header, i) in headers"
            :key="i"
            class="px-4 py-3 font-bold"
          >
            {{ header }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, ri) in rows"
          :key="ri"
          class="border-t border-neutral bg-white even:bg-neutral-lightest"
        >
          <td
            v-for="(cell, ci) in row"
            :key="ci"
            class="px-4 py-3 text-neutral-darkest"
          >
            {{ cell }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
