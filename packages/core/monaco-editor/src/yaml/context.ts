import type * as monaco from 'monaco-editor'
import type { Node } from 'yaml'
import { isMap, isNode, isScalar, isSeq } from 'yaml'
import type { CursorContext, YamlPath } from './types'
import type { CachedYamlDoc } from './doc-cache'

const KEY_CHARS = /[A-Za-z0-9_.-]/

function getPathKeyValue(keyNode: Node): string | number | null {
  if (isScalar(keyNode)) {
    const value = keyNode.value
    if (typeof value === 'string' || typeof value === 'number') {
      return value
    }
  }
  return null
}

function nodeContains(node: Node, offset: number): boolean {
  if (!node.range || node.range.length < 2) return false
  const [start, end] = node.range
  if (start === end) {
    return offset === start
  }
  if (isScalar(node)) {
    return offset >= start && offset <= end
  }
  return offset >= start && offset < end
}

function findPathAtOffset(
  root: Node | null | undefined,
  offset: number,
): { path: YamlPath, inKey: boolean, inValue: boolean } | null {
  const visit = (node: Node, path: YamlPath): { path: YamlPath, inKey: boolean, inValue: boolean } | null => {
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
      }
      return null
    }

    if (isSeq(node)) {
      for (let index = 0; index < node.items.length; index += 1) {
        const item = node.items[index]
        if (!item || !isNode(item)) continue
        if (!nodeContains(item, offset)) continue
        const childPath = [...path, index]
        return visit(item, childPath) ?? { path: childPath, inKey: false, inValue: true }
      }
      return null
    }

    if (isScalar(node)) {
      if (!node.range || node.range.length < 2) return null
      const [start, end] = node.range
      if (start === end) {
        return offset === start ? { path, inKey: false, inValue: true } : null
      }
      return offset <= end ? { path, inKey: false, inValue: true } : null
    }

    return null
  }

  if (!root || !isNode(root)) {
    return null
  }

  return visit(root, [])
}

type LineIndexes = {
  keyLineIndex: Map<number, YamlPath>
  seqLineIndex: Map<number, YamlPath>
}

function buildLineIndexes(
  root: Node | null | undefined,
  lineCounter: CachedYamlDoc['lineCounter'],
): LineIndexes {
  const keyLineIndex = new Map<number, YamlPath>()
  const seqLineIndex = new Map<number, YamlPath>()

  const visit = (node: Node | null | undefined, path: YamlPath) => {
    if (!node) return

    if (isMap(node)) {
      for (const pair of node.items) {
        if (!isNode(pair.key)) continue
        const keyValue = getPathKeyValue(pair.key)
        if (keyValue === null) continue
        const childPath = [...path, keyValue]
        if (pair.key.range && pair.key.range.length >= 2) {
          const pos = lineCounter.linePos(pair.key.range[0])
          keyLineIndex.set(pos.line, childPath)
        }
        if (pair.value && isNode(pair.value)) {
          visit(pair.value, childPath)
        }
      }
      return
    }

    if (isSeq(node)) {
      node.items.forEach((item, index) => {
        const childPath = [...path, index]
        if (item && isNode(item)) {
          if (item.range && item.range.length >= 2) {
            const pos = lineCounter.linePos(item.range[0])
            seqLineIndex.set(pos.line, childPath)
          }
          visit(item, childPath)
        }
      })
    }
  }

  visit(root, [])
  return { keyLineIndex, seqLineIndex }
}

function getLineIndent(lineText: string): string {
  const match = lineText.match(/^\s*/)
  return match ? match[0] : ''
}

function getKeyColumnIndent(lineText: string): string {
  const length = lineText.length
  let index = 0
  while (index < length) {
    const ch = lineText[index]
    if (ch === ' ' || ch === '\t') {
      index += 1
      continue
    }
    if (ch === '-' && (lineText[index + 1] === ' ' || lineText[index + 1] === undefined)) {
      return `${lineText.slice(0, index)}  `
    }
    return lineText.slice(0, index)
  }
  return lineText
}

function getPrefix(lineText: string, column: number): string {
  const left = lineText.slice(0, Math.max(0, column - 1))
  let start = left.length
  while (start > 0 && KEY_CHARS.test(left[start - 1])) {
    start -= 1
  }
  return left.slice(start)
}

function getInlineValuePrefix(lineText: string, column: number): string {
  const left = lineText.slice(0, Math.max(0, column - 1))
  const colonIndex = left.lastIndexOf(':')
  if (colonIndex === -1) {
    return getPrefix(lineText, column)
  }
  const valuePart = left.slice(colonIndex + 1)
  let start = valuePart.length
  while (start > 0 && KEY_CHARS.test(valuePart[start - 1])) {
    start -= 1
  }
  return valuePart.slice(start)
}

