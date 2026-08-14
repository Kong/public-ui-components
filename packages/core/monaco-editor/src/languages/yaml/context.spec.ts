import { isNode, parseDocument } from 'yaml'
import { describe, expect, it } from 'vitest'
import { findInnermostCollectionAtOffset } from './context'

const source = `nodes:
- name: GET
  type: call
  inputs:
    headers: BUILD_HEADERS
    body: STATIC_INPUTS.body
- name: NEXT
  type: jq
branches:
- first
- second
`

const document = parseDocument(source)

function rangeAtPath(path: ReadonlyArray<string | number>) {
  const node = document.getIn(path, true)

  if (!isNode(node) || !node.range) {
    throw new Error(`No ranged YAML node found at ${path.join('.')}`)
  }

  return node.range
}

describe('findInnermostCollectionAtOffset', () => {
  it.each([
    ['nested map', 'BUILD_HEADERS', ['nodes', 0, 'inputs']],
    ['sequence item map', 'NEXT', ['nodes', 1]],
    ['scalar sequence', 'second', ['branches']],
  ] as const)('finds the innermost %s', (_, token, path) => {
    expect(findInnermostCollectionAtOffset(document, source.indexOf(token))).toBe(rangeAtPath(path))
  })

  it('returns undefined when the document has no collection', () => {
    const scalarDocument = parseDocument('hello')

    expect(findInnermostCollectionAtOffset(scalarDocument, 2)).toBeUndefined()
  })
})
