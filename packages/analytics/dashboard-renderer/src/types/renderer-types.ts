import type {
  AllFilters,
  TimeRangeV4,
  ValidDashboardQuery,
} from '@kong-ui-public/analytics-utilities'

export interface DashboardRendererContext {
  filters: AllFilters[]
  timeSpec?: TimeRangeV4
  tz?: string
  refreshInterval?: number
  editable?: boolean
}

// The DashboardRenderer component fills in optional values before passing them down to the tile renderers.
export type DashboardRendererContextInternal = Required<DashboardRendererContext>

export interface RendererProps<T> {
  query: ValidDashboardQuery
  context: DashboardRendererContextInternal
  queryReady: boolean
  chartOptions: T
  height: number
  refreshCounter: number
}
