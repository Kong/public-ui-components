import type * as monaco from 'monaco-editor'
import type { Document, Node } from 'yaml'
import { isMap, isNode, isScalar, isSeq } from 'yaml'
import type {
  CursorContext,
  JsonSchema,
  YamlCompletionExtension,
  YamlCompletionExtensionContext,
  YamlCompletionOptions,
  YamlStyleOptions,
  YamlPath,
} from './types'
import { getSchemaAtPath, getSchemaKind, getSchemaView } from './schema'
import { YAML_SUGGEST_COMMAND_ID } from './constants'

function getNodeAtPath(root: Node | null | undefined, path: YamlPath | null): Node | null {
  if (!root || !path || path.length === 0) return root ?? null
  let node: Node | null = root
  for (const part of path) {
    if (!node) return null
    if (typeof part === 'string') {
      if (isMap(node)) {
        let found = false
        for (const item of node.items) {
          if (!isNode(item.key) || !isScalar(item.key)) continue
          if (item.key.value !== part) continue
          node = isNode(item.value) ? item.value : null
          found = true
          break
        }
        if (!found) return null
        continue
      }
      return null
    }
    if (typeof part === 'number') {
      if (isSeq(node)) {
        const item = node.items[part]
        node = item && isNode(item) ? item : null
        continue
      }
      return null
    }
  }
  return node
}

function getMapKeys(node: Node | null): Set<string> {
  if (!node || !isMap(node)) return new Set()
  const keys = new Set<string>()
  for (const pair of node.items) {
    if (isNode(pair.key) && isScalar(pair.key) && typeof pair.key.value === 'string') {
      keys.add(pair.key.value)
    }
  }
  return keys
}

function getIndentUnit(model: monaco.editor.ITextModel): string {
  const options = model.getOptions()
  if (!options.insertSpaces) return '\t'
  return ' '.repeat(options.tabSize)
}

function getKeyColumnIndent(lineText: string): string {
  const leading = lineText.match(/^\s*/)?.[0] ?? ''
  const rest = lineText.slice(leading.length)
  if (rest.startsWith('- ')) {
    return `${leading}  `
  }
  return leading
}

