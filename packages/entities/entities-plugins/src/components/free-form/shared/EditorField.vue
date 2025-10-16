<template>
  <div class="ff-editor-field">
    <KLabel
      v-bind="fieldAttrs.labelAttributes"
      for="editor-field"
      :required="fieldAttrs.required"
    >
      {{ fieldAttrs.label }}
      <template
        v-if="fieldAttrs.labelAttributes?.info"
        #tooltip
      >
        <slot name="tooltip">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-html="fieldAttrs.labelAttributes.info" />
        </slot>
      </template>
    </KLabel>

    <div
      ref="editorRoot"
      class="editor-container"
      :data-testid="`ff-${field.path.value}`"
    />

    <!-- Format error display -->
    <div
      v-if="formatError"
      class="format-error"
    >
      <KAlert
        appearance="danger"
        :message="formatError"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRef, useAttrs, watch, onMounted, onBeforeUnmount, shallowRef, nextTick, useTemplateRef } from 'vue'
import { get, isEqual } from 'lodash-es'
import yaml from 'js-yaml'
import * as monaco from 'monaco-editor'
import type { LabelAttributes } from '@kong/kongponents'
import { KAlert, KLabel } from '@kong/kongponents'

import { useField, useFieldAttrs, useFreeformStore } from './composables'
import type { UnionFieldSchema } from '../../../types/plugins/form-schema'

const DEFAULT_INITIAL_HEIGHT = 100
const DEFAULT_MIN_HEIGHT = 100
const DEFAULT_MAX_HEIGHT = 800
const STRUCTURED_SCHEMA_TYPES: Array<UnionFieldSchema['type']> = ['json', 'map', 'array', 'set', 'foreign', 'record']

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

type FlexibleHeightProps = {
  autosize: true
  /** initial height */
  height?: number
  minHeight?: number
  maxHeight?: number
}

type FixedHeightProps = {
  autosize?: false
  height?: number
}

type EditorFieldProps = {
  name: string
  /**
   * The language of Monaco editor, language is immutable, any update after mount will be ignored
   * @default 'json'
   */
  language?: 'json' | 'yaml' | 'plaintext' | 'lua'
  readonly?: boolean
  labelAttributes?: LabelAttributes
} & (FixedHeightProps | FlexibleHeightProps)

type ValueType = Record<string, any> | string | number | boolean | null | undefined | unknown[]

const {
  name,
  language = 'json',
  readonly = false,
  ...props
} = defineProps<EditorFieldProps>()

const emit = defineEmits<{
  'update:modelValue': [value: ValueType]
}>()

const { value: fieldValue, onFormDataChange, ...field } = useField<ValueType, UnionFieldSchema>(toRef(() => name))
useFreeformStore()

if (field.error) {
  throw new Error(field.error.message)
}

onFormDataChange?.((formData, meta) => {
  const editor = editorRef.value
  const model = editor?.getModel()
  if (!editor || !model) {
    return
  }

  // self update, ignore
  if (meta.originType === 'field' && meta.fieldInstanceId === field.instanceId) return

  // not related field update, ignore
  if (meta.originType === 'field' && !meta.fieldPath.startsWith(field.path.value)) return

  // check if value actually changed, and update editor if so
  const rawEditorValue = editor.getValue()
  let currentValue: ValueType = null

  try {
    const finalValue = convertStringToValue(rawEditorValue)
    currentValue = finalValue
  } catch {
    return
  }

  const newValue = get(formData, field.path.value)

  // content no change, skip
  if (isEqual(newValue, currentValue)) return

  // update editor content
  const formattedValue = convertValueToString(newValue)
  editor.setValue(formattedValue)
})

const fieldAttrs = useFieldAttrs(field.path!, toRef({ ...props, ...attrs }))

const editorRoot = useTemplateRef('editorRoot')
const editorRef = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)
const formatError = ref('')
const contentHeight = ref(0)

const LINT_SOURCE = `${language.toUpperCase()} Syntax`

// Height calculation for v-bind
const height = computed(() => {
  if (props.autosize) {
    const minH = props.minHeight || DEFAULT_MIN_HEIGHT
    const maxH = props.maxHeight || DEFAULT_MAX_HEIGHT
    const targetHeight = contentHeight.value > 0 ? contentHeight.value : (props.height || DEFAULT_INITIAL_HEIGHT)

    return `clamp(${minH}px, ${targetHeight}px, ${maxH}px)`
  } else {
    return `${props.height || DEFAULT_INITIAL_HEIGHT}px`
  }
})

function convertStringToValue(value: string): ValueType {
  if (!value.trim() || !!field.error || !field.schema.value) {
    return null
  }

  const isStructuredSchema = STRUCTURED_SCHEMA_TYPES.includes(field.schema.value.type)

  // For non-structured types, directly convert and emit
  if (!isStructuredSchema) {
    let finalValue: ValueType = value
    if (field.schema.value.type === 'number') {
      if (isNaN(Number(value) as number)) {
        throw new Error('Invalid number format')
      }
      finalValue = Number(value)
    } else if (field.schema.value.type === 'boolean') {
      if (value !== 'true' && value !== 'false') {
        throw new Error('Invalid boolean format')
      }
      finalValue = value === 'true'
    }
    return finalValue
  }

  // For structured types, parse the value to JSON
  if (language === 'yaml') {
    return yaml.load(value, { json: true }) as ValueType
  } else if (language === 'json') {
    return JSON.parse(value) as ValueType
  } else {
    return value
  }
}

