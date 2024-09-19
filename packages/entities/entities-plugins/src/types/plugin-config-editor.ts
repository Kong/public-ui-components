import type { JSONSchema } from '@kong/vscode-json-languageservice'

export type EditorLanguage = 'json' | 'yaml'

export interface ExtendedJSONSchema extends JSONSchema {
  detail?: string;
}
