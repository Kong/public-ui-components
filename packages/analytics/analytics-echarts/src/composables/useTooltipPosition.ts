import { computed, ref, watch, type Ref } from 'vue'
import type { ElementEvent } from 'echarts/core'
import type { TooltipState } from '../types'

export interface UseTooltipPositionOptions {
  chartWidth: Ref<number>
  chartHeight: Ref<number>
  containerTop: Ref<number>
  containerLeft: Ref<number>
  tooltipWidth: Ref<number | undefined>
  tooltipHeight: Ref<number | undefined>
  tooltipState: Ref<TooltipState>
  offset?: number
}

export default function useTooltipPosition(options: UseTooltipPositionOptions) {
  const {
    chartWidth,
    chartHeight,
    containerTop,
    containerLeft,
    tooltipWidth,
    tooltipHeight,
    tooltipState,
    offset = 40,
  } = options

  const anchor = ref<{ left: number, top: number } | null>(null)

  const canPosition = computed(() => {
    return tooltipWidth.value !== undefined && tooltipHeight.value !== undefined
  })

  const applyAnchorPosition = (position: { left: number, top: number }) => {
    tooltipState.value.left = position.left + containerLeft.value
    tooltipState.value.top = position.top + containerTop.value
  }

  const calculatePosition = (e: ElementEvent): void => {
    if (!canPosition.value) return

    const x = e.offsetX
    const y = e.offsetY

    // Horizontal: flip to left side if cursor is past midpoint
    const left = x > chartWidth.value / 2
      ? x - tooltipWidth.value! - offset
      : x + offset

    // Vertical: flip above if cursor is past midpoint
    const top = y > chartHeight.value / 2
      ? y - tooltipHeight.value! - offset
      : y + offset

    anchor.value = { left, top }

    applyAnchorPosition(anchor.value)
  }

  watch([containerTop, containerLeft], () => {
    if (anchor.value) {
      applyAnchorPosition(anchor.value)
    }
  })

  const resetAnchor = () => {
    anchor.value = null
  }

  return {
    calculatePosition,
    resetAnchor,
  }
}
