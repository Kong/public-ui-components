import type * as monaco from 'monaco-editor'
import { getDatakitIoIndex } from '../schema/io-index'
import type { YamlCompletionExtension } from '@kong-ui-public/monaco-editor'

type ParsedConfig = Parameters<typeof getDatakitIoIndex>[0]

function isBranchPath(path: Array<string | number>): boolean {
  return (
    path.length >= 5 &&
    path[0] === 'config' &&
    path[1] === 'nodes' &&
    typeof path[2] === 'number' &&
    (path[3] === 'then' || path[3] === 'else') &&
    typeof path[4] === 'number'
  )
}

function isConnectionPath(path: Array<string | number>): boolean {
  if (path.length < 4) return false
  if (path[0] !== 'config' || path[1] !== 'nodes' || typeof path[2] !== 'number') return false
  const slot = path[3]
  if (slot === 'input' || slot === 'output') return true
  if ((slot === 'inputs' || slot === 'outputs') && path.length >= 5) return true
  return false
}

function extractFieldTarget(
  model: monaco.editor.ITextModel,
  position: monaco.Position,
): { nodeName: string, fieldPrefix: string } | null {
  const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1)
  const match = linePrefix.match(/([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]*)$/)
  if (!match) return null
  return { nodeName: match[1], fieldPrefix: match[2] ?? '' }
}

function buildFieldSuggestions(
  monacoApi: typeof monaco,
  model: monaco.editor.ITextModel,
  position: monaco.Position,
  nodeName: string,
  items: string[],
  fieldPrefix: string,
): monaco.languages.CompletionItem[] {
  const startColumn = position.column - fieldPrefix.length
  const range = new monacoApi.Range(
    position.lineNumber,
    startColumn,
    position.lineNumber,
    position.column,
  )
  return items.map((label) => ({
    label: { label, description: nodeName },
    kind: monacoApi.languages.CompletionItemKind.Field,
    filterText: `${nodeName}.${label}`,
    insertText: label,
    range,
  }))
}

function buildValueSuggestions(
  monacoApi: typeof monaco,
  model: monaco.editor.ITextModel,
  position: monaco.Position,
  items: string[],
  insertTextPrefix: string,
): monaco.languages.CompletionItem[] {
  const word = model.getWordUntilPosition(position)
  const range = new monacoApi.Range(
    position.lineNumber,
    word.startColumn,
    position.lineNumber,
    word.endColumn,
  )
  return items.map((label) => ({
    label,
    kind: monacoApi.languages.CompletionItemKind.Value,
    insertText: `${insertTextPrefix}${label}`,
    range,
  }))
}

export function getDatakitRefSuggestions(
  monacoApi: typeof monaco,
  model: monaco.editor.ITextModel,
  position: monaco.Position,
  yamlPath: Array<string | number>,
  parsed: ParsedConfig | null,
): monaco.languages.CompletionItem[] | null {
  const ioIndex = getDatakitIoIndex(parsed, 'strict')
  const nodeNames = ioIndex.nodeNames
  const nodeTypeByName = ioIndex.nodeTypeByName

  const currentNodeName =
    typeof yamlPath[2] === 'number' &&
    typeof parsed?.config?.nodes?.[yamlPath[2]]?.name === 'string'
      ? parsed!.config!.nodes![yamlPath[2]]!.name as string
      : null

  const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1)
  const insertTextPrefix = linePrefix.endsWith(':') ? ' ' : ''

  if (isBranchPath(yamlPath)) {
    const names = nodeNames
      .filter((name) => !ioIndex.implicitNames.includes(name))
      .filter((name) => !currentNodeName || name !== currentNodeName)
    if (!names.length) return null
    return buildValueSuggestions(monacoApi, model, position, names, insertTextPrefix)
  }

  if (isConnectionPath(yamlPath)) {
    const slot = yamlPath[3]
    const wantsSource = slot === 'input' || slot === 'inputs'

    const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1)
    if (/\\.[A-Za-z0-9_-]*$/.test(linePrefix)) {
      // User is attempting to access a field; don't fall back to node name suggestions.
      const fieldTarget = extractFieldTarget(model, position)
      if (!fieldTarget) {
        return []
      }
    }

    const fieldTarget = extractFieldTarget(model, position)
    if (fieldTarget) {
      if (currentNodeName && fieldTarget.nodeName === currentNodeName) {
        return null
      }

      const nodeType = nodeTypeByName.get(fieldTarget.nodeName) ?? fieldTarget.nodeName
      const nodeIo = ioIndex.getNodeIoByName(fieldTarget.nodeName)
      const side = wantsSource ? nodeIo?.outputs : nodeIo?.inputs

      let fields: string[] = []
      if (Array.isArray(side)) {
        fields = side
      } else if (side === null && wantsSource) {
        fields = ioIndex.getDynamicOutputFields(fieldTarget.nodeName, nodeType)
      }

      const filtered = fields.filter((field) => field.startsWith(fieldTarget.fieldPrefix))
      if (filtered.length) {
        return buildFieldSuggestions(
          monacoApi,
          model,
          position,
          fieldTarget.nodeName,
          filtered,
          fieldTarget.fieldPrefix,
        )
      }

      // Don't fall back to node suggestions when the user typed a field selector.
      return []
    }

    const implicit = ioIndex.implicitNames
      .filter((name) => (wantsSource ? name !== 'response' : name !== 'request'))

    const names = [...nodeNames, ...implicit]
      .filter((name) => !currentNodeName || name !== currentNodeName)

    if (!names.length) return null
    return buildValueSuggestions(monacoApi, model, position, names, insertTextPrefix)
  }

  return null
}

export function createDatakitRefCompletionExtension(monacoApi: typeof monaco): YamlCompletionExtension {
  return {
    id: 'datakit-ref-completions',
    shouldHandle(ctx) {
      return !!(ctx.cursor.valuePath ?? ctx.cursor.path) && ctx.cursor.inValue
    },
    provide(ctx) {
      const suggestions = getDatakitRefSuggestions(
        monacoApi,
        ctx.model,
        ctx.position,
        ctx.cursor.valuePath ?? ctx.cursor.path ?? [],
        ctx.data as ParsedConfig,
      )

      if (suggestions === null) return null

      return {
        items: suggestions,
        exclusive: true,
      }
    },
  }
}
