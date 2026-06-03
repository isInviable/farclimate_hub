<template>
  <UModal
    v-model:open="authPromptOpen"
    :title="modalTitle"
    :description="modalBody"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton variant="ghost" color="neutral" @click="closeAuthPrompt">
          {{ $t("auth.prompt.cancel") }}
        </UButton>
        <UButton color="primary" :to="authPromptLoginLink">
          {{ $t("auth.prompt.signInAction") }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { AuthPromptContext } from "~/composables/useAccess";

const { t } = useI18n();
const {
  authPromptOpen,
  authPromptContext,
  authPromptLoginLink,
  closeAuthPrompt,
} = useAccess();

const titleKeyByContext: Record<AuthPromptContext, string> = {
  pin: "auth.prompt.pinTitle",
  board: "auth.prompt.boardTitle",
  generic: "auth.prompt.genericTitle",
};

const bodyKeyByContext: Record<AuthPromptContext, string> = {
  pin: "auth.prompt.pinBody",
  board: "auth.prompt.boardBody",
  generic: "auth.prompt.genericBody",
};

const modalTitle = computed(() =>
  t(titleKeyByContext[authPromptContext.value] ?? titleKeyByContext.generic),
);

const modalBody = computed(() =>
  t(bodyKeyByContext[authPromptContext.value] ?? bodyKeyByContext.generic),
);
</script>
