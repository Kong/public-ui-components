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
        <div
          ref="editor-root"
          class="editor"
        />
      </Form>
    </template>

    <template #plugin-config-description>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <span v-html="t('plugins.form.sections.plugin_config.description_yaml')" />
    </template>
  </StandardLayout>
</template>

<script setup lang="ts">
import { onMounted, shallowRef, useTemplateRef, toRaw, onBeforeUnmount } from 'vue'
import type * as monaco from 'monaco-editor'
import type { YAMLException } from 'js-yaml'
import yaml, { JSON_SCHEMA } from 'js-yaml'
import english from '../../../locales/en.json'
import StandardLayout from '../shared/layout/StandardLayout.vue'
import Form from '../shared/Form.vue'
import type { Props } from '../shared/layout/StandardLayout.vue'
import { createI18n } from '@kong-ui-public/i18n'

const { t } = createI18n<typeof english>('en-us', english)

const props = defineProps<Props<any>>()

const editorRoot = useTemplateRef('editor-root')
const editor = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)
const LINT_SOURCE = 'YAML Syntax'

const CODE_EXAMPLE = `# Example YAML configuration

# debug: true
# nodes:
# - name: API1
#   type: call
#   url: https://example.com/api1
# - name: API2
#   type: call
#   url: https://example.com/api2
# - name: JOIN
#   inputs:
#     api1_content: API1.body
#     api2_content: API2.body
#   jq: |
#     {
#         "api1": .api1_content,
#         "api2": .api2_content,
#     }
#   type: jq
# - name: EXIT
#   type: exit
#   inputs:
#     body: JOIN
#   status: 200
`

onMounted(async () => {
  const monaco = await import('monaco-editor')
  editor.value = monaco.editor.create(editorRoot.value!, {
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

  if (props.isEditing) {
    editor.value.setValue(yaml.dump(toRaw(props.model.config), {
      schema: JSON_SCHEMA,
      noArrayIndent: true,
    }))
  } else {
    // If not editing, show an example configuration
    editor.value.setValue(CODE_EXAMPLE)
  }

  editor.value.onDidChangeModelContent(() => {
    const model = editor.value!.getModel()
    const value = editor.value!.getValue() || ''
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
  editor.value?.dispose()
})
</script>

<style lang="scss" scoped>
.dk-form {
  .editor {
    height: 684px;
    width: 100%;
  }
}
</style>
