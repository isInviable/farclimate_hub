<template>
  <div class="flex flex-col" :style="{ gap: `${gap}px` }">
    <div
      v-for="(it, i) in items"
      :key="codeKey ? it[codeKey] : i"
      class="grid grid-cols-[1fr_auto] items-center gap-3"
      :class="onSelectable ? 'cursor-pointer' : ''"
      :style="{ opacity: dimmed(it) ? 0.45 : 1 }"
      @click="onSelectable && it[codeKey!] != null ? emitSelect(it) : undefined"
    >
      <div class="relative" :style="{ height: `${height}px` }">
        <div class="absolute inset-0 bg-warm-neutral-200" />
        <div
          class="absolute bottom-0 left-0 top-0 transition-[width] duration-300"
          :style="{ width: `${(it[valueKey] / max) * 100}%`, backgroundColor: barColor(it, i) }"
        />
        <div class="absolute bottom-0 left-2 top-0 flex items-center">
          <span
            class="font-mono text-[10px] font-semibold"
            :class="(it[valueKey] / max) * 100 > 22 ? 'text-neutral-lightest' : 'text-neutral-darkest'"
          >
            {{ it[valueKey] }}
          </span>
        </div>
      </div>
      <span
        class="text-right font-mono text-[11px]"
        :class="isSelected(it) ? 'font-bold' : 'font-medium'"
      >
        {{ it[labelKey] }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CA_BLUE, CA_INK } from "~/utils/connectedColors";

interface Props {
  items: Record<string, any>[];
  max: number;
  labelKey: string;
  valueKey: string;
  codeKey?: string;
  accentTop?: number;
  selected?: string | null;
  height?: number;
  gap?: number;
}

const props = withDefaults(defineProps<Props>(), {
  codeKey: undefined,
  accentTop: 2,
  selected: null,
  height: 18,
  gap: 6,
});

const emit = defineEmits<{ select: [value: string | null] }>();

const onSelectable = computed(() => !!props.codeKey);

function isSelected(it: Record<string, any>): boolean {
  return !!props.codeKey && props.selected != null && it[props.codeKey] === props.selected;
}

function dimmed(it: Record<string, any>): boolean {
  return (
    !!props.codeKey &&
    props.selected != null &&
    it[props.codeKey] != null &&
    it[props.codeKey] !== props.selected
  );
}

function barColor(it: Record<string, any>, i: number): string {
  if (isSelected(it)) return CA_INK;
  return i < (props.accentTop ?? 2) ? CA_BLUE : "#9fbfd9";
}

function emitSelect(it: Record<string, any>): void {
  const code = it[props.codeKey!];
  emit("select", code === props.selected ? null : code);
}
</script>
