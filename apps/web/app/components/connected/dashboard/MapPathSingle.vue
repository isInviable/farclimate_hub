<template>
  <path
    :d="d"
    style="transition: color 0.5s ease-in-out;"
    :style="{ 
      fill: isHovered ? hoveredColor : color,
      'stroke-width': showStrokeHovered && isHovered ? 2 : 2,
      stroke: '#fff'
    }"
    :class="isHovered ? 'cursor-pointer' : 'cursor-auto'"
    @mouseover="emitThis($event, '_mouseover')"
    @mouseout="emitThis($event, '_mouseout')"
    @click="emitThis($event, '_click')"
  >
  </path>
</template>

<script setup>
const props = defineProps({
  d: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  hoveredColor: {
    type: String,
    required: true
  },
  id: {
    type: String,
    required: true
  },
  showHoverState: {
    type: Boolean,
    default: true
  },
  showStrokeHovered: {
    type: Boolean,
    default: false
  },
  strokeHoveredColor: {
    type: String,
    default: 'black'
  },
});

const emits = defineEmits(['_mouseover', '_mouseout', '_click']);

const hovered = ref(false);

const isHovered = computed(() => {
  return hovered.value && props.showHoverState;
});

function emitThis(event, type) {
  emits(type, event, props.id);
  if (type === '_mouseover') {
    hovered.value = true;
  } else if (type === '_mouseout') {
    hovered.value = false;
  }
}
</script>
