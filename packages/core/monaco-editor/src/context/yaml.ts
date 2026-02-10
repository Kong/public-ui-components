import { parseDocument } from 'yaml'

import type { YAMLModelContext } from '../types'

export function parseIntoYAMLContext(value: string, altVersionId: number): Readonly<YAMLModelContext> {
  const document = parseDocument(value)

  return {
    language: 'yaml',
    altVersionId,
    document,
  }
}
