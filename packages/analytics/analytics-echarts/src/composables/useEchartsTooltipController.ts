import { computed, ref, type Ref } from 'vue'
import type { ElementEvent } from 'echarts/core'
import type { TooltipInteractionMode, TooltipState } from '../types'
import { isTooltipInteractive } from '../utils'
import useTooltipPosition from './useTooltipPosition'

export interface UseEchartsTooltipControllerOptions {
  chartWidth: Ref<number>
  chartHeight: Ref<number>
  containerTop: Ref<number>
  containerLeft: Ref<number>
  tooltipWidth: Ref<number | undefined>
  tooltipHeight: Ref<number | undefined>
  onReset?: () => void
}

export default function useEchartsTooltipController(options: UseEchartsTooltipControllerOptions) {
  const {
    chartWidth,
    chartHeight,
    containerTop,
    containerLeft,
    tooltipWidth,
    tooltipHeight,
    onReset,
  } = options

  const tooltipState = ref<TooltipState>({
    interactionMode: 'idle',
    entries: [],
    visible: false,
    top: 0,
    left: 0,
  })

  const { calculatePosition, resetAnchor } = useTooltipPosition({
    chartWidth,
    chartHeight,
    containerTop,
    containerLeft,
    tooltipWidth,
    tooltipHeight,
    tooltipState,
  })

  const isInteractive = computed(() => {
    return isTooltipInteractive(tooltipState.value.interactionMode)
  })

  const resetTooltipState = () => {
    tooltipState.value.interactionMode = 'idle'
    tooltipState.value.visible = false
    resetAnchor()
    onReset?.()
  }

  const handleTooltipMouseMove = (event: ElementEvent) => {
    if (!isInteractive.value) {
      calculatePosition(event)
    }
  }

  const handleTooltipClick = () => {
    if (tooltipState.value.interactionMode !== 'idle') {
      resetTooltipState()
    } else {
      tooltipState.value.interactionMode = 'interactive'
    }
  }

  const handleTooltipMouseOut = () => {
    if (!isInteractive.value) {
      tooltipState.value.visible = false
      resetAnchor()
    }
  }

  const setInteractionMode = (mode: TooltipInteractionMode) => {
    tooltipState.value.interactionMode = mode
  }

  return {
    tooltipState,
    isInteractive,
    handleTooltipMouseMove,
    handleTooltipClick,
    handleTooltipMouseOut,
    resetTooltipState,
    setInteractionMode,
  }
}
