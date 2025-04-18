import type { Chart, Plugin } from 'chart.js'

export interface DragSelectEventDetail {
  xStart: number | undefined
  xEnd: number | undefined
}

const drawSelectionArea = (chart: Chart, startX: number, endX: number) => {
  const ctx = chart.ctx
  ctx.save()
  ctx.fillStyle = 'rgba(200, 200, 200, 0.5)'
  ctx.fillRect(startX, chart.chartArea.top, endX - startX, chart.chartArea.bottom - chart.chartArea.top)
  ctx.restore()
}

const dispatchEvent = (eventName: string, chart: Chart, pluginInstance: DragSelectPlugin) => {
  const xStartValue = chart.scales.x.getValueForPixel(pluginInstance.startX)
  const xEndValue = chart.scales.x.getValueForPixel(pluginInstance.endX)

  chart.canvas.dispatchEvent(new CustomEvent<DragSelectEventDetail>(eventName, {
    detail: {
      xStart: xStartValue,
      xEnd: xEndValue,
    },
  }))
}

export class DragSelectPlugin implements Plugin {
  id = 'dragSelectPlugin'
  private _isDragging = false
  private _startX = 0
  private _endX = 0
  private _dragTimeout?: number
  private _dragSelectHandlers?: {
    onMouseDown: (event: MouseEvent) => void
    onMouseMove: (event: MouseEvent) => void
    onMouseUp: (event: MouseEvent) => void
  }

  get startX() {
    return this._startX
  }

  get endX() {
    return this._endX
  }

  beforeInit(chart: Chart) {
    const canvas = chart.canvas
    const rect = canvas.getBoundingClientRect()
    let dragInitiated = false

    const onMouseDown = (event: MouseEvent) => {
      this._dragTimeout = window.setTimeout(() => {
        this._isDragging = true
        dragInitiated = true
        this._startX = event.clientX - rect.left
      }, 150)
    }

    const onMouseMove = (event: MouseEvent) => {
      if (dragInitiated && this._isDragging) {
        this._endX = event.clientX - rect.left
        dispatchEvent('dragSelectMove', chart, this)
        chart.update()
      }
    }

    const onMouseUp = (event: MouseEvent) => {
      clearTimeout(this._dragTimeout)
      if (dragInitiated && this._isDragging) {
        this._endX = event.clientX - rect.left
        dispatchEvent('dragSelect', chart, this)
        chart.update()
        this._isDragging = false
        dragInitiated = false
      }
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onMouseUp)

    this._dragSelectHandlers = { onMouseDown, onMouseMove, onMouseUp }
  }

  beforeDestroy(chart: Chart): void {
    const canvas = chart.canvas
    if (this._dragSelectHandlers) {
      const { onMouseDown, onMouseMove, onMouseUp } = this._dragSelectHandlers
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onMouseUp)
    }
    this._isDragging = false
    if (this._dragTimeout) {
      clearTimeout(this._dragTimeout)
    }
  }
  afterDatasetsDraw(chart: Chart): void {
    if (this._isDragging) {
      drawSelectionArea(chart, this._startX, this._endX)
    }
  }
}
