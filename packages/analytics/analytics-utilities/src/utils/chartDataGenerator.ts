import type {
  DimensionMap,
  ExploreAggregations,
  MetricUnit,
  DisplayBlob,
  RecordEvent,
  QueryResponseMeta,
  ExploreResultV4,
} from '../types'
import { SeededRandom } from './SeedRandom'
import { rand } from '../utils'

export interface Metric {
  name: string
  unit: string
}

export const generateSingleMetricTimeSeriesData = (metric: Metric, dimensionMap?: DimensionMap, metaOverrides?: Partial<QueryResponseMeta>) => {
  const seed = rand(10, 10000)
  const rng = new SeededRandom(seed)

  const start = Date.now() - 6 * 60 * 60 * 1000 // 6 hours ago
  const end = Date.now()
  const data = []
  let totalRequests = 0

  for (let i = start; i <= end; i += 60 * 60 * 1000) { // 1 hour apart
    if (dimensionMap) {
      // If dimensionMap is provided, create an event for each dimension value
      for (const dimension in dimensionMap) {
        dimensionMap[dimension].forEach(dimensionValue => {
          totalRequests += rng.next(50, 500)

          const event = {
            [dimension]: dimensionValue,
            [metric.name]: totalRequests,
          }

          const record = {
            version: '1.0',
            timestamp: new Date(i).toISOString(),
            event,
          }
          data.push(record)
        })
      }
    } else {
      // If no dimensionMap is provided, create a single event
      totalRequests += rng.next(50, 500)

      const record = {
        version: '1.0',
        timestamp: new Date(i).toISOString(),
        event: {
          [metric.name]: totalRequests,
        },
      }
      data.push(record)
    }
  }

  // V4 display blob
  const displayBlob: DisplayBlob = {}

  if (dimensionMap) {
    for (const dimension in dimensionMap) {
      displayBlob[dimension] = {}
      dimensionMap[dimension].forEach(dimensionValue => {
        displayBlob[dimension][dimensionValue] = {
          name: dimensionValue,
          deleted: false,
        }
      })
    }
  }

  const meta: QueryResponseMeta = {
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString(),
    query_id: '12345',
    metric_names: [metric.name] as ExploreAggregations[],
    metric_units: {
      [metric.name]: metric.unit,
    },
    granularity_ms: 60 * 60 * 1000, // 1 hour in ms
    display: displayBlob,
    ...(metaOverrides ?? {}),
  }

  return {
    data,
    meta,
  } as ExploreResultV4
}

export const generateMultipleMetricTimeSeriesData = (metrics: Metric[], metaOverrides?: Partial<QueryResponseMeta>) => {
  const seed = rand(10, 10000)
  const rng = new SeededRandom(seed)

  const start = Date.now() - 6 * 60 * 60 * 1000 // 6 hours ago
  const end = Date.now()
  const data = []
  const metricValues: { [metric: string]: number } = {}

  metrics.forEach(metric => {
    metricValues[metric.name] = 0
  })

  for (let i = start; i <= end; i += 60 * 60 * 1000) { // 1 hour apart
    const event: RecordEvent = {}

    metrics.forEach(metric => {
      metricValues[metric.name] += rng.next(50, 500)
      event[metric.name] = metricValues[metric.name]
    })

    const record = {
      version: '1.0',
      timestamp: new Date(i).toISOString(),
      event,
    }
    data.push(record)
  }

  const meta: QueryResponseMeta = {
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString(),
    query_id: '12345',
    metric_names: metrics.map(metric => metric.name) as ExploreAggregations[],
    metric_units: metrics.reduce((units: MetricUnit, metric) => {
      units[metric.name as ExploreAggregations] = metric.unit
      return units
    }, {}),
    granularity_ms: 60 * 60 * 1000, // 1 hour in ms
    display: {},
    ...(metaOverrides ?? {}),
  }

  return {
    data,
    meta,
  } as ExploreResultV4
}

export const generateCrossSectionalData = (metrics: Metric[], dimensionMap?: DimensionMap, metaOverrides?: Partial<QueryResponseMeta>) => {
  const seed = Math.floor(Math.random() * (10000 - 10 + 1)) + 10
  const rng = new SeededRandom(seed)

  const start = Date.now() - 6 * 60 * 60 * 1000 // 6 hours ago
  const end = Date.now()
  const timestamp = new Date((start + end) / 2).toISOString()

  const data = []

  if (dimensionMap) {
    const dimensions = Object.keys(dimensionMap)
    const dimensionValues = Object.values(dimensionMap)

    // Recursively create a record for each combination of dimension values
    const createRecords = (currentEvent: RecordEvent, index: number) => {
      if (index === dimensions.length) {
        // All dimensions have been added to the event, add metrics and push the record
        metrics.forEach(metric => {
          currentEvent[metric.name] = rng.next(1000, 50000000)
        })
        data.push({
          version: '1.0',
          timestamp: new Date().toISOString(),
          event: { ...currentEvent },
        })
        return
      }

      dimensionValues[index].forEach(value => {
        createRecords({ ...currentEvent, [dimensions[index]]: value }, index + 1)
      })
    }

    createRecords({}, 0)
  } else {
    // If no dimensionMap is provided, create a single event with all metrics
    const event: RecordEvent = {}
    metrics.forEach(metric => {
      event[metric.name] = rng.next(50, 500)
    })

    data.push({
      version: '1.0',
      timestamp,
      event,
    })
  }

  // V4 display blob
  const displayBlob: DisplayBlob = {}

  if (dimensionMap) {
    for (const dimension in dimensionMap) {
      displayBlob[dimension] = {}
      dimensionMap[dimension].forEach(dimensionValue => {
        displayBlob[dimension][dimensionValue] = {
          name: dimensionValue,
          deleted: false,
        }
      })
    }
  }

  const meta: QueryResponseMeta = {
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString(),
    query_id: '12345',
    metric_names: metrics.map(metric => metric.name) as ExploreAggregations[],
    metric_units: metrics.reduce((units: MetricUnit, metric) => {
      units[metric.name as ExploreAggregations] = metric.unit
      return units
    }, {}),
    truncated: false,
    limit: 50,
    display: displayBlob,
    granularity_ms: end - start,
    ...(metaOverrides ?? {}),
  }

  return {
    data,
    meta,
  } as ExploreResultV4
}
