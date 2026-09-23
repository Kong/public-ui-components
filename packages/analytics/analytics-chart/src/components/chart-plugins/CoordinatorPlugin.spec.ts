import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { Chart as ChartType } from 'chart.js'
import { useInteractionCoordinator } from '@kong-ui-public/analytics-utilities'
import { CoordinatorPlugin } from './CoordinatorPlugin'

describe('CoordinatorPlugin', () => {
  const DEFAULT_TOP = 10000
  const DEFAULT_BOTTOM = 0
  const DEFAULT_X_PIXEL = 500
  const OTHER_CHART_UUID = 'other-chart-uuid'

  let originalRequestAnimationFrame: typeof window.requestAnimationFrame

  beforeEach(() => {
    originalRequestAnimationFrame = window.requestAnimationFrame
    window.requestAnimationFrame = vi.fn((callback) => {
      callback(0)
      return 0
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    window.requestAnimationFrame = originalRequestAnimationFrame
  })

  const getChart = ({
    type = 'bar',
    datasets = [],
    xPixelForValue = DEFAULT_X_PIXEL,
    elementsAtEventForMode = [] as any[],
  }: {
    type?: string
    datasets?: any[]
    xPixelForValue?: number
    elementsAtEventForMode?: any[]
  } = {}): ChartType => {
    return {
      config: { type },
      data: { datasets },
      scales: {
        x: { getPixelForValue: vi.fn(() => xPixelForValue) },
        y: { top: DEFAULT_TOP, bottom: DEFAULT_BOTTOM },
      },
      ctx: {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        globalAlpha: 1,
      },
      getElementsAtEventForMode: vi.fn(() => elementsAtEventForMode),
      setActiveElements: vi.fn(),
      draw: vi.fn(),
      update: vi.fn(),
    } as unknown as ChartType
  }

  describe('constructor', () => {
    it('defaults optional flags to false when only a coordinator is provided', () => {
      const coordinator = useInteractionCoordinator()
      const plugin = new CoordinatorPlugin({ coordinator })

      expect(plugin.coordinator).toBe(coordinator)
      expect(plugin.requiresUpdate).toBe(false)
      expect(plugin.triggerOnSelf).toBe(false)
      expect(plugin.watchTimestamp).toBe(false)
      expect(plugin.watchDimension).toBe(false)
      expect(plugin.instanceId).toBeTruthy()
    })

    it('uses the provided flags and generates a unique instanceId per instance', () => {
      const coordinator = useInteractionCoordinator()
      const plugin = new CoordinatorPlugin({
        coordinator,
        requiresUpdate: true,
        triggerOnSelf: true,
        watchTimestamp: true,
        watchDimension: true,
      })
      const plugin2 = new CoordinatorPlugin({ coordinator })

      expect(plugin.requiresUpdate).toBe(true)
      expect(plugin.triggerOnSelf).toBe(true)
      expect(plugin.watchTimestamp).toBe(true)
      expect(plugin.watchDimension).toBe(true)
      expect(plugin.instanceId).not.toBe(plugin2.instanceId)
    })
  })

  describe('afterInit', () => {
    it('does nothing when there is no coordinator', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null })
      const chart = getChart()

      plugin.afterInit(chart)

      expect(plugin.stopWatcher).toBeUndefined()
    })

    it('wires up a redraw that calls chart.draw() by default when a watched value changes', async () => {
      const coordinator = useInteractionCoordinator()
      const plugin = new CoordinatorPlugin({ coordinator, watchTimestamp: true })
      const chart = getChart()

      plugin.afterInit(chart)
      expect(plugin.stopWatcher).toBeInstanceOf(Function)

      coordinator.activate({ chartUuid: OTHER_CHART_UUID, timestamp: 123 })
      await nextTick()

      expect(chart.draw).toHaveBeenCalledTimes(1)
      expect(chart.update).not.toHaveBeenCalled()
    })

    it('wires up a redraw that calls chart.update("none") when requiresUpdate is true', async () => {
      const coordinator = useInteractionCoordinator()
      const plugin = new CoordinatorPlugin({ coordinator, watchTimestamp: true, requiresUpdate: true })
      const chart = getChart()

      plugin.afterInit(chart)
      coordinator.activate({ chartUuid: OTHER_CHART_UUID, timestamp: 123 })
      await nextTick()

      expect(chart.update).toHaveBeenCalledWith('none')
    })
  })

  describe('afterEvent', () => {
    it('does nothing when there is no coordinator', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null })
      const chart = getChart()

      plugin.afterEvent(chart, { event: { type: 'mousemove' } as any })

      expect(window.requestAnimationFrame).not.toHaveBeenCalled()
    })

    it('schedules a mouse brush check on mousemove and mouseout only', () => {
      const coordinator = useInteractionCoordinator()
      const plugin = new CoordinatorPlugin({ coordinator })
      const chart = getChart()

      plugin.afterEvent(chart, { event: { type: 'mousemove', native: { type: 'mousemove' } } as any })
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1)

      plugin.afterEvent(chart, { event: { type: 'mouseout', native: { type: 'mouseout' } } as any })
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(2)

      plugin.afterEvent(chart, { event: { type: 'click', native: { type: 'click' } } as any })
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(2)
    })
  })

  describe('beforeDatasetDraw', () => {
    it('does nothing when there is no coordinator', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null, watchDimension: true })
      const highlightSpy = vi.spyOn(plugin, '_highlightDimensionDefault')
      const chart = getChart()

      plugin.beforeDatasetDraw(chart, { index: 0 })

      expect(highlightSpy).not.toHaveBeenCalled()
    })

    it('does nothing when watchDimension is false', () => {
      const coordinator = useInteractionCoordinator()
      const plugin = new CoordinatorPlugin({ coordinator, watchDimension: false })
      const highlightSpy = vi.spyOn(plugin, '_highlightDimensionDefault')
      const chart = getChart()

      plugin.beforeDatasetDraw(chart, { index: 0 })

      expect(highlightSpy).not.toHaveBeenCalled()
    })

    it('does nothing when this chart is the active chart and triggerOnSelf is false', () => {
      const coordinator = useInteractionCoordinator()
      const plugin = new CoordinatorPlugin({ coordinator, watchDimension: true, triggerOnSelf: false })
      const highlightSpy = vi.spyOn(plugin, '_highlightDimensionDefault')
      const chart = getChart()

      coordinator.activate({ chartUuid: plugin.instanceId, dimension: 'd', dimensionValue: 'v' })
      plugin.beforeDatasetDraw(chart, { index: 0 })

      expect(highlightSpy).not.toHaveBeenCalled()
    })

    it('delegates to _highlightDimensionDonut for doughnut charts', () => {
      const coordinator = useInteractionCoordinator()
      const plugin = new CoordinatorPlugin({ coordinator, watchDimension: true })
      const donutSpy = vi.spyOn(plugin, '_highlightDimensionDonut').mockImplementation(() => {})
      const defaultSpy = vi.spyOn(plugin, '_highlightDimensionDefault').mockImplementation(() => {})
      const chart = getChart({ type: 'doughnut' })

      plugin.beforeDatasetDraw(chart, { index: 0 })

      expect(donutSpy).toHaveBeenCalledWith(chart)
      expect(defaultSpy).not.toHaveBeenCalled()
    })

    it('delegates to _highlightDimensionDefault for non-doughnut charts', () => {
      const coordinator = useInteractionCoordinator()
      const plugin = new CoordinatorPlugin({ coordinator, watchDimension: true })
      const donutSpy = vi.spyOn(plugin, '_highlightDimensionDonut').mockImplementation(() => {})
      const defaultSpy = vi.spyOn(plugin, '_highlightDimensionDefault').mockImplementation(() => {})
      const chart = getChart({ type: 'bar' })
      const args = { index: 0 }

      plugin.beforeDatasetDraw(chart, args)

      expect(defaultSpy).toHaveBeenCalledWith(chart, args)
      expect(donutSpy).not.toHaveBeenCalled()
    })
  })

  describe('afterDatasetsDraw', () => {
    it('always resets globalAlpha to 1', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null })
      const chart = getChart()
      chart.ctx.globalAlpha = 0.3

      plugin.afterDatasetsDraw(chart)

      expect(chart.ctx.save).toHaveBeenCalled()
      expect(chart.ctx.globalAlpha).toBe(1)
    })

    it('does not draw a line when there is no coordinator', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null, watchTimestamp: true })
      const chart = getChart()

      plugin.afterDatasetsDraw(chart)

      expect(chart.ctx.moveTo).not.toHaveBeenCalled()
    })

    it('does not draw a line when watchTimestamp is false', () => {
      const coordinator = useInteractionCoordinator()
      coordinator.activate({ chartUuid: OTHER_CHART_UUID, timestamp: 123 })
      const plugin = new CoordinatorPlugin({ coordinator, watchTimestamp: false })
      const chart = getChart()

      plugin.afterDatasetsDraw(chart)

      expect(chart.ctx.moveTo).not.toHaveBeenCalled()
    })

    it('does not draw a line when there is no activeTimestamp', () => {
      const coordinator = useInteractionCoordinator()
      const plugin = new CoordinatorPlugin({ coordinator, watchTimestamp: true })
      const chart = getChart()

      plugin.afterDatasetsDraw(chart)

      expect(chart.ctx.moveTo).not.toHaveBeenCalled()
    })

    it('does not draw a line when this chart is active and triggerOnSelf is false', () => {
      const coordinator = useInteractionCoordinator()
      const plugin = new CoordinatorPlugin({ coordinator, watchTimestamp: true, triggerOnSelf: false })
      coordinator.activate({ chartUuid: plugin.instanceId, timestamp: 123 })
      const chart = getChart()

      plugin.afterDatasetsDraw(chart)

      expect(chart.ctx.moveTo).not.toHaveBeenCalled()
    })

    it('draws a vertical line at the pixel for the activeTimestamp when conditions are met', () => {
      const coordinator = useInteractionCoordinator()
      const plugin = new CoordinatorPlugin({ coordinator, watchTimestamp: true })
      coordinator.activate({ chartUuid: OTHER_CHART_UUID, timestamp: 123 })
      const chart = getChart({ xPixelForValue: 42 })

      plugin.afterDatasetsDraw(chart)

      expect(chart.scales.x.getPixelForValue).toHaveBeenCalledWith(123)
      expect(chart.ctx.moveTo).toHaveBeenCalledWith(42, DEFAULT_TOP)
      expect(chart.ctx.lineTo).toHaveBeenCalledWith(42, DEFAULT_BOTTOM)
    })
  })

  describe('beforeDestroy', () => {
    it('does not throw when there is no stopWatcher', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null })

      expect(() => plugin.beforeDestroy()).not.toThrow()
    })

    it('calls stopWatcher when one is set', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null })
      const stopWatcher = vi.fn()
      plugin.stopWatcher = stopWatcher

      plugin.beforeDestroy()

      expect(stopWatcher).toHaveBeenCalledTimes(1)
    })
  })

  describe('_watchTimestamp', () => {
    it('returns undefined when there is no coordinator', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null, watchTimestamp: true })

      expect(plugin._watchTimestamp(vi.fn())).toBeUndefined()
    })

    it('returns undefined when watchTimestamp is false', () => {
      const coordinator = useInteractionCoordinator()
      const plugin = new CoordinatorPlugin({ coordinator, watchTimestamp: false })

      expect(plugin._watchTimestamp(vi.fn())).toBeUndefined()
    })

    it('calls redraw when another chart activates a timestamp', async () => {
      const coordinator = useInteractionCoordinator()
      const plugin = new CoordinatorPlugin({ coordinator, watchTimestamp: true })
      const redraw = vi.fn()
      plugin._watchTimestamp(redraw)

      coordinator.activate({ chartUuid: OTHER_CHART_UUID, timestamp: 123 })
      await nextTick()

      expect(redraw).toHaveBeenCalledTimes(1)
    })

    it('does not call redraw when this chart activates and triggerOnSelf is false', async () => {
      const coordinator = useInteractionCoordinator()
      const plugin = new CoordinatorPlugin({ coordinator, watchTimestamp: true, triggerOnSelf: false })
      const redraw = vi.fn()
      plugin._watchTimestamp(redraw)

      coordinator.activate({ chartUuid: plugin.instanceId, timestamp: 123 })
      await nextTick()

      expect(redraw).not.toHaveBeenCalled()
    })

    it('calls redraw even when this chart activates if triggerOnSelf is true', async () => {
      const coordinator = useInteractionCoordinator()
      const plugin = new CoordinatorPlugin({ coordinator, watchTimestamp: true, triggerOnSelf: true })
      const redraw = vi.fn()
      plugin._watchTimestamp(redraw)

      coordinator.activate({ chartUuid: plugin.instanceId, timestamp: 123 })
      await nextTick()

      expect(redraw).toHaveBeenCalledTimes(1)
    })
  })

  describe('_watchDimension', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    it('returns undefined when there is no coordinator', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null, watchDimension: true })

      expect(plugin._watchDimension(vi.fn())).toBeUndefined()
    })

    it('returns undefined when watchDimension is false', () => {
      const coordinator = useInteractionCoordinator()
      const plugin = new CoordinatorPlugin({ coordinator, watchDimension: false })

      expect(plugin._watchDimension(vi.fn())).toBeUndefined()
    })

    it('debounces updates to activeDimension/activeDimensionValue and calls redraw', async () => {
      const coordinator = useInteractionCoordinator()
      const plugin = new CoordinatorPlugin({ coordinator, watchDimension: true })
      const redraw = vi.fn()
      plugin._watchDimension(redraw)

      coordinator.activate({ chartUuid: OTHER_CHART_UUID, dimension: 'dim1', dimensionValue: 'val1' })
      await vi.waitFor(() => nextTick())

      // still debounced, nothing applied yet
      expect(plugin.activeDimension).toBeNull()
      expect(redraw).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(coordinator.DIMENSION_DEBOUNCE_MS)

      expect(plugin.activeDimension).toBe('dim1')
      expect(plugin.activeDimensionValue).toBe('val1')
      expect(redraw).toHaveBeenCalledTimes(1)
    })

    it('only applies the most recent values when changes happen faster than the debounce', async () => {
      const coordinator = useInteractionCoordinator()
      const plugin = new CoordinatorPlugin({ coordinator, watchDimension: true })
      const redraw = vi.fn()
      plugin._watchDimension(redraw)

      coordinator.activate({ chartUuid: OTHER_CHART_UUID, dimension: 'dim1', dimensionValue: 'val1' })
      await vi.waitFor(() => nextTick())
      await vi.advanceTimersByTimeAsync(coordinator.DIMENSION_DEBOUNCE_MS / 2)

      coordinator.activate({ chartUuid: OTHER_CHART_UUID, dimension: 'dim2', dimensionValue: 'val2' })
      await vi.waitFor(() => nextTick())
      await vi.advanceTimersByTimeAsync(coordinator.DIMENSION_DEBOUNCE_MS)

      expect(plugin.activeDimension).toBe('dim2')
      expect(plugin.activeDimensionValue).toBe('val2')
      expect(redraw).toHaveBeenCalledTimes(1)
    })

    it('immediately nulls out activeDimension/activeDimensionValue when they are deactivated', async () => {
      const coordinator = useInteractionCoordinator()
      const plugin = new CoordinatorPlugin({ coordinator, watchDimension: true })
      plugin._watchDimension(vi.fn())

      coordinator.activate({ chartUuid: OTHER_CHART_UUID, dimension: 'dim1', dimensionValue: 'val1' })
      await vi.waitFor(() => nextTick())
      await vi.advanceTimersByTimeAsync(coordinator.DIMENSION_DEBOUNCE_MS)
      expect(plugin.activeDimension).toBe('dim1')

      coordinator.deactivate({ chartUuid: OTHER_CHART_UUID })
      await vi.waitFor(() => nextTick())

      // nulled out synchronously, before the debounce timeout fires
      expect(plugin.activeDimension).toBeNull()
      expect(plugin.activeDimensionValue).toBeNull()
    })
  })

  describe('_onMouseBrush', () => {
    it('does nothing when there is no coordinator', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null })
      const chart = getChart()

      expect(() => plugin._onMouseBrush({ type: 'mousemove' } as any, chart, 0)).not.toThrow()
    })

    it('activates the coordinator on mousemove with the derived timestamp and dimension', () => {
      const coordinator = useInteractionCoordinator()
      const activateSpy = vi.spyOn(coordinator, 'activate')
      const plugin = new CoordinatorPlugin({ coordinator, watchTimestamp: true })
      const dataset = { dimension: 'dim1', dimensionValue: 'val1', data: [{ x: 555, y: 1 }] }
      const chart = getChart({
        type: 'bar',
        datasets: [dataset],
        elementsAtEventForMode: [{ datasetIndex: 0, index: 0 }],
      })

      plugin._onMouseBrush({ type: 'mousemove' } as any, chart, 100)

      expect(activateSpy).toHaveBeenCalledWith({
        chartUuid: plugin.instanceId,
        timestamp: 555,
        dimension: 'dim1',
        dimensionValue: 'val1',
      })
      expect(plugin.lastMouseBrushEvent).toBe(100)
    })

    it('deactivates the coordinator on mouseout', () => {
      const coordinator = useInteractionCoordinator()
      const deactivateSpy = vi.spyOn(coordinator, 'deactivate')
      const plugin = new CoordinatorPlugin({ coordinator })
      const chart = getChart()

      plugin._onMouseBrush({ type: 'mouseout' } as any, chart, 100)

      expect(deactivateSpy).toHaveBeenCalledWith({ chartUuid: plugin.instanceId })
      expect(plugin.lastMouseBrushEvent).toBe(100)
    })

    it('throttles rapid mousemove events', () => {
      const coordinator = useInteractionCoordinator()
      const activateSpy = vi.spyOn(coordinator, 'activate')
      const plugin = new CoordinatorPlugin({ coordinator })
      const chart = getChart()

      const throttle = Math.min(coordinator.TIMESTAMP_DEBOUNCE_MS, coordinator.DIMENSION_DEBOUNCE_MS)

      plugin._onMouseBrush({ type: 'mousemove' } as any, chart, 1000)
      expect(activateSpy).toHaveBeenCalledTimes(1)

      // within the throttle window, ignored
      plugin._onMouseBrush({ type: 'mousemove' } as any, chart, 1000 + throttle - 1)
      expect(activateSpy).toHaveBeenCalledTimes(1)

      // past the throttle window
      plugin._onMouseBrush({ type: 'mousemove' } as any, chart, 1000 + throttle)
      expect(activateSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('_highlightDimensionDefault', () => {
    it('sets globalAlpha to 1 when there is no activeDimension/activeDimensionValue', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null })
      const chart = getChart({ datasets: [{ dimension: 'dim1', dimensionValue: 'val1' }] })
      chart.ctx.globalAlpha = 0.3

      plugin._highlightDimensionDefault(chart, { index: 0 })

      expect(chart.ctx.globalAlpha).toBe(1)
    })

    it('sets globalAlpha to 1 for the matching dataset and 0.3 for the rest', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null })
      plugin.activeDimension = 'dim1'
      plugin.activeDimensionValue = 'val1'
      const chart = getChart({
        datasets: [
          { dimension: 'dim1', dimensionValue: 'val1' },
          { dimension: 'dim1', dimensionValue: 'val2' },
        ],
      })

      plugin._highlightDimensionDefault(chart, { index: 0 })
      expect(chart.ctx.globalAlpha).toBe(1)

      plugin._highlightDimensionDefault(chart, { index: 1 })
      expect(chart.ctx.globalAlpha).toBe(0.3)
    })

    it('leaves globalAlpha untouched when no dataset matches the active dimension', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null })
      plugin.activeDimension = 'dim1'
      plugin.activeDimensionValue = 'val1'
      const chart = getChart({ datasets: [{ dimension: 'other-dim', dimensionValue: 'other-val' }] })
      chart.ctx.globalAlpha = 0.75

      plugin._highlightDimensionDefault(chart, { index: 0 })

      expect(chart.ctx.globalAlpha).toBe(0.75)
    })
  })

  describe('_highlightDimensionDonut', () => {
    it('sets no active elements when there is no activeDimension/activeDimensionValue', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null })
      const chart = getChart({ datasets: [{ dimension: 'dim1', dimensionValue: ['val1', 'val2'] }] })

      plugin._highlightDimensionDonut(chart)

      expect(chart.setActiveElements).toHaveBeenCalledWith([])
    })

    it('sets no active elements when the dataset dimension does not match', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null })
      plugin.activeDimension = 'dim1'
      plugin.activeDimensionValue = 'val1'
      const chart = getChart({ datasets: [{ dimension: 'other-dim', dimensionValue: ['val1'] }] })

      plugin._highlightDimensionDonut(chart)

      expect(chart.setActiveElements).toHaveBeenCalledWith([])
    })

    it('sets no active elements when the value is not found within the dimensionValue list', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null })
      plugin.activeDimension = 'dim1'
      plugin.activeDimensionValue = 'missing-val'
      const chart = getChart({ datasets: [{ dimension: 'dim1', dimensionValue: ['val1', 'val2'] }] })

      plugin._highlightDimensionDonut(chart)

      expect(chart.setActiveElements).toHaveBeenCalledWith([])
    })

    it('sets the matching point as the active element', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null })
      plugin.activeDimension = 'dim1'
      plugin.activeDimensionValue = 'val2'
      const chart = getChart({ datasets: [{ dimension: 'dim1', dimensionValue: ['val1', 'val2'] }] })

      plugin._highlightDimensionDonut(chart)

      expect(chart.setActiveElements).toHaveBeenCalledWith([{ datasetIndex: 0, index: 1 }])
    })
  })

  describe('_getDatasetDimension', () => {
    it('returns undefined when there are no elements at the event', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null })
      const chart = getChart({ elementsAtEventForMode: [] })

      expect(plugin._getDatasetDimension(chart, {} as any)).toBeUndefined()
    })

    it('returns the dimension and dimensionValue in dataset mode for non-doughnut charts', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null })
      const chart = getChart({
        type: 'bar',
        datasets: [{ dimension: 'dim1', dimensionValue: 'val1' }],
        elementsAtEventForMode: [{ datasetIndex: 0, index: 0 }],
      })

      const result = plugin._getDatasetDimension(chart, {} as any)

      expect(result).toEqual(['dim1', 'val1'])
      expect(chart.getElementsAtEventForMode).toHaveBeenCalledWith({}, 'dataset', { intersect: true }, false)
    })

    it('uses non-intersecting, index-based lookup for line charts', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null })
      const chart = getChart({
        type: 'line',
        datasets: [{ dimension: 'dim1', dimensionValue: 'val1' }],
        elementsAtEventForMode: [{ datasetIndex: 0, index: 0 }],
      })

      plugin._getDatasetDimension(chart, {} as any)

      expect(chart.getElementsAtEventForMode).toHaveBeenCalledWith({}, 'dataset', { intersect: false }, false)
    })

    it('returns the dimension and the indexed dimensionValue in point mode for doughnut charts', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null })
      const chart = getChart({
        type: 'doughnut',
        datasets: [{ dimension: 'dim1', dimensionValue: ['val1', 'val2'] }],
        elementsAtEventForMode: [{ datasetIndex: 0, index: 1 }],
      })

      const result = plugin._getDatasetDimension(chart, {} as any)

      expect(result).toEqual(['dim1', 'val2'])
      expect(chart.getElementsAtEventForMode).toHaveBeenCalledWith({}, 'point', { intersect: true }, false)
    })
  })

  describe('_getTimestamp', () => {
    it('returns undefined when there is no nearest element', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null, watchTimestamp: true })
      const chart = getChart({ elementsAtEventForMode: [] })

      expect(plugin._getTimestamp(chart, {} as any)).toBeUndefined()
    })

    it('returns undefined when watchTimestamp is false, even with a nearest element', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null, watchTimestamp: false })
      const chart = getChart({
        datasets: [{ data: [{ x: 999, y: 1 }] }],
        elementsAtEventForMode: [{ datasetIndex: 0, index: 0 }],
      })

      expect(plugin._getTimestamp(chart, {} as any)).toBeUndefined()
    })

    it('returns the x value of the nearest element when watchTimestamp is true', () => {
      const plugin = new CoordinatorPlugin({ coordinator: null, watchTimestamp: true })
      const chart = getChart({
        datasets: [{ data: [{ x: 999, y: 1 }] }],
        elementsAtEventForMode: [{ datasetIndex: 0, index: 0 }],
      })

      expect(plugin._getTimestamp(chart, {} as any)).toBe(999)
      expect(chart.getElementsAtEventForMode).toHaveBeenCalledWith({}, 'index', { intersect: false }, false)
    })
  })
})
