<template>
  <div class="sandbox-model-context">
    <div class="editor-area">
      <MonacoEditor
        ref="monacoEditor"
        v-model="content"
        :language="language"
      />
    </div>
    <div class="controls-area">
      <KSelect
        v-model="language"
        :items="languages"
      />

      <KCard>
        CodeLensProvider presets with language-specific helpers.

        <ul class="list">
          <li>Attaching code lenses to a specific JSON value at a key path.</li>
          <li>Decoding a X.509 certificate inline.</li>
          <li>Showing copy commands to all fields that contain string UUID values.</li>
          <li>Displaying formatted date/time to a specific JSON value at a key path.</li>
          <li>Listing formatted enum keys for a specific JSON value at a key path.</li>
          <li>Showing pretty name for a service id at a key path.</li>
          <li>Displaying code lenses for a specific JSON node type (e.g., boolean).</li>
          <li>...</li>
        </ul>
      </KCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as x509 from '@peculiar/x509'
import { editor as editorImport, languages as languagesImport } from 'monaco-editor'
import { computed, ref, useTemplateRef, watch } from 'vue'

import { collectCodeLenses, createJSONCopyUUIDCodeLensProvider, createJSONNodeCodeLensProvider, createJSONValueCodeLensProvider, MonacoEditor } from '../../src'
import { trackDisposableForEditor } from '../../src/singletons/lifecycle'
import codeLensesJSON from '../assets/code-lenses.json'

import type { SelectItem } from '@kong/kongponents'
import type { languages as Languages } from 'monaco-editor'

const COMMAND_ID_COPY = 'kong.monaco-editor.command.copy'
const COMMAND_ID_VIEW_SERVICE = 'kong.monaco-editor.command.viewService'

const languages = ref<SelectItem[]>([
  { label: 'JSON', value: 'json' },
])

const editorComponentRef = useTemplateRef('monacoEditor')
const language = ref(languages.value[0].value as string)
const content = ref('')
const editor = computed(() => editorComponentRef.value?.monacoEditor.editor.value)

watch(language, (newLang) => {
  switch (newLang) {
    case 'json':
      content.value = JSON.stringify(codeLensesJSON, null, 2)
      break
  }
}, { immediate: true })

const unwatchEditor = watch(editor, (editor) => {
  if (!editor) return

  editorImport.registerCommand(COMMAND_ID_COPY, (_accessor, content) => {
    alert(`In the real use-case, we can copy the content "${content}".`)
  })

  editorImport.registerCommand(COMMAND_ID_VIEW_SERVICE, (_accessor, serviceId) => {
    alert(`In the real use-case, we can navigate to the service "${serviceId}".`)
  })

  trackDisposableForEditor(editor, languagesImport.registerCodeLensProvider('json', collectCodeLenses([
    createJSONCopyUUIDCodeLensProvider({
      copyCommandId: COMMAND_ID_COPY,
      title: 'Copy UUID',
    }),

    createJSONValueCodeLensProvider(['created_at'], (value, range) => {
      const formattedDateTime = new Date(Number(value)).toLocaleString('en', { dateStyle: 'full', timeStyle: 'full' })

      return {
        lenses: [{
          range,
          command: {
            id: '',
            title: `$(calendar) ${formattedDateTime}`,
          },
        }],
      }
    }),

    createJSONValueCodeLensProvider(['certificate'], (value, range) => {
      let cert: x509.X509Certificate | undefined
      try {
        cert = new x509.X509Certificate(value)
      } catch (e) {
        console.warn('Failed to parse certificate:', e)
      }

      return {
        lenses: [
          {
            range,
            command: {
              id: COMMAND_ID_COPY,
              title: '$(copy) Copy certificate',
              arguments: [String(value)],
            },
          },
          ...cert ? [
            {
              range,
              command: {
                id: '',
                title: `Subject ${cert.subject}`,
              },
            },
            {
              range,
              command: {
                id: '',
                title: `Expires after ${cert.notAfter.toLocaleString()}`,
              },
            },
          ] : [
            {
              range,
              command: {
                id: '',
                title: 'Invalid certificate',
              },
            },
          ],

        ],
      }
    }),

    createJSONValueCodeLensProvider<{ id: string }>(['service'], (value, range) => {
      return {
        lenses: [
          {
            range,
            command: {
              id: COMMAND_ID_VIEW_SERVICE,
              title: '$(link-external) View service in new tab',
              arguments: [value.id],
            },
          },
          {
            range,
            command: {
              id: '',
              title: 'MyService-1 (Pretty name)',
            },
          },
        ],
      }
    }),

    createJSONValueCodeLensProvider<string[]>(['labels'], (value, range) => {
      return {
        lenses: value.reduce((lenses, label) => {
          let title: string
          if (label === 'debian12') {
            title = '$(terminal-debian) Debian 12'
          } else if (label === 'amd64') {
            title = '$(chip) AMD 64'
          } else {
            return lenses
          }

          lenses.push({
            range,
            command: {
              id: '',
              title,
            },
          })

          return lenses
        }, [] as Languages.CodeLens[]),
      }
    }),

    createJSONNodeCodeLensProvider((node, stop, model) => {
      if (node.type !== 'boolean') return undefined

      const startPos = model.getPositionAt(node.offset)
      const endPos = model.getPositionAt(node.offset + node.length)

      stop()

      return {
        lenses: [
          {
            range: {
              startLineNumber: startPos.lineNumber,
              startColumn: startPos.column,
              endLineNumber: endPos.lineNumber,
              endColumn: endPos.column,
            },
            command: {
              id: '',
              title: 'This only appears on the 1st boolean field because we called stop()',
            },
          },
        ],
      }
    }),
  ])))

  unwatchEditor() // Watch once
})
</script>

<style lang="scss" scoped>
.sandbox-model-context {
  box-sizing: border-box;
  display: grid;
  gap: $kui-space-40;
  grid-template-columns: minmax(600px, 1fr) minmax(400px, 600px);
  height: 100%;
  width: 100%;

  .editor-area {
    height: 100%;

    :deep(.sandbox-monaco-highlight) {
      background: rgba($kui-color-background-warning-weaker, 0.85);
    }
  }

  .controls-area {
    display: flex;
    flex-direction: column;
    gap: $kui-space-60;
    min-height: 0;
    padding: $kui-space-80 $kui-space-80;

    .list {
      margin: $kui-space-20 0 0 $kui-space-20;
      padding: $kui-space-40;
    }
  }
}
</style>
