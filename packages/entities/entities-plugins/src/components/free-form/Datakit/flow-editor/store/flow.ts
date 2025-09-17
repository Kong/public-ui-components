import type { Node as DagreNode } from '@dagrejs/dagre'
import type { Connection, Edge, FitViewParams, Node, Rect, XYPosition } from '@vue-flow/core'
import type { MaybeRefOrGetter } from '@vueuse/core'

import type { EdgeData, EdgeId, EdgeInstance, FieldId, NodeId, NodeInstance, NodePhase } from '../../types'
import type { ConnectionString } from '../modal/ConflictModal.vue'

import dagre from '@dagrejs/dagre'
import { MarkerType, useVueFlow } from '@vue-flow/core'
import { createInjectionState } from '@vueuse/core'
import { computed, toValue, watch } from 'vue'

import { KUI_COLOR_BORDER_NEUTRAL, KUI_COLOR_BORDER_PRIMARY, KUI_COLOR_BORDER_PRIMARY_WEAK } from '@kong/design-tokens'
import useI18n from '../../../../../composables/useI18n'
import { useToaster } from '../../../../../composables/useToaster'
import { DK_NODE_PROPERTIES_PANEL_WIDTH } from '../../constants'
import { createEdgeConnectionString, createNewConnectionString } from '../composables/helpers'
import { useOptionalConfirm } from '../composables/useConflictConfirm'
import { DEFAULT_LAYOUT_OPTIONS, DEFAULT_VIEWPORT_WIDTH, SCROLL_DURATION } from '../constants'
import { isImplicitNode } from '../node/node'
import { useEditorStore } from './store'

/**
 * Parse a handle string in the format of "inputs@fieldId" or "outputs@fieldId".
 * This function is placed here because it is only used in this file.
 */
function parseHandle(handle: string): { io: 'input' | 'output', field: FieldId } | undefined {
  const parsed = handle.match(/^(input|output)s@(.*)$/)
  if (!parsed) return undefined

  return {
    io: parsed[1] as 'input' | 'output',
    field: parsed[2] as FieldId,
  }
}

/**
 * A helper function to create a bounding box around nodes.
 */
function createWrapper(): [typeof wrap, typeof copy] {
  const bounding = {
    x1: Number.POSITIVE_INFINITY,
    y1: Number.POSITIVE_INFINITY,
    x2: Number.NEGATIVE_INFINITY,
    y2: Number.NEGATIVE_INFINITY,
  }

  const wrap = (node: Rect) => {
    bounding.x1 = Math.min(bounding.x1, node.x)
    bounding.y1 = Math.min(bounding.y1, node.y)
    bounding.x2 = Math.max(bounding.x2, node.x + node.width)
    bounding.y2 = Math.max(bounding.y2, node.y + node.height)
  }

  const copy = () => {
    const copy = { ...bounding }
    if (copy.x1 > copy.x2) {
      copy.x1 = copy.x2 = 0
    }
    if (copy.y1 > copy.y2) {
      copy.y1 = copy.y2 = 0
    }
    return copy
  }

  return [wrap, copy]
}

const BORDER_COLORS: Record<EdgeState, string> = {
  default: KUI_COLOR_BORDER_NEUTRAL,
  hover: KUI_COLOR_BORDER_PRIMARY_WEAK,
  selected: KUI_COLOR_BORDER_PRIMARY,
}

type EdgeState = 'default' | 'hover' | 'selected'
let selectedEdgeId: EdgeId | undefined
let hoverEdgeId: EdgeId | undefined

