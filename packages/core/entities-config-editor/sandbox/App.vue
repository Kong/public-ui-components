<template>
  <div class="sandbox-container">
    <div class="stage-container">
      <KCard class="controls-card">
        <div class="controls">
          <KSelect
            v-model="language"
            :items="LANGUAGE_SELECT_ITEMS"
            label="Language"
          />

          <KSelect
            v-model="entityKind"
            :items="ENTITY_KIND"
            label="Entity Kind"
          />
        </div>
      </KCard>

      <div class="editor-container">
        <Suspense>
          <EntitiesConfigEditor
            :language="language"
            :lua-schema="luaSchema"
          />
        </Suspense>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SelectItem } from '@kong/kongponents'
import { ref, watch } from 'vue'
import EntitiesConfigEditor from '../src/components/EntitiesConfigEditor.vue'
import type { EditorLanguage } from '../src/types'

const LANGUAGE_SELECT_ITEMS: SelectItem[] = [
  { label: 'JSON', value: 'json' },
  { label: 'YAML', value: 'yaml' },
]

const ENTITY_KIND: SelectItem[] = [
  { label: 'Service', value: 'services' },
  { label: 'Route', value: 'routes' },
  { label: 'Consumer', value: 'consumers' },
  { label: 'Plugin', value: 'plugins' },
  { label: 'Upstream', value: 'upstreams' },
  { label: 'Target', value: 'targets' },
  { label: 'Certificate', value: 'certificates' },
  { label: 'SNI', value: 'snis' },
]

const language = ref<EditorLanguage>('json')
const entityKind = ref('services')

const luaSchema = ref(undefined)

watch(entityKind, async (kind) => {
  luaSchema.value = (await import (`./fixture/${kind}.json`)).default
}, { immediate: true })
</script>

<style lang="scss" scoped>
.stage-container {
  width: 100%;
  max-width: 1200px;
  margin: auto;

  .controls-card {
    margin-bottom: 8px;
  }

  .controls {
    width: 100%;
    max-width: 800px;
    gap: 18px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }

  .editor-container {
    height: 800px;
  }
}
</style>
