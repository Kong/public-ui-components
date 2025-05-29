<template>
  <div class="sandbox-container">
    <main>
      <div>
        <h1>From Lua</h1>
        <h2>RegExp from Lua pattern</h2>
        <div class="regex-from-lua">
          <KTextArea
            v-model="luaPattern"
            :character-limit="false"
            label="Lua pattern"
            :rows="4"
          />
          <KTextArea
            v-model="regexFromLua"
            :character-limit="false"
            label="Regular expression"
            readonly
            :rows="4"
          />
          <KTextArea
            v-model="testString"
            :character-limit="false"
            :has-error="!testStringMatch"
            label="Test match"
            :rows="4"
          />
        </div>

        <h2>LuaSchema to JSONSchema</h2>
        <div class="lua-json-schema">
          <KTextArea
            v-model="luaSchema"
            :character-limit="false"
            :has-error="!!luaJsonSchemaError"
            :help="luaJsonSchemaError"
            label="Lua schema"
            :rows="20"
          />
          <KTextArea
            v-model="jsonSchema"
            :character-limit="false"
            label="JSONSchema"
            readonly
            :rows="20"
          />
          <KTextArea
            v-model="tsInterface"
            :character-limit="false"
            label="TypeScript interface"
            readonly
            :rows="20"
          />
        </div>

        <div class="lua-json-schema-actions">
          <KButton @click="handleConvertLuaSchema">
            Convert
          </KButton>
        </div>
      </div>

      <h3>Editor</h3>
      <div
        ref="monacoRef"
        class="editor"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { compile } from 'json-schema-to-typescript'
import * as monaco from 'monaco-editor'
import { computed, onMounted, ref, watch } from 'vue'
import { buildLuaSchema, regexFromLuaPattern, type LuaSchema } from '../src'
import routesLuaSchema from './fixtures/routes.json?raw'
import { setupMonaco } from './monaco'

setupMonaco()

const monacoRef = ref<HTMLDivElement>()

const luaPattern = ref('^[+-]?%d+$')
const testString = ref('-123456')
const regexFromLua = computed(() => regexFromLuaPattern(luaPattern.value))
const testStringMatch = computed(() => new RegExp(regexFromLua.value).test(testString.value))

const luaSchema = ref(routesLuaSchema)
const jsonSchema = ref('')
const tsInterface = ref('')
const luaJsonSchemaError = ref('')

const handleConvertLuaSchema = async () => {
  try {
    const parsedLuaSchema = JSON.parse(luaSchema.value) as LuaSchema
    const jsonSchemaObj = buildLuaSchema(parsedLuaSchema)
    jsonSchema.value = JSON.stringify(jsonSchemaObj, null, 2)
    luaJsonSchemaError.value = ''

    // FIXME: Better not to use `as any`
    tsInterface.value = await compile(jsonSchemaObj as any, 'Test', { format: false })
  } catch (error) {
    console.error('Failed to convert from Lua schema:', error)
    jsonSchema.value = ''
    luaJsonSchemaError.value = 'Failed to convert. Please check the console output for details.'
  }
}

watch(jsonSchema, (schema) => {
  const schemaObj = schema ? JSON.parse(schema) : undefined

  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    enableSchemaRequest: false,
    schemas: schemaObj ? [
      {
        uri: 'local://schema.json',
        fileMatch: ['*'],
        schema: schemaObj,
      },
    ] : [],
  })
})

onMounted(() => {
  const modelUri = monaco.Uri.parse('local://test.json')
  const model = monaco.editor.createModel('{}', 'json', modelUri)
  monaco.editor.create(monacoRef.value!, { model })
})
</script>

<style lang="scss" scoped>
.regex-from-lua {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));

  :deep(.k-textarea) textarea {
    font-family: $kui-font-family-code;
  }
}

.lua-json-schema {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));

  :deep(.k-textarea) textarea {
    font-family: $kui-font-family-code;
    font-size: $kui-font-size-10;
  }
}

.lua-json-schema-actions {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  margin-top: $kui-space-30;
}

.editor {
  height: 500px;
}
</style>
