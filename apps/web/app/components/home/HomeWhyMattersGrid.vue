<template>
  <div class="mt-16 border border-neutral-400">
    <div
      v-for="(row, rowIndex) in rows"
      :key="rowIndex"
      class="grid grid-cols-1 md:grid-cols-3"
    >
      <div
        v-for="(item, colIndex) in row"
        :key="item.text"
        class="flex flex-col items-center justify-center gap-6 p-6 min-h-48 border-neutral-400"
        :class="cellBorderClass(rowIndex, colIndex, rows.length, row.length)"
      >
        <img :src="item.icon" alt="" class="size-20 object-contain" />
        <p class="font-mono text-sm text-neutral-900 text-center">
          {{ item.text }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
export interface WhyMattersItem {
  text: string
  icon: string
}

const props = defineProps<{
  items: WhyMattersItem[]
}>()

const rows = computed(() => {
  const result: WhyMattersItem[][] = []
  for (let i = 0; i < props.items.length; i += 3) {
    result.push(props.items.slice(i, i + 3))
  }
  return result
})

function cellBorderClass(
  rowIndex: number,
  colIndex: number,
  rowCount: number,
  colCount: number
) {
  const classes: string[] = []
  if (rowIndex < rowCount - 1) classes.push('border-b')
  if (colIndex < colCount - 1) classes.push('md:border-r')
  return classes.join(' ')
}
</script>
