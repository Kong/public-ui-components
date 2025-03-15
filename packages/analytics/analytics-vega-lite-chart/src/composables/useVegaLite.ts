import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import vegaEmbed from 'vega-embed'
import type { Result, VisualizationSpec } from 'vega-embed'
import { onMounted, ref, watch, type Ref, type ShallowRef } from 'vue'
import { prepareData } from '../utils'

export default function useVegaLite(chartRef: Readonly<ShallowRef<HTMLDivElement | null>>, spec: Ref<VisualizationSpec>, data: Ref<ExploreResultV4>) {

  const chartInstance = ref<Result>()
  const embedChart = (spec: VisualizationSpec) => {
    if (!chartRef.value) return

    return vegaEmbed(chartRef.value, spec, { actions: false, renderer: 'svg' })
  }

  onMounted(async () => {
    chartInstance.value = await embedChart(spec.value)
  })

  watch(spec, async (newSpec) => {
    if (chartInstance.value) {
      chartInstance.value.finalize()
    }
    chartInstance.value = await embedChart(newSpec)
  })

  watch(() => data.value, (newData) => {
    const transformedData = prepareData(newData)
    chartInstance.value?.view.data('chartData', transformedData).run()
  })


  return { chartInstance }
}
