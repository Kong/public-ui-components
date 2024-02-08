import type { ExploreV2Query } from './types'
import { EXPLORE_V2_DIMENSIONS } from './types'
import type { CyHttpMessages } from 'cypress/types/net-stubbing'
import { ALL_STATUS_CODE_GROUPS } from './constants'

// Replicate date-fns `fromUnixTime` here to avoid a dependency.
const fromUnixTimeMs = (t: number) => new Date(t)

export interface MockOptions {
  dimensionNames?: string[]
  injectErrors?: 'latency' | 'traffic' | 'all'
}

export const mockExploreResponseFromCypress = (
  req: CyHttpMessages.IncomingHttpRequest,
  opts?: MockOptions,
) => {
  const body: ExploreV2Query = req.body

  const { startMs: qStart, endMs: qEnd } = req.query

  const start = typeof qStart !== 'number' ? parseInt(qStart, 10) : qStart
  const end = typeof qEnd !== 'number' ? parseInt(qEnd, 10) : qEnd

  req.reply({
    statusCode: 200,
    body: mockExploreResponse(body, start, end, opts),
  })
}

export const mockExploreResponse = (
  body: ExploreV2Query,
  start: number,
  end: number,
  opts?: MockOptions,
) => {
  const granularity = body.granularityMs || 0

  const numRecords = granularity ? (end - start) / granularity : 1

  if (numRecords !== 1 && numRecords !== 2) {
    throw new Error(
      "Query did not request 1 or 2 records.  Perhaps there's a chart query on the same page interfering with the stub?",
    )
  }

  if ((body.dimensions ?? []).length > 2) {
    throw new Error(`Explore only supports 0-2 dimensions; got: ${JSON.stringify(body.dimensions)}`)
  }

  const primaryDimension = (body.dimensions ?? []).find((x) => x !== 'TIME')
  const dimensionNames = opts?.dimensionNames ?? []
  const dimensionLength = Math.max(dimensionNames.length, 1)
  const records: any = []

  for (let i = 0; i < numRecords; i++) {
    for (let j = 0; j < dimensionLength; j++) {
      const eventValue: any = primaryDimension
        ? { [primaryDimension]: dimensionNames[j] }
        : {}

      if (body.dimensions?.includes(EXPLORE_V2_DIMENSIONS.STATUS_CODE_GROUPED)) {
        ALL_STATUS_CODE_GROUPS.forEach(code => {
          const event = body.metrics.reduce((accum, agg) => {
            accum[agg] = (numRecords - i) * 1000 + 100 * j + 1
            return accum
          }, { ...eventValue, STATUS_CODE_GROUPED: code })

          records.push({
            version: 'v1',
            timestamp:
              i === 0
                ? fromUnixTimeMs(start).toISOString()
                : fromUnixTimeMs(start + granularity).toISOString(),
            event,
          })
        })
      } else {
        records.push({
          version: 'v1',
          timestamp:
            i === 0
              ? fromUnixTimeMs(start).toISOString()
              : fromUnixTimeMs(start + granularity).toISOString(),
          event: body.metrics.reduce((accum, agg) => {
            accum[agg] = (numRecords - i) * 1000 + (100 * j) + 1
            return accum
          }, { ...eventValue }),
        })
      }
    }
  }

  const meta = {
    start,
    end,
    granularity,
    dimensions: primaryDimension
      ? {
        [primaryDimension]: dimensionNames,
        ...(body.dimensions?.includes(EXPLORE_V2_DIMENSIONS.STATUS_CODE_GROUPED) ? { STATUS_CODE_GROUPED: ALL_STATUS_CODE_GROUPS } : {}),
      }
      : {},
    metricNames: body.metrics,
  }

  return {
    records,
    meta,
  }
}
