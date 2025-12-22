<template>
  <div
    ref="root"
    :class="editorClass"
  />
</template>

<script setup lang="ts">
import { useDebounce } from '@kong-ui-public/core'
import type { AstType, Schema as AtcSchema, ParseResult, ParseResultOk } from '@kong/atc-router'
import { Parser } from '@kong/atc-router'
import * as monaco from 'monaco-editor'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { buildLanguageId, getTokensRange, locateStringLhsIdent, locateToken, registerLanguage, registerTheme, scanTokenBackward, scanTokensBidirectional, theme, TokenType, transformTokens } from '../monaco'
import { createSchema, type Schema } from '../schema'
import type { ProvideCompletionItems, RhsValueCompletion } from '../types'

let editor: monaco.editor.IStandaloneCodeEditor | undefined
let editorModel: monaco.editor.ITextModel
const editorRef = shallowRef<monaco.editor.IStandaloneCodeEditor>()

const { debounce } = useDebounce()

const props = withDefaults(defineProps<{
  schema: Schema
  parseDebounce?: number
  inactiveUntilFocused?: boolean
  allowEmptyInput?: boolean
  defaultShowDetails?: boolean
  editorOptions?: monaco.editor.IEditorOptions
  rhsValueCompletion?: RhsValueCompletion
}>(), {
  parseDebounce: 500,
  editorOptions: undefined,
  rhsValueCompletion: undefined,
})

const parse = (expression: string, schema: AtcSchema) => {
  if (props.allowEmptyInput && expression === '') {
    return { status: 'ok', expression } satisfies ParseResultOk
  }

  return Parser.parse(expression, schema)
}

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

interface Item {
  property: string
  kind: AstType
  documentation?: string
}

const flattenProperties = (schema: Schema): Item[] => {
  const { definition, documentation } = schema
  const properties: Item[] = []
  Object.entries(definition).forEach(([kind, fields]) => {
    fields.forEach((field) => {
      properties.push({
        property: field,
        kind: kind as AstType,
        documentation: documentation?.[field],
      })
    })
  })
  return properties
}

const schema = computed(() => createSchema(props.schema.definition))
const flatSchemaProperties = computed(() => flattenProperties(props.schema))

