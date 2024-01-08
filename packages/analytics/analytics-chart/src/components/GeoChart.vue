<template>
  <div class="chart-container">
    <canvas
      ref="chartCanvas"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import type { PropType, Ref } from 'vue'
import composables from '../composables'
import type { KChartData, LegendValues } from '../types'
import type { ChartOptions } from 'chart.js'
import { Chart } from 'chart.js'
import { ChoroplethController, GeoFeature, ColorScale, ProjectionScale } from 'chartjs-chart-geo'

// register controller in chart.js and ensure the defaults are set
Chart.register(ChoroplethController, GeoFeature, ColorScale, ProjectionScale)

const props = defineProps({
  chartData: {
    type: Object as PropType<KChartData>,
    required: false,
    default: () => ({ labels: [], datasets: [] }),
  },
  tooltipTitle: {
    type: String,
    required: false,
    default: '',
  },
  legendValues: {
    type: Object as PropType<LegendValues>,
    required: false,
    default: null,
  },
  metricUnit: {
    type: String,
    required: false,
    default: '',
  },
  syntheticsDataKey: {
    type: String,
    required: false,
    default: '',
  },
})

const chartCanvas = ref<HTMLCanvasElement>()

const options = computed<ChartOptions>(() => {
  return {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      projection: {
        axis: 'x',
        projection: 'mercator',
      },
    },
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
    },
    y: {
      grid: {
        display: false,
        drawBorder: false,
      },
    },
  }
})

composables.useChartJSCommon(
  'choropleth',
  chartCanvas,
  // @ts-ignore
  toRef(props, 'chartData'),
  [],
  options,
) as Ref<Chart | null>

</script>

<style lang="scss" scoped>
.chart-container {
  height: 100%;
  width: 100%;
}
</style>