function updateEdgeStyle(edge: Edge<EdgeData>): Edge<EdgeData> {
  const state = edge.id === selectedEdgeId ? 'selected' : edge.id === hoverEdgeId ? 'hover' : 'default'

  const color = BORDER_COLORS[state]
  const { markerEnd } = edge

  const marker = typeof markerEnd === 'object'
    ? { ...markerEnd, color }
    : { type: markerEnd as MarkerType, color }

  return {
    ...edge,
    style: {
      ...edge.style,
      stroke: color,
      strokeWidth: state === 'selected' ? 1.5 : undefined,
    },
    markerEnd: marker,
    zIndex: state === 'default' ? undefined : 1,
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
      onNodeClick,
      onNodeDragStop,
      onEdgeClick,
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
      commit,
      reset,
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

          return updateEdgeStyle({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceField ? `outputs@${edge.sourceField}` : 'output',
            targetHandle: edge.targetField ? `inputs@${edge.targetField}` : 'input',
            markerEnd: MarkerType.ArrowClosed,
            data: edge,
            updatable: !readonly,
          })
        }),
    )

    // Moved away from VueFlow's `:nodes` and `:edges` props because
    // they have race conditions while being updated simultaneously.
    watch([nodes, edges], ([newNodes, newEdges]) => {
      setNodes(newNodes)
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
      changes
        .filter((change) => change.type === 'select')
        // deselected changes come first
        .sort((a, b) => (a.selected === b.selected ? 0 : a.selected ? 1 : -1))
        .forEach((change) => {
          selectStoreNode(change.selected ? (change.id as NodeId) : undefined)
        })

      let schedulePostRemoval = false
      changes.forEach((change) => {
        if (change.type === 'remove') {
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

    onNodeDragStop(({ node }) => {
      if (!node) return

      // Update the node position in the store
      moveNode(node.id as NodeId, node.position)
    })

    // Only triggered by canvas-originated changes
    onEdgesChange((changes) => {
      const selectionChanges = changes.filter((change) => change.type === 'select')
      selectionChanges
        // deselected changes come first
        .sort((a, b) => (a.selected === b.selected ? 0 : a.selected ? 1 : -1))
        .forEach((change) => {
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
      hoverEdgeId = edgeEnter.id as EdgeId

      setEdges((edges) => edges.map((edge) => {
        if (edge.id !== edgeEnter.id) return edge
        return updateEdgeStyle(edge)
      }))
    })

    onEdgeMouseLeave(({ edge: edgeLeave }) => {
      hoverEdgeId = undefined

      setEdges((edges) => edges.map((edge) => {
        if (edge.id !== edgeLeave.id) return edge
        return updateEdgeStyle(edge)
      }))
    })

    onEdgeUpdate(({ edge, connection }) => {
      disconnectEdge(edge.id as EdgeId, false)
      handleConnect(connection)
    })

    function autoLayout(commitNow = true) {
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

      let dagreGraph: dagre.graphlib.Graph | undefined

      for (const node of nodes.value) {
        if (checkImplicitNode(node)) {
          // Skip auto-layout by Dagre for implicit nodes
          continue
        }

        if (configNodes.length > 0) {
          if (!dagreGraph) {
            dagreGraph = new dagre.graphlib.Graph({ multigraph: true })
            dagreGraph.setGraph({
              rankdir: phase === 'request' ? 'LR' : 'RL',
              nodesep: nodeGap,
              edgesep: edgeGap,
              ranksep: rankGap,
            })
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
      }

      if (!leftNode || !rightNode) {
        throw new Error(`One or more implicit nodes are missing from ${phase} phase`)
      }

      const leftGraphNode = findNode(leftNode.id)
      const rightGraphNode = findNode(rightNode.id)
      if (!leftGraphNode || !rightGraphNode) {
        throw new Error(`One or more implicit nodes are missing from the graph in ${phase} phase`)
      }

      if (configNodes.length > 0) {
        if (!dagreGraph) {
          throw new Error('dagreGraph should be defined here if reachable')
        }

        const implicitIds = new Set([leftNode.id, rightNode.id])
        for (const edge of edges.value) {
          if (!implicitIds.has(edge.source) && !implicitIds.has(edge.target)) {
            dagreGraph.setEdge(edge.source, edge.target, { points: [] })
          }
        }

        // Layout
        dagre.layout(dagreGraph)
      }

      const [wrapBounding, copyBounding] = createWrapper()

      // Positions returned by Dagre are centered
      const normalizePosition = (node: DagreNode) => {
        return {
          x: node.x - node.width / 2,
          y: node.y - node.height / 2,
          width: node.width,
          height: node.height,
        }
      }

      if (configNodes.length > 0) {
        if (!dagreGraph) {
          throw new Error('dagreGraph should be defined here if reachable')
        }

        for (const node of configNodes) {
          const dagreNode = dagreGraph.node(node.id)
          const position = normalizePosition(dagreNode)
          wrapBounding(position)
          moveNode(node.data!.id, { x: position.x, y: position.y }, false)
        }
      }

      const centralBounding = copyBounding()
      const centralWidth = centralBounding.x2 - centralBounding.x1
      const centralHeight = centralBounding.y2 - centralBounding.y1

      // Try to place implicit nodes at both ends when there is much room
      // If horizontalSpace is 0, it means we do not have enough space
      const horizontalSpace = Math.max(
        0,
        Math.min(toValue(viewport?.width) ?? Number.POSITIVE_INFINITY, DEFAULT_VIEWPORT_WIDTH)
          - centralWidth
          - 2 * nodeGap
          - leftGraphNode.dimensions.width
          - rightGraphNode.dimensions.width
          - 2 * padding,
      )

      const centerY = centralBounding.y1 + centralHeight / 2

      moveNode(leftNode.data!.id, {
        x: centralBounding.x1 - nodeGap - horizontalSpace / 2 - leftGraphNode.dimensions.width,
        y: centerY - leftGraphNode.dimensions.height / 2,
      }, false)

      moveNode(rightNode.data!.id, {
        x: centralBounding.x2 + nodeGap + horizontalSpace / 2,
        y: centerY - rightGraphNode.dimensions.height / 2,
      }, false)

      if (commitNow) {
        historyCommit(`autolayout-${flowId}`)
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
      const nodes = getNodes.value

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
