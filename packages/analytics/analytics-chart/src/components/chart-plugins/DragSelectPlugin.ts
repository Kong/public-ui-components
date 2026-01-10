import type { Chart, Plugin } from 'chart.js'

export interface DragSelectEventDetail {
  xStart: number | undefined
  xEnd: number | undefined
}

const drawSelectionBorder = (chart: Chart, startX: number, endX: number) => {
  const ctx = chart.ctx
  ctx.save()
  ctx.strokeStyle = 'rgba(95, 154, 255, 1)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(startX, chart.chartArea.top)
  ctx.lineTo(startX, chart.chartArea.bottom)
  ctx.moveTo(endX, chart.chartArea.top)
  ctx.lineTo(endX, chart.chartArea.bottom)
  ctx.stroke()
  ctx.restore()
}

const drawSelectionArea = (chart: Chart, startX: number, endX: number) => {
  const ctx = chart.ctx
  ctx.save()
  ctx.fillStyle = 'rgba(143, 193, 255, 0.3)'
  ctx.fillRect(startX, chart.chartArea.top, endX - startX, chart.chartArea.bottom - chart.chartArea.top)
  ctx.restore()
}

const dispatchEvent = (eventName: string, chart: Chart, pluginInstance: DragSelectPlugin) => {
  const xStartValue = chart.scales.x?.getValueForPixel(pluginInstance.startX)
  const xEndValue = chart.scales.x?.getValueForPixel(pluginInstance.endX)

  if (xStartValue && xEndValue) {
    chart.canvas.dispatchEvent(new CustomEvent<DragSelectEventDetail>(eventName, {
      detail: {
        xStart: Math.min(xStartValue, xEndValue),
        xEnd: Math.max(xStartValue, xEndValue),
      },
    }))
  }
}

export class DragSelectPlugin implements Plugin {
  id = 'dragSelectPlugin'
  private _isDragging = false
  private _startX = 0
  private _endX = 0
  private _dragTimeout?: number
  private _clearSelectionArea = true
  private _chart: Chart | null = null
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
    this._chart = chart
    const canvas = chart.canvas
    let dragInitiated = false

    const onMouseDown = (event: MouseEvent) => {
      this._dragTimeout = window.setTimeout(() => {
        const rect = canvas.getBoundingClientRect()
        this._isDragging = true
        this._clearSelectionArea = false
        dragInitiated = true
        this._startX = event.clientX - rect.left
      }, 150)
    }

    const onMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      if (dragInitiated && this._isDragging) {
        this._endX = event.clientX - rect.left
        dispatchEvent('dragSelectMove', chart, this)
      }
    }

    const onMouseUp = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      clearTimeout(this._dragTimeout)
      if (dragInitiated && this._isDragging) {
        this._endX = event.clientX - rect.left
        dispatchEvent('dragSelect', chart, this)
        dragInitiated = false
        this._isDragging = false
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
    if (this._isDragging || !this._clearSelectionArea) {
      drawSelectionArea(chart, this._startX, this._endX)
      drawSelectionBorder(chart, this._startX, this._endX)
    }
  }

  clearSelectionArea(): void {
    this._clearSelectionArea = true
    if (this._chart) {
      this._chart.update()
    }
  }
}
