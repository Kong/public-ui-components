import ECharts from './components/ECharts.vue'
import HeatmapChart from './components/chart-types/HeatmapChart.vue'
import SankeyChart from './components/chart-types/SankeyChart.vue'
import TreeMapChart from './components/chart-types/TreeMapChart.vue'

export {
  ECharts, // Base ECharts component, exported by wrapping up with default theme and common settings
  HeatmapChart,
  SankeyChart,
  TreeMapChart,
}

export { chartColors, useChartColors } from './composables/useChartColors.ts'

export * from './types/index.ts'