const provideCompletionItems: ProvideCompletionItems = async (model, position) => {
  const [flatTokens, nestedTokens] = transformTokens(model, monaco.editor.tokenize(model.getValue(), model.getLanguageId()))
  const token = locateToken(nestedTokens, position.lineNumber - 1, position.column - 2)

  if (token) {
    switch (token.shortType) {
      case TokenType.QUOTE_OPEN:
        return { suggestions: [] }
      case TokenType.STR_LITERAL:
      case TokenType.STR_ESCAPE:
      case TokenType.STR_INVALID_ESCAPE: {
        if (props.rhsValueCompletion) {
          const [rhsValueRange, rhsValueFirstTokenIndex] = scanTokensBidirectional(model, flatTokens, token.flatIndex, (t) =>
            !(t.shortType === TokenType.STR_LITERAL || t.shortType === TokenType.STR_ESCAPE || t.shortType === TokenType.STR_INVALID_ESCAPE),
          )
          const rhsValueValue = model.getValueInRange(rhsValueRange)
          const lhsIdentTokenIndex = locateStringLhsIdent(flatTokens, rhsValueFirstTokenIndex)
          if (lhsIdentTokenIndex >= 0) {
            const lhsIdentRange = getTokensRange(model, flatTokens, lhsIdentTokenIndex, lhsIdentTokenIndex + 1)
            const lhsIdentValue = model.getValueInRange(lhsIdentRange)
            if (props.rhsValueCompletion?.shouldProvide(lhsIdentValue)) {
              const completion = await props.rhsValueCompletion.provide(lhsIdentValue, rhsValueValue, lhsIdentRange, rhsValueRange)
              if (completion) {
                return completion
              }
            }
          }
        }
        // Do not provide any extra suggestions
        return { suggestions: [] }
      }
      case TokenType.IDENT: {
        const identRange = getTokensRange(model, flatTokens, token.flatIndex, token.flatIndex + 1)
        return {
          suggestions: [
            ...flatSchemaProperties.value.map((item) => ({
              label: item.property,
              kind: monaco.languages.CompletionItemKind.Property,
              detail: item.kind,
              documentation: item.documentation,
              insertText: item.property.replace(/\*/g, ''),
              range: identRange,
            })),
            ...(props.schema.functions?.map((func) => ({
              label: func,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: `${func}($${1})`,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: identRange,
            })) ?? []),
          ],
        }
      }
      default:
        break
    }
  }

  const range = new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
  return {
    suggestions: [
      ...flatSchemaProperties.value.map((item) => ({
        label: item.property,
        kind: monaco.languages.CompletionItemKind.Property,
        detail: item.kind,
        documentation: item.documentation,
        insertText: item.property.replace(/\*/g, ''),
        range,
      })),
      ...(props.schema.functions?.map((func) => ({
        label: func,
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: `${func}($${1})`,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
      })) ?? []),
    ],
  }
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
    maxTokenizationLineLength: 1000,
    editContext: false,
    ...props.editorOptions,
  })

  editorRef.value = editor

  if (props.defaultShowDetails) {
    editor.getContribution<Record<string, any> & monaco.editor.IEditorContribution>('editor.contrib.suggestController')
      ?.widget?.value._setDetailsVisible(true)
  }
  editor.onDidChangeModelContent(() => {
    const model = editor!.getModel()!
    const value = model.getValue()!

    if (props.rhsValueCompletion) {
      const position = editor!.getPosition()
      if (position) {
        const [flatTokens, nestedTokens] = transformTokens(model, monaco.editor.tokenize(value, model.getLanguageId()))
        const token = locateToken(nestedTokens, position.lineNumber - 1, position.column - 2)
        switch (token?.shortType) {
          case TokenType.STR_LITERAL:
          case TokenType.STR_ESCAPE:
          case TokenType.STR_INVALID_ESCAPE: {
            const stringLeftTokenIndex = scanTokenBackward(flatTokens, token.flatIndex, (t) =>
              !(t.shortType === TokenType.STR_LITERAL || t.shortType === TokenType.STR_ESCAPE || t.shortType === TokenType.STR_INVALID_ESCAPE),
            ) + 1
            const lhsIdentTokenIndex = locateStringLhsIdent(flatTokens, stringLeftTokenIndex)
            if (lhsIdentTokenIndex >= 0) {
              const lhsIdentRange = getTokensRange(model, flatTokens, lhsIdentTokenIndex, lhsIdentTokenIndex + 1)
              const lhsIdentValue = model.getValueInRange(lhsIdentRange)
              if (props.rhsValueCompletion.shouldProvide(lhsIdentValue)) {
                editor!.getContribution<Record<string, any> & monaco.editor.IEditorContribution>('editor.contrib.suggestController')
                  ?.triggerSuggest()
              }
            }
            break
          }
          default:
            break
        }
      }
    }

    expression.value = value
  })

  editorModel = editor.getModel()!

  if (props.inactiveUntilFocused) {
    editor.onDidFocusEditorWidget(() => {
      if (!isParsingActive.value) {
        const { languageId } = registerLanguage(buildLanguageId(props.schema), provideCompletionItems)
        monaco.editor.setModelLanguage(editorModel, languageId)
        isParsingActive.value = true
        parseResult.value = parse(expression.value, createSchema(props.schema.definition))
      }
    })
  } else {
    const { languageId } = registerLanguage(buildLanguageId(props.schema), provideCompletionItems)
    monaco.editor.setModelLanguage(editorModel, languageId)
    isParsingActive.value = true
    parseResult.value = parse(expression.value, createSchema(props.schema.definition))
  }
})

onBeforeUnmount(() => {
  editor?.dispose()
})

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

  let markers: monaco.editor.IMarkerData[] = []

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

defineExpose({
  editor: editorRef,
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