function convertValueToString(value: ValueType): string {
  // return empty string for null/undefined
  if (value == null) {
    return ''
  }

  try {
    if (language === 'yaml') {
      return yaml.dump(value, {
        indent: 2,
        noArrayIndent: true,
        sortKeys: false,
      })
    } else if (language === 'json') {
      return JSON.stringify(value, null, 2)
    } else {
      return String(value)
    }
  } catch (error) {
    console.error(`Failed to format ${language}:`, error)
    return ''
  }
}

function handleEditorChange() {
  const editor = editorRef.value
  const model = editor?.getModel()
  if (!editor || !model || !!field.error || !field.schema.value) {
    return
  }

  const value = editor.getValue()

  // Clear previous error markers
  monaco.editor.setModelMarkers(model, LINT_SOURCE, [])
  formatError.value = ''

  try {
    const finalValue = convertStringToValue(value)
    fieldValue!.value = finalValue
    emit('update:modelValue', finalValue)
  } catch (error) {
    // Handle parsing error with Monaco markers
    if (language === 'json' && error instanceof SyntaxError) {
      // Try to extract line/column info from JSON syntax error
      const match = error.message.match(/at position (\d+)/)
      if (match) {
        const position = parseInt(match[1], 10)
        const lines = value.split('\n')
        let currentPos = 0
        let lineNumber = 1
        let column = 1

        for (const line of lines) {
          if (currentPos + line.length >= position) {
            column = position - currentPos + 1
            break
          }
          currentPos += line.length + 1 // +1 for newline
          lineNumber++
        }

        monaco.editor.setModelMarkers(model, LINT_SOURCE, [
          {
            startLineNumber: lineNumber,
            startColumn: column,
            endLineNumber: lineNumber,
            endColumn: column + 1,
            message: error.message,
            severity: monaco.MarkerSeverity.Error,
            source: LINT_SOURCE,
          },
        ])
        formatError.value = error.message
      }
    } else if (language === 'yaml' && error instanceof yaml.YAMLException) {
      // Handle YAML parsing error
      const { mark } = error
      const line = mark?.line ?? 0
      const column = mark?.column ?? 0

      monaco.editor.setModelMarkers(model, LINT_SOURCE, [
        {
          startLineNumber: line + 1,
          startColumn: column + 1,
          endLineNumber: line + 1,
          endColumn: column + 2,
          message: error.reason,
          severity: monaco.MarkerSeverity.Error,
          source: LINT_SOURCE,
        },
      ])
      formatError.value = `${error.reason} (line ${line + 1} column ${column + 1})`
    } else {
      formatError.value = error instanceof Error ? error.message : String(error)
    }
  }
}

function setupAutoResize() {
  const editor = editorRef.value
  if (!editor || !('autosize' in props) || !props.autosize) {
    return
  }

  const updateHeight = () => {
    const newContentHeight = editor.getContentHeight()

    // Update the reactive content height which will trigger style recalculation
    contentHeight.value = newContentHeight

    // Layout the editor to fit the new height
    nextTick(() => {
      editor.layout()
    })
  }

  editor.onDidContentSizeChange(updateHeight)
  // Initial height setup
  nextTick(() => updateHeight())
}

onMounted(() => {
  if (!editorRoot.value) return

  const editor = monaco.editor.create(editorRoot.value, {
    language,
    theme: 'vs',
    automaticLayout: true,
    minimap: {
      enabled: false,
    },
    scrollBeyondLastLine: false,
    tabSize: 2,
    scrollbar: {
      alwaysConsumeMouseWheel: false,
    },
    autoIndent: 'keep' as const,
    readOnly: readonly,
    wordWrap: 'on' as const,
    lineNumbers: 'on' as const,
    folding: true,
    ...('autosize' in props && props.autosize ? {
      automaticLayout: true,
      scrollBeyondLastLine: false,
    } : {}),
  })

  editorRef.value = editor

  // Set initial value
  const formattedValue = convertValueToString(fieldValue?.value)
  editor.setValue(formattedValue)

  // Setup change handler
  editor.onDidChangeModelContent(handleEditorChange)

  // Setup auto resize if enabled
  setupAutoResize()
})

onBeforeUnmount(() => {
  editorRef.value?.dispose()
})

// Watch for readonly changes
watch(() => readonly, (newReadonly) => {
  const editor = editorRef.value
  if (editor) {
    editor.updateOptions({ readOnly: newReadonly })
  }
})
</script>

<style lang="scss" scoped>
.ff-editor-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }

  .editor-container {
    border: 1px solid var(--kui-color-border, #e0e4ea);
    border-radius: 4px;
    height: v-bind(height);

    &:focus-within {
      border-color: var(--kui-color-border-primary, #1155cb);
      box-shadow: 0 0 0 1px var(--kui-color-border-primary, #1155cb);
    }
  }

  .format-error {
    margin-top: 8px;
  }
}
</style>
