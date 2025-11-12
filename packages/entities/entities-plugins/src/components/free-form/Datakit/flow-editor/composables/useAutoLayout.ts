import dagre from '@dagrejs/dagre'
import { useVueFlow } from '@vue-flow/core'
import { nextTick, toValue } from 'vue'

import { DEFAULT_LAYOUT_OPTIONS, DEFAULT_VIEWPORT_WIDTH, DK_BRANCH_GROUP_PADDING } from '../constants'
import { isGroupInstance } from '../node/node'
import { useEditorStore } from '../store/store'
import { getBoundingRect } from './helpers'

import type { Edge as DagreEdge, Node as DagreNode } from '@dagrejs/dagre'
import type { GraphNode, Rect } from '@vue-flow/core'

import type { GroupId, GroupInstance, NodeId, NodeInstance, NodePhase } from '../../types'
import type { LayoutOptions, useFlowStore } from '../store/flow'
import type { useBranchLayout } from './useBranchLayout'

interface useAutoLayoutOptions extends Pick<ReturnType<typeof useFlowStore>, 'nodes' | 'edges'> {
  phase: NodePhase
  layoutOptions: LayoutOptions
  branchLayout: ReturnType<typeof useBranchLayout>
}

export function useAutoLayout(options: useAutoLayoutOptions) {
  const {
    branchLayout,
    phase,
    layoutOptions,
    nodes,
    edges,
  } = options

  const { findNode } = useVueFlow()
  const { state, branchGroups, getNodeById, moveNode, commit: historyCommit } = useEditorStore()
  const { getNodeDepth, isGroupId, groupsByOwner } = branchGroups
  const {
    isBranchEdgeId,
    updateGroupLayout,
    translateGroupTree,
    waitForLayoutFlush,
  } = branchLayout

  const {
    viewport,
    padding = DEFAULT_LAYOUT_OPTIONS.padding,
    gaps = DEFAULT_LAYOUT_OPTIONS.gaps,
  } = layoutOptions
  const {
    nodes: nodeGap = DEFAULT_LAYOUT_OPTIONS.gaps.nodes,
    edges: edgeGap = DEFAULT_LAYOUT_OPTIONS.gaps.edges,
    ranks: rankGap = DEFAULT_LAYOUT_OPTIONS.gaps.ranks,
  } = gaps

  async function autoLayout(commitNow = true) {
    const nodeMap = new Map<string, NodeInstance>(
      nodes.value.map((node) => [node.id, node.data!]),
    )

    // These are Dagre edges for tweaking auto-layout only.
    const virtualEdges = new Map<number, DagreEdge[]>()

    // A cached version of `findNode`
    const findNodeCache = new Map<string, GraphNode>()
    const cachedFindNode: typeof findNode = (nodeId) => {
      if (!nodeId) return undefined

      let node = findNodeCache.get(nodeId)
      if (node) return node

      node = findNode(nodeId)
      if (node) {
        findNodeCache.set(nodeId, node)
      }
      return node
    }

    const getNodeDepthCache = new Map<string, number>()
    const cachedGetNodeDepth: typeof getNodeDepth = (nodeId) => {
      let depth = getNodeDepthCache.get(nodeId)
      if (depth !== undefined) return depth

      depth = getNodeDepth(nodeId)
      getNodeDepthCache.set(nodeId, depth)
      return depth
    }

    // Since group nodes do not have parentNode set, we will find the parent
    // via the owner node.
    const safeParentId = (node: GraphNode): NodeId | GroupId | undefined => {
      if (!isGroupInstance(node.data)) {
        // Normal path
        return node.parentNode as (NodeId | GroupId | undefined)
      }
      const ownerNode = cachedFindNode(node.data.ownerId)
      if (!ownerNode) {
        throw new Error(`Cannot find owner node '${node.data.ownerId}' for group node '${node.id}' via findNode`)
      }
      return ownerNode.parentNode as (NodeId | GroupId | undefined)
    }

    for (const edge of edges.value) {
      // Skip branch edges
      if (isBranchEdgeId(edge.id)) continue

      const source = edge.source as NodeId
      const target = edge.target as NodeId

      // We have skipped branch edges. By this point, there should be no other
      // edges connecting to groups.
      if (isGroupId(source) || isGroupId(target))
        continue

      const sourceNode = cachedFindNode(source)
      const targetNode = cachedFindNode(target)

      if (!sourceNode) {
        throw new Error(`Cannot find source node '${source}' for edge '${edge.id}' via findNode`)
      } else if (!targetNode) {
        throw new Error(`Cannot find target node '${target}' for edge '${edge.id}' via findNode`)
      }

      // Not interested in edges being the direct children at root or within
      // the same group.
      if (safeParentId(sourceNode) === safeParentId(targetNode))
        continue

      let sourceStackTop = sourceNode
      let targetStackTop = targetNode

      // Track depths here to avoid repeated `getNodeDepth` calls.
      let sourceStackDepth = cachedGetNodeDepth(sourceStackTop.id as NodeId)
      let targetStackDepth = cachedGetNodeDepth(targetStackTop.id as NodeId)

      // Pop stacks until both stacks are at the same depth
      while (sourceStackDepth !== targetStackDepth) {
        if (sourceStackDepth > targetStackDepth) {
          const parentId = safeParentId(sourceStackTop)
          if (!parentId) {
            // Assumption: sourceStackDepth > targetStackDepth > 0
            // sourceStackTop must have a parent
            throw new Error(`Expected node '${sourceStackTop.id}' to have parent, but it does not`)
          }

          const parentNode = cachedFindNode(parentId)
          if (!parentNode) {
            throw new Error(`Cannot find parent node '${parentId}' for node '${sourceStackTop.id}' via findNode`)
          }

          sourceStackTop = parentNode
          sourceStackDepth--
        } else if (targetStackDepth > sourceStackDepth) {
          const parentId = safeParentId(targetStackTop)
          if (!parentId) {
            // Assumption: targetStackDepth > sourceStackDepth > 0
            // targetStackTop must have a parent
            throw new Error(`Expected node '${targetStackTop.id}' to have parent, but it does not`)
          }

          const parentNode = cachedFindNode(parentId)
          if (!parentNode) {
            throw new Error(`Cannot find parent node '${parentId}' for node '${targetStackTop.id}' via findNode`)
          }

          targetStackTop = parentNode
          targetStackDepth--
        }
      }

      // Assumption: sourceStackDepth === targetStackDepth, we use either one
      while (sourceStackDepth >= 0) {
        const sourceParentId = safeParentId(sourceStackTop)
        const targetParentId = safeParentId(targetStackTop)

        if (sourceParentId === targetParentId) {
          if (!virtualEdges.has(sourceStackDepth)) {
            virtualEdges.set(sourceStackDepth, [])
          }
          virtualEdges.get(sourceStackDepth)!.push({
            v: sourceStackTop.id,
            w: targetStackTop.id,
          })
          break
        }

        if (!sourceParentId) {
          const message = `Expected node '${sourceStackTop.id}' to have parent, but it does not`
          console.error(message, sourceStackTop)
          throw new Error(message)
        } else if (!targetParentId) {
          const message = `Expected node '${targetStackTop.id}' to have parent, but it does not`
          console.error(message, targetStackTop)
          throw new Error(message)
        }

        const sourceParentNode = cachedFindNode(sourceParentId)
        const targetParentNode = cachedFindNode(targetParentId)

        if (!sourceParentNode) {
          throw new Error(`Cannot find parent node '${sourceParentId}' for node '${sourceStackTop.id}' via findNode`)
        } else if (!targetParentNode) {
          throw new Error(`Cannot find parent node '${targetParentId}' for node '${targetStackTop.id}' via findNode`)
        }

        sourceStackTop = sourceParentNode
        targetStackTop = targetParentNode
        sourceStackDepth--
        targetStackDepth--
      }
    }

    // Bottom-up layout
    const sortedGroups = state.value.groups.toSorted((a, b) => cachedGetNodeDepth(b.ownerId) - cachedGetNodeDepth(a.ownerId))
    for (const group of sortedGroups) {
      doAutoLayout(
        group.memberIds.reduce((nodes, memberId) => {
          const node = getNodeById(memberId)
          if (!node) {
            console.warn(`Cannot find node '${memberId}' of group '${group.id}' by getNodeById`)
            return nodes
          }

          if (node.phase !== phase) return nodes

          if (node.type === 'branch') {
            const ownedGroups = groupsByOwner.value.get(node.id)
            if (ownedGroups) {
              nodes.push(...ownedGroups)
            }
          }

          nodeMap.delete(node!.id)
          nodes.push(node)
          return nodes
        }, [] as Array<NodeInstance | GroupInstance>),
        {
          virtualEdges: virtualEdges.get(cachedGetNodeDepth(group.ownerId)),
          cachedFindNode,
        },
      )
      await nextTick() // <- Wait for updates on VueFlow internals
      updateGroupLayout(group.id, false)
      await waitForLayoutFlush() // ensure pending group layout writes applied before next iteration
    }

    const rootNodes: Array<NodeInstance | GroupInstance> = nodeMap.values().toArray()
    for (const node of rootNodes) {
      if (isGroupInstance(node)) continue
      if (node.type !== 'branch') continue

      const ownedGroups = groupsByOwner.value.get(node.id)
      if (!ownedGroups) continue
      rootNodes.push(...ownedGroups)
    }

    const { autoNodes, leftNode, rightNode } = pickNodesForAutoLayout(rootNodes)
    doAutoLayout(autoNodes, {
      leftNode,
      rightNode,
      virtualEdges: virtualEdges.get(0),
      cachedFindNode,
    })

    if (commitNow) {
      historyCommit()
    }
  }

  function doAutoLayout(
    autoNodes: Array<NodeInstance | GroupInstance>,
    extraOptions?: {
      leftNode?: NodeInstance
      rightNode?: NodeInstance
      virtualEdges?: DagreEdge[]
      cachedFindNode?: typeof findNode
    },
  ) {
    const { leftNode, rightNode, virtualEdges, cachedFindNode } = extraOptions || {}
    const leftGraphNode = leftNode ? (cachedFindNode ?? findNode)(leftNode.id) : undefined
    const rightGraphNode = rightNode ? (cachedFindNode ?? findNode)(rightNode.id) : undefined

    let dagreGraph: dagre.graphlib.Graph | undefined
    if (autoNodes.length > 0) {
      dagreGraph = new dagre.graphlib.Graph({ multigraph: true })
      dagreGraph.setGraph({
        rankdir: phase === 'request' ? 'LR' : 'RL',
        nodesep: nodeGap,
        edgesep: edgeGap,
        ranksep: rankGap,
      })

      const autoNodeIds = new Set()

      for (const node of autoNodes) {
        const graphNode = (cachedFindNode ?? findNode)(node.id)
        if (!graphNode) {
          console.warn(`Cannot find graph node '${node.id}' in ${phase} phase`)
          continue
        }

        autoNodeIds.add(node.id)
        if (isGroupInstance(node)) {
          // Try `dimensions` from the GroupInstance first
          dagreGraph!.setNode(node.id, node.dimensions ?? graphNode.dimensions)
        } else {
          dagreGraph!.setNode(node.id, graphNode.dimensions)
        }
      }

      for (const edge of edges.value) {
        if (!autoNodeIds.has(edge.source) || !autoNodeIds.has(edge.target)) continue
        dagreGraph.setEdge(edge.source, edge.target, { points: [] })
      }

      // Apply layout-tweaking virtual edges
      virtualEdges?.forEach((edge) => dagreGraph!.setEdge(edge, { points: [] }))

      // Layout
      dagre.layout(dagreGraph)
    }

    const boundingRects: Rect[] = []

    // Positions returned by Dagre are centered
    const normalizePosition = (node: DagreNode) => {
      return {
        x: node.x - node.width / 2,
        y: node.y - node.height / 2,
        width: node.width,
        height: node.height,
      }
    }

    if (autoNodes.length > 0) {
      if (!dagreGraph) {
        throw new Error('Expected dagreGraph to be initialized')
      }

      for (const node of autoNodes) {
        const dagreNode = dagreGraph.node(node.id)
        const position = normalizePosition(dagreNode)
        boundingRects.push(position)

        if (isGroupInstance(node)) {
          // moveGroup is not enough
          translateGroupTree(
            node.id,
            position,
            position.x + DK_BRANCH_GROUP_PADDING,
            position.y + DK_BRANCH_GROUP_PADDING,
          )
        } else {
          moveNode(node.id, { x: position.x, y: position.y }, false)
        }
      }
    }

    const centralRect = boundingRects.length > 0
      ? getBoundingRect(boundingRects)
      : { x: 0, y: 0, width: 0, height: 0 }
    const centralWidth = centralRect.width
    const centralHeight = centralRect.height
    const centralLeft = centralRect.x
    const centralRight = centralRect.x + centralRect.width

    // Try to place implicit nodes at both ends when there is much room
    // If horizontalSpace is 0, it means we do not have enough space
    const horizontalSpace = Math.max(
      0,
      Math.min(toValue(viewport?.width) ?? Number.POSITIVE_INFINITY, DEFAULT_VIEWPORT_WIDTH)
          - centralWidth
          - 2 * nodeGap
          - (leftGraphNode?.dimensions?.width ?? 0)
          - (rightGraphNode?.dimensions?.width ?? 0)
          - 2 * padding,
    )

    const centerY = centralRect.y + centralHeight / 2

    if (leftNode) {
      moveNode(leftNode.id, {
        x: centralLeft - nodeGap - horizontalSpace / 2 - (leftGraphNode?.dimensions?.width ?? 0),
        y: centerY - (leftGraphNode?.dimensions?.height ?? 0) / 2,
      }, false)
    }

    if (rightNode) {
      moveNode(rightNode.id, {
        x: centralRight + nodeGap + horizontalSpace / 2,
        y: centerY - (rightGraphNode?.dimensions?.height ?? 0) / 2,
      }, false)
    }
  }

  function pickNodesForAutoLayout(nodes: Array<NodeInstance | GroupInstance>) {
    let leftNode: NodeInstance | undefined
    let rightNode: NodeInstance | undefined
    const autoNodes: Array<NodeInstance | GroupInstance> = []

    for (const node of nodes) {
      if (isGroupInstance(node)) {
        autoNodes.push(node)
        continue
      }

      switch (node.name) {
        case 'request': {
          if (phase !== 'request') {
            throw new Error(`Unexpected request node in ${phase} phase`)
          }
          if (leftNode) {
            throw new Error('Duplicated request node in request phase')
          }
          leftNode = node
          break
        }
        case 'service_request': {
          if (phase !== 'request') {
            throw new Error(`Unexpected service_request node in ${phase} phase`)
          }
          if (rightNode) {
            throw new Error('Duplicated service_request node in request phase')
          }
          rightNode = node
          break
        }
        case 'service_response': {
          if (phase !== 'response') {
            throw new Error(`Unexpected service_response node in ${phase} phase`)
          }
          if (rightNode) {
            throw new Error('Duplicated service_response node in response phase')
          }
          rightNode = node
          break
        }
        case 'response': {
          if (phase !== 'response') {
            throw new Error(`Unexpected response node in ${phase} phase`)
          }
          if (leftNode) {
            throw new Error('Duplicated response node in response phase')
          }
          leftNode = node
          break
        }
        default: {
          autoNodes.push(node)
          break
        }
      }
    }

    return { autoNodes, leftNode, rightNode }
  }

  return { autoLayout }
}
