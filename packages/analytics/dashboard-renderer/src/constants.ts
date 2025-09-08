// Default tile height and width - approximated from the figma design.
export const DEFAULT_TILE_HEIGHT = 170
export const DASHBOARD_COLS = 6
export const INJECT_QUERY_PROVIDER = 'analytics-query-provider'
export const ENTITY_ID_TOKEN = '{entity-id}'
export const CP_ID_TOKEN = '{cp-id}'
export const TIMEFRAME_TOKEN = '{timeframe}'
export const DEFAULT_TILE_REFRESH_INTERVAL_MS = 30 * 1000 // 30 seconds

/**
 * default refresh interval for queries that are 24 hours or less is 5 minutes
 */
export const FULLSCREEN_SHORT_REFRESH_INTERVAL_MS = 300000

/**
 * default refresh interval for queries that are greater than 24 hours is 1 hour
 */
export const FULLSCREEN_LONG_REFRESH_INTERVAL_MS = 3600000

export const EXPORT_RECORD_LIMIT = 250
