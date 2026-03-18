import type {
  AllFilters,
  TimeRangeV4,
  ValidDashboardQuery,
} from '@kong-ui-public/analytics-utilities'
import type { ExternalLink } from '@kong-ui-public/analytics-chart'

export type ChartRenderer = 'chartjs' | 'echarts'

export interface DashboardRendererContext {
  filters: AllFilters[]
  timeSpec?: TimeRangeV4
  tz?: string
  refreshInterval?: number
  editable?: boolean
  showTileActions?: boolean
  chartRenderer?: ChartRenderer
}

// The DashboardRenderer component fills in optional values before passing them down to the tile renderers.
export interface DashboardRendererContextInternal extends Required<DashboardRendererContext> {
  zoomable: boolean
}

export interface RendererProps<T> {
  query: ValidDashboardQuery
  context: DashboardRendererContextInternal
  queryReady: boolean
  chartOptions: T
  height: number
  refreshCounter: number
  requestsLink?: ExternalLink
  exploreLink?: ExternalLink
}
