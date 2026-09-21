<template>
  <MonacoEditor
    :key="activeColorMode"
    ref="monacoEditor"
    v-model="expression"
    appearance="standalone"
    :class="editorClass"
    language="plaintext"
    :options="editorOptions"
    :show-empty-state="false"
    :show-loading-state="false"
    :theme="activeColorMode"
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import { MonacoEditor } from '@kong-ui-public/monaco-editor'
import { useDebounce } from '@kong-ui-public/core'
import type { AstType, Schema as AtcSchema, ParseResult, ParseResultOk } from '@kong/atc-router'
import { Parser } from '@kong/atc-router'
import * as monaco from 'monaco-editor'
import { computed, inject, ref, toRef, useTemplateRef, watch } from 'vue'
import { buildLanguageId, getTokensRange, locateStringLhsIdent, locateToken, registerLanguage, scanTokenBackward, scanTokensBidirectional, TokenType, transformTokens } from '../monaco'
import { createSchema, type Schema } from '../schema'
import type { ProvideCompletionItems, RhsValueCompletion } from '../types'
import type { ComputedRef } from 'vue'

import '@kong-ui-public/monaco-editor/dist/runtime/style.css'

const activeColorMode = inject<ComputedRef<'light' | 'dark'>>('app:konnectColorMode', computed(() => 'light'))

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

const monacoRef = useTemplateRef('monacoEditor')
const editor = toRef(() => monacoRef.value?.monacoEditor.editor.value)

const isParsingActive = ref(false)
const parseResult = ref<ParseResult | undefined>()

const editorClass = computed(() => [
  'expression-editor',
  { invalid: isParsingActive.value && parseResult.value?.status !== 'ok' },
])

const editorOptions = computed<monaco.editor.IEditorOptions>(() => ({
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
  maxTokenizationLineLength: 1000,
  ...props.editorOptions,
}))

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

const onReady = (editorInstance: monaco.editor.IStandaloneCodeEditor) => {
  const languageId = buildLanguageId(props.schema)

  if (props.defaultShowDetails) {
    editorInstance.getContribution<Record<string, any> & monaco.editor.IEditorContribution>('editor.contrib.suggestController')
      ?.widget?.value._setDetailsVisible(true)
  }

  // rhsValueCompletion: watch content changes to auto-trigger suggestions
  if (props.rhsValueCompletion) {
    const rhsValueCompletion = props.rhsValueCompletion
    editorInstance.onDidChangeModelContent(() => {
      const model = editorInstance.getModel()!
      const value = model.getValue()
      const position = editorInstance.getPosition()
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
              if (rhsValueCompletion.shouldProvide(lhsIdentValue)) {
                editorInstance.getContribution<Record<string, any> & monaco.editor.IEditorContribution>('editor.contrib.suggestController')
                  ?.triggerSuggest()
              }
            }
            break
          }
          default:
            break
        }
      }
    })
  }

  const activateLanguage = () => {
    registerLanguage(languageId, provideCompletionItems)
    monaco.editor.setModelLanguage(editorInstance.getModel()!, languageId)
    isParsingActive.value = true
    parseResult.value = parse(expression.value, createSchema(props.schema.definition))
  }

  if (props.inactiveUntilFocused) {
    editorInstance.onDidFocusEditorWidget(() => {
      if (!isParsingActive.value) {
        activateLanguage()
      }
    })
  } else {
    activateLanguage()
  }
}

watch(expression, () => {
  if (!isParsingActive.value) {
    isParsingActive.value = true
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

  const editorModel = editor.value?.getModel()
  if (!editorModel) {
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
  editor,
})
</script>

<style lang="scss" scoped>
.expression-editor {

  :deep(.monaco-editor-target) {
    min-height: 200px;
    // flex: 1;
    // min-height: 0;
  }

  &.invalid {
    border-color: var(--kui-color-border-danger, $kui-color-border-danger) !important;
  }
}
</style>
