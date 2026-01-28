import type { Ref } from 'vue'
import { computed } from 'vue'
import type {
  ConfigNode,
  EditorState,
  EdgeInstance,
  EdgeData,
  FieldId,
  NodeInstance,
  NodeId,
  DatakitConfig,
} from '../../types'
import { hasInputField, hasOutputField } from './helpers'
import { IMPLICIT_NODE_NAMES } from '../../constants'
import type { SimpleEdge } from './graph'
import {
  buildAdjacency,
  getCombinedEdges,
  hasCycle,
} from './graph'
import { validateGraph as validateConfigGraph } from '../../schema/graph-validation'

export type ValidationResult = { ok: true } | { ok: false, errors: string[] }

/**
 * Validators bound to a reactive EditorState.
 * Always reads the latest state through computed getters.
 */
export function useValidators(
  stateRef: Ref<EditorState>,
  getConfigNodes?: () => ConfigNode[],
) {
  /** reactive maps for O(1) look-up */
  const nodesById = computed(() => {
    const m = new Map<NodeId, NodeInstance>()
    stateRef.value.nodes.forEach((n) => m.set(n.id, n))
    return m
  })
  const edges = computed<readonly EdgeInstance[]>(
    () => stateRef.value.edges,
  )
  const groups = computed(() => stateRef.value.groups)

  const combinedEdges = computed(() => getCombinedEdges(edges.value, groups.value))

  function buildStateAdjacency(extra?: SimpleEdge) {
    return buildAdjacency(
      combinedEdges.value,
      extra ? { source: extra.source, target: extra.target } : undefined,
    )
  }

  /* ---------- helpers ---------- */

  /** Swap ends when drag starts at an input handle. */
  function canonicalizeConnection(edge: EdgeData): EdgeData {
    const sourceNode = nodesById.value.get(edge.source)
    const targetNode = nodesById.value.get(edge.target)
    if (!sourceNode || !targetNode) return edge

    const fromIsInput =
      hasInputField(sourceNode, edge.sourceField) &&
      !hasOutputField(sourceNode, edge.sourceField)
    const toIsOutput = hasOutputField(targetNode, edge.targetField)

    return fromIsInput && toIsOutput
      ? {
        source: edge.target,
        sourceField: edge.targetField,
        target: edge.source,
        targetField: edge.sourceField,
      }
      : edge
  }

  /* ---------- edge-level validation ---------- */

  function validateConnection(raw: EdgeData): ValidationResult {
    const edge = canonicalizeConnection(raw)
    const errors: string[] = []

    const sourceNode = nodesById.value.get(edge.source)
    const targetNode = nodesById.value.get(edge.target)

    if (!sourceNode) errors.push('source node not found')
    if (!targetNode) errors.push('target node not found')
    if (!sourceNode || !targetNode) return { ok: false, errors }

    if (!hasOutputField(sourceNode, edge.sourceField))
      errors.push('source handle is not an output field')
    if (!hasInputField(targetNode, edge.targetField))
      errors.push('target handle is not an input field')

    // phase / implicit rules
    if (targetNode.name === 'request') errors.push('cannot target "request"')
    if (sourceNode.name === 'response')
      errors.push('cannot source from "response"')

    // fan-in rules
    const hasWholeOnTarget = edges.value.some(
      (e) => e.target === edge.target && !e.targetField,
    )
    const hasFieldOnTarget = edges.value.some(
      (e) => e.target === edge.target && !!e.targetField,
    )
    if (
      (hasWholeOnTarget && edge.targetField) ||
      (hasFieldOnTarget && !edge.targetField)
    )
      errors.push(
        'cannot mix whole-node and field-level inputs on same target',
      )

    if (
      edge.targetField &&
      edges.value.some(
        (e) => e.target === edge.target && e.targetField === edge.targetField,
      )
    )
      errors.push('target field already connected')
    if (
      !edge.targetField &&
      edges.value.some((e) => e.target === edge.target && !e.targetField)
    )
      errors.push('target input already taken')

    if (edge.source === edge.target) errors.push('self-loop not allowed')

    const adjacency = buildStateAdjacency({ source: edge.source, target: edge.target })
    if (hasCycle(adjacency))
      errors.push('connection introduces a cycle')

    return errors.length ? { ok: false, errors } : { ok: true }
  }

  /* ---------- graph-level validation ---------- */

  function validateGraph(): ValidationResult {
    const errors: string[] = []

    if (getConfigNodes) {
      const config: DatakitConfig = {
        nodes: getConfigNodes(),
      }
      const issues = validateConfigGraph(config, { mode: 'compat' })
      issues.forEach((issue) => {
        errors.push(issue.message)
      })
    }

    for (const n of IMPLICIT_NODE_NAMES)
      if (![...nodesById.value.values()].some((node) => node.name === n))
        errors.push(`missing implicit node "${n}"`)

    for (const e of edges.value) {
      const s = nodesById.value.get(e.source)!
      const t = nodesById.value.get(e.target)!
      if (t.name === 'request') errors.push(`edge "${e.id}" targets "request"`)
      if (s.name === 'response')
        errors.push(`edge "${e.id}" sources from "response"`)
    }

    if (hasCycle(buildStateAdjacency())) errors.push('graph contains cycle')
    return errors.length ? { ok: false, errors } : { ok: true }
  }

  /* ---------- UI helpers ---------- */

  function isValidConnection(edge: EdgeData): boolean {
    return validateConnection(edge).ok
  }

  function isValidVueFlowConnection(conn: {
    source?: string | null
    sourceHandle?: string | null
    target?: string | null
    targetHandle?: string | null
  }) {
    if (!conn.source || !conn.target) return false
    return isValidConnection({
      source: conn.source as NodeId,
      sourceField: conn.sourceHandle as FieldId | undefined,
      target: conn.target as NodeId,
      targetField: conn.targetHandle as FieldId | undefined,
    })
  }

  return {
    canonicalizeConnection,
    validateConnection,
    validateGraph,
    isValidConnection,
    isValidVueFlowConnection,
    buildAdjacency,
  }
}
