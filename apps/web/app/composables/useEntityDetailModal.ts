export function useEntityDetailModal() {
  const isOpen = ref(false);
  const entityId = ref<string | null>(null);

  const openEntity = (id: string) => {
    entityId.value = id;
    isOpen.value = true;
  };

  const closeEntity = () => {
    isOpen.value = false;
  };

  watch(isOpen, (open) => {
    if (!open) {
      entityId.value = null;
    }
  });

  return { isOpen, entityId, openEntity, closeEntity };
}
