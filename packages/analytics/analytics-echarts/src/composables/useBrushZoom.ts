import { ref, onUnmounted, type ShallowRef } from 'vue'
import type { AbsoluteTimeRangeV4 } from '@kong-ui-public/analytics-utilities'
import type { ElementEvent } from 'echarts/core'

export interface UseBrushZoomOptions {
  chartRef: Readonly<ShallowRef<any>>
  onSelectionStart?: () => void
  onSelectionEnd?: (timeRange: AbsoluteTimeRangeV4 | undefined) => void
}

export default function useBrushZoom(options: UseBrushZoomOptions) {
  const { chartRef, onSelectionStart, onSelectionEnd } = options

  const isSelecting = ref(false)
  const dragTimeout = ref<number | undefined>(undefined)
  const dragStartX = ref<number | undefined>(undefined)
  const brushTimeRange = ref<AbsoluteTimeRangeV4 | undefined>(undefined)

  const xValFromPixel = (e: ElementEvent): number | undefined => {
    return chartRef.value?.convertFromPixel({ xAxisIndex: 0 }, e.offsetX)
  }

  const setBrush = (min: number, max: number) => {
    chartRef.value?.dispatchAction({
      type: 'brush',
      areas: [{
        brushType: 'lineX',
        xAxisIndex: 0,
        coordRange: [Math.min(min, max), Math.max(min, max)],
      }],
    })
  }

  const clearBrush = () => {
    isSelecting.value = false
    dragStartX.value = undefined
    brushTimeRange.value = undefined
    chartRef.value?.dispatchAction({
      type: 'brush',
      command: 'clear',
      areas: [],
    })
  }

  const handleMouseDown = (e: ElementEvent) => {
    dragTimeout.value = window.setTimeout(() => {
      isSelecting.value = true
      onSelectionStart?.()

      chartRef.value?.dispatchAction({
        type: 'takeGlobalCursor',
        key: 'brush',
        brushOption: {
          brushType: 'lineX',
          brushMode: 'single',
          xAxisIndex: 0,
        },
      })
      chartRef.value?.dispatchAction({
        type: 'takeGlobalCursor',
        key: 'brush',
        brushOption: { brushType: false },
      })

      dragStartX.value = xValFromPixel(e)
      if (dragStartX.value) {
        setBrush(dragStartX.value, dragStartX.value)
      }
    }, 150)
  }

  const handleMouseMove = (e: ElementEvent) => {
    if (!isSelecting.value || !dragStartX.value) return

    const xNow = xValFromPixel(e)
    if (xNow) {
      setBrush(dragStartX.value, xNow)
    }
  }

  const handleMouseUp = (e: ElementEvent) => {
    clearTimeout(dragTimeout.value)
    if (!isSelecting.value) return

    isSelecting.value = false
    const xEnd = xValFromPixel(e)
    if (xEnd && dragStartX.value) {
      setBrush(dragStartX.value, xEnd)
    }

    chartRef.value?.dispatchAction({
      type: 'takeGlobalCursor',
      key: 'brush',
      brushOption: { brushType: false },
    })

    onSelectionEnd?.(brushTimeRange.value)
  }

  const handleBrush = (e: any) => {
    if (!e.areas?.[0]?.coordRange) return

    brushTimeRange.value = {
      type: 'absolute',
      start: new Date(e.areas[0].coordRange[0]),
      end: new Date(e.areas[0].coordRange[1]),
    }
  }

  onUnmounted(() => {
    if (dragTimeout.value) {
      clearTimeout(dragTimeout.value)
    }
  })

  return {
    isSelecting,
    brushTimeRange,
    clearBrush,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleBrush,
  }
}
