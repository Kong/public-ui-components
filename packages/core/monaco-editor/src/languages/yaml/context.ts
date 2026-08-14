import { isCollection, parseDocument, visit } from 'yaml'

import type { YAMLModelContext } from '../../types'
import type { Document as YAMLDocument, Range } from 'yaml'

export function parseIntoYAMLContext(value: string, altVersionId: number): Readonly<YAMLModelContext> {
  const document = parseDocument(value)

  return {
    language: 'yaml',
    altVersionId,
    document,
  }
}

/** Finds the innermost YAML map or sequence that contains the given offset. */
export function findInnermostCollectionAtOffset(
  document: YAMLDocument.Parsed,
  offset: number,
): Range | undefined {
  let match: Range | undefined

  visit(document, {
    Node(_, node) {
      if (!isCollection(node) || !node.range) return

      const [start, , end] = node.range
      if (offset < start || offset >= end) return

      if (!match || end - start <= match[2] - match[0]) {
        match = node.range
      }
    },
  })

  return match
}
