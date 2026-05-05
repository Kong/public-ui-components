import { describe, expect, it, vi } from 'vitest'
import { defineComponent, shallowRef } from 'vue'
import type { ElementEvent } from 'echarts/core'
import { mount } from '@vue/test-utils'
import useBrushZoom from './useBrushZoom'

const createEvent = (offsetX: number) => ({ offsetX } as ElementEvent)

describe('useBrushZoom', () => {
  it('supports selections that start and end at zero', () => {
    vi.useFakeTimers()

    const dispatchAction = vi.fn()
    const onSelectionEnd = vi.fn()
    const chartRef = shallowRef({
      convertFromPixel: vi.fn((_axis, offsetX: number) => offsetX),
      dispatchAction,
    })
    let brush!: ReturnType<typeof useBrushZoom>

    const wrapper = mount(defineComponent({
      setup() {
        brush = useBrushZoom({
          chartRef,
          onSelectionEnd,
        })

        return () => null
      },
    }))

    brush.handleMouseDown(createEvent(0))
    vi.advanceTimersByTime(151)

    brush.handleBrush({
      areas: [{ coordRange: [0, 5] }],
    })
    brush.handleMouseMove(createEvent(0))
    brush.handleMouseUp(createEvent(0))
    wrapper.unmount()

    expect(dispatchAction).toHaveBeenCalledWith(expect.objectContaining({
      type: 'brush',
      areas: [expect.objectContaining({
        coordRange: [0, 0],
      })],
    }))
    expect(brush.brushTimeRange.value).toEqual({
      type: 'absolute',
      start: new Date(0),
      end: new Date(5),
    })
    expect(onSelectionEnd).toHaveBeenCalledWith({
      type: 'absolute',
      start: new Date(0),
      end: new Date(5),
    })

    vi.useRealTimers()
  })
})
