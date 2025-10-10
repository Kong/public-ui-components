import type {
  EdgeInstance,
  GroupInstance,
  NodeId,
} from '../../types'

export type SimpleEdge = { source: NodeId, target: NodeId }

export function getDataEdges(edges: readonly EdgeInstance[]): SimpleEdge[] {
  return edges.map(({ source, target }) => ({ source, target }))
}

export function getBranchMembershipEdges(groups: readonly GroupInstance[]): SimpleEdge[] {
  const pairs: SimpleEdge[] = []
  for (const group of groups) {
    for (const memberId of group.memberIds) {
      pairs.push({ source: group.ownerId, target: memberId })
    }
  }
  return pairs
}

export function getCombinedEdges(
  edges: readonly EdgeInstance[],
  groups: readonly GroupInstance[],
): SimpleEdge[] {
  return [
    ...getDataEdges(edges),
    ...getBranchMembershipEdges(groups),
  ]
}

export function buildAdjacency(
  edges: readonly SimpleEdge[],
  extra?: SimpleEdge | null,
) {
  const map = new Map<NodeId, NodeId[]>()

  for (const { source, target } of edges) {
    if (!map.has(source)) map.set(source, [])
    map.get(source)!.push(target)
    if (!map.has(target)) map.set(target, [])
  }

  if (extra) {
    if (!map.has(extra.source)) map.set(extra.source, [])
    map.get(extra.source)!.push(extra.target)
    if (!map.has(extra.target)) map.set(extra.target, [])
  }

  return map
}

export function hasCycle(graph: ReadonlyMap<NodeId, readonly NodeId[]>): boolean {
  const seen = new Set<NodeId>()
  const stack = new Set<NodeId>()

  function dfs(n: NodeId): boolean {
    if (stack.has(n)) return true
    if (seen.has(n)) return false

    seen.add(n)
    stack.add(n)

    for (const next of graph.get(n) ?? []) {
      if (dfs(next)) return true
    }

    stack.delete(n)
    return false
  }

  for (const id of graph.keys()) {
    if (dfs(id)) return true
  }

  return false
}