function isAfterColon(lineText: string, column: number): boolean {
  const left = lineText.slice(0, Math.max(0, column - 1))
  const colonIndex = left.lastIndexOf(':')
  if (colonIndex === -1) return false
  const trailing = left.slice(colonIndex + 1)
  return trailing.trim().length === 0
}

function isSeqItemLine(lineText: string): boolean {
  return /^\s*-(\s|$)/.test(lineText)
}

function getLineIndentSize(lineText: string): number {
  return getLineIndent(lineText).length
}

function countSeqItemsAtIndent(
  model: monaco.editor.ITextModel,
  fromLine: number,
  toLine: number,
  indentSize: number,
): number {
  let count = 0
  for (let line = fromLine; line <= toLine; line += 1) {
    const text = model.getLineContent(line)
    if (!isSeqItemLine(text)) continue
    if (getLineIndentSize(text) === indentSize) {
      count += 1
    }
  }
  return count
}

function findPreviousNonEmptyLine(model: monaco.editor.ITextModel, lineNumber: number): number | null {
  for (let line = lineNumber - 1; line >= 1; line -= 1) {
    const text = model.getLineContent(line)
    if (text.trim().length > 0) {
      return line
    }
  }
  return null
}

type AnchorLine = {
  line: number
  indent: number
  text: string
  path: YamlPath
  kind: 'key' | 'seq'
}

function findNearestAnchorLine(
  model: monaco.editor.ITextModel,
  lineNumber: number,
  currentIndent: number,
  indexes: LineIndexes,
): AnchorLine | null {
  for (let line = lineNumber - 1; line >= 1; line -= 1) {
    const text = model.getLineContent(line)
    if (text.trim().length === 0) continue
    const keyPath = indexes.keyLineIndex.get(line)
    const seqPath = indexes.seqLineIndex.get(line)
    if (!keyPath && !seqPath) continue
    const indent = getKeyColumnIndent(text).length
    if (indent <= currentIndent) {
      if (keyPath) {
        return { line, indent, text, path: keyPath, kind: 'key' }
      }
      if (seqPath) {
        return { line, indent, text, path: seqPath, kind: 'seq' }
      }
    }
  }
  return null
}

function findNearestKeyAnchorLine(
  model: monaco.editor.ITextModel,
  lineNumber: number,
  currentIndent: number,
  indexes: LineIndexes,
): AnchorLine | null {
  for (let line = lineNumber - 1; line >= 1; line -= 1) {
    const text = model.getLineContent(line)
    if (text.trim().length === 0) continue
    const keyPath = indexes.keyLineIndex.get(line)
    if (!keyPath) continue
    const indent = getKeyColumnIndent(text).length
    if (indent <= currentIndent) {
      return { line, indent, text, path: keyPath, kind: 'key' }
    }
  }
  return null
}

function parseSimpleKeyFromLine(lineText: string): string | null {
  const match = lineText.match(/^\s*(?:-\s+)?([A-Za-z0-9_.-]+)\s*:/)
  return match ? match[1] : null
}

