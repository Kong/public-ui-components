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

    <KModal
      :action-button-text="t('plugins.free-form.datakit.detected_config_format_confirm')"
      :title="t('plugins.free-form.datakit.detected_config_format_title')"
      :visible="showConvertModal"
      @cancel="handleConvertCancel"
      @proceed="handleConvertConfirm"
    >
      {{ t('plugins.free-form.datakit.detected_config_format', { format: pendingExtractorName }) }}
    </KModal>
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef, shallowRef, inject, toRaw } from 'vue'
import { isEqual, omit } from 'lodash-es'
import * as monaco from 'monaco-editor'
import yaml, { JSON_SCHEMA } from 'js-yaml'
import { createI18n } from '@kong-ui-public/i18n'
import { KAlert, KButton, KModal } from '@kong/kongponents'
import { SparklesIcon } from '@kong/icons'
import { useErrors } from '@kong-ui-public/entities-shared'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { useMonacoEditor } from '@kong-ui-public/monaco-editor'
import english from '../../../locales/en.json'
import { useFormShared } from '../shared/composables'
import examples from './examples'
import { extractors } from './config-extractors'

import type { YAMLException } from 'js-yaml'
import type { DatakitConfig, DatakitPluginData } from './types'
import type { KonnectPluginFormConfig, KongManagerPluginFormConfig } from '../../../types'

const { t } = createI18n<typeof english>('en-us', english)

const { formData, setValue } = useFormShared<DatakitPluginData>()
const formConfig = inject<KonnectPluginFormConfig | KongManagerPluginFormConfig>(FORMS_CONFIG)!

defineProps<{
  editing: boolean
}>()

const emit = defineEmits<{
  change: [config: unknown]
  error: [msg: string]
}>()

const { getMessageFromError } = useErrors()

const editorRoot = useTemplateRef('editor-root')

const LINT_SOURCE = 'YAML Syntax'

function dumpYaml(config: unknown): string {
  return yaml.dump(toRaw(config), {
    schema: JSON_SCHEMA,
    noArrayIndent: true,
  })
}

function formDataToCode(): string {
  if (formConfig.app === 'kongManager' && formData.config) {
    return dumpYaml(formData.config)
  }

  if (formConfig.app === 'konnect') {
    return dumpYaml(omit(formData, ['__ui_data']))
  }

  return ''
}

const code = shallowRef(formDataToCode())

const { editor: editorRef } = useMonacoEditor(editorRoot, {
  language: 'yaml',
  code,
  theme: 'light',
  monacoOptions: {
    scrollbar: {
      alwaysConsumeMouseWheel: false,
    },
    autoIndent: 'keep',
    editContext: false,
  },
  onCreated: () => {
    const editor = editorRef.value
    const model = editor?.getModel()
    if (!editor || !model) return

    editor.onDidChangeModelContent(() => {
      try {
        const config = yaml.load(editor.getValue() || '', {
          schema: JSON_SCHEMA,
          json: true,
        })

        monaco.editor.setModelMarkers(model, LINT_SOURCE, [])

        if (formConfig.app === 'konnect') {
          setValue(config as DatakitPluginData)
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

        monaco.editor.setModelMarkers(model, LINT_SOURCE, markers)

        emit('error', simpleMessage)
      }
    })

    if (formConfig.app === 'konnect') {
      editor.onDidPaste((e) => {
        const model = editor.getModel()
        if (!model) return

        const pastedText = model.getValueInRange(e.range)

        for (const extractor of extractors) {
          const extractedConfig = extractor.extract(pastedText)
          if (extractedConfig) {
            pendingConfig.value = extractedConfig
            pendingExtractorName.value = extractor.name
            showConvertModal.value = true
            return
          }
        }
      })
    }

    focusEnd()
  },
})

const showConvertModal = shallowRef(false)
const pendingConfig = shallowRef<unknown | null>(null)
const pendingExtractorName = shallowRef('')

function handleConvertCancel() {
  showConvertModal.value = false
  pendingConfig.value = null
  pendingExtractorName.value = ''
}

function handleConvertConfirm() {
  if (!pendingConfig.value) return

  code.value = dumpYaml(pendingConfig.value)

  handleConvertCancel()
}

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

  // Kong Manager's code editor is editing only the config portion
  if (formConfig.app === 'kongManager') {
    if (editor.getValue() !== newCode) {
      code.value = newCode
    }

    focusEnd()
    return
  }

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

    code.value = dumpYaml(nextConfig)
  } catch (error: unknown) {
    emit('error', getMessageFromError(error))
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
