<template>
  <div class="sandbox-container">
    <main class="editor-grid-container">
      <MonacoEditor
        v-for="lang, i in languages"
        :key="lang"
        v-model="codes[lang]"
        :language="lang"
        :theme="languages.length - 1 === i ? 'dark' : 'light'"
        :toolbar="true"
      />
      <!-- :toolbar="i % 2 !== 0" -->
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { MonacoEditor } from '../src'
import { defaultCodes } from './content'

const languages = ['yaml', 'typescript', 'regex', 'json', 'markdown', 'css']

const codes = reactive<{ [key in typeof languages[number]]: string }>({ ...defaultCodes })
</script>

<style lang="scss">
html,
body {
  margin: $kui-space-0;
}

.editor-grid-container {
  background: $kui-color-background-decorative-purple;
  display: grid;
  gap: $kui-space-20;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  height: 100vh;
  width: 100%;
  padding: $kui-space-20;
}
</style>
