import type { Chart, ChartEvent, InteractionItem, Plugin } from 'chart.js'

interface HighlightPlugin extends Plugin {
  clickedElements?: InteractionItem[]
  previousHoverOption?: Chart['options']['hover']
  clicked: boolean
}

const drawHighlight = (chart: Chart, clickedElements: InteractionItem[]) => {
  const ctx = chart.ctx
  const yScale = chart.scales.y
  const xScale = chart.scales.x

  // When mode is "index" the last element is the top one.
  // We need the top one to get the correct "y" value for the highlight.
  const clickedElement = clickedElements[clickedElements.length - 1].element

  ctx.save()

  ctx.strokeStyle = 'rgba(100, 100, 100, 1)'
  ctx.lineWidth = 3

  if (chart.options.indexAxis === 'x') {
    // @ts-ignore element is not typed correctly by ChartJS, it most definitely has "width"
    ctx.strokeRect(clickedElement.x - (clickedElement.width / 2), clickedElement.y, clickedElement.width, yScale.bottom - clickedElement.y)
  } else {
    // @ts-ignore element is not typed correctly by ChartJS, it most definitely has "height"
    ctx.strokeRect(xScale.left, clickedElement.y - (clickedElement.height / 2), clickedElement.x - xScale.left, clickedElement.height)
  }

  ctx.restore()
}

export const highlightPlugin: HighlightPlugin = {
  id: 'highlightPlugin',
  clicked: false,
  afterDatasetsDraw: function(chart: Chart) {
    if (this.clickedElements && this.clickedElements.length) {
      drawHighlight(chart, this.clickedElements)
    }
  },
  afterEvent: function(chart: Chart, { event }: { event: ChartEvent }) {
    if (event.type !== 'click' || !event.native) {
      return
    }

    this.clicked = !this.clicked

    const interactionMode = chart.options.interaction?.mode || 'index'

    const elementsAtEvent = chart.getElementsAtEventForMode(event.native, interactionMode, { intersect: false }, true)

    if (elementsAtEvent.length && this.clicked) {
      // When mode is "index" the last element is the top one.
      // We need the top one to get the correct "y" value for the highlight.
      this.clickedElements = elementsAtEvent

      drawHighlight(chart, this.clickedElements)

      this.previousHoverOption = chart.options.hover
      // @ts-ignore - disable hovering actions while chart is "locked" need to set hover mode to null (which is invalid, but works)
      chart.options.hover = { mode: null }
    } else {
      delete this.clickedElements
      chart.options.hover = this.previousHoverOption || chart.options.hover
      this.clicked = false
    }
  },
}
