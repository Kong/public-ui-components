import type { Node as DagreNode } from '@dagrejs/dagre'
import type { EdgeData, EdgeId, EdgeInstance, FieldId, NodeId, NodeInstance, NodePhase } from '../../types'

import dagre from '@dagrejs/dagre'
import { MarkerType, useVueFlow, type Edge, type Node } from '@vue-flow/core'
import { computed, nextTick, toRaw } from 'vue'

import { AUTO_LAYOUT_DEFAULT_OPTIONS } from '../constants'
import { isImplicitNode } from '../node/node'
import { useEditorStore } from '../store/store'
import { useConfirm } from './useConflictConnectionConfirm'
import useI18n from '../../../../../composables/useI18n'
import type { ConnectionString } from '../modal/ConflictConnectionConfirmModal.vue'
import { createEdgeConnectionString, createNewConnectionString } from './helpers'
import { useToaster } from '../../../../../composables/useToaster'

/**
 * Parse a handle string in the format of "inputs@fieldId" or "outputs@fieldId".
 * This function is placed here because it is only used in this file.
 */
const parseHandle = (handle: string): { io: 'input' | 'output', field: FieldId } | undefined => {
  const parsed = handle.match(/^(input|output)s@(.*)$/)
  if (!parsed) return undefined

  return {
    io: parsed[1] as 'input' | 'output',
    field: parsed[2] as FieldId,
  }
}

export interface AutoLayoutOptions {
  boundingRect: DOMRect
  padding?: number
  nodeGap?: number
  edgeGap?: number
  rankGap?: number
}

