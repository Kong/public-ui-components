/**
 * Why this file exists?
 *
 * Every chart shows the same `ChartTooltip`; charts and consumers only decide
 * what goes in it. ECharts measures and positions the tooltip right after
 * `tooltip.formatter` returns, so the Vue content is rendered synchronously
 * with `render()`. Rendering on Vue's next tick (like vue-echarts' `#tooltip`
 * slot does) would position the first tooltip as if it were empty.
 */

import { getCurrentScope, h, onScopeDispose, render } from 'vue'
import ChartTooltip from '../components/ChartTooltip.vue'
import { tooltipItems, tooltipRow } from '../utils/tooltip.ts'
import type { ChartTooltipContent } from '../types'
import type { TooltipComponentFormatterCallbackParams } from 'echarts'

/** The last value for multi-dimensional data (e.g. `[x, y, value]`), otherwise the value itself. */
const lastValue = (value: unknown): unknown => Array.isArray(value) ? value[value.length - 1] : value

/**
 * Default content for charts that don't build their own, like the
 * analytics-chart tooltips: the hovered category (e.g. the time) as the
 * subtitle, and a row per series with its color, name and value.
 */
export const defaultTooltipContent: ChartTooltipContent = (params) => {
  const items = tooltipItems(params)
  const first = items[0] as (typeof items)[number] & { axisValueLabel?: string } | undefined

  return {
    context: String(first?.axisValueLabel ?? first?.name ?? ''),
    rows: items.map((item) => tooltipRow(item, item.seriesName ?? '', lastValue(item.value))),
  }
}

/** Returns a `tooltip.formatter` that renders `ChartTooltip` with the chart type's content (or the default). */
export const useChartTooltip = (getContent: () => ChartTooltipContent | undefined) => {
  let container: HTMLElement | undefined

  if (getCurrentScope()) {
    onScopeDispose(() => {
      if (container) {
        render(null, container)
      }
    })
  }

  return (params: TooltipComponentFormatterCallbackParams): HTMLElement => {
    container ??= document.createElement('div')
    // Rendering the same component into the same container patches it in place
    render(h(ChartTooltip, (getContent() ?? defaultTooltipContent)(params)), container)

    return container
  }
}
