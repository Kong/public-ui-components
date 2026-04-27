import { ref, onUnmounted, type Ref } from 'vue'
import type { AbsoluteTimeRangeV4 } from '@kong-ui-public/analytics-utilities'
import type { ElementEvent } from 'echarts/core'

type BrushZoomChart = {
  convertFromPixel: (finder: { xAxisIndex: number }, value: number) => number | number[] | undefined
  dispatchAction: (payload: unknown) => void
}

type BrushZoomPayload = {
  areas?: Array<{
    coordRange?: number[]
  }>
}

export interface UseBrushZoomOptions {
  chartRef: Readonly<Ref<BrushZoomChart | undefined>>
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
    const value = chartRef.value?.convertFromPixel({ xAxisIndex: 0 }, e.offsetX)

    return typeof value === 'number' ? value : undefined
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
      if (dragStartX.value !== undefined) {
        setBrush(dragStartX.value, dragStartX.value)
      }
    }, 150)
  }

  const handleMouseMove = (e: ElementEvent) => {
    if (!isSelecting.value || dragStartX.value === undefined) return

    const xNow = xValFromPixel(e)
    if (xNow !== undefined) {
      setBrush(dragStartX.value, xNow)
    }
  }

  const handleMouseUp = (e: ElementEvent) => {
    clearTimeout(dragTimeout.value)
    if (!isSelecting.value) return

    isSelecting.value = false
    const xEnd = xValFromPixel(e)
    if (xEnd !== undefined && dragStartX.value !== undefined) {
      setBrush(dragStartX.value, xEnd)
    }

    chartRef.value?.dispatchAction({
      type: 'takeGlobalCursor',
      key: 'brush',
      brushOption: { brushType: false },
    })

    onSelectionEnd?.(brushTimeRange.value)
  }

  const handleBrush = (e: BrushZoomPayload) => {
    const [start, end] = e.areas?.[0]?.coordRange || []

    if (start === undefined || end === undefined) return

    brushTimeRange.value = {
      type: 'absolute',
      start: new Date(start),
      end: new Date(end),
    }
  }

  onUnmounted(() => {
    if (dragTimeout.value !== undefined) {
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
