<template>
  <BaseEdge
    v-bind="props"
    :path="path[0]"
  />
</template>

<script lang="ts" setup>
import { BaseEdge, getSmoothStepPath, Position, type EdgeProps, type SmoothStepEdgeProps } from '@vue-flow/core'
import { computed, defineComponent } from 'vue'
import type { LifecycleEdgeData } from '../../types'

defineComponent({
  inheritAttrs: false,
})

// We are extending the "smoothstep"-typed edge
const props = defineProps<SmoothStepEdgeProps & Pick<EdgeProps<LifecycleEdgeData>, 'data'>>()

// Hardcoded from VueFlow's source
const HANDLE_SIZE = 4
const HANDLE_RADIUS = HANDLE_SIZE / 2

/**
 * This is to move the source/target X/Y nearer to the node to reduce the gap between edge start/end and the node
 */
const path = computed(() => {
  let {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  } = props

  switch (sourcePosition) {
    case Position.Top:
      sourceY += HANDLE_RADIUS
      break
    case Position.Bottom:
      sourceY -= HANDLE_RADIUS
      break
    case Position.Left:
      sourceX += HANDLE_RADIUS
      break
    case Position.Right:
      sourceX -= HANDLE_RADIUS
      break
  }

  switch (targetPosition) {
    case Position.Top:
      targetY += HANDLE_RADIUS
      break
    case Position.Bottom:
      targetY -= HANDLE_RADIUS
      break
    case Position.Left:
      targetX += HANDLE_RADIUS
      break
    case Position.Right:
      targetX -= HANDLE_RADIUS
      break
  }

  return getSmoothStepPath({
    ...props,
    sourceX,
    sourceY,
    targetX,
    targetY,
  })
})
</script>
