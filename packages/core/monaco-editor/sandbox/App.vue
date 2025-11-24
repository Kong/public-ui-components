<template>
  <div class="sandbox-container">
    <main class="editor-grid-container">
      <MonacoEditor
        v-model="codes['yaml']"
        language="yaml"
        :toolbar="false"
      >
        <template #state-empty="{ isEmpty }">
          <template v-if="isEmpty">
            Custom empty state for YAML editor
          </template>
        </template>
      </MonacoEditor>
      <MonacoEditor
        v-for="lang in languages"
        :key="lang"
        v-model="codes[lang]"
        :language="lang"
        :toolbar="true"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { MonacoEditor } from '../src'
import { defaultCodes } from './constants'

const languages = ['typescript', 'regex', 'json', 'markdown', 'css']

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
  padding: $kui-space-20;
  width: 100%;
}
</style>
