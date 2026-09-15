import type {
  ApiRequestsQuery,
  RelativeTimeRangeValuesRequestV2,
  TimeRangeRequestV2,
  TimeRangeV4,
} from '@kong-ui-public/analytics-utilities'
import type { RequestsToScatterDataOptions } from '@kong-ui-public/analytics-chart'

import { relativeTimeRangeValuesRequestV2 } from '@kong-ui-public/analytics-utilities'

const DEFAULT_REQUESTS_TIME_RANGE: RelativeTimeRangeValuesRequestV2 = '24H'

export const REQUEST_FIELD_TO_RECORD_KEY: Readonly<Record<string, string>> = {
  status_code: 'response_http_status',
  upstream_status_code: 'upstream_status',
}

export const REQUEST_METRIC_UNITS: Readonly<Record<string, string>> = {
  cost: 'usd',
  latencies_response_ms: 'ms',
  latencies_upstream_ms: 'ms',
  latencies_kong_gateway_ms: 'ms',
  latencies_kong_internal_ms: 'ms',
  request_body_size: 'bytes',
  response_body_size: 'bytes',
  response_header_content_length: 'bytes',
  ai_count: 'count',
}

const isRequestsRelativeTimeRange = (value: string): value is RelativeTimeRangeValuesRequestV2 => (
  (relativeTimeRangeValuesRequestV2 as readonly string[]).includes(value)
)

export const toRequestsTimeRange = (timeRange: TimeRangeV4 | undefined): TimeRangeRequestV2 => {
  const tz = timeRange?.tz ? { tz: timeRange.tz } : {}

  if (timeRange?.type === 'absolute') {
    return { type: 'absolute', start: timeRange.start, end: timeRange.end, ...tz }
  }

  const relative = timeRange?.time_range.toUpperCase() ?? ''

  return {
    type: 'relative',
    time_range: isRequestsRelativeTimeRange(relative) ? relative : DEFAULT_REQUESTS_TIME_RANGE,
    ...tz,
  }
}

const toRecordKey = (field: string): string => REQUEST_FIELD_TO_RECORD_KEY[field] ?? field

export const toRequestsScatterOptions = (query: ApiRequestsQuery): RequestsToScatterDataOptions => ({
  metric: toRecordKey(query.metric),
  dimension: query.dimension ? toRecordKey(query.dimension) : undefined,
  unroll: query.unroll,
  metricUnit: REQUEST_METRIC_UNITS[query.metric],
  extraFields: query.extra_fields,
})
