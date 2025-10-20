import type { ComputedRef } from 'vue'
import { shallowRef } from 'vue'

import type { GroupId, GroupInstance, NodeId } from '../../types'
import type { XYPosition } from '@vue-flow/core'

interface UseBranchDropOptions {
  phase: string
  groupMapById: ComputedRef<Map<GroupId, GroupInstance>>
  getNodeDepth: (nodeId: NodeId) => number
}

type DragSource = 'panel' | 'canvas'

type DragHitArea = XYPosition | { x: number, y: number, width: number, height: number } | undefined

const isPoint = (value: DragHitArea): value is XYPosition =>
  typeof value === 'object' && !!value && 'x' in value && 'y' in value && !('width' in value)

const isRect = (value: DragHitArea): value is { x: number, y: number, width: number, height: number } =>
  typeof value === 'object' && !!value && 'width' in value && 'height' in value

export function useBranchDrop({ phase, groupMapById, getNodeDepth }: UseBranchDropOptions) {
  const source = shallowRef<DragSource>()
  const activeGroupId = shallowRef<GroupId>()

  function start(newSource: DragSource) {
    source.value = newSource
    activeGroupId.value = undefined
  }

  function finish() {
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

  function updateActiveGroup(target: DragHitArea) {
    if (!target || !source.value) {
      activeGroupId.value = undefined
      return
    }

    if (isRect(target)) {
      const center = {
        x: target.x + target.width / 2,
        y: target.y + target.height / 2,
      }
      activeGroupId.value = findDeepestGroup(center)
      return
    }

    if (isPoint(target)) {
      activeGroupId.value = findDeepestGroup(target)
    }
  }

  function reset() {
    source.value = undefined
    activeGroupId.value = undefined
  }

  return {
    activeGroupId,
    start,
    updateActiveGroup,
    finish,
    reset,
  }
}
