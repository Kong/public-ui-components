import { nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { ElementEvent } from 'echarts/core'
import useEchartsTooltipController from './useEchartsTooltipController'

const createEvent = ({ offsetX, offsetY }: { offsetX: number, offsetY: number }) => {
  return { offsetX, offsetY } as ElementEvent
}

describe('useEchartsTooltipController', () => {
  it('initializes tooltip state and positions on mouse move when not interactive', () => {
    const controller = useEchartsTooltipController({
      chartWidth: ref(200),
      chartHeight: ref(100),
      containerTop: ref(10),
      containerLeft: ref(20),
      tooltipWidth: ref(30),
      tooltipHeight: ref(20),
    })

    expect(controller.tooltipState.value.interactionMode).toBe('idle')
    expect(controller.tooltipState.value.visible).toBe(false)

    controller.handleTooltipMouseMove(createEvent({ offsetX: 40, offsetY: 20 }))

    expect(controller.tooltipState.value.left).toBe(100)
    expect(controller.tooltipState.value.top).toBe(70)
  })

  it('toggles interactive mode and does not reposition while interactive', () => {
    const controller = useEchartsTooltipController({
      chartWidth: ref(200),
      chartHeight: ref(100),
      containerTop: ref(10),
      containerLeft: ref(20),
      tooltipWidth: ref(30),
      tooltipHeight: ref(20),
    })

    controller.handleTooltipMouseMove(createEvent({ offsetX: 40, offsetY: 20 }))
    controller.handleTooltipClick()

    expect(controller.tooltipState.value.interactionMode).toBe('interactive')

    controller.handleTooltipMouseMove(createEvent({ offsetX: 150, offsetY: 80 }))

    expect(controller.tooltipState.value.left).toBe(100)
    expect(controller.tooltipState.value.top).toBe(70)

    controller.handleTooltipClick()

    expect(controller.tooltipState.value.interactionMode).toBe('idle')
    expect(controller.tooltipState.value.visible).toBe(false)
  })

  it('clears the anchor on mouseout and reset, and runs onReset', async () => {
    const containerTop = ref(10)
    const containerLeft = ref(20)
    const onReset = vi.fn()
    const controller = useEchartsTooltipController({
      chartWidth: ref(200),
      chartHeight: ref(100),
      containerTop,
      containerLeft,
      tooltipWidth: ref(30),
      tooltipHeight: ref(20),
      onReset,
    })

    controller.handleTooltipMouseMove(createEvent({ offsetX: 40, offsetY: 20 }))
    controller.handleTooltipMouseOut()

    containerTop.value = 50
    containerLeft.value = 35
    await nextTick()

    expect(controller.tooltipState.value.left).toBe(100)
    expect(controller.tooltipState.value.top).toBe(70)

    controller.resetTooltipState()

    expect(controller.tooltipState.value.interactionMode).toBe('idle')
    expect(controller.tooltipState.value.visible).toBe(false)
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('supports selection modes through shared interaction classification', () => {
    const controller = useEchartsTooltipController({
      chartWidth: ref(200),
      chartHeight: ref(100),
      containerTop: ref(10),
      containerLeft: ref(20),
      tooltipWidth: ref(30),
      tooltipHeight: ref(20),
    })

    controller.setInteractionMode('selecting-chart-area')
    expect(controller.tooltipState.value.interactionMode).toBe('selecting-chart-area')
    expect(controller.isInteractive.value).toBe(false)

    controller.setInteractionMode('zoom-interactive')
    expect(controller.isInteractive.value).toBe(true)
  })

  it('keeps following the pointer while selecting-chart-area is active but does not hide on mouseout', () => {
    const controller = useEchartsTooltipController({
      chartWidth: ref(200),
      chartHeight: ref(100),
      containerTop: ref(10),
      containerLeft: ref(20),
      tooltipWidth: ref(30),
      tooltipHeight: ref(20),
    })

    controller.handleTooltipMouseMove(createEvent({ offsetX: 40, offsetY: 20 }))
    controller.tooltipState.value.visible = true
    controller.setInteractionMode('selecting-chart-area')

    controller.handleTooltipMouseMove(createEvent({ offsetX: 150, offsetY: 80 }))
    controller.handleTooltipMouseOut()

    expect(controller.tooltipState.value.left).toBe(100)
    expect(controller.tooltipState.value.top).toBe(30)
    expect(controller.tooltipState.value.visible).toBe(true)
  })
})
