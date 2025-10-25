import dagre from '@dagrejs/dagre'
import { KUI_COLOR_BORDER_NEUTRAL, KUI_COLOR_BORDER_PRIMARY, KUI_COLOR_BORDER_PRIMARY_WEAK } from '@kong/design-tokens'
import { MarkerType, useVueFlow } from '@vue-flow/core'
import { createInjectionState } from '@vueuse/core'
import { computed, nextTick, toValue, watch } from 'vue'

import useI18n from '../../../../../composables/useI18n'
import { useToaster } from '../../../../../composables/useToaster'
import {
  DK_BRANCH_GROUP_PADDING,
  DK_FLOW_EDGE_Z_OFFSET,
  DK_FLOW_NODE_Z_OFFSET,
  DK_FLOW_Z_LAYER_STEP,
  DK_NODE_PROPERTIES_PANEL_WIDTH,
} from '../../constants'
import { createEdgeConnectionString, createNewConnectionString } from '../composables/helpers'
import { useBranchLayout } from '../composables/useBranchLayout'
import { useOptionalConfirm } from '../composables/useConflictConfirm'
import {
  DEFAULT_LAYOUT_OPTIONS,
  DEFAULT_VIEWPORT_WIDTH,
  SCROLL_DURATION,
} from '../constants'
import { isGroupInstance, isImplicitNode } from '../node/node'
import { useEditorStore } from './store'
import { parseGroupId } from './helpers'
import { useBranchDrop } from '../composables/useBranchDrop'
import { getBoundingRect } from '../composables/helpers'

import type { Node as DagreNode } from '@dagrejs/dagre'
import type { Connection, FitViewParams, Node, NodeSelectionChange, XYPosition } from '@vue-flow/core'
import type { MaybeRefOrGetter } from '@vueuse/core'

import type {
  EdgeId,
  EdgeInstance,
  FieldId,
  FlowEdge,
  GroupId,
  GroupInstance,
  NodeId,
  NodeInstance,
  NodePhase,
  Rect,
} from '../../types'
import type { ConnectionString } from '../modal/ConflictModal.vue'

/**
 * Parse a handle string in the format of "inputs@fieldId" or "outputs@fieldId".
 * This function is placed here because it is only used in this file.
 */
function parseHandle(handle: string): { io: 'input' | 'output', field?: FieldId } | undefined {
  const parsed = handle.match(/^(input|output)(?:s@(.*))?$/)
  if (!parsed) return undefined

  return {
    io: parsed[1] as 'input' | 'output',
    field: parsed[2] as FieldId | undefined,
  }
}

const BORDER_COLORS: Record<EdgeState, string> = {
  default: KUI_COLOR_BORDER_NEUTRAL,
  hover: KUI_COLOR_BORDER_PRIMARY_WEAK,
  selected: KUI_COLOR_BORDER_PRIMARY,
}

type EdgeState = 'default' | 'hover' | 'selected'
let selectedEdgeId: EdgeId | undefined
let hoverEdgeId: EdgeId | undefined

function updateEdgeStyle(edge: FlowEdge): FlowEdge {
  const state = edge.id === selectedEdgeId ? 'selected' : edge.id === hoverEdgeId ? 'hover' : 'default'

  const color = BORDER_COLORS[state]
  const { markerEnd } = edge

  const marker = typeof markerEnd === 'object'
    ? { ...markerEnd, color }
    : { type: markerEnd as MarkerType, color }

  const baseZIndex = edge.zIndex ?? 0
  const zIndex = state === 'selected'
    ? baseZIndex + 2
    : state === 'hover'
      ? baseZIndex + 1
      : baseZIndex

  return {
    ...edge,
    style: {
      ...edge.style,
      stroke: color,
      strokeWidth: state === 'selected' ? 1.5 : undefined,
    },
    markerEnd: marker,
    zIndex,
  }
}

