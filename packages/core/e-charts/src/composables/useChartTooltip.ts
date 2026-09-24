/**
 * Why this file exists?
 *
 * Every chart shows the same `ChartTooltip`, and charts only decide what goes
 * in it (see `ChartTooltipContent`). ECharts measures and positions the
 * tooltip right after `tooltip.formatter` returns, so the Vue content is
 * rendered synchronously with `render()`. Rendering on Vue's next tick (like
 * vue-echarts' `#tooltip` slot does) would position the first tooltip as if
 * it were empty.
 */

import { defineComponent, getCurrentScope, h, onScopeDispose, render } from 'vue'
import type { PropType } from 'vue'
import ChartTooltip from '../components/ChartTooltip.vue'
import type { ChartTooltipContent, ChartTooltipProps } from '../types'
import type { TooltipComponentFormatterCallbackParams } from 'echarts'

// Defined once so each render patches the previous tooltip instead of remounting it
const TooltipContent = defineComponent({
  props: { content: { type: Object as PropType<ChartTooltipProps>, required: true } },
  setup: (props) => () => h(ChartTooltip, props.content),
})

/** Returns a `tooltip.formatter` that renders `ChartTooltip` with the given content. */
export const useChartTooltip = (getContent: () => ChartTooltipContent | undefined) => {
  let container: HTMLElement | undefined

  if (getCurrentScope()) {
    onScopeDispose(() => {
      if (container) {
        render(null, container)
      }
    })
  }

  return (params: TooltipComponentFormatterCallbackParams): HTMLElement | string => {
    const content = getContent()?.(params)

    if (!content) {
      return ''
    }

    container ??= document.createElement('div')
    render(h(TooltipContent, { content }), container)

    return container
  }
}
