<template>
  <div class="dk-code-editor">
    <KAlert class="examples">
      <div class="examples-content">
        {{ t('plugins.free-form.datakit.description_example') }}

        <KButton
          v-for="(_, key) in examples"
          :key="key"
          appearance="secondary"
          size="small"
          @click="setExampleCode(key)"
        >
          {{ t(`plugins.free-form.datakit.examples.${key}`) }}
        </KButton>
      </div>

      <template #icon>
        <SparklesIcon />
      </template>
    </KAlert>
    <div
      ref="editor-root"
      class="editor"
    />
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef, onMounted, onBeforeUnmount, shallowRef, toRaw, inject } from 'vue'
import * as monaco from 'monaco-editor'
import { createI18n } from '@kong-ui-public/i18n'
import { KAlert, KButton } from '@kong/kongponents'
import { SparklesIcon } from '@kong/icons'
import english from '../../../locales/en.json'
import yaml, { JSON_SCHEMA } from 'js-yaml'
import examples from './examples'
import { FEATURE_FLAGS } from '../../../constants'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'

import type { YAMLException } from 'js-yaml'
import type { DatakitConfig, DatakitPluginData } from './types'
import { useFormShared } from '../shared/composables'
import { isEqual, omit } from 'lodash-es'
import { useErrors } from '@kong-ui-public/entities-shared'

const enableDatakitM2 = inject<boolean>(FEATURE_FLAGS.DATAKIT_M2, false)

const { t } = createI18n<typeof english>('en-us', english)

const { formData, resetFormData } = useFormShared<DatakitPluginData>()

defineProps<{
  editing: boolean
}>()

const emit = defineEmits<{
  change: [config: unknown]
  error: [msg: string]
}>()

const { getMessageFromError } = useErrors()

const editorRoot = useTemplateRef('editor-root')
const editorRef = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)
const LINT_SOURCE = 'YAML Syntax'

const EDIT_SOURCE = 'datakit.insert-example'

/**
 * Sets the example code in the Monaco editor.
 * We do not use `setValue` directly because it will clear the undo stack,
 * which prevents the user from undoing changes after inserting an example.
 */
function setExampleCode(example: keyof typeof examples) {
  const editor = editorRef.value
  const model = editor?.getModel()
  if (!editor || !model) {
    return
  }

  const newCode = examples[example]
  if (!enableDatakitM2 && editor.getValue() !== newCode) {
    editor.pushUndoStop()
    editor.executeEdits(EDIT_SOURCE, [{ range: model.getFullModelRange(), text: newCode }])
    editor.pushUndoStop()
  }

  if (enableDatakitM2) {
    try {
      const value = editor.getValue() || ''
      const config = yaml.load(value, {
        schema: JSON_SCHEMA,
        json: true,
      }) as any

      const exampleConfigJson = yaml.load(newCode, {
        schema: JSON_SCHEMA,
        json: true,
      }) as any

      if (isEqual(config.config, exampleConfigJson)) return

      const nextConfig = omit({
        ...formData,
        config: { ...exampleConfigJson },
      }, ['__ui_data'])

      const nextValue = yaml.dump(nextConfig, {
        schema: JSON_SCHEMA,
        noArrayIndent: true,
      })

      editor.pushUndoStop()
      editor.executeEdits(EDIT_SOURCE, [{ range: model.getFullModelRange(), text: nextValue }])
      editor.pushUndoStop()
    } catch (error: unknown) {
      emit('error', getMessageFromError(error))
    }
  }

  focusEnd()
}

function focusEnd() {
  const editor = editorRef.value
  const model = editor?.getModel()
  if (!editor || !model) {
    return
  }

  editor.setPosition(model.getFullModelRange().getEndPosition())
  editor.focus()
}

onMounted(() => {
  const editor = monaco.editor.create(editorRoot.value!, {
    language: 'yaml',
    automaticLayout: true,
    minimap: {
      enabled: false,
    },
    scrollBeyondLastLine: false,
    tabSize: 2,
    scrollbar: {
      alwaysConsumeMouseWheel: false,
    },
    autoIndent: 'keep',
  })
  editorRef.value = editor

  if (!enableDatakitM2 && formData.config && Object.keys(formData.config).length > 0) {
    const config = { ...formData.config } as any

    if (config.nodes && config.nodes.length === 0) {
      delete config.nodes
    }

    const value = Object.keys(config).length === 0
      ? ''
      : yaml.dump(toRaw(config), {
        schema: JSON_SCHEMA,
        noArrayIndent: true,
      })

    editor.setValue(value)

    focusEnd()
  }

  if (enableDatakitM2) {
    const initialConfig = omit({ ...formData }, ['__ui_data'])
    const value = yaml.dump(initialConfig, {
      schema: JSON_SCHEMA,
      noArrayIndent: true,
    })
    editor.setValue(value)
    focusEnd()
  }

  editor.onDidChangeModelContent(() => {
    const model = editor.getModel()
    const value = editor.getValue() || ''
    try {
      const config = yaml.load(value, {
        schema: JSON_SCHEMA,
        json: true,
      })

      monaco.editor.setModelMarkers(model!, LINT_SOURCE, [])

      if (enableDatakitM2) {
        resetFormData(config as DatakitPluginData)
      } else {
        formData.config = config as DatakitConfig
      }
      emit('change', config)
    } catch (error: unknown) {
      const { message, mark } = error as YAMLException
      const { line, column } = mark || { line: 0, column: 0 }

      const simpleMessage = message.split('\n')[0] // Take the first line of the error message

      const markers: monaco.editor.IMarkerData[] = [
        {
          startLineNumber: line + 1,
          startColumn: column + 1,
          endLineNumber: line + 1,
          endColumn: column + 2,
          message: simpleMessage,
          severity: monaco.MarkerSeverity.Error,
          source: LINT_SOURCE,
        },
      ]

      monaco.editor.setModelMarkers(model!, LINT_SOURCE, markers)

      emit('error', simpleMessage)
    }
  })
})

onBeforeUnmount(() => {
  editorRef.value?.dispose()
})

defineExpose({
  setExampleCode,
})
</script>

<style lang="scss" scoped>
.dk-code-editor {
  .examples {
    margin-bottom: $kui-space-70;
  }

  .examples-content {
    display: flex;
    flex-wrap: wrap;
    gap: $kui-space-40;
  }

  .editor {
    height: 684px;
    width: 100%;
  }
}
</style>
