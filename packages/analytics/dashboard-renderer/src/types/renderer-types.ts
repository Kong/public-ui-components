import type {
  AllAggregations,
  AllFilters,
  ApiRequestsQuery,
  ScatterChartOptions,
  TimeRangeV4,
  ValidDashboardChartQuery,
  ValidDashboardTableQuery,
} from '@kong-ui-public/analytics-utilities'
import type { ExternalLink, ScatterChartData } from '@kong-ui-public/analytics-chart'

export interface DashboardRendererContext {
  filters: AllFilters[]
  timeSpec?: TimeRangeV4
  tz?: string
  refreshInterval?: number
  editable?: boolean
  showTileActions?: boolean
  zoomable?: boolean
  showTileZoomActions?: boolean
  scatterDataFn?: (
    query: ApiRequestsQuery,
    context: DashboardRendererContext,
    abortController: AbortController,
  ) => Promise<ScatterChartData | undefined>
}

export interface PdfExportOptions {
  /**
   * PDF filename without .pdf extension, a date stamp is always appended.
   * Defaults to a slug of `title`, falling back to 'dashboard-export'.
   */
  filename?: string
  /** Dashboard name used in the header */
  title?: string
  /** Second header line */
  subtitle?: string
  /** URL to the dashboard in the footer. */
  dashboardUrl?: string
  /** Page orientation. Defaults to 'landscape'. */
  orientation?: 'portrait' | 'landscape'
  /** Page size. Defaults to 'letter'. */
  pageSize?: 'letter' | 'a4'
  /** Page margin in mm. Defaults to 4. */
  margin?: number
  /** Scale factor for capture resolution. Higher = better quality, larger file. Defaults to 2. */
  scale?: number
  /** CSS selectors to exclude from capture (e.g. tooltips, dropdowns). */
  exclude?: string[]
  /**
   * 'download' is for client-side generation, 'blob' returns the PDF as a Blob
   * which is needed for headless. Defaults to 'download'.
   */
  output?: 'download' | 'blob'
  /** Called before DOM capture starts (e.g. to hide interactive UI). */
  onBeforeCapture?: () => void | Promise<void>
  /** Called after DOM capture completes (e.g. to restore UI). */
  onAfterCapture?: () => void | Promise<void>
}

export type PdfExportStatus = 'idle' | 'preparing' | 'capturing' | 'generating' | 'complete' | 'error'

export interface PdfExportState {
  status: PdfExportStatus
  /** Number of pages in the generated document. Set when status is 'complete'. */
  pageCount?: number
  error?: unknown
}

export interface ChartRendererProps<T> {
  query: ValidDashboardChartQuery
  context: DashboardRendererContext
  queryReady: boolean
  chartOptions: T
  height: number
  refreshCounter: number
  /**
   * Active metric for grouped multi-metric time series charts.
   * This is only used when rendering a time series chart with multiple metrics and a group-by dimension.
   */
  activeMetric?: AllAggregations
  headerDescription?: string
  requestsLink?: ExternalLink
  exploreLink?: ExternalLink
}

export interface ScatterRendererProps extends Omit<ChartRendererProps<ScatterChartOptions>, 'query'> {
  /** A scatter tile can show either request or explore data */
  query: ApiRequestsQuery | ValidDashboardChartQuery
}

export interface TableRendererProps {
  query: ValidDashboardTableQuery
  context: DashboardRendererContext
  queryReady: boolean
  height?: number
  refreshCounter: number
}
