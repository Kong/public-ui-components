import type {
  AllFilters,
  TimeRangeV4,
  ValidDashboardChartQuery,
  ValidDashboardTableQuery,
} from '@kong-ui-public/analytics-utilities'
import type { ExternalLink } from '@kong-ui-public/analytics-chart'

export interface DashboardRendererContext {
  filters: AllFilters[]
  timeSpec?: TimeRangeV4
  tz?: string
  refreshInterval?: number
  editable?: boolean
  showTileActions?: boolean
}

// The DashboardRenderer component fills in optional values before passing them down to the tile renderers.
export interface DashboardRendererContextInternal extends Required<DashboardRendererContext> {
  zoomable: boolean
  /**
   * only used internally as controlling this externally is just a matter of
   * including a zoom handler on the DashboardRenderer component.
   */
  showTileZoomActions: boolean
}

export interface PdfExportOptions {
  /**
   * PDF filename without .pdf extension, a date stamp is always appended.
   * Defaults to a slug of `title`, falling back to 'dashboard-export'.
   */
  filename?: string
  /** Dashboard name used in the header */
  title?: string
  /** URL to the dashboard in the footer. */
  dashboardUrl?: string
  /** Page orientation. Defaults to 'landscape'. */
  orientation?: 'portrait' | 'landscape'
  /** Page margin in mm. Defaults to 10. */
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
  error?: unknown
}

export interface ChartRendererProps<T> {
  query: ValidDashboardChartQuery
  context: DashboardRendererContextInternal
  queryReady: boolean
  chartOptions: T
  height: number
  refreshCounter: number
  requestsLink?: ExternalLink
  exploreLink?: ExternalLink
}

export interface TableRendererProps {
  query: ValidDashboardTableQuery
  context: DashboardRendererContextInternal
  queryReady: boolean
  height?: number
  refreshCounter: number
}
