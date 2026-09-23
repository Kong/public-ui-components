import type { Chart, ChartEvent, Plugin } from 'chart.js'
import type { InteractionCoordinator } from '@kong-ui-public/analytics-utilities'
import { watch, type WatchHandle } from 'vue'

const drawLine = (
  ctx: CanvasRenderingContext2D,
  x: number,
  top: number,
  bottom: number,
  color: string = '#0275d8',
) => {
  if (ctx) {
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x, top)
    ctx.lineTo(x, bottom)
    ctx.lineWidth = 1
    ctx.strokeStyle = color
    ctx.stroke()
    ctx.restore()
  }
}

type CoordinatorPluginConstructor = {
  coordinator: InteractionCoordinator | null
  requiresUpdate?: boolean
  triggerOnSelf?: boolean
  watchTimestamp?: boolean
  watchDimension?: boolean
}

export class CoordinatorPlugin implements Plugin {
  id = 'coordinator'
  coordinator: InteractionCoordinator | null = null
  instanceId = ''
  stopWatcher: (() => void) | undefined = undefined
  activeDimension: string | null = null
  activeDimensionValue: string | null = null

  requiresUpdate = false
  triggerOnSelf = false
  watchTimestamp = false
  watchDimension = false
  lastMouseBrushEvent = 0

  constructor({
    coordinator,
    requiresUpdate = false,
    triggerOnSelf = false,
    watchTimestamp = false,
    watchDimension = false,
  }: CoordinatorPluginConstructor) {
    this.instanceId = crypto.randomUUID()
    this.coordinator = coordinator
    this.requiresUpdate = requiresUpdate
    this.triggerOnSelf = triggerOnSelf
    this.watchTimestamp = watchTimestamp
    this.watchDimension = watchDimension
  }

  afterInit(chart: Chart) {
    if (!this.coordinator) {
      return
    }

    const redraw = this.requiresUpdate
      ? () => chart.update('none')
      : () => chart.draw()

    const stopTimestampWatcher = this._watchTimestamp(redraw)
    const stopDimensionWatcher = this._watchDimension(redraw)

    this.stopWatcher = () => {
      if (stopTimestampWatcher) {
        stopTimestampWatcher()
      }
      if (stopDimensionWatcher) {
        stopDimensionWatcher()
      }
    }
  }

  afterEvent(chart: Chart, { event }: { event: ChartEvent }) {
    if (!this.coordinator) {
      return
    }

    if (event.type === 'mousemove' || event.type === 'mouseout') {
      requestAnimationFrame((time) => this._onMouseBrush(event.native!, chart, time))
    }
  }

  beforeDatasetDraw(chart: Chart, args: any) {
    // We want to affect how a dimensions are highlighted, so we handle that entirely
    // in this hook as we can affect opacity on a per-dataset basis
    if (!this.coordinator
        || !this.watchDimension
        || (this.coordinator.activeChart.value === this.instanceId && !this.triggerOnSelf)) {
      return
    }

    // @ts-ignore chart.config.type does exist
    if (chart.config.type === 'doughnut') {
      this._highlightDimensionDonut(chart)
    } else {
      this._highlightDimensionDefault(chart, args)
    }
  }

  afterDatasetsDraw(chart: Chart) {
    // regardless of what we do in other hooks, we always want to reset the alpha
    // to 1 here, so that legends and axes are drawn full opacity
    chart.ctx.save()
    chart.ctx.globalAlpha = 1

    // Here we assume that we only want to draw timestamp effects in places where
    // the x axis is the time access, and all we do is draw a vertical line.
    if (!this.coordinator
        || !this.watchTimestamp
        || !this.coordinator.activeTimestamp.value
        || (this.coordinator.activeChart.value === this.instanceId && !this.triggerOnSelf)) {
      return
    }

    const xScale = chart.scales['x']
    const xValue = xScale.getPixelForValue(this.coordinator.activeTimestamp.value)
    const ctx = chart.ctx
    drawLine(ctx, xValue, chart.scales.y.top, chart.scales.y.bottom)
  }

  beforeDestroy() {
    if (this.stopWatcher) {
      this.stopWatcher()
    }
  }

  _watchTimestamp(redraw: () => void): WatchHandle | undefined {
    if (!this.coordinator) return

    let stopTimestampWatcher: WatchHandle | undefined = undefined

    if (this.watchTimestamp) {
      stopTimestampWatcher = watch([
        this.coordinator.activeChart,
        this.coordinator.activeTimestamp,
      ], ([
        activeChart,
      ]) => {
        if (activeChart !== this.instanceId || this.triggerOnSelf) {
          redraw()
        }
      })
    }

    return stopTimestampWatcher
  }

