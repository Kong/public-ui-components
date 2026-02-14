import type { Chart, ChartEvent, InteractionItem, Plugin } from 'chart.js'


const drawHighlight = (chart: Chart, clickedElements: InteractionItem[]) => {
  const ctx = chart.ctx
  const yScale = chart.scales.y
  const xScale = chart.scales.x

  // When mode is "index" the last element is the top one.
  // We need the top one to get the correct "y" value for the highlight.
  const clickedElement = clickedElements[clickedElements.length - 1]?.element

  if (!clickedElement) {
    return
  }

  ctx.save()

  ctx.strokeStyle = 'rgba(100, 100, 100, 1)'
  ctx.lineWidth = 3

  if (chart.options.indexAxis === 'x') {
    // @ts-ignore element is typed generically by ChartJS, all of the chart elements we use include "width"
    ctx.strokeRect(clickedElement.x - (clickedElement.width / 2), clickedElement.y, clickedElement.width, yScale.bottom - clickedElement.y)
  } else {
    // @ts-ignore element is typed generically by ChartJS, all of the chart elements we use include "height"
    ctx.strokeRect(xScale.left, clickedElement.y - (clickedElement.height / 2), clickedElement.x - xScale.left, clickedElement.height)
  }

  ctx.restore()
}

export class HighlightPlugin implements Plugin {
  id = 'highlightPlugin'
  private _clickedElements?: InteractionItem[]
  private _previousHoverOption?: Chart['options']['hover']
  private _clicked = false
  private _pause = false
  private _suppressNextClick = false

  afterDatasetsDraw(chart: Chart) {
    if (this._clickedElements && this._clickedElements.length && !this._pause) {
      drawHighlight(chart, this._clickedElements)
    }
  }

  afterEvent(chart: Chart, { event }: { event: ChartEvent }) {
    if (event.type === 'click' && this._suppressNextClick) {
      this._suppressNextClick = false
      return
    }
    if (event.type !== 'click' || !event.native || this._pause) {
      return
    }

    this._clicked = !this._clicked

    const interactionMode = chart.options.interaction?.mode || 'index'

    const elementsAtEvent = chart.getElementsAtEventForMode(event.native, interactionMode, { intersect: false }, true)

    if (elementsAtEvent.length && this._clicked) {
      // When mode is "index" the last element is the top one.
      // We need the top one to get the correct "y" value for the highlight.
      this._clickedElements = elementsAtEvent

      drawHighlight(chart, this._clickedElements)

      this._previousHoverOption = chart.options.hover
      // @ts-ignore - disable hovering actions while chart is "locked" need to set hover mode to null (which is invalid, but works)
      chart.options.hover = { mode: null }
    } else {
      delete this._clickedElements
      chart.options.hover = this._previousHoverOption || chart.options.hover
      this._clicked = false
    }
  }
  beforeDestroy(chart: Chart) {
    delete this._clickedElements
    chart.options.hover = this._previousHoverOption || chart.options.hover
    this._clicked = false
  }

  pause() {
    this._pause = true
  }

  get isPaused() {
    return this._pause
  }

  resume(suppressNextClick = false) {
    this._pause = false
    if (suppressNextClick) {
      this._suppressNextClick = true
    }
  }
}
