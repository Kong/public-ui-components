import type { z } from 'zod'

export type ConnectionRef = {
  nodeName: string
  path: Array<string | number>
  value: string
}

export function collectConnectionRefs(
  node: any,
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
    for (const [k, v] of Object.entries(
      node.inputs as Record<string, unknown>,
    )) {
      if (v != null) push(['inputs', k], v)
    }
  }
  if ('output' in node && node.output != null) push(['output'], node.output)
  if ('outputs' in node && node.outputs && typeof node.outputs === 'object') {
    for (const [k, v] of Object.entries(
      node.outputs as Record<string, unknown>,
    )) {
      if (v != null) push(['outputs', k], v)
    }
  }
  return out
}

export function isOutRef(ref: ConnectionRef) {
  const slot = ref.path[2] as string
  return slot === 'output' || slot === 'outputs'
}

export function hasAnyNonNullEntry(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false
  for (const v of Object.values(obj as Record<string, unknown>)) {
    if (v != null) return true
  }
  return false
}

export function validateNamesAndConnections(
  config: { nodes?: any[] | null },
  implicitNames: readonly string[],
  ctx: z.RefinementCtx,
) {
  if (!config.nodes) return

  const names = config.nodes.map((n) => n.name)
  const seen = new Set<string>()
  names.forEach((name, i) => {
    if (seen.has(name)) {
      ctx.addIssue({
        code: 'custom',
        message: `Duplicate node name: "${name}"`,
        path: ['nodes', i, 'name'],
      })
    }
    seen.add(name)
  })

  config.nodes.forEach((node, i) => {
    const hasInput = 'input' in node && node.input != null
    const hasInputs =
      'inputs' in node && hasAnyNonNullEntry((node as any).inputs)
    if (hasInput && hasInputs) {
      ctx.addIssue({
        code: 'custom',
        message:
          'A node cannot use both "input" and "inputs". Use one or the other.',
        path: ['nodes', i, 'inputs'],
      })
    }
  })

  const allowed = new Set<string>([...implicitNames, ...names])
  const pairOutPath = new Map<string, Array<string | number>>()
  const pairInPath = new Map<string, Array<string | number>>()

  config.nodes.forEach((node, i) => {
    for (const ref of collectConnectionRefs(node, i)) {
      const other = ref.value.split('.', 1)[0]!
      if (!allowed.has(other)) {
        ctx.addIssue({
          code: 'custom',
          message: `Unknown node "${other}" in connection "${ref.value}"`,
          path: ref.path,
        })
      }
      if (isOutRef(ref)) {
        const key = `${ref.nodeName}->${other}`
        if (pairInPath.has(key)) {
          ctx.addIssue({
            code: 'custom',
            message: `Connection specified on both sides: "${ref.nodeName}" outputs to "${other}" and "${other}" inputs from "${ref.nodeName}". Specify it on one side only.`,
            path: ref.path,
          })
        } else {
          pairOutPath.set(key, pairOutPath.get(key) ?? ref.path)
        }
      } else {
        const key = `${other}->${ref.nodeName}`
        if (pairOutPath.has(key)) {
          ctx.addIssue({
            code: 'custom',
            message: `Connection specified on both sides: "${other}" outputs to "${ref.nodeName}" and "${ref.nodeName}" inputs from "${other}". Specify it on one side only.`,
            path: ref.path,
          })
        } else {
          pairInPath.set(key, pairInPath.get(key) ?? ref.path)
        }
      }
    }
  })
}
