import type { QueryableExploreDimensions } from '@kong-ui-public/analytics-utilities'

export const MAX_ANALYTICS_REQUEST_RETRIES = 2
export const ALL_STATUS_CODE_GROUPS = ['1XX', '2XX', '3XX', '4XX', '5XX']
export const STATUS_CODES_FAILED = ['4XX', '5XX']
export const STATUS_CODES_SUCCESS = ['1XX', '2XX', '3XX']
export const DEFAULT_REFRESH_INTERVAL = 30 * 1000
export const INJECT_QUERY_PROVIDER = 'analytics-query-provider'

// This dimension is special: metric cards are never going to group on this dimension
// except in order to determine traffic and error rate information.
export const ERROR_RATE_DIMENSION: QueryableExploreDimensions = 'status_code_grouped'
export const DEFAULT_KEY = Symbol('default')

