import type * as monaco from 'monaco-editor'
import type { YamlCompletionExtension } from '@kong-ui-public/monaco-editor'
import {
  KONG_CLIENT_SUPPORTED_PROPERTIES,
  PROPERTY_KEY_PATTERN,
} from '../flow-editor/node/property'

type ParsedConfig = {
  config?: {
    nodes?: Array<{ type?: string }>
  }
}

function isPropertyValuePath(path: Array<string | number>): boolean {
  return (
    path.length === 4 &&
    path[0] === 'config' &&
    path[1] === 'nodes' &&
    typeof path[2] === 'number' &&
    path[3] === 'property'
  )
}

function resolvePropertyInsertText(prop: string): string {
  if (!prop.includes(PROPERTY_KEY_PATTERN)) {
    return prop
  }
  return prop.replace(PROPERTY_KEY_PATTERN, '${1:key}')
}

function getValueRange(
  monacoApi: typeof monaco,
  model: monaco.editor.ITextModel,
  position: monaco.Position,
  prefix: string,
): monaco.IRange {
  const startColumn = Math.max(1, position.column - prefix.length)
  return new monacoApi.Range(
    position.lineNumber,
    startColumn,
    position.lineNumber,
    position.column,
  )
}

export function createDatakitPropertyCompletionExtension(
  monacoApi: typeof monaco,
): YamlCompletionExtension {
  return {
    id: 'datakit-property-completions',
    shouldHandle(ctx) {
      const path = ctx.cursor.valuePath ?? ctx.cursor.path
      if (!ctx.cursor.inValue || !path || !isPropertyValuePath(path)) return false
      const nodeIndex = path[2]
      const nodeType =
        typeof nodeIndex === 'number'
          ? (ctx.data as ParsedConfig | null)?.config?.nodes?.[nodeIndex]?.type
          : undefined
      return nodeType === 'property'
    },
    provide(ctx) {
      const prefix = ctx.cursor.prefix ?? ''
      const range = getValueRange(monacoApi, ctx.model, ctx.position, prefix)
      const entries = Object.keys(KONG_CLIENT_SUPPORTED_PROPERTIES)
      const items = entries.map((prop) => {
        const insertText = resolvePropertyInsertText(prop)
        const filterText = prop.includes(PROPERTY_KEY_PATTERN)
          ? prop.replace(PROPERTY_KEY_PATTERN, '')
          : prop
        return {
          label: prop,
          kind: monacoApi.languages.CompletionItemKind.Value,
          insertText,
          filterText,
          range,
          insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        }
      })

      return {
        items,
        exclusive: true,
      }
    },
  }
}
