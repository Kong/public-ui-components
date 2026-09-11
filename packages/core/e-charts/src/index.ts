// import type { App } from 'vue'
import HeatmapChart from './components/chart-types/HeatmapChart.vue'

// Export Vue plugin
// We rarely want to export components as a plugin as we prefer to support proper tree-shaking in the host application. Only enable if you're packing a Vue plugin.
// export default {
//   // Customize plugin options as desired
//   // Providing a `name` property allows for customizing the registered
//   // name of the component (useful for exporting a single component).
//   install: (app: App, options: { name?: string, [key: string]: any } = {}): void => {
//     app.component(options.name || 'ECharts', ECharts)
//   },
// }

export {
  HeatmapChart,
}

export { chartColors, useChartColors } from './composables/useChartColors.ts'

export * from './types/index.ts'
