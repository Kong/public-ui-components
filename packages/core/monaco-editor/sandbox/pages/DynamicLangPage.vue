<template>
  <main class="editor-container">
    <MonacoEditor
      v-model="code"
      :language="language"
    />
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { MonacoEditor } from '../../src'

const code = ref(`openapi: 3.0.3
info:
  title: Flight API
  description: API for searching, booking, and managing flights.
  version: 1.0.0\n`)

const language = ref('yaml')

onMounted(async () => {

  // wait 3 seconds and change language to json
  await new Promise((resolve) => setTimeout(resolve, 3000))
  // language.value = 'json'
  const response = await fetch('https://jsonplaceholder.typicode.com/todos')
  const data = await response.json()
  code.value = JSON.stringify(data, null, 2)
  language.value = 'json'
})
</script>

<style lang="scss" scoped>
.editor-container {
  height: 100%;
}
</style>
