import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'

export type CsvExportState =
  | { status: 'loading' }
  | { status: 'success', chartData: ExploreResultV4 }
  | { status: 'error', error: unknown }
