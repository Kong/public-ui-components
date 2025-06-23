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

const { t } = createI18n<typeof english>('en-us', english)

const props = defineProps<Props<any>>()

const editorRoot = useTemplateRef('editor-root')
const editorRef = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)
const LINT_SOURCE = 'YAML Syntax'

const CODE_EXAMPLES = {
  // FIXME: Replace the `authenticate` example when it's ready
  authenticate:
`debug: true
nodes:
- name: AUTHENTICATE
  type: call
  url: https://example.com/authenticate
- name: EXIT
  type: exit
  inputs:
    body: AUTHENTICATE.body
  status: 200
`,
  combine:
`debug: true
nodes:
- name: API1
  type: call
  url: https://example.com/api1
- name: API2
  type: call
  url: https://example.com/api2
- name: JOIN
  inputs:
    api1_content: API1.body
    api2_content: API2.body
  jq: |
    {
        "api1": .api1_content,
        "api2": .api2_content,
    }
  type: jq
- name: EXIT
  type: exit
  inputs:
    body: JOIN
  status: 200
`,
}

function setExampleCode(example: 'authenticate' | 'combine') {
  if (editorRef.value) {
    replaceAll(CODE_EXAMPLES[example])
  }
}

function replaceAll(newCode: string) {
  const editor = editorRef.value
  const model = editor?.getModel()
  if (!editor || !model) {
    return
  }

  if (editor.getValue() !== newCode) {
    const fullRange = model.getFullModelRange()

    editor.pushUndoStop()
    editor.executeEdits(
      'replace-all',
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
