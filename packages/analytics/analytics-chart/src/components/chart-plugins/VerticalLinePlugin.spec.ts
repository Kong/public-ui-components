import { afterAll, it, expect, describe, vi } from 'vitest'
import type { Chart as ChartType } from 'chart.js'

vi.mock('chart.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    // @ts-ignore dynamic import
    ...actual,
    Chart: {
      instances: {},
    },
  }
})

import { Chart } from 'chart.js'
import { VerticalLinePlugin } from './VerticalLinePlugin'

describe('VerticalLinePlugin', () => {
  const DEFAULT_X = 10000
  const DEFAULT_TOP = 10000
  const DEFAULT_BOTTOM = 0
  const DEFAULT_ANIMATION_DELAY = 12 // this must be greater than EVENT_THROTTLE_MS

  let originalRequestAnimationFrame: typeof window.requestAnimationFrame
  let lastAnimationFrameTime = 0
  let requestAnimationFrameDelayMs = DEFAULT_ANIMATION_DELAY

  beforeEach(() => {
    // handle request animation frame
    originalRequestAnimationFrame = window.requestAnimationFrame
    window.requestAnimationFrame = vi.fn((callback) => {
      lastAnimationFrameTime += requestAnimationFrameDelayMs
      callback(lastAnimationFrameTime)
      return lastAnimationFrameTime
    })
  })

  afterEach(() => {
    // reset mocks
    vi.restoreAllMocks()

    // reset animation stuff
    lastAnimationFrameTime = 0
    requestAnimationFrameDelayMs = DEFAULT_ANIMATION_DELAY
    window.requestAnimationFrame = originalRequestAnimationFrame

    // reset chartjs instances
    const instanceKeys = Object.keys(Chart.instances)
    instanceKeys.forEach((key) => {
      delete Chart.instances[key]
    })
  })

  afterAll(() => {
    vi.resetAllMocks()
  })

  const triggerMouseMove = (plugin: InstanceType<typeof VerticalLinePlugin>, chart: ChartType) => {
    plugin.afterEvent(chart, { event: { type: 'mousemove' } })
  }

  const triggerMouseOut = (plugin: InstanceType<typeof VerticalLinePlugin>, chart: ChartType) => {
    plugin.afterEvent(chart, { event: { type: 'mouseout' } })
  }

  const getChart = ({
    plugin,
    id,
    tooltipX = DEFAULT_X,
    hasTooltip = false,
  }: {
    plugin: InstanceType<typeof VerticalLinePlugin>
    id?: string
    tooltipX?: number
    hasTooltip?: boolean
  }): ChartType => {
    const getActiveElements = vi.fn(() => hasTooltip ? [{}] : [])

    const chart = {
      id,
      ...(hasTooltip && {
        tooltip: {
          getActiveElements,
          dataPoints: [
            {
              element: {
                x: tooltipX,
              },
            },
          ],
        },
      }),
      ctx: {
        save: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        restore: vi.fn(),
      },
      scales: {
        y: {
          top: DEFAULT_TOP,
          bottom: DEFAULT_BOTTOM,
        },
      },
      update: vi.fn(() => {
        // force a draw event
        plugin.afterDatasetsDraw(chart)
      }),
    } as unknown as ChartType

    Chart.instances[chart.id] = chart

    return chart
  }

  const prepare = ({
    brushGroup,
    chartId = crypto.randomUUID(),
    xClickedSegment,
    xLinkBrush,
    xTooltip,
  }: {
    brushGroup?: string
    chartId?: string
    xClickedSegment?: number
    xLinkBrush?: number
    xTooltip?: number
  } = {}) => {
    const plugin = xLinkBrush !== undefined || brushGroup !== undefined
      ? new VerticalLinePlugin({
        brushGroup: brushGroup ?? crypto.randomUUID(),
        brushStrategy: 'group',
        enableBrushing: true,
      })
      : new VerticalLinePlugin()

    if (xClickedSegment !== undefined) {
      plugin.clickedSegment = {
        element: {
          x: xClickedSegment,
        },
      } as any
    }

    let chart
    if (xTooltip === undefined && xLinkBrush === undefined) {
      // no hover effect, so get defaults
      chart = getChart({
        plugin,
        id: chartId,
        tooltipX: DEFAULT_X,
        hasTooltip: false,
      })
    } else if (xTooltip === undefined) {
      // only xLinkBrush is defined
      chart = getChart({
        plugin,
        id: chartId,
        tooltipX: xLinkBrush,
        hasTooltip: true, // link brushing currently reads from tooltip position
      })
    } else if (xLinkBrush === undefined) {
      // only xTooltip is defined
      chart = getChart({
        plugin,
        id: chartId,
        tooltipX: xTooltip,
        hasTooltip: true,
      })
    } else {
      // when we have both a xLinkBrush and xTooltip, that currently means the
      // xLinkBrush wins (effectively they're the same though) and this case
      // doesn't make a ton of sense, really.
      chart = getChart({
        plugin,
        id: chartId,
        tooltipX: xLinkBrush,
        hasTooltip: true,
      })
    }

    if (xLinkBrush !== undefined) {
      // we're proactively doing this because it simulates how the mouse would
      // enter the chart before any other plugin functions would be called (such
      // as afterDatasetsDraw) and because this is what causes the brushingState
      // to get populated
      triggerMouseMove(plugin, chart)
    }

    return {
      chart,
      plugin,
    }
  }

  const expectDrewOnChart = (chart: ChartType, {
    times = 1,
    x = DEFAULT_X,
    top = DEFAULT_TOP,
    bottom = DEFAULT_BOTTOM,
  }: {
    times?: number
    x?: number
    top?: number
    bottom?: number
  } = {}) => {
    expect(chart.ctx.save).toHaveBeenCalledTimes(times)
    expect(chart.ctx.save).toHaveBeenCalled()
    expect(chart.ctx.moveTo).toHaveBeenCalledWith(x, top)
    expect(chart.ctx.lineTo).toHaveBeenCalledWith(x, bottom)
  }

  const expectNoDrawOnChart = (chart: ChartType) => {
    expect(chart.ctx.save).toHaveBeenCalledTimes(0)
    expect(chart.ctx.moveTo).toHaveBeenCalledTimes(0)
    expect(chart.ctx.lineTo).toHaveBeenCalledTimes(0)
  }

  describe('when afterDatasetsDraw is triggered', () => {
    it.each([
      ['at clicked segment', { xClickedSegment: 999 }, 999],
      ['at clicked segment over everything else 1', { xClickedSegment: 9, xLinkBrush: 8, xTooltip: 7 }, 9],
      ['at clicked segment over everything else 2', { xClickedSegment: 9, xLinkBrush: 8 }, 9],
      ['at clicked segment over everything else 3', { xClickedSegment: 9, xTooltip: 8 }, 9],
      ['at link brush', { xLinkBrush: 999 }, 999],
      ['at link brush over tooltip', { xLinkBrush: 9, xTooltip: 8 }, 9],
      ['at tooltip only when nothing else exists', { xTooltip: 999 }, 999],
    ])('draws a line %s', (title, args, xExpected) => {
      const { chart, plugin } = prepare(args)
      expectNoDrawOnChart(chart)
      plugin.afterDatasetsDraw(chart)
      expectDrewOnChart(chart, { x: xExpected })
    })

    it('if paused, doesn\'t draw a line until resumed', () => {
      const { chart, plugin } = prepare({ xTooltip: 9 })
      expectNoDrawOnChart(chart)

      plugin.pause()
      plugin.afterDatasetsDraw(chart)
      expectNoDrawOnChart(chart)

      plugin.resume()
      plugin.afterDatasetsDraw(chart)
      expectDrewOnChart(chart, { x: 9 })
    })

    it('doesn\'t draw a line if no clicked segment, link brush, nor tooltip', () => {
      const { chart, plugin } = prepare()
      expectNoDrawOnChart(chart)
      plugin.afterDatasetsDraw(chart)
      expectNoDrawOnChart(chart)
    })

    it('draws at the tooltip if the clicked segment is destroyed', () => {
      const { chart, plugin } = prepare({ xClickedSegment: 9, xTooltip: 8 })
      expectNoDrawOnChart(chart)

      plugin.afterDatasetsDraw(chart)
      expectDrewOnChart(chart, { x: 9 })

      plugin.destroyClickedSegment()
      plugin.afterDatasetsDraw(chart)
      expectDrewOnChart(chart, { x: 8, times: 2 })
    })
  })

  describe('when afterEvent is triggered', () => {
    it('does nothing if link brushing is not enabled', () => {
      const { chart, plugin } = prepare({ xTooltip: 8 })
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(0)
      triggerMouseMove(plugin, chart)
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(0)
    })

    it('requestAnimationFrame is called if linkBrushing is enabled', () => {
      const { chart, plugin } = prepare({ xLinkBrush: 8 })
      // `prepare` automatically calls it once
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1)

      triggerMouseMove(plugin, chart)

      // this is the call from this test
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(2)
    })

    it('requestAnimationFrame is only called if it\'s a mousemove or mouseout event', () => {
      const { chart, plugin } = prepare({ xLinkBrush: 8 })
      // `prepare` automatically calls it once
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1)

      plugin.afterEvent(chart, { event: { type: 'mousemove' } })
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(2)

      plugin.afterEvent(chart, { event: { type: 'mouseout' } })
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(3)

      // ignored
      plugin.afterEvent(chart, { event: { type: 'mouseover' } })
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(3)

      // ignored
      plugin.afterEvent(chart, { event: { type: 'click' } })
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(3)
    })

    it('throttles multiple mouse events', () => {
      // forces initial draw for test setup to be at 20 ms
      requestAnimationFrameDelayMs = 20

      const { chart: aChart, plugin: aPlugin } = prepare({ xLinkBrush: 8, brushGroup: 'a' })
      const { chart: bChart } = prepare({ brushGroup: 'a' })

      // internal tracked time for last mousemove should be `20`
      // forces each subsequent mousemove to be treated as if it happened 3 ms apart
      requestAnimationFrameDelayMs = 3

      expectNoDrawOnChart(aChart)
      expectNoDrawOnChart(bChart)

      aPlugin.afterDatasetsDraw(aChart)
      expectDrewOnChart(aChart, { x: 8, times: 1 })

      triggerMouseMove(aPlugin, aChart)
      triggerMouseMove(aPlugin, aChart)
      triggerMouseMove(aPlugin, aChart)
      // internal tracked time for last mousemove should now be `29`

      expectDrewOnChart(aChart, { x: 8, times: 1 })
      expectNoDrawOnChart(bChart) // because only 9ms have elapsed since the last mousemove

      triggerMouseMove(aPlugin, aChart)
      // internal tracked time for last mousemove should now be `32` which
      // should be enough to trigger a drawing
      expectDrewOnChart(aChart, { x: 8, times: 1 })
      expectDrewOnChart(bChart, { x: 8, times: 1 }) // because now 12ms have elapsed
    })

    it('mousemove triggers redraw in other charts with linked brushes', () => {
      const { chart: aChart, plugin: aPlugin } = prepare({ xLinkBrush: 8, brushGroup: 'a' })
      const { chart: bChart, plugin: bPlugin } = prepare({ xClickedSegment: 4, brushGroup: 'a' })

      expectNoDrawOnChart(aChart)
      expectNoDrawOnChart(bChart)

      aPlugin.afterDatasetsDraw(aChart) // we should have a drawing at 8
      expectDrewOnChart(aChart, { x: 8, times: 1 })
      expectNoDrawOnChart(bChart)

      triggerMouseMove(aPlugin, aChart)
      expectDrewOnChart(aChart, { x: 8, times: 1 }) // shouldn't draw again on aChart
      expectDrewOnChart(bChart, { x: 4, times: 1 }) // bChart has a clickedSegment, it wins

      bPlugin.destroyClickedSegment() // remove the clicked segment
      triggerMouseMove(aPlugin, aChart)
      expectDrewOnChart(aChart, { x: 8, times: 1 }) // shouldn't draw again on aChart
      expectDrewOnChart(bChart, { x: 8, times: 2 }) // bChart should match aChart now
    })

    it('mousemove triggers redraw only in charts with the same brushGroup', () => {
      const { chart: aChart, plugin: aPlugin } = prepare({ xLinkBrush: 8, brushGroup: 'a' })
      const { chart: bChart } = prepare({ brushGroup: 'a' })
      const { chart: cChart } = prepare({ brushGroup: 'c' })

      expectNoDrawOnChart(aChart)
      expectNoDrawOnChart(bChart)
      expectNoDrawOnChart(cChart)

      aPlugin.afterDatasetsDraw(aChart)
      expectDrewOnChart(aChart, { x: 8, times: 1 })
      expectNoDrawOnChart(bChart)
      expectNoDrawOnChart(cChart)

      triggerMouseMove(aPlugin, aChart)
      expectDrewOnChart(aChart, { x: 8, times: 1 }) // shouldn't draw again on aChart
      expectDrewOnChart(bChart, { x: 8, times: 1 }) // bChart should match aChart
      expectNoDrawOnChart(cChart)
    })

    it('mouseout triggers redraw in other charts with linked brushes', () => {
      const { chart: aChart, plugin: aPlugin } = prepare({ xLinkBrush: 8, brushGroup: 'a' })
      const { chart: bChart } = prepare({ brushGroup: 'a' })

      expectNoDrawOnChart(aChart)
      expectNoDrawOnChart(bChart)

      aPlugin.afterDatasetsDraw(aChart)
      expectDrewOnChart(aChart, { x: 8, times: 1 })
      expectNoDrawOnChart(bChart)

      triggerMouseOut(aPlugin, aChart)
      triggerMouseOut(aPlugin, aChart)
      expectDrewOnChart(aChart, { x: 8, times: 1 }) // didn't draw again (which removes the line)
      expectNoDrawOnChart(bChart) // we don't draw a line on mouseout
    })
  })
})