export function getCursorContext(
  model: monaco.editor.ITextModel,
  position: monaco.Position,
  doc: CachedYamlDoc,
): CursorContext {
  const lineText = model.getLineContent(position.lineNumber)
  const lineIndent = getLineIndent(lineText)
  const isEmptyLine = lineText.trim().length === 0
  const prefix = getInlineValuePrefix(lineText, position.column)
  const afterColon = isAfterColon(lineText, position.column)
  const atLineStart = lineText.slice(0, Math.max(0, position.column - 1)).trim().length === 0
  const prevNonEmptyLine = isEmptyLine ? findPreviousNonEmptyLine(model, position.lineNumber) : null
  const prevNonEmptyText = prevNonEmptyLine ? model.getLineContent(prevNonEmptyLine) : ''
  const isBlockScalarLine = /:\s*[>|]/.test(prevNonEmptyText)

  let path: YamlPath | null = null
  let containerPath: YamlPath | null = null
  let keyPath: YamlPath | null = null
  let valuePath: YamlPath | null = null
  let inKey = false
  let inValue = false
  let slot: 'key' | 'value' | 'unknown' = 'unknown'

  const offset = model.getOffsetAt(position)
  let result = findPathAtOffset(doc.doc.contents as Node, offset)
  if (isEmptyLine && !isBlockScalarLine) {
    result = null
  }
  if (result) {
    path = result.path
    inKey = result.inKey
    inValue = result.inValue

    if (inKey && lineText.includes(':')) {
      const colonIndex = lineText.indexOf(':')
      if (position.column - 1 > colonIndex) {
        inKey = false
        inValue = true
      }
    }

    if (inKey && path.length > 0) {
      keyPath = path.slice(0, -1)
      containerPath = keyPath
      slot = 'key'
    } else if (inValue) {
      valuePath = path
      containerPath = path
      slot = 'value'
    }
  } else {
    const indexes = buildLineIndexes(doc.doc.contents as Node, doc.lineCounter)
    const prevLine = prevNonEmptyLine
    const keyPathAtLine = indexes.keyLineIndex.get(position.lineNumber)
    const seqPathAtLine = indexes.seqLineIndex.get(position.lineNumber)

    if (!isEmptyLine) {
      const inlineMatch = lineText.match(/^\s*(?:-\s+)?([A-Za-z0-9_.-]+)\s*:\s*[^#]*$/)
      const colonIndex = lineText.indexOf(':')
      const cursorAfterColon = colonIndex !== -1 && position.column - 1 > colonIndex
      if (inlineMatch && cursorAfterColon) {
        const key = inlineMatch[1]
        if (keyPathAtLine && keyPathAtLine[keyPathAtLine.length - 1] === key) {
          valuePath = keyPathAtLine
        } else if (seqPathAtLine) {
          valuePath = [...seqPathAtLine, key]
        } else if (isSeqItemLine(lineText)) {
          const dashIndent = getLineIndentSize(lineText)
          const anchor = findNearestKeyAnchorLine(model, position.lineNumber, dashIndent, indexes)
          if (anchor) {
            const count = countSeqItemsAtIndent(model, anchor.line + 1, position.lineNumber, dashIndent)
            const index = Math.max(0, count - 1)
            valuePath = [...anchor.path, index, key]
          }
        }
        if (valuePath) {
          containerPath = valuePath
          inValue = true
          slot = 'value'
        }
      }

      if (!valuePath && cursorAfterColon) {
        const key = parseSimpleKeyFromLine(lineText)
        if (key) {
          if (seqPathAtLine) {
            valuePath = [...seqPathAtLine, key]
          } else if (isSeqItemLine(lineText)) {
            const dashIndent = getLineIndentSize(lineText)
            const anchor = findNearestKeyAnchorLine(model, position.lineNumber, dashIndent, indexes)
            if (anchor) {
              const count = countSeqItemsAtIndent(model, anchor.line + 1, position.lineNumber, dashIndent)
              const index = Math.max(0, count - 1)
              valuePath = [...anchor.path, index, key]
            }
          }
          if (valuePath) {
            containerPath = valuePath
            inValue = true
            slot = 'value'
          }
        }
      }
    }

    if (keyPathAtLine && afterColon) {
      valuePath = keyPathAtLine
      containerPath = valuePath
      inValue = true
      slot = 'value'
    }

    if (!isEmptyLine && isSeqItemLine(lineText) && !valuePath) {
      const dashIndent = getLineIndentSize(lineText)
      const anchor = findNearestKeyAnchorLine(model, position.lineNumber, dashIndent, indexes)
      if (anchor) {
        const count = countSeqItemsAtIndent(model, anchor.line + 1, position.lineNumber, dashIndent)
        const index = Math.max(0, count - 1)
        valuePath = [...anchor.path, index]
        containerPath = valuePath
        inValue = true
        slot = 'value'
      }
    }

    if (isEmptyLine && prevLine !== null) {
      const prevLineText = model.getLineContent(prevLine)
      const prevIndent = getKeyColumnIndent(prevLineText).length
      const endsWithColon = /:\s*(#.*)?$/.test(prevLineText)
      const keyPathAtPrev = indexes.keyLineIndex.get(prevLine)
      const seqPathAtPrev = indexes.seqLineIndex.get(prevLine)

      if (!keyPath && !valuePath && prevIndent > lineIndent.length) {
        const anchor = findNearestKeyAnchorLine(model, position.lineNumber, Math.max(0, lineIndent.length - 1), indexes)
        if (anchor) {
          keyPath = anchor.path
          containerPath = keyPath
          inKey = true
          slot = 'key'
        }
      }

      if (seqPathAtPrev && isSeqItemLine(prevLineText) && lineIndent.length >= prevIndent && !endsWithColon) {
        valuePath = seqPathAtPrev
        containerPath = valuePath
        inValue = true
        slot = 'value'
      } else if (keyPathAtPrev && lineIndent.length >= prevIndent) {
        if (endsWithColon) {
          valuePath = keyPathAtPrev
          containerPath = valuePath
          inValue = true
          slot = 'value'
        } else {
          keyPath = keyPathAtPrev.slice(0, -1)
          containerPath = keyPath
          inKey = true
          slot = 'key'
        }
      } else if (endsWithColon && lineIndent.length >= prevIndent) {
        const keyName = parseSimpleKeyFromLine(prevLineText)
        if (keyName) {
          const parentAnchor = findNearestAnchorLine(model, prevLine, Math.max(0, prevIndent - 1), indexes)
          const parentPath = parentAnchor ? parentAnchor.path : []
          valuePath = [...parentPath, keyName]
          containerPath = valuePath
          inValue = true
          slot = 'value'
        }
      } else if (seqPathAtPrev && lineIndent.length >= prevIndent) {
        valuePath = seqPathAtPrev
        containerPath = valuePath
        inValue = true
        slot = 'value'
      } else if (isSeqItemLine(prevLineText) && lineIndent.length >= prevIndent && !valuePath) {
        const dashIndent = getLineIndentSize(prevLineText)
        const anchor = findNearestKeyAnchorLine(model, prevLine, dashIndent, indexes)
        if (anchor) {
          const count = countSeqItemsAtIndent(model, anchor.line + 1, prevLine, dashIndent)
          const index = Math.max(0, count - 1)
          valuePath = [...anchor.path, index]
          containerPath = valuePath
          inValue = true
          slot = 'value'
        }
      }
    }

    if (!keyPath && !valuePath) {
      const anchor = findNearestAnchorLine(model, position.lineNumber, lineIndent.length, indexes)
      if (anchor) {
        const inlineValue = /:\s*[^#\s]/.test(anchor.text)
        const endsWithColon = /:\s*$/.test(anchor.text)
        if (anchor.kind === 'key') {
          if (lineIndent.length > anchor.indent) {
            valuePath = anchor.path
            containerPath = valuePath
            inValue = true
            slot = 'value'
          } else if (lineIndent.length === anchor.indent) {
            if (isEmptyLine && endsWithColon && !inlineValue) {
              valuePath = anchor.path
              containerPath = valuePath
              inValue = true
              slot = 'value'
            } else {
              keyPath = anchor.path.slice(0, -1)
              containerPath = keyPath
              inKey = true
              slot = 'key'
            }
          }
        } else if (anchor.kind === 'seq') {
          if (lineIndent.length >= anchor.indent) {
            valuePath = anchor.path
            containerPath = valuePath
            inValue = true
            slot = 'value'
          }
        }
      }
    }
  }

  if (!keyPath && !valuePath) {
    keyPath = []
    containerPath = keyPath
    inKey = true
    slot = 'key'
  }

  if (!keyPath && valuePath) {
    keyPath = valuePath
  }

  if (!path) {
    path = valuePath ?? keyPath
  }

  if (inValue) {
    const linePrefix = lineText.slice(0, Math.max(0, position.column - 1))
    const match = linePrefix.match(/^\s*(?:-\s+)?([A-Za-z0-9_.-]+)\s*:\s*[^#]*$/)
    if (match) {
      const key = match[1]
      if (!valuePath || valuePath[valuePath.length - 1] !== key) {
        const basePath = keyPath ?? valuePath ?? []
        valuePath = [...basePath, key]
        if (path) {
          path = valuePath
        }
      }
    }
  }

  if (isSeqItemLine(lineText)) {
    const indexes = buildLineIndexes(doc.doc.contents as Node, doc.lineCounter)
    const dashIndent = getLineIndentSize(lineText)
    const anchor = findNearestKeyAnchorLine(model, position.lineNumber, dashIndent, indexes)
    if (anchor) {
      const count = countSeqItemsAtIndent(model, anchor.line + 1, position.lineNumber, dashIndent)
      const index = Math.max(0, count - 1)
      const seqPath = [...anchor.path, index]
      if (!valuePath) {
        valuePath = seqPath
        containerPath = valuePath
        inValue = true
        slot = 'value'
      } else {
        const rest = valuePath.slice(anchor.path.length)
        if (rest.length === 0 || typeof rest[0] !== 'number') {
          valuePath = [...anchor.path, index, ...rest]
          if (path) {
            path = valuePath
          }
        }
      }
    }
  }

  return {
    path,
    containerPath,
    keyPath,
    valuePath,
    slot,
    inKey,
    inValue,
    lineText,
    lineIndent,
    lineIndentSize: lineIndent.length,
    prefix,
    isEmptyLine,
    afterColon,
    atLineStart,
  }
}
