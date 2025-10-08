import type { Node, XYPosition } from '@vue-flow/core'
import { MarkerType, useVueFlow } from '@vue-flow/core'
import { KUI_SPACE_90 } from '@kong/design-tokens'
import { computed, nextTick, ref, watch } from 'vue'

import type {
  GroupId,
  GroupInstance,
  NodeId,
  NodeInstance,
  NodePhase,
} from '../../types'
import { useEditorStore } from '../store/store'
import type { FlowEdge, FlowGroupNodeData, PendingGroupLayout } from '../../types'
import {
  DK_FLOW_Z_LAYER_STEP,
  DK_FLOW_GROUP_Z_OFFSET,
  DK_FLOW_BRANCH_EDGE_Z_OFFSET,
} from '../../constants'

const BRANCH_GROUP_PADDING = parseInt(KUI_SPACE_90, 10)
const BRANCH_GROUP_MIN_WIDTH = 160
const BRANCH_GROUP_MIN_HEIGHT = 96

export function useBranchLayout({ phase, readonly, flowId }: { phase: NodePhase, readonly?: boolean, flowId?: string }) {
  const { findNode } = useVueFlow(flowId)
  const editorStore = useEditorStore()
  const {
    state,
    getNodeById,
    moveNode,
    moveGroup,
    setGroupLayout,
  } = editorStore

  const draggingNodeId = ref<NodeId | GroupId>()

  const groupMapById = computed(() =>
    new Map<GroupId, GroupInstance>(state.value.groups.map(group => [group.id, group])),
  )

  const groupIdSet = computed(() => new Set(state.value.groups.map(group => group.id)))

  const isGroupId = (id?: string): id is GroupId => !!id && groupIdSet.value.has(id as GroupId)
  const isBranchEdgeId = (id?: string) => !!id && id.startsWith('branch:')

  function getGroupMembers(group: GroupInstance): NodeInstance[] {
    const resolved: NodeInstance[] = []
    for (const memberId of group.memberIds) {
      const member = getNodeById(memberId)
      if (member) {
        resolved.push(member)
      }
    }
    return resolved
  }

  const memberGroupMap = computed(() => {
    const map = new Map<NodeId, GroupInstance>()
    for (const group of state.value.groups) {
      if (group.phase !== phase) continue
      if (!group.position) continue
      const members = getGroupMembers(group).filter(member => member.phase === phase && !member.hidden)
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
      depth += 1
      visited.add(currentGroup.id)
      currentGroup = memberGroupMap.value.get(currentGroup.ownerId)
    }
    return depth
  }

  function getGroupDepth(group: GroupInstance): number {
    return getNodeDepth(group.ownerId)
  }

  const groupNodes = computed(() => {
    const results: Array<Node<FlowGroupNodeData>> = []

    for (const group of state.value.groups) {
      const owner = getNodeById(group.ownerId)
      if (!owner || owner.phase !== phase) continue

      const position = group.position
      const dimensions = group.dimensions
      if (!position || !dimensions) continue

      const members = getGroupMembers(group).filter(member => member.phase === phase && !member.hidden)
      const depth = getGroupDepth(group)

      results.push({
        id: group.id,
        type: 'group',
        position,
        width: dimensions.width,
        height: dimensions.height,
        data: {
          ...group,
          memberIds: members.map(member => member.id),
        },
        draggable: !readonly,
        selectable: false,
        zIndex: depth * DK_FLOW_Z_LAYER_STEP + DK_FLOW_GROUP_Z_OFFSET,
      })
    }

    return results
  })

  const branchEdges = computed(() => {
    const edges: FlowEdge[] = []

    for (const group of state.value.groups) {
      if (group.phase !== phase) continue
      if (!group.position || !group.dimensions) continue

      const owner = getNodeById(group.ownerId)
      if (!owner || owner.phase !== phase || owner.hidden) continue

      const members = getGroupMembers(group).filter(member => member.phase === phase && !member.hidden)
      if (!members.length) continue

      const depth = Math.max(getNodeDepth(owner.id), getGroupDepth(group))

      const edge: FlowEdge = {
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
        zIndex: depth * DK_FLOW_Z_LAYER_STEP + DK_FLOW_BRANCH_EDGE_Z_OFFSET,
      }

      edges.push(edge)
    }

    return edges
  })

  const pendingGroupLayouts = new Map<GroupId, PendingGroupLayout>()
  const pendingParentUpdates = new Set<GroupId>()
  let layoutFlushPromise: Promise<void> | undefined

  function calculateGroupLayout(group: GroupInstance): PendingGroupLayout | undefined {
    if (group.phase !== phase) return undefined

    const members = getGroupMembers(group).filter(member => member.phase === phase && !member.hidden)
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

    return {
      position: {
        x: Math.round(x1 - BRANCH_GROUP_PADDING),
        y: Math.round(y1 - BRANCH_GROUP_PADDING),
      },
      dimensions: {
        width: Math.round(paddedWidth),
        height: Math.round(paddedHeight),
      },
    }
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

    while (groupQueue.length) {
      const currentGroupId = groupQueue.shift()!
      const currentGroup = groupMapById.value.get(currentGroupId)
      if (!currentGroup) continue

      const members = getGroupMembers(currentGroup).filter(member => member.phase === phase && !member.hidden)

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
        }
      }
    }
  }

  function shouldSkipGroupUpdate(groupId: GroupId, memberIds: NodeId[]): boolean {
    const dragging = draggingNodeId.value
    if (!dragging) return false

    if (dragging === groupId) return true
    if (memberIds.some(id => dragging === id)) return true

    for (const memberId of memberIds) {
      const childGroups = groupsByOwner.value.get(memberId)
      if (childGroups?.some(group => group.id === dragging)) {
        return true
      }
    }

    return false
  }

  const lastLayoutSignatures = new Map<GroupId, string>()

  watch(
    () => {
      const relevantGroups = state.value.groups.filter(group => group.phase === phase)

      return relevantGroups.map(group => {
        const memberSignatures = group.memberIds.map(id => {
          const node = findNode(id)
          const width = Math.round(node?.dimensions?.width ?? 0)
          const height = Math.round(node?.dimensions?.height ?? 0)
          return `${id}:${width}x${height}`
        })

        return {
          id: group.id,
          memberIds: group.memberIds,
          signature: memberSignatures.join(','),
        }
      })
    },
    (groups) => {
      for (const group of groups) {
        if (shouldSkipGroupUpdate(group.id, group.memberIds)) continue

        const lastSignature = lastLayoutSignatures.get(group.id)
        if (lastSignature !== group.signature) {
          lastLayoutSignatures.set(group.id, group.signature)
          updateGroupLayout(group.id)
        }
      }
    },
    {
      deep: true,
      flush: 'post',
    },
  )

  return {
    groupMapById,
    memberGroupMap,
    groupNodes,
    branchEdges,
    isGroupId,
    isBranchEdgeId,
    updateGroupLayout,
    flushPendingGroupLayouts,
    translateGroupTree,
    setDraggingNode: (id?: NodeId | GroupId) => {
      draggingNodeId.value = id
    },
    getNodeDepth,
  }
}
