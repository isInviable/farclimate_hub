<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: ["admin-auth"],
});

onMounted(() => {
  // Redirect to the first admin table by default
  navigateTo("/admin/entities");
});
</script>

<template>
  <div />
</template>