export default function useFlow(phase: NodePhase, flowId?: string) {
  const vueFlowStore = useVueFlow(flowId)
  const editorStore = useEditorStore()
  const confirm = useConfirm()
  const toaster = useToaster()
  const { i18n: { t } } = useI18n()

  const {
    findNode,
    fitView,
    onNodeClick,
    onNodeDragStop,
    onEdgeClick,
    onConnect,
    onNodesChange,
    onEdgesChange,
    deleteKeyCode,
  } = vueFlowStore

  // VueFlow has a default delete key code of 'Backspace',
  // but we want to also support 'Delete'.
  deleteKeyCode.value = ['Delete', 'Backspace']

  const {
    state,
    commit: historyCommit,
    moveNode,
    selectNode,
    removeNode,
    getNodeById,
    connectEdge,
    disconnectEdge,
    getInEdgesByNodeId,
    commit,
    undo,
  } = editorStore

  function edgeInPhase(edge: EdgeInstance, phase: NodePhase) {
    const sourceNode = getNodeById(edge.source)
    const targetNode = getNodeById(edge.target)
    return !!(
      sourceNode &&
        targetNode &&
        sourceNode.phase === phase &&
        targetNode.phase === phase
    )
  }

  const nodes = computed(() =>
    state.value.nodes
      .filter((node) => node.phase === phase)
      .map<Node<NodeInstance>>((node) => ({
        id: node.id,
        type: 'flow',
        position: node.position,
        data: node,
        deletable: !isImplicitNode(node),
      })),
  )

  const edges = computed(() =>
    state.value.edges
      .filter((edge) => edgeInPhase(edge, phase))
      .map<Edge<EdgeData>>((edge) => {
        const sourceNode = getNodeById(edge.source)
        const targetNode = getNodeById(edge.target)
        if (!sourceNode) {
          throw new Error(`Missing source node "${edge.source}" for edge "${edge.id}" in phase "${phase}"`)
        } else if (!targetNode) {
          throw new Error(`Missing target node "${edge.target}" for edge "${edge.id}" in phase "${phase}"`)
        }

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceField ? `outputs@${edge.sourceField}` : 'output',
          targetHandle: edge.targetField ? `inputs@${edge.targetField}` : 'input',
          markerEnd: MarkerType.ArrowClosed,
          data: edge,
        }
      }),
  )

  onNodeClick(({ node }) => {
    // TODO(Makito): Remove these in the future
    console.debug('[useFlow] onNodeClick', toRaw(node))
  })

  onEdgeClick(({ edge }) => {
    // TODO(Makito): Remove these in the future
    console.debug('[useFlow] onEdgeClick', toRaw(edge))
  })

  onConnect(async ({ source, sourceHandle, target, targetHandle }) => {
    console.debug('[useFlow] onConnect', { source, sourceHandle, target, targetHandle })
    if (!sourceHandle || !targetHandle) return

    const parsedSource = parseHandle(sourceHandle)
    const parsedTarget = parseHandle(targetHandle)

    if (parsedSource?.io === 'input' || parsedTarget?.io === 'output')
      return // Only connect output to input

    // Get all incoming edges for the target node
    const targetIncomingEdges = getInEdgesByNodeId(target as NodeId)
    let confirmToSwitch = false
    let confirmToOverride = false
    const addedConnections: ConnectionString[] = []
    const removedConnections: ConnectionString[] = []

    // Determine which edges need to be removed based on connection type
    // For `input` connections, we need to disconnect the input`s` edges
    // For input`s` connections, we need to disconnect the `input` edges
    const edgesToDisconnect = parsedTarget?.io === 'input'
      ? targetIncomingEdges.filter(edge => !edge.targetField)
      : targetIncomingEdges.filter(edge => !!edge.targetField)

    // Disconnect conflicting edges if any exist
    if (edgesToDisconnect.length > 0) {
      confirmToSwitch = true
      edgesToDisconnect.forEach(edge => {
        removedConnections.push(createEdgeConnectionString(edge, getNodeById))
        disconnectEdge(edge.id, false)
      })
    }

    // Handle conflict edge conflicts based on the opposite connection type
    // This ensures we clean up all incompatible connections
    const conflictEdgesToDisconnect = parsedTarget?.io === 'input'
      ? targetIncomingEdges.filter(edge => edge.targetField === parsedTarget.field)
      : targetIncomingEdges.filter(edge => !edge.targetField)

    if (conflictEdgesToDisconnect.length > 0) {
      const hasConnected = conflictEdgesToDisconnect.some(edge => {
        return edge.source === source
          && edge.target === target
          && edge.targetField === parsedTarget?.field
          && edge.sourceField === parsedSource?.field
      })

      if (hasConnected) {
        return // The connection already exists, do nothing
      }

      confirmToOverride = true
      conflictEdgesToDisconnect.forEach(edge => {
        removedConnections.push(createEdgeConnectionString(edge, getNodeById))
        disconnectEdge(edge.id, false)
      })
    }

    // Attempt to create the new connection
    const connectionSuccess = connectEdge({
      source: source as NodeId,
      sourceField: parsedSource?.field,
      target: target as NodeId,
      targetField: parsedTarget?.field,
    }, false)

    // Add the new connection to the display list
    addedConnections.push(
      createNewConnectionString(
        source as NodeId,
        parsedSource?.field,
        target as NodeId,
        parsedTarget?.field,
        getNodeById,
      ),
    )

    commit()
    if (connectionSuccess) {
      // Confirm the changes, undo if users not confirmed
      if (confirmToSwitch || confirmToOverride) {
        const isConfirmed = await confirm(
          confirmToSwitch
            ? t('plugins.free-form.datakit.flow_editor.confirm.message.switch')
            : t('plugins.free-form.datakit.flow_editor.confirm.message.override'),
          addedConnections,
          removedConnections,
        )
        if (!isConfirmed) {
          undo()
        }
      }
    } else {
      undo()
      toaster({
        message: t('plugins.free-form.datakit.flow_editor.error.invalid_connection'),
        appearance: 'danger',
      })
    }
  })

  // Only triggered by canvas-originated changes
  onNodesChange((changes) => {
    changes
      .filter((change) => change.type === 'select')
      // deselected changes come first
      .sort((a, b) => (a.selected === b.selected ? 0 : a.selected ? 1 : -1))
      .forEach((change) => {
        selectNode(change.selected ? (change.id as NodeId) : undefined)
      })

    changes.forEach((change) => {
      if (change.type === 'remove') {
        removeNode(change.id as NodeId, true)
      }
    })
  })

  onNodeDragStop(({ node }) => {
    if (!node) return

    // Update the node position in the store
    moveNode(node.id as NodeId, node.position)
  })

  // Only triggered by canvas-originated changes
  onEdgesChange((changes) => {
    changes.forEach((change) => {
      if (change.type === 'remove') {
        disconnectEdge(change.id as EdgeId, true)
      }
    })
  })

  function autoLayout(options: AutoLayoutOptions) {
    const {
      boundingRect,
      padding = AUTO_LAYOUT_DEFAULT_OPTIONS.padding,
      nodeGap = AUTO_LAYOUT_DEFAULT_OPTIONS.nodeGap,
      edgeGap = AUTO_LAYOUT_DEFAULT_OPTIONS.edgeGap,
      rankGap = AUTO_LAYOUT_DEFAULT_OPTIONS.rankGap,
    } = options

    let leftNode: Node<NodeInstance> | undefined
    let rightNode: Node<NodeInstance> | undefined
    const configNodes: Array<Node<NodeInstance>> = []

    /**
     * Check for implicit nodes in the current phase. If the node is an implicit node,
     * it will be assigned to either leftNode or rightNode based on its type.
     *
     * @param node Node to check
     * @return Whether the node is an implicit node or not
     */
    const checkImplicitNode = (node: Node<NodeInstance>): boolean => {
      switch (node.data!.name) {
        case 'request': {
          if (phase !== 'request') {
            throw new Error(`Unexpected request node in ${phase} phase`)
          }
          if (leftNode) {
            throw new Error('Duplicated request node in request phase')
          }
          leftNode = node
          return true
        }
        case 'service_request': {
          if (phase !== 'request') {
            throw new Error(`Unexpected service_request node in ${phase} phase`)
          }
          if (rightNode) {
            throw new Error('Duplicated service_request node in request phase')
          }
          rightNode = node
          return true
        }
        case 'service_response': {
          if (phase !== 'response') {
            throw new Error(`Unexpected service_response node in ${phase} phase`)
          }
          if (rightNode) {
            throw new Error('Duplicated service_response node in response phase')
          }
          rightNode = node
          return true
        }
        case 'response': {
          if (phase !== 'response') {
            throw new Error(`Unexpected response node in ${phase} phase`)
          }
          if (leftNode) {
            throw new Error('Duplicated response node in response phase')
          }
          leftNode = node
          return true
        }
        default: {
          configNodes.push(node)
          return false
        }
      }
    }

    const dagreGraph = new dagre.graphlib.Graph({ multigraph: true })
    dagreGraph.setGraph({
      rankdir: phase === 'request' ? 'LR' : 'RL',
      nodesep: nodeGap,
      edgesep: edgeGap,
      ranksep: rankGap,
    })

    for (const node of nodes.value) {
      if (checkImplicitNode(node)) {
        // Skip auto-layout by Dagre for implicit nodes
        continue
      }

      // Only run for config nodes
      const graphNode = findNode(node.id)
      if (!graphNode) {
        throw new Error(`Node ${node.id} is missing from the graph in ${phase} phase`)
      }

      dagreGraph.setNode(node.id, {
        width: graphNode.dimensions.width,
        height: graphNode.dimensions.height,
      })
    }

    if (!leftNode || !rightNode) {
      throw new Error(`One or more implicit nodes are missing from ${phase} phase`)
    }

    const leftGraphNode = findNode(leftNode.id)
    const rightGraphNode = findNode(rightNode.id)
    if (!leftGraphNode || !rightGraphNode) {
      throw new Error(`One or more implicit nodes are missing from the graph in ${phase} phase`)
    }

    if (configNodes.length === 0) {
      const centerY = boundingRect.height / 2

      moveNode(leftNode.data!.id, {
        x: padding,
        y: centerY - leftGraphNode.dimensions.height / 2,
      }, false)

      moveNode(rightNode.data!.id, {
        x: boundingRect.width - padding - rightGraphNode.dimensions.width,
        y: centerY - rightGraphNode.dimensions.height / 2,
      }, false)

      // No need to call dagre.layout()
    } else {
      const implicitIds = new Set([leftNode.id, rightNode.id])
      for (const edge of edges.value) {
        if (!implicitIds.has(edge.source) && !implicitIds.has(edge.target)) {
          dagreGraph.setEdge(edge.source, edge.target, { points: [] })
        }
      }

      // Layout
      dagre.layout(dagreGraph)

      const configBoundingRect = {
        x1: Number.POSITIVE_INFINITY,
        y1: Number.POSITIVE_INFINITY,
        x2: Number.NEGATIVE_INFINITY,
        y2: Number.NEGATIVE_INFINITY,
      }
      const updateConfigBoundingRect = (node: { x: number, y: number, width: number, height: number }) => {
        configBoundingRect.x1 = Math.min(configBoundingRect.x1, node.x)
        configBoundingRect.y1 = Math.min(configBoundingRect.y1, node.y)
        configBoundingRect.x2 = Math.max(configBoundingRect.x2, node.x + node.width)
        configBoundingRect.y2 = Math.max(configBoundingRect.y2, node.y + node.height)
      }

      // Positions returned by Dagre are centered
      const normalizePosition = (node: DagreNode) => {
        return {
          x: node.x - node.width / 2,
          y: node.y - node.height / 2,
          width: node.width,
          height: node.height,
        }
      }

      for (const node of configNodes) {
        const dagreNode = dagreGraph.node(node.id)
        const normalizedPosition = normalizePosition(dagreNode)
        updateConfigBoundingRect(normalizedPosition)
        moveNode(node.data!.id, { x: normalizedPosition.x, y: normalizedPosition.y }, false)
      }

      const leftGraphNode = findNode(leftNode.id)
      const rightGraphNode = findNode(rightNode.id)
      if (!leftGraphNode || !rightGraphNode) {
        throw new Error(`One or more implicit nodes are missing from the graph in ${phase} phase`)
      }

      // TODO(Makito): Better positioning for implicit nodes

      const centerY = configBoundingRect.y1 + (configBoundingRect.y2 - configBoundingRect.y1) / 2

      moveNode(leftNode.data!.id, {
        x: configBoundingRect.x1 - (leftGraphNode.dimensions.width + nodeGap),
        y: centerY - leftGraphNode.dimensions.height / 2,
      }, false)

      moveNode(rightNode.data!.id, {
        x: configBoundingRect.x2 + nodeGap,
        y: centerY - rightGraphNode.dimensions.height / 2,
      }, false)
    }

    historyCommit()

    nextTick(() => {
      fitView()
    })
  }

  return {
    vueFlowStore,
    editorStore,

    nodes,
    edges,

    autoLayout,
  }
}
