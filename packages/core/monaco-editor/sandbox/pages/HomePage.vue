<template>
  <main class="page">
    <header class="controls">
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
    </header>

    <section
      class="editor-container"
      :class="[appearance]"
    >
      <MonacoEditor
        v-model="code"
        :appearance="appearance"
        language="json"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MonacoEditor } from '../../src'
import { KRadio } from '@kong/kongponents'

const code = ref('')

const appearance = ref<'embedded' | 'standalone'>('embedded')
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
  border-bottom: $kui-border-width-10 solid $kui-color-border;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-80;
  padding: $kui-space-60;
}

.editor-container {
  flex: 1;
  height: 100%;
  min-height: 0;

  &.standalone {
    padding: $kui-space-60;
  }
}
</style>
