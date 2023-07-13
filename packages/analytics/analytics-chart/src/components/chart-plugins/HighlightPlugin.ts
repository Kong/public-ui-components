import { Chart, ChartEvent, InteractionItem, Plugin } from 'chart.js'
import { darkenColor, enhanceColor } from '../../utils'

interface HighlightPlugin extends Plugin {
  clickedElements?: InteractionItem[]
  previousHoverOption?: Chart['options']['hover']
  clicked: boolean
}

const drawHighlight = (chart: Chart, clickedElements: InteractionItem[]) => {
  const ctx = chart.ctx
  const yScale = chart.scales.y

  // When mode is "index" the last element is the top one.
  // We need the top one to get the correct "y" value for the highlight.
  const clickedElement = clickedElements[clickedElements.length - 1].element

  ctx.save()

  ctx.strokeStyle = 'rgba(100, 100, 100, 1)'
  ctx.lineWidth = 3

  // @ts-ignore element is not typed correctly by ChartJS, it most definitely has "width"
  ctx.strokeRect(clickedElement.x - (clickedElement.width / 2), clickedElement.y, clickedElement.width, yScale.bottom - clickedElement.y)

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

    const elementsAtEvent = chart.getElementsAtEventForMode(event.native, 'index', { intersect: false }, true)

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
      chart.options.hover = this.previousHoverOption
    }
  },
}
