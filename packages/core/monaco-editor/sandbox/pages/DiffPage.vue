<template>
  <main class="page">
    <header class="controls">
      <KSelect
        v-model="language"
        :items="languages"
      />
      <KRadio
        v-model="appearance"
        label="Embedded"
        selected-value="embedded"
      />
      <KRadio
        v-model="appearance"
        label="Standalone"
        selected-value="standalone"
      />
      <KRadio
        v-model="theme"
        label="Light"
        selected-value="light"
      />
      <KRadio
        v-model="theme"
        label="Dark"
        selected-value="dark"
      />
    </header>

    <section
      :key="theme"
      class="diff-container"
      :class="[appearance]"
    >
      <MonacoDiffEditor
        :appearance="appearance"
        :language="language"
        :modified="modified"
        :original="original"
        :theme="theme"
        @ready="onReady"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { MonacoDiffEditor } from '../../src'
import { KRadio, KSelect } from '@kong/kongponents'
import { defaultCodes } from '../constants'
import type { SelectItem } from '@kong/kongponents'
import type { editor } from 'monaco-editor'

// A per-language original/modified pair, so switching the language dropdown shows
// a visible diff instead of re-tokenizing the same YAML text under a different mode.
const diffSamples: Record<string, { original: string, modified: string }> = {
  yaml: {
    original: defaultCodes.yaml,
    modified: defaultCodes.yamlModified,
  },
  json: {
    original: JSON.stringify({
      name: 'my-service',
      version: '1.0.0',
      features: { autoSave: true, languages: ['javascript', 'typescript', 'css', 'markdown', 'yaml'] },
    }, null, 2),
    modified: JSON.stringify({
      name: 'my-service',
      version: '1.1.0',
      features: { autoSave: true, languages: ['javascript', 'typescript', 'css', 'markdown', 'yaml', 'json'] },
    }, null, 2),
  },
  typescript: {
    original: [
      'function greet(name: string): string {',
      "  return 'Hello, ' + name",
      '}',
      '',
    ].join('\n'),
    modified: [
      'function greet(name: string): string {',
      "  return 'Hello, ' + name + '!'",
      '}',
      '',
    ].join('\n'),
  },
  markdown: {
    original: [
      '# Release Notes',
      '',
      '- Fixed a bug',
      '',
    ].join('\n'),
    modified: [
      '# Release Notes',
      '',
      '- Fixed a bug',
      '- Added dark mode',
      '',
    ].join('\n'),
  },
}

const language = ref('yaml')
const original = ref(diffSamples[language.value].original)
const modified = ref(diffSamples[language.value].modified)

const appearance = ref<'embedded' | 'standalone'>('standalone')
const theme = ref<'light' | 'dark'>('light')

const languages = ref<SelectItem[]>([
  { label: 'YAML', value: 'yaml' },
  { label: 'JSON', value: 'json' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Markdown', value: 'markdown' },
])

watch(language, (newLang) => {
  const sample = diffSamples[newLang]
  if (!sample) return
  original.value = sample.original
  modified.value = sample.modified
})

const onReady = (diffEditor: editor.IStandaloneDiffEditor) => {
  console.log('Diff editor ready', diffEditor)
}
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.controls {
  align-items: center;
  border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: var(--kui-space-70, $kui-space-70);
  padding: var(--kui-space-60, $kui-space-60);
}

.diff-container {
  flex: 1;
  height: 100%;
  min-height: 0;

  &.standalone {
    padding: var(--kui-space-60, $kui-space-60);
  }
}
</style>
