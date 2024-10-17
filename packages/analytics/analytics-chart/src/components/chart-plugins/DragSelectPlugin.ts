import type { Chart, Plugin } from 'chart.js'

interface DragSelectPlugin extends Plugin {
  isDragging: boolean
  startX: number
  endX: number
  dragTimeout?: number
  dragSelectHandlers?: {
    onMouseDown: (event: MouseEvent) => void
    onMouseMove: (event: MouseEvent) => void
    onMouseUp: (event: MouseEvent) => void
  }
}

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


export const dragSelectPlugin: DragSelectPlugin = {
  id: 'dragSelectPlugin',
  isDragging: false,
  startX: 0,
  endX: 0,

  beforeInit: function(chart: Chart) {
    const canvas = chart.canvas
    const rect = canvas.getBoundingClientRect()
    let dragInitiated = false

    const onMouseDown = (event: MouseEvent) => {
      this.dragTimeout = window.setTimeout(() => {
        this.isDragging = true
        dragInitiated = true
        this.startX = event.clientX - rect.left
      }, 150)
    }

    const onMouseMove = (event: MouseEvent) => {
      if (dragInitiated && this.isDragging) {
        this.endX = event.clientX - rect.left
        dispatchEvent('dragSelectMove', chart, this)
        chart.update()
      }
    }

    const onMouseUp = (event: MouseEvent) => {
      clearTimeout(this.dragTimeout)
      if (dragInitiated && this.isDragging) {
        this.endX = event.clientX - rect.left
        dispatchEvent('dragSelect', chart, this)
        chart.update()
        this.isDragging = false
        dragInitiated = false
      }
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onMouseUp)

    this.dragSelectHandlers = { onMouseDown, onMouseMove, onMouseUp }
  },

  beforeDestroy(chart) {
    const canvas = chart.canvas
    if (this.dragSelectHandlers) {
      const { onMouseDown, onMouseMove, onMouseUp } = this.dragSelectHandlers
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onMouseUp)
    }
    this.isDragging = false
  },

  afterDatasetsDraw: function(chart: Chart) {
    if (this.isDragging) {
      drawSelectionArea(chart, this.startX, this.endX)
    }
  },
}
