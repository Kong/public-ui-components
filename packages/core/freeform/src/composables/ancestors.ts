import { computed, toValue } from 'vue'
import * as utils from '../utils'

import type { MaybeRefOrGetter } from 'vue'

export type Ancestor = {
  path?: string
  parent: Ancestor | null
}

export function buildAncestor(path: string): Ancestor {
  const parts = utils.toArray(path) // [a, b, c]
  let parent: Ancestor = { parent: null }

  parts.pop()

  while (parts.length) {
    const n = parts.shift()!
    parent.path = parent.parent?.path ? utils.resolve(parent.parent.path, n) : n
    parent = { parent }
  }

  return parent
}

/**
 * a.b.c => { parent: { parent: { path: 'a.b', parent: { path: 'a', parent: null } } } }
 */
export function useFieldAncestors(fieldPath: MaybeRefOrGetter<string>) {
  return computed<Ancestor>(() => {
    return buildAncestor(toValue(fieldPath))
  })
}
