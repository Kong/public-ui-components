import type { ComputedRef } from 'vue'
import { shallowRef } from 'vue'

import type { GroupId, GroupInstance, NodeId, Rect } from '../../types'
import type { XYPosition } from '@vue-flow/core'

interface UseBranchDropOptions {
  phase: string
  groupMapById: ComputedRef<Map<GroupId, GroupInstance>>
  getNodeDepth: (nodeId: NodeId) => number
}

type DragOrigin = 'panel' | 'canvas'
type DragTarget = XYPosition | Rect | undefined

const isRect = (value: DragTarget): value is Rect =>
  typeof value === 'object' && !!value && 'width' in value && 'height' in value

const isPoint = (value: DragTarget): value is XYPosition =>
  typeof value === 'object' && !!value && 'x' in value && 'y' in value && !isRect(value)

const toPoint = (value: DragTarget): XYPosition | undefined => {
  if (!value) return undefined
  if (isRect(value)) {
    return {
      x: value.x + value.width / 2,
      y: value.y + value.height / 2,
    }
  }
  if (isPoint(value)) return value
  return undefined
}

export function useBranchDrop({ phase, groupMapById, getNodeDepth }: UseBranchDropOptions) {
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

    groupMapById.value.forEach((group) => {
      if (group.phase !== phase) return
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

  function updateActiveGroup(target: DragTarget) {
    if (!source.value) {
      activeGroupId.value = undefined
      return
    }

    const point = toPoint(target)
    if (!point) {
      activeGroupId.value = undefined
      return
    }

    activeGroupId.value = findDeepestGroup(point)
  }

  function reset() {
    source.value = undefined
    activeGroupId.value = undefined
  }

  return {
    activeGroupId,
    start,
    updateActiveGroup,
    end,
    reset,
  }
}
