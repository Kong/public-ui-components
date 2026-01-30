import type { Node } from 'yaml'
import { isMap, isNode, isScalar, isSeq } from 'yaml'
import type { YamlPath } from './yaml-path-index'
import { getPathKeyValue } from './yaml-path-index'

export type CursorContext = {
  path: YamlPath
  inKey: boolean
  inValue: boolean
}

function nodeContains(node: Node, offset: number): boolean {
  if (!node.range || node.range.length < 2) return false
  const [start, end] = node.range
  if (start === end) {
    return offset >= start && offset <= end + 1
  }
  return offset >= start && offset <= end
}

export function findPathAtOffset(
  root: Node | null | undefined,
  offset: number,
): CursorContext | null {
  const visit = (node: Node, path: YamlPath): CursorContext | null => {
    if (!nodeContains(node, offset)) {
      return null
    }

    if (isMap(node)) {
      for (const pair of node.items) {
        if (!isNode(pair.key)) continue
        const keyValue = getPathKeyValue(pair.key)
        if (keyValue === null) continue
        const childPath = [...path, keyValue]

        if (nodeContains(pair.key, offset)) {
          return { path: childPath, inKey: true, inValue: false }
        }

        if (pair.value && isNode(pair.value) && nodeContains(pair.value, offset)) {
          return visit(pair.value, childPath) ?? { path: childPath, inKey: false, inValue: true }
        }

        if (pair.value == null && nodeContains(pair.key, offset)) {
          return { path: childPath, inKey: true, inValue: false }
        }
      }
    }

    if (isSeq(node)) {
      for (let index = 0; index < node.items.length; index += 1) {
        const item = node.items[index]
        if (!item || !isNode(item)) continue
        if (!nodeContains(item, offset)) continue
        const childPath = [...path, index]
        return visit(item, childPath) ?? { path: childPath, inKey: false, inValue: true }
      }
    }

    if (isScalar(node)) {
      return { path, inKey: false, inValue: true }
    }

    return { path, inKey: false, inValue: true }
  }

  if (!root || !isNode(root)) {
    return null
  }

  return visit(root, [])
}
