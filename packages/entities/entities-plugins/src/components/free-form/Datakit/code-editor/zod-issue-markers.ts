import type { z } from 'zod'
import { isMap, isScalar, isSeq } from 'yaml'

import type { LineCounter, Node } from 'yaml'
import type { MonacoRange, PathIndex, YamlPath } from './yaml-path-index'
import {
  getKeyNode,
  getParentKeyNode,
  getValueNode,
  isBlockScalar,
  rangeFromNode,
  rangeFromOffsets,
} from './yaml-path-index'

export type IssueMarker = {
  range: MonacoRange
  message: string
}

type ZodIssue = z.core.$ZodIssue

type MarkerContext = {
  index: PathIndex
  lineCounter: LineCounter
  prefixPath: YamlPath
  maxMarkers?: number
}

function rangeForScalar(node: Node, lineCounter: LineCounter): MonacoRange | null {
  if (isBlockScalar(node)) {
    return rangeFromNode(node, lineCounter, { singleLine: true })
  }
  return rangeFromNode(node, lineCounter)
}

function rangeForHeader(node: Node, lineCounter: LineCounter): MonacoRange | null {
  return rangeFromNode(node, lineCounter, { singleLine: true })
}

function rangeForPath(path: YamlPath, ctx: MarkerContext): MonacoRange | null {
  const node = getValueNode(ctx.index, path)
  if (!node) {
    return null
  }

  if (isScalar(node)) {
    return rangeForScalar(node, ctx.lineCounter)
  }

  if (isMap(node) || isSeq(node)) {
    const lastSegment = path[path.length - 1]
    const parentKey = getParentKeyNode(ctx.index, path)
    if (parentKey && typeof lastSegment !== 'number') {
      const range = rangeFromNode(parentKey, ctx.lineCounter)
      if (range) {
        return range
      }
    }
    return rangeForHeader(node, ctx.lineCounter)
  }

  return rangeFromNode(node, ctx.lineCounter)
}

function fallbackRange(path: YamlPath, ctx: MarkerContext): MonacoRange | null {
  for (let i = path.length; i >= 0; i -= 1) {
    const subPath = path.slice(0, i)
    const lastSegment = subPath[subPath.length - 1]
    if (typeof lastSegment !== 'number') {
      const keyNode = getKeyNode(ctx.index, subPath) ?? getParentKeyNode(ctx.index, subPath)
      if (keyNode) {
        const range = rangeFromNode(keyNode, ctx.lineCounter)
        if (range) {
          return range
        }
      }
    }
    const node = getValueNode(ctx.index, subPath)
    if (node) {
      const range = rangeForHeader(node, ctx.lineCounter)
      if (range) {
        return range
      }
    }
  }

  return rangeFromOffsets(ctx.lineCounter, 0, 1)
}

function createMarker(range: MonacoRange, message: string): IssueMarker {
  return { range, message }
}

function issuePathWithPrefix(issue: ZodIssue, prefixPath: YamlPath): YamlPath {
  return [...prefixPath, ...issue.path] as YamlPath
}

function formatIssueMessage(issue: ZodIssue, path: YamlPath, ctx: MarkerContext): string {
  const last = path[path.length - 1]
  if (
    issue.code === 'invalid_type' &&
    typeof last === 'string'
  ) {
    const hasKey = !!getKeyNode(ctx.index, path)
    if (!hasKey) {
      return `Missing required field "${last}"`
    }
  }

  if (
    issue.code === 'invalid_union' &&
    'discriminator' in issue &&
    typeof issue.discriminator === 'string'
  ) {
    const note = 'note' in issue && typeof issue.note === 'string' ? issue.note : undefined
    if (note !== 'No matching discriminator') {
      return issue.message
    }
    const keyPath = [...path.slice(0, -1), issue.discriminator] as YamlPath
    const hasKey = !!getKeyNode(ctx.index, keyPath)
    if (!hasKey) {
      return `Missing required field "${issue.discriminator}"`
    }
  }

  return issue.message
}

function rangeForMissingPath(path: YamlPath, ctx: MarkerContext): MonacoRange | null {
  if (path.length === 0) {
    return null
  }
  const last = path[path.length - 1]
  if (typeof last !== 'string') {
    return null
  }

  const parentPath = path.slice(0, -1)
  const parentNode = getValueNode(ctx.index, parentPath)
  if (parentNode && isMap(parentNode)) {
    const range = rangeFromNode(parentNode, ctx.lineCounter, { singleLine: true })
    if (range) {
      return range
    }
  }

  return null
}

function issueToMarkers(issue: ZodIssue, ctx: MarkerContext): IssueMarker[] {
  if (issue.code === 'unrecognized_keys' && 'keys' in issue) {
    return issue.keys
      .map((key) => {
        const path = [...ctx.prefixPath, ...issue.path, key] as YamlPath
        const keyNode = getKeyNode(ctx.index, path)
        const range = keyNode
          ? rangeFromNode(keyNode, ctx.lineCounter)
          : rangeForPath(path, ctx) ?? fallbackRange(path, ctx)
        if (!range) {
          return null
        }
        return createMarker(range, `Unknown key "${key}"`)
      })
      .filter((marker): marker is IssueMarker => !!marker)
  }

  const path = issuePathWithPrefix(issue, ctx.prefixPath)
  const range =
    rangeForPath(path, ctx) ??
    rangeForMissingPath(path, ctx) ??
    fallbackRange(path, ctx)

  if (!range) {
    return []
  }

  return [createMarker(range, formatIssueMessage(issue, path, ctx))]
}

function dedupeMarkers(markers: IssueMarker[]): IssueMarker[] {
  const seen = new Set<string>()
  return markers.filter((marker) => {
    const key = [
      marker.message,
      marker.range.startLineNumber,
      marker.range.startColumn,
      marker.range.endLineNumber,
      marker.range.endColumn,
    ].join(':')
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

export function zodIssuesToMarkers(issues: ZodIssue[], ctx: MarkerContext): IssueMarker[] {
  const collected: IssueMarker[] = []

  for (const issue of issues) {
    const markers = issueToMarkers(issue, ctx)
    collected.push(...markers)
    if (ctx.maxMarkers && collected.length >= ctx.maxMarkers) {
      break
    }
  }

  return dedupeMarkers(collected).slice(0, ctx.maxMarkers)
}
