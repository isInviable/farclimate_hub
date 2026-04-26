<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, nextTick } from "vue";
import { Markmap } from "markmap-view";
import { transformer } from "~/assets/js/markmap";
import { Toolbar } from "markmap-toolbar";
import { DEFAULT_MARKMAP_YAML } from "~/constants/markmapDefaults";

interface Props {
  markdown: string;
  autoFit?: boolean;
  yaml?: string;
  /** When false, skip markmap-toolbar (e.g. pinboard card previews). */
  showToolbar?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autoFit: true,
  yaml: DEFAULT_MARKMAP_YAML,
  showToolbar: true,
});

const svgRef = ref<SVGSVGElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
let mm: Markmap | null = null;
let toolbarEl: HTMLElement | null = null;

function removeToolbar() {
  if (toolbarEl?.parentNode) {
    toolbarEl.parentNode.removeChild(toolbarEl);
  }
  toolbarEl = null;
}

const render = async () => {
  if (!mm || !svgRef.value) return;
  removeToolbar();
  if (props.showToolbar) {
    const { el } = Toolbar.create(mm);
    toolbarEl = el;
    el.style.position = "absolute";
    el.style.bottom = "100px";
    el.style.right = "10px";
    containerRef.value?.appendChild(el);
  }

  const { root } = transformer.transform(props.yaml + "\n" + props.markdown);
  await mm.setData(root, {
    spacingVertical: 16,
    spacingHorizontal: 20,
  });
  if (props.autoFit !== false) mm.fit();
};

onMounted(async () => {
  if (!svgRef.value) return;
  mm = Markmap.create(svgRef.value);
  svgRef.value.addEventListener("click", onSvgClickCapture, true);
  await nextTick();
  await render();
});

watch(
  () => [props.markdown, props.yaml, props.showToolbar, props.autoFit] as const,
  async () => {
    await render();
  }
);

const emit = defineEmits(["article-click"]);

function onSvgClickCapture(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const link = target.closest("a");
  if (link) {
    e.preventDefault();
    e.stopPropagation();
  }
  const url = link?.getAttribute("href");
  if (!url) return;
  const articleId = url.split("?id=")[1];
  if (articleId) emit("article-click", articleId);
}

onBeforeUnmount(() => {
  svgRef.value?.removeEventListener("click", onSvgClickCapture, true);
  removeToolbar();
  if (svgRef.value) svgRef.value.replaceChildren();
  mm = null;
});
</script>

<template>
  <div class="relative h-full w-full" ref="containerRef">
    <svg ref="svgRef" class="h-full w-full" />
  </div>
</template>
