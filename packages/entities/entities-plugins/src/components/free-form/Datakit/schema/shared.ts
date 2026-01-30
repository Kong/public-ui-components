import type { z } from 'zod'
import type { ConfigNode } from './strict'

export type ConnectionRef = {
  nodeName: string
  path: Array<string | number>
  value: string
}

export function collectConnectionRefs(
  node: ConfigNode,
  nodeIndex: number,
): ConnectionRef[] {
  const out: ConnectionRef[] = []
  const push = (path: Array<string | number>, v: unknown) => {
    if (typeof v === 'string') {
      out.push({
        nodeName: node.name,
        path: ['nodes', nodeIndex, ...path],
        value: v,
      })
    }
  }
  if ('input' in node && node.input != null) push(['input'], node.input)
  if ('inputs' in node && node.inputs && typeof node.inputs === 'object') {
    for (const [k, v] of Object.entries(node.inputs)) {
      if (v != null) push(['inputs', k], v)
    }
  }
  if ('output' in node && node.output != null) push(['output'], node.output)
  if ('outputs' in node && node.outputs && typeof node.outputs === 'object') {
    for (const [k, v] of Object.entries(node.outputs)) {
      if (v != null) push(['outputs', k], v)
    }
  }
  return out
}

export function isOutRef(ref: ConnectionRef) {
  const slot = ref.path[2]
  return slot === 'output' || slot === 'outputs'
}

export function hasAnyNonNullEntry(obj?: Record<string, unknown> | null): boolean {
  if (!obj) return false
  for (const v of Object.values(obj)) {
    if (v != null) return true
  }
  return false
}

type IONode = {
  input?: unknown
  inputs?: Record<string, unknown> | null
  output?: unknown
  outputs?: Record<string, unknown> | null
}

export function validateInputOutputExclusivity(
  node: IONode,
  ctx: z.RefinementCtx,
) {
  const hasInput = node.input !== undefined && node.input !== null
  const hasInputs = hasAnyNonNullEntry(node.inputs)
  if (hasInput && hasInputs) {
    ctx.addIssue({
      code: 'custom',
      message: 'A node cannot use both "input" and "inputs". Use one or the other.',
      path: ['inputs'],
    })
  }

  const hasOutput = node.output !== undefined && node.output !== null
  const hasOutputs = hasAnyNonNullEntry(node.outputs)
  if (hasOutput && hasOutputs) {
    ctx.addIssue({
      code: 'custom',
      message: 'A node cannot use both "output" and "outputs". Use one or the other.',
      path: ['outputs'],
    })
  }
}
