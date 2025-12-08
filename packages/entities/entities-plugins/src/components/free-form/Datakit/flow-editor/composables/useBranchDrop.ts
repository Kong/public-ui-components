import type { ComputedRef, Ref } from 'vue'
import { shallowRef } from 'vue'

import type { GroupId, GroupInstance, NodeId, NodePhase } from '../../types'
import { isNodeId } from '../node/node'
import type { XYPosition } from '@vue-flow/core'

interface UseBranchDropOptions {
  phase: NodePhase
  groupMapById: ComputedRef<Map<GroupId, GroupInstance>>
  memberGroupMap: ComputedRef<Map<NodeId, GroupInstance>>
  getNodeDepth: (nodeId: NodeId) => number
  draggingId?: Readonly<Ref<NodeId | GroupId | undefined>>
}

type DragOrigin = 'panel' | 'canvas'

export function useBranchDrop({
  phase,
  groupMapById,
  memberGroupMap,
  getNodeDepth,
  draggingId,
}: UseBranchDropOptions) {
  const source = shallowRef<DragOrigin>()
  const activeGroupId = shallowRef<GroupId>()

  function start(newSource: DragOrigin) {
    source.value = newSource
    activeGroupId.value = undefined
  }

  function end() {
    if (!source.value) return
    source.value = undefined
    activeGroupId.value = undefined
  }

  function findDeepestGroup(point: XYPosition): GroupId | undefined {
    let best: { depth: number, id: GroupId } | undefined
    const nodeId = draggingId?.value

    groupMapById.value.forEach((group) => {
      if (group.phase !== phase) return
      if (nodeId && isNodeId(nodeId) && isAncestor(nodeId, group.id)) return
      const position = group.position
      const dimensions = group.dimensions
      if (!position || !dimensions) return

      const within =
        point.x >= position.x
        && point.x <= position.x + dimensions.width
        && point.y >= position.y
        && point.y <= position.y + dimensions.height

      if (!within) return

      const depth = getNodeDepth(group.ownerId)
      if (!best || depth > best.depth) {
        best = { depth, id: group.id }
      }
    })

    return best?.id
  }

  function updateActiveGroup(point: XYPosition | undefined) {
    if (!source.value) {
      activeGroupId.value = undefined
      return
    }

    if (!point) {
      activeGroupId.value = undefined
      return
    }

    activeGroupId.value = findDeepestGroup(point)
  }

  function isAncestor(nodeId: NodeId, groupId: GroupId): boolean {
    const start = groupMapById.value.get(groupId)
    if (!start || start.phase !== phase) return false

    if (start.ownerId === nodeId) return true

    let currentOwner = start.ownerId
    const visited = new Set<GroupId>()

    while (true) {
      const parentGroup = memberGroupMap.value.get(currentOwner)
      if (!parentGroup || parentGroup.phase !== phase) return false
      if (visited.has(parentGroup.id)) return false

      if (parentGroup.ownerId === nodeId) return true
      visited.add(parentGroup.id)
      currentOwner = parentGroup.ownerId
    }
  }

  return {
    activeGroupId,
    start,
    updateActiveGroup,
    end,
  }
}
