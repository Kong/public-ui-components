import { computed, type Ref } from 'vue'
import type { ElementEvent } from 'echarts/core'

export interface UseTooltipPositionOptions {
  chartWidth: Ref<number>
  chartHeight: Ref<number>
  containerTop: Ref<number>
  containerLeft: Ref<number>
  tooltipWidth: Ref<number | undefined>
  tooltipHeight: Ref<number | undefined>
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
    offset = 40,
  } = options

  const canPosition = computed(() => {
    return tooltipWidth.value !== undefined && tooltipHeight.value !== undefined
  })

  const calculatePosition = (e: ElementEvent): { left: number, top: number } | null => {
    if (!canPosition.value) return null

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

    return {
      left: left + containerLeft.value,
      top: top + containerTop.value,
    }
  }

  return {
    calculatePosition,
    canPosition,
  }
}
