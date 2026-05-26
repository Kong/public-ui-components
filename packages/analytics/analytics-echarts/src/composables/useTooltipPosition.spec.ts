import { nextTick, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import type { ElementEvent } from 'echarts/core'
import type { TooltipState } from '../types'
import useTooltipPosition from './useTooltipPosition'

const createTooltipState = () => ref<TooltipState>({
  interactionMode: 'idle',
  entries: [],
  visible: false,
  top: 0,
  left: 0,
})

const createEvent = ({ offsetX, offsetY }: { offsetX: number, offsetY: number }) => {
  return { offsetX, offsetY } as ElementEvent
}

describe('useTooltipPosition', () => {
  it('writes absolute tooltip coordinates and reapplies the chart-relative anchor on container movement', async () => {
    const tooltipState = createTooltipState()
    const containerTop = ref(10)
    const containerLeft = ref(20)

    const { calculatePosition } = useTooltipPosition({
      chartWidth: ref(200),
      chartHeight: ref(100),
      containerTop,
      containerLeft,
      tooltipWidth: ref(30),
      tooltipHeight: ref(20),
      tooltipState,
    })

    calculatePosition(createEvent({ offsetX: 40, offsetY: 20 }))

    expect(tooltipState.value.left).toBe(100)
    expect(tooltipState.value.top).toBe(70)

    containerTop.value = 50
    containerLeft.value = 35
    await nextTick()

    expect(tooltipState.value.left).toBe(115)
    expect(tooltipState.value.top).toBe(110)
  })

  it('stops re-anchoring after resetAnchor is called', async () => {
    const tooltipState = createTooltipState()
    const containerTop = ref(10)
    const containerLeft = ref(20)

    const { calculatePosition, resetAnchor } = useTooltipPosition({
      chartWidth: ref(200),
      chartHeight: ref(100),
      containerTop,
      containerLeft,
      tooltipWidth: ref(30),
      tooltipHeight: ref(20),
      tooltipState,
    })

    calculatePosition(createEvent({ offsetX: 40, offsetY: 20 }))
    resetAnchor()

    containerTop.value = 50
    containerLeft.value = 35
    await nextTick()

    expect(tooltipState.value.left).toBe(100)
    expect(tooltipState.value.top).toBe(70)
  })

  it('preserves the existing flip logic when the pointer is past the chart midpoint', () => {
    const tooltipState = createTooltipState()

    const { calculatePosition } = useTooltipPosition({
      chartWidth: ref(200),
      chartHeight: ref(100),
      containerTop: ref(10),
      containerLeft: ref(20),
      tooltipWidth: ref(30),
      tooltipHeight: ref(20),
      tooltipState,
    })

    calculatePosition(createEvent({ offsetX: 150, offsetY: 80 }))

    expect(tooltipState.value.left).toBe(100)
    expect(tooltipState.value.top).toBe(30)
  })
})
