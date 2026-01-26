import type { LineCounter, Node, Scalar } from 'yaml'
import { isMap, isNode, isScalar, isSeq } from 'yaml'

export type YamlPathPart = string | number
export type YamlPath = YamlPathPart[]

export type MonacoRange = {
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
}

export type PathIndex = {
  valueNodes: Map<string, Node>
  keyNodes: Map<string, Node>
  parentKeyNodes: Map<string, Node | null>
}

const pathKey = (path: YamlPath) => JSON.stringify(path)

function getPathKeyValue(keyNode: Node): string | number | null {
  if (isScalar(keyNode)) {
    const value = keyNode.value
    if (typeof value === 'string' || typeof value === 'number') {
      return value
    }
  }
  return null
}

export function buildPathIndex(root: Node | null | undefined): PathIndex {
  const valueNodes = new Map<string, Node>()
  const keyNodes = new Map<string, Node>()
  const parentKeyNodes = new Map<string, Node | null>()

  const visit = (node: Node | null | undefined, path: YamlPath, parentKey: Node | null) => {
    if (!node) return

    valueNodes.set(pathKey(path), node)
    parentKeyNodes.set(pathKey(path), parentKey)

    if (isMap(node)) {
      for (const pair of node.items) {
        if (!isNode(pair.key)) continue
        const keyValue = getPathKeyValue(pair.key)
        if (keyValue === null) continue
        const childPath = [...path, keyValue]
        keyNodes.set(pathKey(childPath), pair.key)
        parentKeyNodes.set(pathKey(childPath), pair.key)
        if (pair.value && isNode(pair.value)) {
          valueNodes.set(pathKey(childPath), pair.value)
          visit(pair.value, childPath, pair.key)
        } else {
          // Still index the path to allow fallbacks to land on the key.
          valueNodes.set(pathKey(childPath), pair.key)
        }
      }
      return
    }

    if (isSeq(node)) {
      node.items.forEach((item, index) => {
        const childPath = [...path, index]
        if (item && isNode(item)) {
          valueNodes.set(pathKey(childPath), item)
          parentKeyNodes.set(pathKey(childPath), parentKey)
          visit(item, childPath, parentKey)
        }
      })
    }
  }

  visit(root, [], null)

  return { valueNodes, keyNodes, parentKeyNodes }
}

export function getValueNode(index: PathIndex, path: YamlPath): Node | undefined {
  return index.valueNodes.get(pathKey(path))
}

export function getKeyNode(index: PathIndex, path: YamlPath): Node | undefined {
  return index.keyNodes.get(pathKey(path))
}

export function getParentKeyNode(index: PathIndex, path: YamlPath): Node | null | undefined {
  return index.parentKeyNodes.get(pathKey(path))
}

export function isBlockScalar(node: Node): node is Scalar {
  return isScalar(node) && (node.type === 'BLOCK_LITERAL' || node.type === 'BLOCK_FOLDED')
}

export function rangeFromOffsets(
  lineCounter: LineCounter,
  startOffset: number,
  endOffset?: number,
): MonacoRange {
  const safeStart = Math.max(startOffset, 0)
  const safeEnd = Math.max(endOffset ?? startOffset + 1, safeStart + 1)
  const start = lineCounter.linePos(safeStart)
  const end = lineCounter.linePos(safeEnd)

  if (end.line < start.line || (end.line === start.line && end.col <= start.col)) {
    return {
      startLineNumber: start.line,
      startColumn: start.col,
      endLineNumber: start.line,
      endColumn: start.col + 1,
    }
  }

  return {
    startLineNumber: start.line,
    startColumn: start.col,
    endLineNumber: end.line,
    endColumn: end.col,
  }
}

export function rangeFromNode(
  node: Node,
  lineCounter: LineCounter,
  opts?: { singleLine?: boolean },
): MonacoRange | null {
  if (!node.range || node.range.length < 2) return null
  const [start, end] = node.range
  if (opts?.singleLine) {
    const pos = lineCounter.linePos(start)
    return {
      startLineNumber: pos.line,
      startColumn: pos.col,
      endLineNumber: pos.line,
      endColumn: pos.col + 1,
    }
  }
  return rangeFromOffsets(lineCounter, start, end)
}
