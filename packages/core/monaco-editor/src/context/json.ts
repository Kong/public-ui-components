import { parseTree } from 'jsonc-parser'

import type { JSONModelContext } from '../types'

export function parseIntoJSONContext(value: string, altVersionId: number): Readonly<JSONModelContext> {
  const root = parseTree(value)

  return {
    language: 'json',
    altVersionId,
    root,
  }
}
