import AnalyticsChart from './components/AnalyticsChart.vue'
import SimpleChart from './components/SimpleChart.vue'
import SparklineChart from './components/SparklineChart.vue'

export { AnalyticsChart, SimpleChart, SparklineChart }

/**
 * @deprecated Use dashboard-renderer for dashboard TopN tiles, or TableDataGrid
 * from '@kong-ui-public/table-data-grid' for new standalone tables.
 * Retained for existing consumers; removal will be handled separately.
 */
export { default as TopNTable } from './components/TopNTable.vue'

/**
 * @deprecated Import CsvExportModal from '@kong-ui-public/dashboard-renderer' instead.
 * TODO: Remove this deprecated analytics-chart export after consumers migrate to
 * @kong-ui-public/dashboard-renderer. MA-5236: https://konghq.atlassian.net/browse/MA-5236
 */
export { default as CsvExportModal } from './components/CsvExportModal.vue'

export * from './types'
export * from './enums'
export { statusCodeBadgeBackgroundColor } from './utils/colors'
export { lookupStatusCodeColor } from './utils/customColors'
export * from './utils/constants'
export * from './utils/queryError'
export * from './utils/scatter-adapters'
