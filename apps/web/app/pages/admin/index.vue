<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

onMounted(() => {
  // Redirect to the first admin table by default
  navigateTo("/admin/entities");
});
</script>

<template>
  <div />
</template>


