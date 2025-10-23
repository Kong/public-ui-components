import type { Node, XYPosition } from '@vue-flow/core'
import { MarkerType, useVueFlow } from '@vue-flow/core'
import { computed, nextTick, ref, watch } from 'vue'

import type {
  GroupId,
  GroupInstance,
  NodeId,
  NodeInstance,
  NodePhase,
} from '../../types'
import { useEditorStore } from '../store/store'
import type { FlowEdge, FlowGroupNodeData, GroupLayout } from '../../types'
import {
  DK_FLOW_Z_LAYER_STEP,
  DK_FLOW_GROUP_Z_OFFSET,
  DK_FLOW_BRANCH_EDGE_Z_OFFSET,
  DK_BRANCH_GROUP_PADDING,
} from '../../constants'

export function useBranchLayout({ phase, readonly, flowId }: { phase: NodePhase, readonly?: boolean, flowId?: string }) {
  const { findNode } = useVueFlow(flowId)
  const editorStore = useEditorStore()
  const {
    state,
    groupMapById,
    getNodeById,
    moveNode,
    moveGroup,
    setGroupLayout,
    commit,
    branchGroups,
  } = editorStore
  const {
    memberGroupMap,
    groupsByOwner,
    getNodeDepth,
    getGroupDepth,
  } = branchGroups

  const draggingNodeId = ref<NodeId | GroupId>()

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

  const memberGroups = computed(() => {
    const map = new Map<NodeId, GroupInstance>()
    memberGroupMap.value.forEach((group, nodeId) => {
      if (group.phase !== phase) return
      if (!group.position) return
      const member = getNodeById(nodeId)
      if (!member) return
      if (member.phase !== phase || member.hidden) return
      map.set(nodeId, group)
    })
    return map
  })

  const groupsByOwnerInPhase = computed(() => {
    const map = new Map<NodeId, GroupInstance[]>()
    groupsByOwner.value.forEach((groupList, ownerId) => {
      const filtered = groupList.filter(group => group.phase === phase)
      if (filtered.length > 0) {
        map.set(ownerId, filtered)
      }
    })
    return map
  })

  const groupNodes = computed(() => {
    const results: Array<Node<FlowGroupNodeData>> = []

    for (const group of state.value.groups) {
      const owner = getNodeById(group.ownerId)
      if (!owner || owner.phase !== phase) continue

      const position = group.position
      const dimensions = group.dimensions
      if (!position || !dimensions) continue

      const members = getGroupMembers(group).filter(member => member.phase === phase && !member.hidden)
      const depth = getGroupDepth(group.id)

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

  const maxGroupDepth = computed(() => {
    let max = 0
    for (const group of state.value.groups) {
      if (group.phase !== phase) continue
      const depth = getGroupDepth(group.id)
      if (depth > max) {
        max = depth
      }
    }
    return max
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

      const depth = Math.max(getNodeDepth(owner.id), getGroupDepth(group.id)) + maxGroupDepth.value + 1

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

  const pendingGroupLayouts = new Map<GroupId, GroupLayout>()
  const pendingParentUpdates = new Map<GroupId, { commit: boolean }>()
  let layoutFlushPromise: Promise<void> | undefined

  /**
   * Calculates the layout (position and dimensions) for a group by determining the bounding box
   * that encompasses all its member nodes and child groups.
   *
   * This function:
   * 1. Filters group members that match the current phase and are not hidden
   * 2. Iterates through all members to find their positions and dimensions
   * 3. Considers child groups and their layouts (pending or current)
   * 4. Calculates the minimum bounding rectangle that contains all members
   * 5. Applies padding
   *
   * @param group - The group instance for which to calculate the layout
   * @returns A pending group layout object containing position and dimensions, or undefined if:
   *   - The group phase doesn't match the current phase
   *   - There are no valid members in the group
   *   - Any member node lacks valid dimensions
   *   - The calculated bounds are invalid (infinite values)
   */
  function calculateGroupLayout(group: GroupInstance, commit = true): GroupLayout | undefined {
    if (group.phase !== phase) return undefined

    const members = getGroupMembers(group).filter(member => member.phase === phase && !member.hidden)
    if (!members.length) return undefined

    let x1 = Number.POSITIVE_INFINITY
    let y1 = Number.POSITIVE_INFINITY
    let x2 = Number.NEGATIVE_INFINITY
    let y2 = Number.NEGATIVE_INFINITY

    for (const member of members) {
      const flowNode = findNode(member.id)
      const dimensions = flowNode?.dimensions
      const width = dimensions?.width ?? 0
      const height = dimensions?.height ?? 0
      if (width <= 0 || height <= 0) {
        return undefined
      }

      const computedPosition = flowNode?.computedPosition
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

    const paddedWidth = (x2 - x1) + DK_BRANCH_GROUP_PADDING * 2
    const paddedHeight = (y2 - y1) + DK_BRANCH_GROUP_PADDING * 2

    return {
      position: {
        x: Math.round(x1 - DK_BRANCH_GROUP_PADDING),
        y: Math.round(y1 - DK_BRANCH_GROUP_PADDING),
      },
      dimensions: {
        width: Math.round(paddedWidth),
        height: Math.round(paddedHeight),
      },
      commit,
    }
  }

  function applyPendingGroupLayouts() {
    if (pendingGroupLayouts.size === 0) {
      layoutFlushPromise = undefined
      return
    }

    const applied: Array<{ id: GroupId, changed: boolean, commit: boolean }> = []
    let scheduleCommit = false

    pendingGroupLayouts.forEach((layout, id) => {
      const changed = setGroupLayout(id, layout, false)
      applied.push({ id, changed, commit: layout.commit })
      if (layout.commit && changed && !scheduleCommit) {
        scheduleCommit = true
      }
    })

    pendingGroupLayouts.clear()
    layoutFlushPromise = undefined

    for (const { id, changed, commit } of applied) {
      if (!changed) continue
      const group = groupMapById.value.get(id)
      if (!group) continue
      const parent = memberGroups.value.get(group.ownerId)
      if (parent) {
        pendingParentUpdates.set(parent.id, { commit })
      }
    }

    if (pendingParentUpdates.size > 0) {
      const parentIds = Array.from(pendingParentUpdates)
      pendingParentUpdates.clear()
      for (const [parentId, { commit }] of parentIds) {
        updateGroupLayout(parentId, commit)
      }
    }

    if (scheduleCommit) {
      commit('*')
    }
  }

  function flushPendingGroupLayouts() {
    if (pendingGroupLayouts.size === 0) return
    if (layoutFlushPromise) return

    layoutFlushPromise = nextTick().then(applyPendingGroupLayouts)
  }

  /**
   * Recalculates and schedules a layout update for the given group:
   *
   * 1. Resolve the group instance.
   * 2. Derive its layout via `calculateGroupLayout`.
   * 3. Queue the layout in `pendingGroupLayouts`.
   * 4. Trigger a deferred flush with `flushPendingGroupLayouts`.
   *
   * @param groupId - The ID of the group to update.
   */
  function updateGroupLayout(groupId: GroupId, commit = true) {
    const group = groupMapById.value.get(groupId)
    if (!group) return

    const layout = calculateGroupLayout(group, commit)
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

        const childGroups = groupsByOwnerInPhase.value.get(member.id) ?? []
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

  /**
   * Determines whether a group's layout update should be skipped based on the currently dragging node.
   *
   * A group update is skipped if:
   * - The group itself is being dragged
   * - Any of the group's member nodes is being dragged
   * - Any child group of the member nodes is being dragged
   *
   * @param groupId - The ID of the group to check
   * @param memberIds - Array of node IDs that are members of the group
   * @returns `true` if the group update should be skipped, `false` otherwise
   */
  function shouldSkipGroupUpdate(groupId: GroupId, memberIds: NodeId[]): boolean {
    const dragging = draggingNodeId.value
    if (!dragging) return false

    if (dragging === groupId) return true
    if (memberIds.some(id => dragging === id)) return true

    for (const memberId of memberIds) {
      const childGroups = groupsByOwnerInPhase.value.get(memberId) ?? []
      if (childGroups?.some(group => group.id === dragging)) {
        return true
      }
    }

    return false
  }

  const lastLayoutSignatures = new Map<GroupId, string>()

  /**
   * Watches for changes in group member nodes' dimensions and triggers layout updates.
   *
   * This watcher:
   * 1. Monitors all groups in the current phase
   * 2. Creates a signature for each group based on its member nodes' dimensions
   * 3. Compares signatures to detect changes
   * 4. Triggers group layout recalculation when member dimensions change
   * 5. Skips updates for groups that are currently being dragged
   *
   * The signature is a string combining member node IDs with their rounded dimensions
   * (e.g., "node1:100x50,node2:200x100"). This allows efficient detection of when
   * member nodes have been resized or changed without triggering unnecessary updates.
   */
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
      // Clean up signatures for groups that no longer exist
      const currentGroupIds = new Set(groups.map(g => g.id))
      for (const groupId of lastLayoutSignatures.keys()) {
        if (!currentGroupIds.has(groupId)) {
          lastLayoutSignatures.delete(groupId)
        }
      }

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
    groupsByOwner: groupsByOwnerInPhase,
    memberGroupMap: memberGroups,
    groupNodes,
    branchEdges,
    isBranchEdgeId,
    updateGroupLayout,
    translateGroupTree,
    updateDragging: (id?: NodeId | GroupId) => {
      draggingNodeId.value = id
    },
    getNodeDepth,
    maxGroupDepth,
    waitForLayoutFlush: () => layoutFlushPromise ?? Promise.resolve(),
  }
}
