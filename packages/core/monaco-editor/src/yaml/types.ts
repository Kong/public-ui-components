import type * as monaco from 'monaco-editor'
import type { Document } from 'yaml'

export type YamlArrayItemStyle = 'indentless' | 'nested'

export type JsonSchema = Record<string, unknown>

export type YamlStyleOptions = {
  arrayItemStyle?: YamlArrayItemStyle
}

export type YamlCompletionOptions = {
  enabled?: boolean
  triggerOnAccept?: boolean
  triggerOnEnter?: boolean
  triggerOnColon?: boolean
  hideSchemaTemplates?: boolean
  discriminatedUnion?: 'intersection-until-narrowed'
  includeNullValue?: boolean
  suggestAdditionalPropertiesKey?: boolean
}

export type YamlSchemaRegistration = {
  schema: JsonSchema
  schemaUri?: string
}

export type AttachYamlJsonSchemaOptions = {
  yamlVersion?: '1.1'
  style?: YamlStyleOptions
  completion?: YamlCompletionOptions
  schema: JsonSchema
  schemaUri?: string
  extensions?: YamlCompletionExtension[]
}

export type YamlPath = Array<string | number>

export type SchemaKind = 'object' | 'array' | 'scalar' | 'unknown'

export type SchemaView = {
  schema: JsonSchema
  kind: SchemaKind
  properties?: Record<string, JsonSchema>
  required?: Set<string>
  enumValues?: Array<string | number | boolean | null>
  itemSchema?: JsonSchema
}

export type CursorContext = {
  path: YamlPath | null
  containerPath: YamlPath | null
  keyPath: YamlPath | null
  valuePath: YamlPath | null
  slot: 'key' | 'value' | 'unknown'
  inKey: boolean
  inValue: boolean
  lineText: string
  lineIndent: string
  lineIndentSize: number
  prefix: string
  isEmptyLine: boolean
  afterColon: boolean
  atLineStart: boolean
}

export type YamlCompletionExtensionContext = {
  model: monaco.editor.ITextModel
  position: monaco.Position
  doc: Document.Parsed
  data: unknown
  cursor: CursorContext
  schema: SchemaView | null
  containerSchema: SchemaView | null
}

export type YamlCompletionExtensionResult = {
  items: monaco.languages.CompletionItem[]
  exclusive?: boolean
}

export type YamlCompletionExtension = {
  id: string
  shouldHandle(ctx: YamlCompletionExtensionContext): boolean
  provide(ctx: YamlCompletionExtensionContext): YamlCompletionExtensionResult | null
}
