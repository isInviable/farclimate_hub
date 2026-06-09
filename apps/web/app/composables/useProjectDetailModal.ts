export function useProjectDetailModal() {
  const isOpen = ref(false);
  const projectId = ref<string | null>(null);

  const openProject = (id: string) => {
    projectId.value = id;
    isOpen.value = true;
  };

  const closeProject = () => {
    isOpen.value = false;
  };

  watch(isOpen, (open) => {
    if (!open) {
      projectId.value = null;
    }
  });

  return { isOpen, projectId, openProject, closeProject };
}
