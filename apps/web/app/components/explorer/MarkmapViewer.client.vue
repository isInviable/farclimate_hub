<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, nextTick } from "vue";
import { Markmap } from "markmap-view";
import { transformer } from "~/assets/js/markmap";
import { Toolbar } from 'markmap-toolbar';

interface Props {
  markdown: string;
  autoFit?: boolean;
  yaml?: string;
}

const {
  markdown,
  autoFit,
  yaml = "--- \n \
title: my title \n \
markmap:\n \
  colorFreezeLevel: 2\n \
  color: '#2980b9'\n \
--- \n",
} = defineProps<Props>();

const svgRef = ref<SVGSVGElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
let mm: Markmap | null = null;

const render = async () => {

  if (!mm || !svgRef.value) return;
  const {el: toolbarEl} = Toolbar.create(mm);
  toolbarEl.style.position = 'absolute';
  toolbarEl.style.bottom = '100px';
  toolbarEl.style.right = '10px';
  
  containerRef.value?.appendChild(toolbarEl);
  
  
  const { root } = transformer.transform(
    yaml + "\n" + markdown 
  );
  await mm.setData(root, {
    spacingVertical: 16,
    spacingHorizontal: 20,
  });
  if (autoFit !== false) mm.fit();
};

onMounted(async () => {
  if (!svgRef.value) return;
  mm = Markmap.create(svgRef.value);
  await nextTick();
  await render();
});

watch(
  () => markdown,
  async () => {
    await render();
  }
);

onBeforeUnmount(() => {
  if (svgRef.value) svgRef.value.replaceChildren();
  mm = null;
});

const emit = defineEmits(["article-click"]);


const handleClick = (event: MouseEvent) => {
  console.log(event);
  // Get target element from event
  const target = event.target as HTMLElement;
  
  // Find closest anchor element
  const link = target.closest('a');
  if (!link) return;

  // Get href attribute which contains the URL
  const url = link.getAttribute('href');
  if (!url) return;

  // Log and handle URL
  console.log('Clicked URL:', url);
  const articleId = url.split('?id=')[1];
  if (articleId) {
    emit('article-click', articleId);
  }
};

// Add event listener to SVG node to capture all clicks
onMounted(() => {
  if (!svgRef.value) return;
  svgRef.value.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (link) {
      e.preventDefault();
      e.stopPropagation();
    }
    handleClick(e);
  }, true); // Use capture phase to ensure we get all clicks
});

// Clean up event listener
onBeforeUnmount(() => {
  if (svgRef.value) {
    svgRef.value.removeEventListener('click', handleClick, true);
  }
});

</script>

<template>
    <div class="relative w-full h-full" ref="containerRef">
      <svg ref="svgRef" class="w-full h-full" />
      
  </div>
  <!-- Parent container should control sizing; use min-h via utility classes if needed -->
  <!-- Example: <div class="min-h-[300px]"><MarkmapViewer :markdown="md"/></div> -->
</template>
