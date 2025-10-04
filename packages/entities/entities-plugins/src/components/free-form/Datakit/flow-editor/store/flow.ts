import type { Node as DagreNode } from '@dagrejs/dagre'
import type { Connection, Edge, FitViewParams, Node, NodeSelectionChange, Rect, XYPosition } from '@vue-flow/core'
import type { MaybeRefOrGetter } from '@vueuse/core'

import type {
  EdgeData,
  EdgeId,
  EdgeInstance,
  FieldId,
  BranchName,
  GroupId,
  GroupInstance,
  NodeDimensions,
  NodeId,
  NodeInstance,
  NodePhase,
} from '../../types'
import type { ConnectionString } from '../modal/ConflictModal.vue'

import dagre from '@dagrejs/dagre'
import { MarkerType, useVueFlow } from '@vue-flow/core'
import { createInjectionState } from '@vueuse/core'
import { computed, nextTick, toValue, watch, watchEffect } from 'vue'

import { KUI_COLOR_BORDER_NEUTRAL, KUI_COLOR_BORDER_PRIMARY, KUI_COLOR_BORDER_PRIMARY_WEAK } from '@kong/design-tokens'
import useI18n from '../../../../../composables/useI18n'
import { useToaster } from '../../../../../composables/useToaster'
import { DK_NODE_PROPERTIES_PANEL_WIDTH } from '../../constants'
import { createEdgeConnectionString, createNewConnectionString } from '../composables/helpers'
import { useOptionalConfirm } from '../composables/useConflictConfirm'
import {
  DEFAULT_LAYOUT_OPTIONS,
  DEFAULT_VIEWPORT_WIDTH,
  SCROLL_DURATION,
} from '../constants'
import { isImplicitNode } from '../node/node'
import { useEditorStore } from './store'
import { makeGroupId } from './helpers'

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

