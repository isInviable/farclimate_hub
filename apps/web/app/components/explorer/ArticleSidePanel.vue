<template>
  <USlideover :open="open" class=" max-w-5xl" >
    <template #header>
      
      <div class="flex gap-2 items-center">
        <UButton
          :to="`/wireframes/article/${documentIdNoLang}`"
          target="_blank"
          variant="ghost"
          :title="$t('common.openFullPage')"
          icon="mdi:open-in-new"
        >
         
        </UButton>
        <h2 class=" font-semibold">{{ document.title }}</h2>
        <uButton @click="handleClose" icon="mdi:close" variant="ghost" ></uButton>
      </div>
    </template>
    <template #body>
        <ArticleViewAI :document="document" :show-sidebar="false" />

    </template>
  </USlideover>
</template>

<script setup>
import ArticleViewAI from "./ArticleViewAI.vue";

const props = defineProps({
  document: {
    type: Object,
    required: true,
  },
  open: {
    type: Boolean,
    required: true,
  },
});
const documentIdNoLang = props.document.local_id.split("_")[0];

const emit = defineEmits(["close"]);

// Handle scroll blocking
function disableScroll() {
  document.body.style.overflow = "hidden";
  document.body.style.paddingRight = "15px"; // Prevent layout shift
}

function enableScroll() {
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
}

function handleClose() {
  enableScroll();
  emit("close");
}

onMounted(() => {
  disableScroll();
});

onBeforeUnmount(() => {
  enableScroll();
});
</script>

<style scoped>
.side-panel-enter-active,
.side-panel-leave-active {
  transition: transform 0.3s ease;
}

.side-panel-enter-from,
.side-panel-leave-to {
  transform: translateX(-100%);
}
</style>
