<template>
  <main class="editor-container">
    <MonacoEditor
      v-model="code"
      language="json"
      :loading="loading"
    />
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { MonacoEditor } from '../../src'

const code = ref('')

const loading = ref(false)

onMounted(async () => {
  loading.value = true

  const response = await fetch('https://jsonplaceholder.typicode.com/todos')
  const data = await response.json()
  code.value = JSON.stringify(data, null, 2)
  // to simulate loading
  await new Promise((resolve) => setTimeout(resolve, 1000))
  loading.value = false
})
</script>

<style lang="scss" scoped>
.editor-container {
  height: calc(100vh - 20px);
  padding: $kui-space-50;
}
</style>
