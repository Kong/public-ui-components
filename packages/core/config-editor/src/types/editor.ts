import type { JSONSchema } from '@kong/vscode-json-languageservice'
import type { FieldSchema } from './schema'

export type EditorLanguage = 'json' | 'yaml'

export interface ExtendedJSONSchema extends JSONSchema {
  detail?: string;
  /**
   * Reference back to Kong's field schema.
   */
  _fieldSchema?: FieldSchema;
}
