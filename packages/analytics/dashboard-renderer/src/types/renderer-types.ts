import type {
  AllAggregations,
  AllFilters,
  ApiRequestsQuery,
  ApiRequestsResult,
  DashboardConfig,
  ExploreResultV4,
  PlatformTabularResponse,
  ScatterChartOptions,
  TileLayout,
  TimeRangeV4,
  ValidDashboardChartQuery,
  ValidDashboardTableQuery,
} from '@kong-ui-public/analytics-utilities'
import type { ExternalLink } from '@kong-ui-public/analytics-chart'
import type { TILE_DATA_EMPTY, TILE_DATA_LOADING } from '../constants'

export interface DashboardRendererContext {
  filters: AllFilters[]
  disableCoordination?: boolean
  timeSpec?: TimeRangeV4
  tz?: string
  refreshInterval?: number
  editable?: boolean
  showTileActions?: boolean
}

/**
 * One section of a multi-dashboard renderer: a dashboard definition with an
 * optional title and description displayed above it.
 */
export interface DashboardSection {
  title?: string
  description?: string
  /**
   * Rendered as the `id` of an anchor element at the top of the section, so it
   * can be linked to (e.g. `#my-section`). No anchor is rendered when omitted.
   */
  anchorId?: string
  /**
   * renders a single tile per groupId. Each tileId per groupId is the tile that
   * will be rendered when the label is selected. Shows a tabbed interface with
   * label as the text for switching between tiles.
   */
  tileGroups?: Array<{
    groupId: string
    tileIdLabels: Array<[string, string]>
    layout: TileLayout
  }>
  definition: DashboardConfig
}

export type ZoomConfiguration = {
  /**
   * whether or not to allow zoom on a chart (i.e. click/drag/unclick to highlight a range)
   */
  enabled: boolean
  /**
   * whether the context menu should include "Zoom in"
   */
  showZoomInAction: boolean
  /**
   * whether or not the context menu should include "Explore"
   */
  showExploreAction: boolean
  /**
   * whether or not the context menu should include "Jump to requests"
   */
  showRequestsAction: boolean
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

/**
 * Data a host supplies to a tile in place of the tile's query result.
 * Table tiles take `PlatformTabularResponse`, scatter tiles on the `requests`
 * datasource take `ApiRequestsResult`, and other chart tiles take `ExploreResultV4`.
 */
export type TileData = ExploreResultV4 | PlatformTabularResponse | ApiRequestsResult

/**
 * What a host passes as a tile's `data`: the data itself, `TILE_DATA_LOADING` while
 * the host loads it, `TILE_DATA_EMPTY` when there is no data, or an `Error` when the
 * host failed to load it.
 */
export type SuppliedTileData = TileData | typeof TILE_DATA_LOADING | typeof TILE_DATA_EMPTY | Error

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
  zoomConfiguration?: ZoomConfiguration
  /** When set, the renderer shows this data and doesn't run a query. */
  suppliedData?: SuppliedTileData
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
  /** When set, the renderer shows this data and doesn't run a query. */
  suppliedData?: SuppliedTileData
}