function parseBranchHandle(handle: string): BranchName | undefined {
  const parsed = handle.match(/^branch@(.+)$/)
  if (!parsed) return undefined
  return parsed[1] as BranchName
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

const BRANCH_GROUP_PADDING = 32
const BRANCH_GROUP_MIN_WIDTH = 160
const BRANCH_GROUP_MIN_HEIGHT = 96

const Z_LAYER_STEP = 100
const GROUP_Z_OFFSET = 0
const EDGE_Z_OFFSET = 30
const BRANCH_EDGE_Z_OFFSET = 40
const NODE_Z_OFFSET = 50

export type FlowGroupNodeData = GroupInstance & {
  memberIds: NodeId[]
}

type BranchEdgeData = {
  type: 'branch'
  ownerId: NodeId
  branch: BranchName
  groupId: GroupId
}

type FlowEdge = Edge<EdgeData | BranchEdgeData>

type EdgeState = 'default' | 'hover' | 'selected'
let selectedEdgeId: string | undefined
let hoverEdgeId: string | undefined

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
    } = vueFlowStore

    // VueFlow has a default delete key code of 'Backspace',
    // but we want to also support 'Delete'.
    deleteKeyCode.value = ['Delete', 'Backspace']

    const {
      state,
      commit: historyCommit,
      moveNode,
      moveGroup,
      setGroupLayout,
      selectNode: selectStoreNode,
      removeNode,
      getNodeById,
      branchGroups,
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

    const groupIdSet = computed(() => new Set(state.value.groups.map((group) => group.id)))
    const groupMapById = computed(
      () => new Map<GroupId, GroupInstance>(state.value.groups.map((group) => [group.id, group])),
    )

    const isGroupId = (id?: string): id is GroupId =>
      !!id && groupIdSet.value.has(id as GroupId)

    const isBranchEdgeId = (id?: string) => !!id && id.startsWith('branch:')

    function getGroupMembers(group: GroupInstance): NodeInstance[] {
      const resolvedMembers: NodeInstance[] = []
      for (const memberId of group.memberIds) {
        const member = getNodeById(memberId)
        if (member) {
          resolvedMembers.push(member)
        }
      }
      return resolvedMembers
    }

    const memberGroupMap = computed(() => {
      const map = new Map<NodeId, GroupInstance>()
      for (const group of state.value.groups) {
        if (group.phase !== phase) continue
        if (!group.position) continue
        const members = getGroupMembers(group)
          .filter((member) => member.phase === phase && !member.hidden)
        if (!members.length) continue
        for (const member of members) {
          map.set(member.id, group)
        }
      }
      return map
    })

    const groupsByOwner = computed(() => {
      const map = new Map<NodeId, GroupInstance[]>()
      for (const group of state.value.groups) {
        if (!map.has(group.ownerId)) {
          map.set(group.ownerId, [])
        }
        map.get(group.ownerId)!.push(group)
      }
      return map
    })

    function getNodeDepth(nodeId: NodeId): number {
      let depth = 0
      const visited = new Set<GroupId>()
      let currentGroup = memberGroupMap.value.get(nodeId)
      while (currentGroup && !visited.has(currentGroup.id)) {
        depth++
        visited.add(currentGroup.id)
        currentGroup = memberGroupMap.value.get(currentGroup.ownerId)
      }
      return depth
    }

    function getGroupDepth(group: GroupInstance): number {
      return getNodeDepth(group.ownerId)
    }

    const nodes = computed(() =>
      state.value.nodes
        .filter((node) => node.phase === phase && !node.hidden)
        .map<Node<NodeInstance>>((node) => {
          const parentGroup = memberGroupMap.value.get(node.id)
          const parentPosition = parentGroup?.position
          const position = parentGroup && parentPosition
            ? {
              x: node.position.x - parentPosition.x,
              y: node.position.y - parentPosition.y,
            }
            : node.position

          const depth = getNodeDepth(node.id)

          return {
            id: node.id,
            type: 'flow',
            position,
            data: node,
            deletable: !isImplicitNode(node),
            parentNode: parentGroup && parentGroup.position ? parentGroup.id : undefined,
            zIndex: depth * Z_LAYER_STEP + NODE_Z_OFFSET,
          }
        }),
    )

    const groupNodes = computed(() => {
      const results: Array<Node<FlowGroupNodeData>> = []

      for (const group of state.value.groups) {
        const owner = getNodeById(group.ownerId)
        if (!owner || owner.phase !== phase) continue

        const position = group.position
        const dimensions = group.dimensions
        // Groups intentionally render only when persisted UI coordinates exist. This keeps
        // layout purely data-driven and avoids generating implicit positions that we cannot
        // serialize back into `DatakitUIData`.
        if (!position || !dimensions) continue

        const members = getGroupMembers(group).filter((member) => member.phase === phase && !member.hidden)
        const depth = getGroupDepth(group)

        results.push({
          id: group.id,
          type: 'group',
          position,
          width: dimensions.width,
          height: dimensions.height,
          data: {
            ...group,
            memberIds: members.map((member) => member.id),
          },
          draggable: !readonly,
          selectable: false,
          zIndex: depth * Z_LAYER_STEP + GROUP_Z_OFFSET,
        })
      }

      return results
    })

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

          const depth = Math.max(getNodeDepth(edge.source), getNodeDepth(edge.target))

          return updateEdgeStyle({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceField ? `outputs@${edge.sourceField}` : 'output',
            targetHandle: edge.targetField ? `inputs@${edge.targetField}` : 'input',
            markerEnd: MarkerType.ArrowClosed,
            data: edge,
            updatable: !readonly,
            zIndex: depth * Z_LAYER_STEP + EDGE_Z_OFFSET,
          })
        }),
    )

    const branchEdges = computed<FlowEdge[]>(() => {
      const results: FlowEdge[] = []

      for (const group of state.value.groups) {
        if (group.phase !== phase) continue
        if (!group.position || !group.dimensions) continue

        const owner = getNodeById(group.ownerId)
        if (!owner || owner.phase !== phase || owner.hidden) continue

        const members = getGroupMembers(group)
          .filter((member) => member.phase === phase && !member.hidden)
        if (!members.length) continue

        const depth = Math.max(getNodeDepth(owner.id), getGroupDepth(group))

        results.push(updateEdgeStyle({
          id: `branch:${group.id}`,
          source: owner.id,
          target: group.id,
          sourceHandle: `branch@${group.branch}`,
          targetHandle: 'input',
          markerEnd: MarkerType.ArrowClosed,
          selectable: false,
          focusable: false,
          updatable: false,
          data: {
            type: 'branch',
            ownerId: owner.id,
            branch: group.branch,
            groupId: group.id,
          },
          zIndex: depth * Z_LAYER_STEP + BRANCH_EDGE_Z_OFFSET,
        }))
      }

      return results
    })

    const edges = computed(() => [
      ...branchEdges.value,
      ...configEdges.value,
    ])

    const pendingGroupLayouts = new Map<GroupId, { position: XYPosition, dimensions: NodeDimensions }>()
    const pendingParentUpdates = new Set<GroupId>()
    let layoutFlushPromise: Promise<void> | undefined

    function calculateGroupLayout(group: GroupInstance): { position: XYPosition, dimensions: NodeDimensions } | undefined {
      if (group.phase !== phase) return undefined

      const members = getGroupMembers(group)
        .filter((member) => member.phase === phase && !member.hidden)
      if (!members.length) return undefined

      let x1 = Number.POSITIVE_INFINITY
      let y1 = Number.POSITIVE_INFINITY
      let x2 = Number.NEGATIVE_INFINITY
      let y2 = Number.NEGATIVE_INFINITY

      for (const member of members) {
        const vueNode = findNode(member.id)
        const dimensions = vueNode?.dimensions
        const width = dimensions?.width ?? 0
        const height = dimensions?.height ?? 0
        if (width <= 0 || height <= 0) {
          return undefined
        }

        const computedPosition = vueNode?.computedPosition
        const absoluteX = computedPosition?.x ?? member.position.x
        const absoluteY = computedPosition?.y ?? member.position.y

        x1 = Math.min(x1, absoluteX)
        y1 = Math.min(y1, absoluteY)
        x2 = Math.max(x2, absoluteX + width)
        y2 = Math.max(y2, absoluteY + height)

        const childGroups = groupsByOwner.value.get(member.id) ?? []
        for (const child of childGroups) {
          if (child.phase !== phase) continue
          const pendingLayout = pendingGroupLayouts.get(child.id)
          const childPosition = pendingLayout?.position ?? child.position
          const childDimensions = pendingLayout?.dimensions ?? child.dimensions
          if (!childPosition || !childDimensions) continue

          x1 = Math.min(x1, childPosition.x)
          y1 = Math.min(y1, childPosition.y)
          x2 = Math.max(x2, childPosition.x + childDimensions.width)
          y2 = Math.max(y2, childPosition.y + childDimensions.height)
        }
      }

      if (!Number.isFinite(x1) || !Number.isFinite(y1) || !Number.isFinite(x2) || !Number.isFinite(y2)) {
        return undefined
      }

      const paddedWidth = Math.max((x2 - x1) + BRANCH_GROUP_PADDING * 2, BRANCH_GROUP_MIN_WIDTH)
      const paddedHeight = Math.max((y2 - y1) + BRANCH_GROUP_PADDING * 2, BRANCH_GROUP_MIN_HEIGHT)

      const position: XYPosition = {
        x: Math.round(x1 - BRANCH_GROUP_PADDING),
        y: Math.round(y1 - BRANCH_GROUP_PADDING),
      }
      const dimensions: NodeDimensions = {
        width: Math.round(paddedWidth),
        height: Math.round(paddedHeight),
      }

      return { position, dimensions }
    }

    function applyPendingGroupLayouts() {
      if (pendingGroupLayouts.size === 0) {
        layoutFlushPromise = undefined
        return
      }

      const applied: Array<{ id: GroupId, changed: boolean }> = []

      pendingGroupLayouts.forEach((layout, id) => {
        const changed = setGroupLayout(id, layout, false)
        applied.push({ id, changed })
      })

      pendingGroupLayouts.clear()
      layoutFlushPromise = undefined

      for (const { id, changed } of applied) {
        if (!changed) continue
        const group = groupMapById.value.get(id)
        if (!group) continue
        const parent = memberGroupMap.value.get(group.ownerId)
        if (parent) {
          pendingParentUpdates.add(parent.id)
        }
      }

      if (pendingParentUpdates.size > 0) {
        const parentIds = Array.from(pendingParentUpdates)
        pendingParentUpdates.clear()
        for (const parentId of parentIds) {
          updateGroupLayout(parentId)
        }
      }
    }

    function flushPendingGroupLayouts() {
      if (pendingGroupLayouts.size === 0) return
      if (layoutFlushPromise) return

      layoutFlushPromise = nextTick().then(applyPendingGroupLayouts)
    }

    function updateGroupLayout(groupId: GroupId) {
      const group = groupMapById.value.get(groupId)
      if (!group) return

      const layout = calculateGroupLayout(group)
      if (!layout) return

      pendingGroupLayouts.set(groupId, layout)
      flushPendingGroupLayouts()
    }

    function translateGroupTree(groupId: GroupId, targetPosition: XYPosition, deltaX: number, deltaY: number) {
      const rootGroup = groupMapById.value.get(groupId)
      if (!rootGroup) return

      if (!rootGroup.position) {
        moveGroup(groupId, targetPosition, false)
        updateGroupLayout(groupId)
        return
      }

      if (deltaX === 0 && deltaY === 0) {
        moveGroup(groupId, targetPosition, false)
        return
      }

      moveGroup(groupId, targetPosition, false)

      const groupQueue: GroupId[] = [groupId]
      const visitedGroups = new Set<GroupId>([groupId])
      const visitedNodes = new Set<NodeId>()
      const groupsToUpdate = new Set<GroupId>([groupId])

      while (groupQueue.length) {
        const currentGroupId = groupQueue.shift()!
        const currentGroup = groupMapById.value.get(currentGroupId)
        if (!currentGroup) continue

        const members = getGroupMembers(currentGroup)
          .filter((member) => member.phase === phase && !member.hidden)

        for (const member of members) {
          if (!visitedNodes.has(member.id)) {
            moveNode(member.id, {
              x: member.position.x + deltaX,
              y: member.position.y + deltaY,
            }, false)
            visitedNodes.add(member.id)
          }

          const childGroups = groupsByOwner.value.get(member.id) ?? []
          for (const child of childGroups) {
            if (visitedGroups.has(child.id)) continue

            const childInstance = groupMapById.value.get(child.id)
            if (childInstance?.position) {
              moveGroup(child.id, {
                x: childInstance.position.x + deltaX,
                y: childInstance.position.y + deltaY,
              }, false)
            }

            visitedGroups.add(child.id)
            groupQueue.push(child.id)
            groupsToUpdate.add(child.id)
          }
        }
      }

      groupsToUpdate.forEach(updateGroupLayout)
    }

    watchEffect(() => {
      for (const group of state.value.groups) {
        if (group.phase !== phase) continue
        updateGroupLayout(group.id)
      }
    })

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
      const branchHandle = parseBranchHandle(sourceHandle)

      if (branchHandle) {
        if (targetHandle !== 'input') {
          reset()
          toaster({
            message: t('plugins.free-form.datakit.flow_editor.error.invalid_connection'),
            appearance: 'danger',
          })
          return
        }

        const ownerId = source as NodeId
        const memberId = target as NodeId

        if (branchGroups.wouldCreateCycle(ownerId, memberId)) {
          reset()
          toaster({
            message: t('plugins.free-form.datakit.flow_editor.error.branch_cycle'),
            appearance: 'danger',
          })
          return
        }

        const added = branchGroups.addMember(ownerId, branchHandle, memberId, { commit: false })
        if (!added) {
          reset()
          return
        }

        const groupId = makeGroupId(ownerId, branchHandle)
        updateGroupLayout(groupId)
        flushPendingGroupLayouts()

        commit()
        return
      }

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

    onNodeDrag(({ node }) => {
      if (!node) return

      if (isGroupId(node.id)) {
        const groupId = node.id as GroupId
        const group = groupMapById.value.get(groupId)
        if (!group) return

        const previousPosition = group.position ?? { ...node.position }
        const deltaX = node.position.x - previousPosition.x
        const deltaY = node.position.y - previousPosition.y

        translateGroupTree(groupId, node.position, deltaX, deltaY)
        return
      }

      const nodeId = node.id as NodeId
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
        updateGroupLayout(owningGroupId)
      }
    })

    onNodeDragStop(({ node }) => {
      if (!node) return

      if (isGroupId(node.id)) {
        const groupId = node.id as GroupId
        historyCommit(`drag-group:${groupId}`)
        return
      }

      const nodeId = node.id as NodeId
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
        updateGroupLayout(owningGroupId)
      }

      historyCommit(`drag-node:${nodeId}`)
    })

    // Only triggered by canvas-originated changes
    onEdgesChange((changes) => {
      const selectionChanges = changes.filter((change) => change.type === 'select')
      selectionChanges
        // deselected changes come first
        .sort((a, b) => (a.selected === b.selected ? 0 : a.selected ? 1 : -1))
        .forEach((change) => {
          if (isBranchEdgeId(change.id)) return
          selectedEdgeId = change.selected ? change.id : undefined

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
      hoverEdgeId = edgeEnter.id

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
