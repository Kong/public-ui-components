import type { ComputedRef, Ref } from 'vue'
import { shallowRef } from 'vue'

import type { BranchName, GroupId, GroupInstance, NodeId, NodePhase } from '../../types'
import { isNodeId } from '../node/node'
import type { XYPosition } from '@vue-flow/core'

interface UseBranchDropOptions {
  phase: NodePhase
  groupMapById: ComputedRef<Map<GroupId, GroupInstance>>
  getNodeDepth: (nodeId: NodeId) => number
  canAddMember: (ownerId: NodeId, branch: BranchName, memberId: NodeId) => boolean
  draggingId?: Readonly<Ref<NodeId | GroupId | undefined>>
}

type DragOrigin = 'panel' | 'canvas'

export function useBranchDrop({
  phase,
  groupMapById,
  getNodeDepth,
  canAddMember,
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
      if (nodeId && isNodeId(nodeId) && !canAddMember(group.ownerId, group.branch, nodeId)) return
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

  return {
    activeGroupId,
    start,
    updateActiveGroup,
    end,
  }
}