export interface LayoutOptions {
  /**
   * The viewport (unscaled width and height) of the canvas.
   * Helpful when placing implicit nodes while performing auto layout.
   */
  viewport?: {
    width: MaybeRefOrGetter<number>
    height: MaybeRefOrGetter<number>
  }

  /**
   * The padding in pixels around the bounding box of all the nodes.
   *
   * See {@link DEFAULT_LAYOUT_OPTIONS.padding} for the default value.
   */
  padding?: number

  /**
   * The gaps in pixels between nodes, edges, and ranks.
   *
   * See {@link DEFAULT_LAYOUT_OPTIONS.gaps} for the default values.
   */
  gaps?: {
    nodes?: number
    edges?: number
    ranks?: number
  }
}

export interface UseFlowOptions {
  phase: NodePhase
  flowId?: string
  layoutOptions: LayoutOptions
  readonly?: boolean
}

const [provideFlowStore, useOptionalFlowStore] = createInjectionState(
  function(options: UseFlowOptions) {
    const { phase, flowId, layoutOptions, readonly } = options
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

    const vueFlowStore = useVueFlow(flowId)
    const editorStore = useEditorStore()
    // Readonly flow does not need confirmation modals
    const confirm = useOptionalConfirm()
    const toaster = useToaster()
    const { i18n: { t } } = useI18n()

    const {
      findNode,
      fitView: flowFitView,
      deleteKeyCode,
      onNodeDrag,
      onNodeDragStop,
      onConnect,
      onNodesChange,
      onEdgesChange,
      onEdgeUpdate,
      onEdgeMouseEnter,
      onEdgeMouseLeave,
      getNodes,
      setNodes,
      setEdges,
      addSelectedNodes,
      screenToFlowCoordinate,
    } = vueFlowStore

    // VueFlow has a default delete key code of 'Backspace',
    // but we want to also support 'Delete'.
    deleteKeyCode.value = ['Delete', 'Backspace']

    const {
      state,
      commit: historyCommit,
      moveNode,
      selectNode: selectStoreNode,
      removeNode,
      getNodeById,
      connectEdge,
      disconnectEdge,
      getInEdgesByNodeId,
      branchGroups,
      commit,
      reset,
      groupMapById,
    } = editorStore
    const { isGroupId } = branchGroups

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

    const {
      groupsByOwner,
      memberGroupMap,
      groupNodes,
      branchEdges,
      isBranchEdgeId,
      updateGroupLayout,
      translateGroupTree,
      updateDragging,
      getNodeDepth,
      maxGroupDepth,
      waitForLayoutFlush,
    } = useBranchLayout({
      phase,
      readonly,
      flowId,
    })

    const {
      activeGroupId,
      start: startGroupDrag,
      updateActiveGroup,
      finish: finishGroupDrag,
    } = useBranchDrop({
      phase,
      groupMapById,
      getNodeDepth,
    })

    const nodes = computed(() =>
      state.value.nodes
        .filter((node) => node.phase === phase && !node.hidden)
        .map<Node<NodeInstance>>((node) => {
          const parentGroup = memberGroupMap.value.get(node.id)
          const parentPosition = parentGroup?.position
          const parentDimensions = parentGroup?.dimensions
          const position = parentGroup && parentPosition && parentDimensions
            ? {
              x: node.position.x - parentPosition.x,
              y: node.position.y - parentPosition.y,
            }
            : node.position

          const depth = getNodeDepth(node.id)
          const parentResolved = !!(parentGroup && parentPosition && parentDimensions)
          const zLayerDepth = (parentResolved ? depth : 0) + maxGroupDepth.value + 1

          return {
            id: node.id,
            type: 'flow',
            position,
            data: node,
            deletable: !isImplicitNode(node),
            parentNode: parentResolved ? parentGroup.id : undefined,
            zIndex: zLayerDepth * DK_FLOW_Z_LAYER_STEP + DK_FLOW_NODE_Z_OFFSET,
          }
        }),
    )

    const configEdges = computed<FlowEdge[]>(() =>
      state.value.edges
        .filter((edge) => edgeInPhase(edge, phase))
        .filter((edge) => {
          const sourceNode = getNodeById(edge.source)
          const targetNode = getNodeById(edge.target)
          return !sourceNode?.hidden && !targetNode?.hidden
        })
        .map<FlowEdge>((edge) => {
          const sourceNode = getNodeById(edge.source)
          const targetNode = getNodeById(edge.target)
          if (!sourceNode) {
            throw new Error(`Missing source node "${edge.source}" for edge "${edge.id}" in phase "${phase}"`)
          } else if (!targetNode) {
            throw new Error(`Missing target node "${edge.target}" for edge "${edge.id}" in phase "${phase}"`)
          }

          const depth = Math.max(getNodeDepth(edge.source), getNodeDepth(edge.target)) + maxGroupDepth.value + 1

          return updateEdgeStyle({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceField ? `outputs@${edge.sourceField}` : 'output',
            targetHandle: edge.targetField ? `inputs@${edge.targetField}` : 'input',
            markerEnd: MarkerType.ArrowClosed,
            data: edge,
            updatable: !readonly,
            zIndex: depth * DK_FLOW_Z_LAYER_STEP + DK_FLOW_EDGE_Z_OFFSET,
          })
        }),
    )

    const edges = computed(() => [
      ...branchEdges.value,
      ...configEdges.value,
    ])

    // Moved away from VueFlow's `:nodes` and `:edges` props because
    // they have race conditions while being updated simultaneously.
    watch([nodes, groupNodes, edges], ([newNodes, newGroupNodes, newEdges]) => {
      setNodes([...newGroupNodes, ...newNodes])
      setEdges(newEdges)
    }, { immediate: true }) // As `nodes` and `edges` are computed refs, it would be okay without `deep: true`

    const fitViewParams = computed<FitViewParams>(() => {
      return {
        // Padding in VueFlow is a ratio
        padding: padding / Math.max(toValue(viewport?.width) ?? 0, toValue(viewport?.height) ?? 0),
        // maxZoom and minZoom come from the VueFlow store
      }
    })

    async function handleConnect({ source, sourceHandle, target, targetHandle }: Connection) {
      if (!sourceHandle || !targetHandle) return

      const parsedSource = parseHandle(sourceHandle)
      const parsedTarget = parseHandle(targetHandle)

      if (
        (parsedSource?.io === 'input' || parsedTarget?.io === 'output')
        || (sourceHandle === 'output' && targetHandle === 'output')
      )
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
        ? parsedTarget?.field
          ? targetIncomingEdges.filter(edge => edge.targetField === parsedTarget.field)
          : targetIncomingEdges.filter(edge => !!edge.targetField)
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

      if (!connectionSuccess) {
        // Reset on failure
        reset()
        toaster({
          message: t('plugins.free-form.datakit.flow_editor.error.invalid_connection'),
          appearance: 'danger',
        })
        return
      }

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

      if (confirmToSwitch || confirmToOverride) {
        if (!confirm) {
          // The code here should not be reachable in a readonly flow
          reset() // In case
          throw new Error('Expected confirm modal to be provided here when reachable')
        }

        const isConfirmed = await confirm(
          confirmToSwitch
            ? t('plugins.free-form.datakit.flow_editor.confirm.message.switch')
            : t('plugins.free-form.datakit.flow_editor.confirm.message.override'),
          addedConnections,
          removedConnections,
        )
        if (!isConfirmed) {
          // Reset if changes are not confirmed
          reset()
          return
        }
      }

      // Commit new changes
      commit()
    }

    onConnect(handleConnect)

    // Because `onNodesChange` and `onEdgesChange` are called separately, and the order is not
    // guaranteed, we need some mechanism to batch them together in the same tick, so that they only
    // trigger `commit()` once at the end whenever there are removals.
    let postRemovalScheduled = false
    const onPostRemoval = () => {
      if (!postRemovalScheduled)
        return

      postRemovalScheduled = false
      commit()
    }

    // Only triggered by canvas-originated changes
    onNodesChange((changes) => {
      const selectionChanges = changes.filter((change): change is NodeSelectionChange => change.type === 'select')

      selectionChanges
        .filter((change) => !isGroupId(change.id))
        // deselected changes come first
        .sort((a, b) => (a.selected === b.selected ? 0 : a.selected ? 1 : -1))
        .forEach((change) => {
          selectStoreNode(change.selected ? (change.id as NodeId) : undefined)
        })

      let schedulePostRemoval = false
      changes.forEach((change) => {
        if (change.type === 'remove') {
          if (isGroupId(change.id)) {
            return
          }
          // !! ATTENTION !!
          // We assume `onNodesChange` is only triggered when user removes nodes from the canvas.
          // Removals originated from the node panel (form) does not trigger this, because they
          // manipulate the state directly.
          schedulePostRemoval = true
          removeNode(change.id as NodeId, false) // Hold off committing until sync
        }
      })

      if (schedulePostRemoval && !postRemovalScheduled) {
        postRemovalScheduled = true
        // Schedule for the same tick
        queueMicrotask(onPostRemoval)
      }
    })

    onNodeDrag(({ node, event }) => {
      if (!node) return

      if (isGroupId(node.id)) {
        const groupId = node.id as GroupId
        updateDragging(groupId)
        updateActiveGroup(undefined)
        const group = groupMapById.value.get(groupId)
        if (!group) return

        const previousPosition = group.position ?? { ...node.position }
        const deltaX = node.position.x - previousPosition.x
        const deltaY = node.position.y - previousPosition.y

        translateGroupTree(groupId, node.position, deltaX, deltaY)

        // Update parent group layout in real-time when dragging nested groups
        // This allows the parent group to expand/shrink as child group moves
        const parentGroup = memberGroupMap.value.get(group.ownerId)
        if (parentGroup) {
          updateGroupLayout(parentGroup.id, false)
        }

        return
      }

      const nodeId = node.id as NodeId
      startGroupDrag('canvas')
      updateDragging(nodeId)
      const parentId = node.parentNode

      let absolutePosition: XYPosition = { ...node.position }

      if (parentId && isGroupId(parentId)) {
        const parentGroup = groupMapById.value.get(parentId as GroupId)
        if (parentGroup?.position) {
          absolutePosition = {
            x: parentGroup.position.x + node.position.x,
            y: parentGroup.position.y + node.position.y,
          }
        }
      }

      moveNode(nodeId, absolutePosition, false)

      const rect = {
        x: absolutePosition.x,
        y: absolutePosition.y,
        width: node.dimensions?.width ?? 0,
        height: node.dimensions?.height ?? 0,
      }
      const pointer = event && 'clientX' in event
        ? screenToFlowCoordinate({ x: event.clientX, y: event.clientY })
        : undefined
      updateActiveGroup(pointer ?? rect)

      // Update group layout in real-time when dragging member nodes
      // This allows the group to expand/shrink as members move
      const owningGroupId = parentId && isGroupId(parentId)
        ? parentId as GroupId
        : memberGroupMap.value.get(nodeId)?.id

      if (owningGroupId) {
        updateGroupLayout(owningGroupId, false)
      }
    })

    onNodeDragStop(async ({ node }) => {
      if (!node) return

      if (isGroupId(node.id)) {
        updateDragging()
        historyCommit()
        return
      }

      const nodeId = node.id as NodeId
      updateDragging()
      const parentId = node.parentNode

      let absolutePosition: XYPosition = { ...node.position }

      if (parentId && isGroupId(parentId)) {
        const parentGroup = groupMapById.value.get(parentId as GroupId)
        if (parentGroup?.position) {
          absolutePosition = {
            x: parentGroup.position.x + node.position.x,
            y: parentGroup.position.y + node.position.y,
          }
        }
      }

      moveNode(nodeId, absolutePosition, false)

      const owningGroupId = parentId && isGroupId(parentId)
        ? parentId as GroupId
        : memberGroupMap.value.get(nodeId)?.id

      if (owningGroupId) {
        updateGroupLayout(owningGroupId, false)
      }

      attachNodeToActiveGroup(nodeId)
      finishGroupDrag()

      historyCommit()
    })

    // Only triggered by canvas-originated changes
    onEdgesChange((changes) => {
      const selectionChanges = changes.filter((change) => change.type === 'select')
      selectionChanges
        // deselected changes come first
        .sort((a, b) => (a.selected === b.selected ? 0 : a.selected ? 1 : -1))
        .forEach((change) => {
          if (isBranchEdgeId(change.id)) return
          selectedEdgeId = change.selected ? change.id as EdgeId : undefined

          setEdges((edges) => edges.map((edge) => {
            if (edge.id !== change.id || !edge.markerEnd) {
              return edge
            }

            return updateEdgeStyle({
              ...edge,
              zIndex: change.selected ? 1 : undefined,
            })
          }))
        })

      let schedulePostRemoval = false
      changes.forEach((change) => {
        if (change.type === 'remove') {
          if (isBranchEdgeId(change.id)) return
          // !! ATTENTION !!
          // We assume `onEdgesChange` is only triggered when user removes edges from the canvas.
          // Removals originated from the node panel (form) does not trigger this, because they
          // manipulate the state directly.
          schedulePostRemoval = true
          disconnectEdge(change.id as EdgeId, false) // Hold off committing until sync
        }
      })

      if (schedulePostRemoval && !postRemovalScheduled) {
        postRemovalScheduled = true
        // Schedule for the same tick
        queueMicrotask(onPostRemoval)
      }
    })

    onEdgeMouseEnter(({ edge: edgeEnter }) => {
      if (isBranchEdgeId(edgeEnter.id)) return
      hoverEdgeId = edgeEnter.id as EdgeId

      setEdges((edges) => edges.map((edge) => {
        if (edge.id !== edgeEnter.id) return edge
        return updateEdgeStyle(edge)
      }))
    })

    onEdgeMouseLeave(({ edge: edgeLeave }) => {
      if (isBranchEdgeId(edgeLeave.id)) return
      hoverEdgeId = undefined

      setEdges((edges) => edges.map((edge) => {
        if (edge.id !== edgeLeave.id) return edge
        return updateEdgeStyle(edge)
      }))
    })

    onEdgeUpdate(({ edge, connection }) => {
      if (isBranchEdgeId(edge.id)) return
      disconnectEdge(edge.id as EdgeId, false)
      handleConnect(connection)
    })

    function doAutoLayout(
      autoNodes: Array<NodeInstance | GroupInstance>,
      leftNode?: NodeInstance,
      rightNode?: NodeInstance,
    ) {
      const leftGraphNode = leftNode ? findNode(leftNode.id) : undefined
      const rightGraphNode = rightNode ? findNode(rightNode.id) : undefined

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
          const graphNode = findNode(node.id)
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

      const centralRect = getBoundingRect(boundingRects) ?? { x: 0, y: 0, width: 0, height: 0 }
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

    async function autoLayout(commitNow = true) {
      const nodeMap = new Map<string, NodeInstance>(
        nodes.value.map((node) => [node.id, node.data!]),
      )

      // Bottom-up layout
      const sortedGroups = state.value.groups.toSorted((a, b) => getNodeDepth(b.ownerId) - getNodeDepth(a.ownerId))
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
      doAutoLayout(autoNodes, leftNode, rightNode)

      if (commitNow) {
        historyCommit()
      }
    }

    function fitView(paramOverrides?: Partial<FitViewParams>) {
      flowFitView({
        ...fitViewParams.value,
        ...paramOverrides,
      })
    }

    /**
     * Select a node in the flow editor. This operation ensures that the store state
     * and the internal state of VueFlow are in sync.
     */
    async function selectNode(nodeId?: NodeId) {
      selectStoreNode(nodeId)

      // Wait until rendering is complete before syncing with VueFlow's internal
      // selection state. Use setTimeout to ensure all microtasks have finished.
      return new Promise<void>((resolve) =>
        setTimeout(() => {
          const selectedNode = findNode(nodeId)
          addSelectedNodes(selectedNode ? [selectedNode] : [])
          resolve()
        }, 0),
      )
    }

    /**
     * Calculate the position to place a node to the right of a reference node.
     */
    function placeToRight(nodeId: NodeId): XYPosition {
      const nodes = getNodes.value.filter(({ type }) => type !== 'group')

      const refNode = nodes.find(({ id }) => id === nodeId)
      if (!refNode) throw new Error(`Node ${nodeId} not found`)

      const {
        position: { x: refX, y: refY },
        dimensions: { width: refWidth, height: refHeight },
      } = refNode

      const rowTop = refY
      const rowBottom = refY + refHeight

      const intervals = nodes
        .filter(({ id }) => id !== nodeId)
        .filter(({ position: { y }, dimensions: { height } }) => {
          return y < rowBottom && y + height > rowTop
        })
        .map(({ position: { x }, dimensions: { width } }) => {
          return { left: x, right: x + width }
        })
        .sort((a, b) => a.left - b.left)

      let cursorX = refX + refWidth + nodeGap

      for (const { left, right } of intervals) {
        if (right <= cursorX) continue
        if (cursorX + refWidth <= left) return { x: cursorX, y: rowTop }
        cursorX = Math.max(cursorX, right) + nodeGap
      }

      return { x: cursorX, y: rowTop }
    }

    /**
     * Scroll the viewport to the right to reveal a node.
     */
    function scrollRightToReveal(nodeId?: NodeId) {
      if (!nodeId) return

      const target = findNode(nodeId)
      if (!target) throw new Error(`Node ${nodeId} not found`)

      const {
        position: { x: targetLeft },
        dimensions: { width: targetWidth },
      } = target

      const targetRight = targetLeft + targetWidth

      const { viewport, dimensions, setViewport } = vueFlowStore

      const { x: translateX, y: translateY, zoom } = viewport.value
      const { width: viewportWidth } = dimensions.value

      const nodeLeftScreen = targetLeft * zoom + translateX
      const nodeRightScreen = targetRight * zoom + translateX

      const visibleRightScreen = viewportWidth - DK_NODE_PROPERTIES_PANEL_WIDTH - nodeGap

      if (nodeRightScreen <= visibleRightScreen) return

      let deltaScreenX = visibleRightScreen - nodeRightScreen
      if (nodeLeftScreen + deltaScreenX < 0) {
        deltaScreenX = -nodeLeftScreen
      }

      if (deltaScreenX === 0) return

      setViewport(
        { x: translateX + deltaScreenX, y: translateY, zoom },
        { duration: SCROLL_DURATION },
      )
    }

    function attachNodeToActiveGroup(nodeId: NodeId) {
      if (!activeGroupId.value) return false
      const { nodeId: ownerId, branch } = parseGroupId(activeGroupId.value)
      const changed = branchGroups.addMember(ownerId, branch, nodeId, { commit: false })
      updateActiveGroup(undefined)
      return changed
    }

    const groupDrop = {
      activeGroupId,
      beginPanelDrag: () => startGroupDrag('panel'),
      endPanelDrag: finishGroupDrag,
      updateActiveGroup,
      attachNodeToActiveGroup,
    }

    return {
      vueFlowStore,
      editorStore,

      readonly,

      nodes,
      edges,

      selectNode,
      autoLayout,
      placeToRight,
      scrollRightToReveal,

      fitViewParams,
      fitView,
      groupDrop,
    }
  },
)

export { provideFlowStore, useOptionalFlowStore }

export function useFlowStore() {
  const store = useOptionalFlowStore()
  if (!store) {
    throw new Error('FlowStore is not provided. Ensure you are using provideFlowStore in a parent component.')
  }
  return store
}
