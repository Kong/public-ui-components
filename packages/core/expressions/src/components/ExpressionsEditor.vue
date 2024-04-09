<template>
  <div
    ref="root"
    :class="editorClass"
  />
</template>

<script setup lang="ts">
import { useDebounce } from '@kong-ui-public/core'
import type { ParseResult, Schema as AtcSchema } from '@kong/atc-router'
import { Parser } from '@kong/atc-router'
import type * as Monaco from 'monaco-editor'
import * as monaco from 'monaco-editor'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createSchema, type Schema } from '../schema'
import { registerLanguage, registerTheme, theme } from '../monaco'

let editor: Monaco.editor.IStandaloneCodeEditor | undefined
let editorModel: Monaco.editor.ITextModel

const parse = (expression:string, schema: AtcSchema) => Parser.parse(expression, schema)

const { debounce } = useDebounce()

const props = withDefaults(defineProps<{
  schema: Schema,
  parseDebounce?: number,
  inactiveUntilFocused?: boolean,
}>(), {
  parseDebounce: 500,
})

const expression = defineModel<string>({ required: true })

const emit = defineEmits<{
  'parse-result-update': [result: ParseResult]
}>()

const root = ref(null)
const isParsingActive = ref(false)
const parseResult = ref<ParseResult | undefined>()

const editorClass = computed(() => [
  'expression-editor',
  { invalid: isParsingActive.value && parseResult.value?.status !== 'ok' },
])

const registerSchema = (schema: Schema) => {
  const { languageId } = registerLanguage(schema)
  monaco.editor.setModelLanguage(editorModel, languageId)
}

onMounted(() => {
  registerTheme()

  editor = monaco.editor.create(root.value!, {
    automaticLayout: true,
    fixedOverflowWidgets: true,
    fontSize: 14,
    lineNumbersMinChars: 3,
    lineDecorationsWidth: 2,
    minimap: {
      enabled: false,
    },
    renderValidationDecorations: 'editable',
    overviewRulerLanes: 0,
    renderLineHighlightOnlyWhenFocus: true,
    scrollBeyondLastLine: false,
    theme,
    value: expression.value,
  })

  editor.onDidChangeModelContent(() => {
    const value = editor!.getValue()
    expression.value = value
  })

  editorModel = editor.getModel()!

  if (props.inactiveUntilFocused) {
    editor.onDidFocusEditorWidget(() => {
      if (!isParsingActive.value) {
        registerSchema(props.schema)
        isParsingActive.value = true
        parseResult.value = parse(expression.value, createSchema(props.schema.definition))
      }
    })
  } else {
    registerSchema(props.schema)
    isParsingActive.value = true
    parseResult.value = parse(expression.value, createSchema(props.schema.definition))
  }
})

onBeforeUnmount(() => {
  editor?.dispose()
})

const schema = computed(() => createSchema(props.schema.definition))

watch(() => props.schema, (newSchema) => {
  const { languageId } = registerLanguage(newSchema)
  monaco.editor.setModelLanguage(editorModel, languageId)
}, { deep: true })

watch(expression, (newExpression) => {
  if (!isParsingActive.value) {
    isParsingActive.value = true
  }

  if (editor !== undefined && editor.getValue() !== newExpression) {
    editor.setValue(newExpression)
  }
})

watch([expression, schema], (() => {
  const parseAndUpdate = () => {
    parseResult.value = parse(expression.value, schema.value)
  }

  if (props.parseDebounce === undefined || props.parseDebounce <= 0) {
    return parseAndUpdate
  }

  return debounce(parseAndUpdate, props.parseDebounce) as typeof parseAndUpdate
})())

watch(() => parseResult.value, (result?: ParseResult) => {
  if (!isParsingActive.value) {
    return
  }

  let markers: Monaco.editor.IMarkerData[] = []

  if (result !== undefined) {
    emit('parse-result-update', result)

    switch (result.status) {
      case 'ok': {
        break
      }
      case 'parseError': {
        const { parseError } = result
        const message =
        'parsingError' in parseError.variant
          ? parseError.variant.parsingError
          : parseError.variant.customError
        if ('pos' in parseError.lineCol) {
          const [line, col] = parseError.lineCol.pos

          markers = [
            {
              severity: monaco.MarkerSeverity.Error,
              startLineNumber: line,
              startColumn: col,
              endLineNumber: line,
              endColumn: col + 1,
              message,
            },
          ]
        } else {
          const [[startLineNumber, startColumn], [endLineNumber, endColumn]] =
          parseError.lineCol.span

          markers = [
            {
              severity: monaco.MarkerSeverity.Error,
              startLineNumber,
              startColumn,
              endLineNumber,
              endColumn,
              message,
            },
          ]
        }
        break
      }
      case 'validationError': {
        markers = [
          {
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: 0,
            startColumn: 0,
            endLineNumber: editorModel.getLineCount(),
            endColumn: editorModel.getLineMaxColumn(editorModel.getLineCount()),
            message: result.validationError,
          },
        ]
        break
      }
    }
  }

  monaco.editor.setModelMarkers(editorModel, 'kong-expressions-editor', markers)
})
</script>

<style lang="scss" scoped>
.expression-editor {
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: 3px;
  min-height: 200px;
  overflow: hidden;
  transition: border-color linear 150ms;
  width: 100%;

  &.invalid {
    border-color: $kui-color-border-danger;
  }
}
</style>
