import type { JSONSchema } from 'vscode-json-languageservice'

import type { FieldSchema } from './fields'

export interface ExtendedJSONSchema extends JSONSchema {
  detail?: string;
  /**
   * Reference back to Kong's field schema.
   */
  _fieldSchema?: FieldSchema;
}

