<template>
  <StandardLayout
    v-bind="props"
    class="dk-form"
  >
    <template #default="formProps">
      <Form
        v-bind="formProps"
        tag="div"
      >
        <KAlert class="examples">
          <div class="examples-content">
            {{ t('plugins.free-form.datakit.description_example') }}

            <KButton
              appearance="secondary"
              size="small"
              @click="setExampleCode('authenticate')"
            >
              Authenticate Kong Gateway to a third-party service
            </KButton>
            <KButton
              appearance="secondary"
              size="small"
              @click="setExampleCode('combine')"
            >
              Combine two APIs into one response
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
      </Form>
    </template>

    <template #plugin-config-description>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <span v-html="t('plugins.free-form.datakit.description')" />
    </template>
  </StandardLayout>
</template>

<script setup lang="ts">
import { onMounted, shallowRef, useTemplateRef, toRaw, onBeforeUnmount } from 'vue'
import * as monaco from 'monaco-editor'
import type { YAMLException } from 'js-yaml'
import yaml, { JSON_SCHEMA } from 'js-yaml'
import english from '../../../locales/en.json'
import StandardLayout from '../shared/layout/StandardLayout.vue'
import Form from '../shared/Form.vue'
import type { Props } from '../shared/layout/StandardLayout.vue'
import { createI18n } from '@kong-ui-public/i18n'
import { KAlert } from '@kong/kongponents'
import { SparklesIcon } from '@kong/icons'

// TODO: Update the `authenticate` example with real code once it's ready
import * as examples from './examples'

const { t } = createI18n<typeof english>('en-us', english)

const props = defineProps<Props<any>>()

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
  if (editor.getValue() !== newCode) {
    const fullRange = model.getFullModelRange()

    editor.pushUndoStop()
    editor.executeEdits(
      EDIT_SOURCE,
      [{ range: fullRange, text: newCode }],
    )
    editor.pushUndoStop()
  }

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

  if (props.isEditing) {
    editor.setValue(yaml.dump(toRaw(props.model.config), {
      schema: JSON_SCHEMA,
      noArrayIndent: true,
    }))
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

      props.onFormChange({
        config,
      })
      props.onValidityChange?.({
        model: 'config',
        valid: true,
      })
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

      props.onValidityChange?.({
        model: 'config',
        valid: false,
        error: simpleMessage,
      })
    }
  })
})

onBeforeUnmount(() => {
  editorRef.value?.dispose()
})
</script>

<style lang="scss" scoped>
.dk-form {
  .editor {
    height: 684px;
    width: 100%;
  }

  .examples {
    margin-bottom: $kui-space-70;
  }

  .examples-content {
    display: flex;
    gap: $kui-space-40;
  }
}
</style>