  _watchDimension(redraw: () => void): WatchHandle | undefined {
    if (!this.coordinator) return

    let stopDimensionWatcher: WatchHandle | undefined = undefined

    if (this.watchDimension) {
      let hoverTimeout: ReturnType<typeof setTimeout>
      stopDimensionWatcher = watch([
        this.coordinator.activeChart,
        this.coordinator.activeDimension,
        this.coordinator.activeDimensionValue,
      ], ([
        activeChart,
        activeDimension,
        activeDimensionValue,
      ]) => {
        clearTimeout(hoverTimeout)

        if (activeDimension === null) {
          this.activeDimension = null
        }

        if (activeDimensionValue === null) {
          this.activeDimensionValue = null
        }

        hoverTimeout = setTimeout(() => {
          this.activeDimension = activeDimension
          this.activeDimensionValue = activeDimensionValue
          if (activeChart !== this.instanceId || this.triggerOnSelf) {
            redraw()
          }
        }, this.coordinator?.DIMENSION_DEBOUNCE_MS ?? 400)
      })
    }

    return stopDimensionWatcher
  }

  _onMouseBrush(event: Event, chart: Chart, time: number) {
    if (!this.coordinator) return

    const type = event.type
    const throttle = Math.min(this.coordinator.TIMESTAMP_DEBOUNCE_MS, this.coordinator.DIMENSION_DEBOUNCE_MS)

    if (type === 'mousemove' && (time - this.lastMouseBrushEvent) < throttle) {
      // if we don't hit the throttle condition, ignore this event
      return
    }

    if (type === 'mousemove') {
      const timestamp = this._getTimestamp(chart, event)
      const [dimension, dimensionValue] = this._getDatasetDimension(chart, event) ?? []
      this.coordinator.activate({
        chartUuid: this.instanceId,
        timestamp,
        dimension,
        dimensionValue,
      })
    } else if (type === 'mouseout') {
      this.coordinator.deactivate({ chartUuid: this.instanceId })
    }

    this.lastMouseBrushEvent = time
  }

  _highlightDimensionDefault(chart: Chart, args: any) {
    chart.ctx.save()

    if (this.activeDimension && this.activeDimensionValue) {
      const highlightedSets = chart.data.datasets
        .map((dataset: any, index: number) => {
          return dataset?.dimension === this.activeDimension && dataset?.dimensionValue === this.activeDimensionValue
            ? index
            : -1
        })
        .filter((matchedIndices: number) => {
          return matchedIndices >= 0
        })

      if (highlightedSets.length) {
        chart.ctx.globalAlpha = highlightedSets.includes(args.index) ? 1 : 0.3
      }
    } else {
      chart.ctx.globalAlpha = 1
    }
  }

  _highlightDimensionDonut(chart: Chart) {
    if (this.activeDimension && this.activeDimensionValue) {
      // handle highlighting of doughnut chart values
      const { dimension, dimensionValue } = chart.data.datasets[0] as any
      if (dimension === this.activeDimension) {
        const index = dimensionValue.findIndex((dimVal: string) => dimVal === this.activeDimensionValue)

        if (index >= 0) {
          chart.setActiveElements([{
            datasetIndex: 0,
            index,
          }])
        } else {
          chart.setActiveElements([])
        }
      } else {
        chart.setActiveElements([])
      }
    } else {
      chart.setActiveElements([])
    }
  }

  _getDatasetDimension(chart: Chart, event: Event): [string, string] | undefined {
    // @ts-ignore chart.config.type does exist
    const intersect = chart.config.type !== 'line'
    // @ts-ignore chart.config.type does exist
    const mode = chart.config.type === 'doughnut' ? 'point' : 'dataset'

    const result = chart.getElementsAtEventForMode(event, mode, { intersect }, false)

    const [point] = result

    if (!point) {
      return
    }

    const { datasetIndex, index } = point
    const { dimension, dimensionValue } = chart.data.datasets[datasetIndex] as any

    if (mode === 'point') {
      return [dimension, dimensionValue[index]]
    }

    return [dimension, dimensionValue]
  }

  _getTimestamp(chart: Chart, event: Event): number | undefined {
    const [nearestElement] = chart.getElementsAtEventForMode(event, 'index', { intersect: false }, false)
    if (!nearestElement) {
      return
    }

    if (this.watchTimestamp) {
      const { datasetIndex, index } = nearestElement
      const { x } = chart.data.datasets[datasetIndex].data[index] as { x: number, y: number }
      return x
    }
  }
}
