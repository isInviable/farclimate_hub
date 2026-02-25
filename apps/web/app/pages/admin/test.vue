
<script setup>
  
  const entities = ref([])

  async function getTodos() {
    const { data } = await supabase.from('entities_cordis').select()
    entities.value = data
  }

  onMounted(() => {
    getTodos()
  })

</script>

<template>
  <ul>
    <li v-for="todo in entities" :key="todo.id">{{ todo.legal_name }}</li>
  </ul>
</template>
