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
        :provide-rhs-completion="provideRhsCompletion"
        :schema="schemaDefinition"
        @parse-result-update="onParseResultUpdate"
      />

      <a
        href="#"
        style="color: #0030cc; font-weight: bold;"
        @click.prevent="isVisible = true"
      >Test with Router Playground</a>

      <RouterPlaygroundModal
        :hide-editor-actions="false"
        :initial-expression="expression"
        :is-visible="isVisible"
        @cancel="isVisible = false"
        @commit="handleCommit"
        @notify="console.log"
      >
        <template #page-header>
          <p>A playground where you can test out the Kong router Expressions.</p>
        </template>
      </RouterPlaygroundModal>

      <div>
        <p>ParseResult:</p>
        <pre>{{ parseResult }}</pre>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { ref, watch } from 'vue'
import type { SchemaDefinition } from '../src'
import { ExpressionsEditor, HTTP_SCHEMA_DEFINITION, RouterPlaygroundModal, STREAM_SCHEMA_DEFINITION } from '../src'
import type { ProvideRhsCompletion } from '../src/components/ExpressionsEditor.vue'

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

const expression = ref('lower(http.path) == "/kong" || lower(lower(http.path)) == "/kong"')
const schemaDefinition = ref<NamedSchemaDefinition>(schemaPresets[0])
const parseResult = ref('')
const isVisible = ref(false)

const onParseResultUpdate = (result: any) => {
  parseResult.value = JSON.stringify(result, null, 2)
}

const handleCommit = (exp: string) => {
  expression.value = exp
  isVisible.value = false
}

const provideRhsCompletion: ProvideRhsCompletion = async (lhsValue, rhsValue, lhsRange, rhsRange) => {
  return {
    suggestions: new Array(10).fill(0).map(() => {
      const text = `${rhsValue}+${Math.random().toString(36).slice(2, 6)}`
      return {
        label: text,
        kind: monaco.languages.CompletionItemKind.Value,
        detail: `lhs = ${lhsValue}`,
        insertText:text,
        range: rhsRange,
      }
    }),
  }
}

watch(schemaDefinition, (newSchemaDefinition) => {
  schemaDefinition.value = newSchemaDefinition
})
</script>