function formatYamlString(value: string): string {
  const lower = value.toLowerCase()
  const needsQuotes =
    value.trim() !== value ||
    value === '' ||
    /[:#{}\[\],&*!|>'"%@`?]/.test(value) ||
    /^(?:~|null|true|false|yes|no|on|off)$/i.test(lower)
  if (!needsQuotes) {
    return value
  }
  return `'${value.replace(/'/g, "''")}'`
}

function formatYamlScalar(value: string | number | boolean | null): string {
  if (typeof value === 'string') return formatYamlString(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value === null) return 'null'
  return String(value)
}

function getInlineScalarToken(
  lineText: string,
  column: number,
): string | null {
  const prefix = lineText.slice(0, Math.max(0, column - 1))
  const noComment = prefix.split('#')[0] ?? prefix
  const match = noComment.match(/:\s*([^\s#]+)$/)
  return match ? match[1] : null
}

function getReplaceRange(
  model: monaco.editor.ITextModel,
  position: monaco.Position,
  prefix: string,
): monaco.IRange {
  const startColumn = position.column - prefix.length
  return {
    startLineNumber: position.lineNumber,
    startColumn: Math.max(1, startColumn),
    endLineNumber: position.lineNumber,
    endColumn: position.column,
  }
}

function getDataAtPath(data: unknown, path: YamlPath | null): unknown {
  if (!path || path.length === 0) return data
  let current: unknown = data
  for (const part of path) {
    if (current == null) return undefined
    if (typeof part === 'number') {
      if (!Array.isArray(current)) return undefined
      current = current[part]
      continue
    }
    if (typeof part === 'string') {
      if (typeof current !== 'object') return undefined
      current = (current as Record<string, unknown>)[part]
    }
  }
  return current
}

function buildKeyInsertText(
  key: string,
  valueKind: 'scalar' | 'object' | 'array',
  ctx: CursorContext,
  model: monaco.editor.ITextModel,
  style: YamlStyleOptions,
): string {
  const indentUnit = getIndentUnit(model)
  const keyIndent = getKeyColumnIndent(ctx.lineText)
  const childIndent = keyIndent + indentUnit
  const arrayIndent = style.arrayItemStyle === 'indentless' ? keyIndent : childIndent

  if (valueKind === 'scalar') {
    return `${key}: `
  }

  if (valueKind === 'array') {
    return `${key}:\n${arrayIndent}- $0`
  }

  return `${key}:\n${childIndent}$0`
}

function getValueKind(
  schema: JsonSchema,
  rootSchema: JsonSchema,
  data: unknown,
  opts: { discriminatedUnion: 'intersection-until-narrowed' },
): 'scalar' | 'object' | 'array' {
  const kind = getSchemaKind(schema, rootSchema)
  if (kind === 'array') return 'array'
  if (kind === 'object') return 'object'
  if (kind === 'unknown') {
    const view = getSchemaView(schema, rootSchema, data, opts)
    if (view.kind === 'array') return 'array'
    if (view.kind === 'object') return 'object'
  }
  return 'scalar'
}

function makeCompletionItem(
  monacoApi: typeof monaco,
  label: string,
  insertText: string,
  range: monaco.IRange,
  kind: monaco.languages.CompletionItemKind,
  options: YamlCompletionOptions,
  triggerSuggest: boolean,
  modelUri: string,
): monaco.languages.CompletionItem {
  return {
    label,
    kind,
    insertText,
    range,
    insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    command: options.triggerOnAccept && triggerSuggest
      ? { id: YAML_SUGGEST_COMMAND_ID, title: 'Trigger Suggest', arguments: [modelUri] }
      : undefined,
  }
}

export function provideYamlCompletions(
  monacoApi: typeof monaco,
  model: monaco.editor.ITextModel,
  position: monaco.Position,
  ctx: CursorContext,
  rootSchema: JsonSchema,
  data: unknown,
  doc: Document.Parsed,
  options: Required<YamlCompletionOptions>,
  style: YamlStyleOptions,
  extensions: YamlCompletionExtension[],
): monaco.languages.CompletionList {
  if (!options.enabled) {
    return { suggestions: [] }
  }

  const schemaOpts = { discriminatedUnion: options.discriminatedUnion }
  const valuePath = ctx.valuePath ?? (ctx.inValue ? ctx.path : null)
  const keyPath = ctx.keyPath ?? (ctx.inKey ? ctx.containerPath : null)
  const valueSchema = getSchemaAtPath(rootSchema, valuePath, data, schemaOpts)
  const containerSchema = getSchemaAtPath(rootSchema, keyPath, data, schemaOpts)
  const valueData = getDataAtPath(data, valuePath)
  const containerData = getDataAtPath(data, keyPath)
  const schemaView = getSchemaView(valueSchema, rootSchema, valueData, schemaOpts)
  const containerView = getSchemaView(containerSchema, rootSchema, containerData, schemaOpts)


  const extensionContext: YamlCompletionExtensionContext = {
    model,
    position,
    doc,
    data,
    cursor: ctx,
    schema: schemaView,
    containerSchema: containerView,
  }

  let extensionItems: monaco.languages.CompletionItem[] = []
  let exclusive = false
  for (const extension of extensions) {
    if (!extension.shouldHandle(extensionContext)) continue
    const result = extension.provide(extensionContext)
    if (!result) continue
    if (result.items.length) {
      extensionItems = extensionItems.concat(result.items)
    }
    if (result.exclusive) {
      exclusive = true
    }
  }

  const suggestions: monaco.languages.CompletionItem[] = []
  if (extensionItems.length) {
    suggestions.push(...extensionItems)
  }

  if (exclusive) {
    return { suggestions }
  }

  const range = getReplaceRange(model, position, ctx.prefix)

  const shouldSuggestKeys =
    ctx.inKey ||
    ctx.atLineStart ||
    (ctx.inValue && schemaView.kind === 'object' && !ctx.lineText.includes(':'))

  if (shouldSuggestKeys) {
    const keySchemaView = (ctx.inKey || ctx.atLineStart) ? containerView : schemaView
    if (keySchemaView.kind === 'object' && keySchemaView.properties) {
      const existingKeys = getMapKeys(getNodeAtPath(doc.contents as Node, keyPath))
      const hasAdditionalProperties =
        !!(keySchemaView.schema && (keySchemaView.schema as { additionalProperties?: unknown }).additionalProperties)
      for (const [key, valueSchema] of Object.entries(keySchemaView.properties)) {
        if (existingKeys.has(key)) continue
        const kind = getValueKind(valueSchema, rootSchema, data, schemaOpts)
        const insertText = buildKeyInsertText(key, kind, ctx, model, style)
        suggestions.push(
          makeCompletionItem(
            monacoApi,
            key,
            insertText,
            range,
            monacoApi.languages.CompletionItemKind.Property,
            options,
            true,
            model.uri.toString(),
          ),
        )
      }
      if (hasAdditionalProperties) {
        suggestions.push(
          makeCompletionItem(
            monacoApi,
            '${1:key}',
            '${1:key}: $0',
            range,
            monacoApi.languages.CompletionItemKind.Property,
            options,
            true,
            model.uri.toString(),
          ),
        )
      }
    }
  } else if (ctx.inValue) {
    const enumValues = schemaView.enumValues ?? []
    if (enumValues.length) {
      const orderedValues = [
        ...enumValues.filter((value) => value !== null),
        ...(options.includeNullValue ? enumValues.filter((value) => value === null) : []),
      ]
      if (!options.includeNullValue && orderedValues.length === 0) {
        return { suggestions }
      }
      const currentToken = getInlineScalarToken(ctx.lineText, position.column)
      for (const value of orderedValues) {
        const label = formatYamlScalar(value)
        if (currentToken && currentToken === label) continue
        suggestions.push(
          makeCompletionItem(
            monacoApi,
            label,
            label,
            range,
            monacoApi.languages.CompletionItemKind.Value,
            options,
            false,
            model.uri.toString(),
          ),
        )
      }
      return { suggestions }
    }

  }

  const deduped: monaco.languages.CompletionItem[] = []
  const seen = new Set<string>()
  for (const item of suggestions) {
    const label = typeof item.label === 'string' ? item.label : item.label.label
    const key = `${label}::${item.insertText ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(item)
  }

  return { suggestions: deduped }
}
