<template>
  <div class="sandbox-container">
    <main>
      <p class="presets">
        <span>Schema presets:</span>
        <button
          v-for="definition in schemaPresets"
          :key="definition.name"
          @click="schemaDefinition = definition"
        >
          {{ definition.name }}
        </button>
      </p>

      <p class="presets">
        <span>Expression presets:</span>
        <button
          v-for="e in expressionPresets"
          :key="btoa(e)"
          @click="expression = e"
        >
          <code>{{ e }}</code>
        </button>
      </p>

      <ExpressionsEditor
        v-model="expression"
        :schema="schemaDefinition"
        @parse-result-update="onParseResultUpdate"
      />

      <div>
        <p>ParseResult:</p>
        <pre>{{ parseResult }}</pre>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SchemaDefinition } from '../src'
import { ExpressionsEditor, HTTP_SCHEMA_DEFINITION, STREAM_SCHEMA_DEFINITION } from '../src'

type NamedSchemaDefinition = { name: string; definition: SchemaDefinition }

const schemaPresets: NamedSchemaDefinition[] = [
  {
    name: 'http',
    definition: HTTP_SCHEMA_DEFINITION,
  },
  {
    name: 'stream',
    definition: STREAM_SCHEMA_DEFINITION,
  },
  { name: 'empty', definition: {} },
]

const expressionPresets = [
  'http.path contains "kong"',
  'http.host == "localhost"',
  'net.protocol ~ "^https?$"',
  'net.protocol ~ "^https?$" && net.src.port == 80',
]

const btoa = (s: string) => window.btoa(s)

const expression = ref(expressionPresets[0])
const schemaDefinition = ref<NamedSchemaDefinition>(schemaPresets[0])
const parseResult = ref('')

const onParseResultUpdate = (result: any) => {
  parseResult.value = JSON.stringify(result, null, 2)
}

watch(schemaDefinition, (newSchemaDefinition) => {
  schemaDefinition.value = newSchemaDefinition
})
</script>

<style lang="scss" scoped>
.presets {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}
</style>
