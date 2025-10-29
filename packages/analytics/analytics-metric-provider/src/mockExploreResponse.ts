import type { CyHttpMessages } from 'cypress/types/net-stubbing'
import { ALL_STATUS_CODE_GROUPS } from './constants'
import type {
  AbsoluteTimeRangeV4,
  Display,
  ExploreQuery,
  ExploreResultV4,
  GroupByResult,
  QueryResponseMeta,
} from '@kong-ui-public/analytics-utilities'
import { DeltaQueryTime, UnaryQueryTime } from '@kong-ui-public/analytics-utilities'

// Replicate date-fns `fromUnixTime` here to avoid a dependency.
const fromUnixTimeMs = (t: number) => new Date(t)

export interface MockOptions {
  dimensionNames?: string[]
  injectErrors?: 'latency' | 'traffic' | 'all'
  deterministic?: boolean
  timeRange?: AbsoluteTimeRangeV4
}

export const mockExploreResponseFromCypress = (
  req: CyHttpMessages.IncomingHttpRequest,
  opts?: MockOptions,
) => {
  const body: ExploreQuery = req.body

  req.reply({
    statusCode: 200,
    body: mockExploreResponse(body, opts),
  })
}

const arrayToDisplay = (arr: string[]): Display =>
  arr.reduce((acc, val) => {
    acc[val] = { name: val }
    return acc
  }, {} as Display)

export const mockExploreResponse = (
  body: ExploreQuery,
  opts?: MockOptions,
) => {
  const timeRange = opts?.timeRange && {
    start: opts.timeRange.start,
    end: opts.timeRange.end,
  } || body.time_range?.type === 'absolute'
    ? {
      // @ts-ignore - already asserted time range is absolute above
      start: new Date(body.time_range.start),
      // @ts-ignore - already asserted time range is absolute above
      end: new Date(body.time_range.end),
    }
    : {
      start: new Date(Date.now() - 3600 * 1000 * 24),
      end: new Date(),
    }
  const defaultQueryTime = body.granularity === 'trend' ? new DeltaQueryTime(timeRange, 'secondly') : new UnaryQueryTime(timeRange, 'secondly')
  const end = defaultQueryTime.endMs()
  const start = defaultQueryTime.startMs()

  const granularity = defaultQueryTime.granularityMs()

  const numRecords = body.granularity === 'trend' ? 2 : 1

  if ((body.dimensions ?? []).length > 2) {
    throw new Error(`Explore only supports 0-2 dimensions; got: ${JSON.stringify(body.dimensions)}`)
  }

  const primaryDimension = (body.dimensions ?? []).find((x) => x !== 'time')
  const dimensionNames = opts?.dimensionNames ?? []
  const dimensionLength = Math.max(dimensionNames.length, 1)
  const metrics = body.metrics || []
  const data: GroupByResult[] = []

  for (let i = 0; i < numRecords; i++) {
    for (let j = 0; j < dimensionLength; j++) {
      const eventValue: any = primaryDimension
        ? { [primaryDimension]: dimensionNames[j] }
        : {}

      if (body.dimensions?.includes('status_code_grouped')) {
        ALL_STATUS_CODE_GROUPS.forEach(code => {
          const event = metrics.reduce((accum, agg) => {
            if (opts?.deterministic ?? true) {
              accum[agg] = (numRecords - i) * 1000 + 100 * j + 1
            } else {
              accum[agg] = Math.round(Math.random() * 1000)
            }
            return accum
          }, { ...eventValue, status_code_grouped: code })

          data.push({
            version: 'v1',
            timestamp:
              i === 0
                ? fromUnixTimeMs(start).toISOString()
                : fromUnixTimeMs(start + granularity).toISOString(),
            event,
          })
        })
      } else {
        data.push({
          version: 'v1',
          timestamp:
            i === 0
              ? fromUnixTimeMs(start).toISOString()
              : fromUnixTimeMs(start + granularity).toISOString(),
          event: metrics.reduce((accum, agg) => {
            if (opts?.deterministic ?? true) {
              accum[agg] = (numRecords - i) * 1000 + (100 * j) + 1
            } else {
              accum[agg] = Math.round(Math.random() * 1000)
            }
            return accum
          }, { ...eventValue }),
        })
      }
    }
  }

  const meta: QueryResponseMeta = {
    start_ms: start,
    end_ms: end,
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString(),
    granularity_ms: granularity,
    display: primaryDimension
      ? {
        [primaryDimension]: arrayToDisplay(dimensionNames),
        ...(body.dimensions?.includes('status_code_grouped') ? { status_code_grouped: arrayToDisplay(ALL_STATUS_CODE_GROUPS) } : {}),
      }
      : {},
    metric_names: body.metrics,
    query_id: 'test',
  }

  return {
    data,
    meta,
  } as ExploreResultV4
}
