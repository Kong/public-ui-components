import Chart from 'chart.js/auto'
import type { ChartType, ChartData, Plugin, ChartOptions } from 'chart.js'
import type { Ref } from 'vue'
import { onMounted, watch, shallowRef, onBeforeUnmount } from 'vue'
import { isNullOrUndef } from 'chart.js/helpers'

// Based on
// https://github.com/apertureless/vue-chartjs/blob/e61d0b5ce94d71214300a26876e0f2a12e9a26d6/src/utils.ts#L139
const isSameShape = (oldData: ChartData, newData: ChartData) => {
  const newDatasetLabels = newData.datasets.map(dataset => {
    return dataset.label
  })

  const oldDatasetLabels = oldData.datasets.map(dataset => {
    return dataset.label
  })

  // Check if Labels are equal and if dataset length is equal
  return (
    oldData.datasets.length === newData.datasets.length &&
    newDatasetLabels.every((value, index) => value === oldDatasetLabels[index])
  )
}

export default function useChartJSCommon<T extends ChartType>(
  chartType: T,
  canvas: Ref<HTMLCanvasElement | null>,
  chartData: Readonly<Ref<ChartData>>,
  plugins: Plugin[],
  options: Ref<ChartOptions>,
): Ref<Chart | null | undefined> {
  const chartInstance = shallowRef<Chart | null | undefined>(null)

  const createChart = (data: ChartData, options: ChartOptions) => {
    if (canvas.value) {
      return new Chart(canvas.value, {
        type: chartType,
        data,
        plugins,
        options,
      })
    }
  }

  onMounted(() => {
    chartInstance.value = createChart(chartData.value, options.value)
  })

  onBeforeUnmount(() => {
    if (!isNullOrUndef(chartInstance.value)) {
      chartInstance.value.destroy()
    }
  })

  watch(chartData, (newData, oldData) => {
    if (isSameShape(oldData, newData) && !isNullOrUndef(chartInstance.value)) {
      // Update each dataset in-place to avoid ChartJS triggering a re-animate.
      for (const [i, dataset] of newData.datasets.entries()) {
        if (chartInstance.value.data.datasets[i]) {
          Object.assign(chartInstance.value.data.datasets[i], dataset)
        }
      }
      chartInstance.value.data.labels = newData.labels
      chartInstance.value.update()
    } else {
      // The data changed shape; start from scratch and trigger a re-animate.
      if (!isNullOrUndef(chartInstance.value)) {
        chartInstance.value.destroy()
      }

      chartInstance.value = createChart(newData, options.value)
    }
  })

  // In some cases, for example showing/hiding chart based on
  // empty state, there could be a race condition where we
  // try to instantiate a chart, without there being a canvas
  // available yet. Need to watch the canvas ref for change, create
  // a new chart when/if the canvas "updates"
  watch(canvas, () => {
    if (!isNullOrUndef(chartInstance.value)) {
      chartInstance.value.destroy()
    }

    chartInstance.value = createChart(chartData.value, options.value)
  })

  // Here we track specific options that we want to be reactive
  watch(options, (newOptions, oldOptions) => {
    if (newOptions.indexAxis !== oldOptions.indexAxis ||
        // @ts-ignore - chart js options internally, are not well typed
        JSON.stringify(newOptions.scales.x.title) !== JSON.stringify(oldOptions.scales.x.title) ||
        // @ts-ignore - chart js options internally, are not well typed
        JSON.stringify(newOptions.scales.y.title) !== JSON.stringify(oldOptions.scales.y.title)) {
      if (!isNullOrUndef(chartInstance.value)) {
        chartInstance.value.destroy()
      }

      chartInstance.value = createChart(chartData.value, newOptions)
    }
  })

  return chartInstance
}
