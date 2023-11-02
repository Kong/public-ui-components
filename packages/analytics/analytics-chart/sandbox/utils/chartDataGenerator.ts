import type { AnalyticsExploreV2Meta, DimensionMap, MetricUnit, RecordEvent } from '@kong-ui-public/analytics-utilities'
import { SeededRandom } from './SeedRandom'
import { rand } from './utils'

export interface Metric {
  name: string,
  unit: string
}

export const generateSingleMetricTimeSeriesData = (metric: Metric, dimensionMap?: DimensionMap) => {
  const seed = rand(10, 10000)
  const rng = new SeededRandom(seed)

  const start = Date.now() - 6 * 60 * 60 * 1000 // 6 hours ago
  const end = Date.now()
  const records = []
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
          records.push(record)
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
      records.push(record)
    }
  }

  const meta = {
    startMs: start,
    endMs: end,
    queryId: '12345',
    metricNames: [metric.name],
    metricUnits: {
      [metric.name]: metric.unit,
    },
    granularity: 60 * 60 * 1000, // 1 hour in ms
    dimensions: dimensionMap,
  }

  return {
    records,
    meta,
  }
}

export const generateMultipleMetricTimeSeriesData = (metrics: Metric[]) => {
  const seed = rand(10, 10000)
  const rng = new SeededRandom(seed)

  const start = Date.now() - 6 * 60 * 60 * 1000 // 6 hours ago
  const end = Date.now()
  const records = []
  const metricValues: {[metric: string]: number} = {}

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
    records.push(record)
  }

  const meta = {
    startMs: start,
    endMs: end,
    queryId: '12345',
    metricNames: metrics.map(metric => metric.name),
    metricUnits: metrics.reduce((units: MetricUnit, metric) => {
      units[metric.name] = metric.unit
      return units
    }, {}),
    granularity: 60 * 60 * 1000, // 1 hour in ms
  }

  return {
    records,
    meta,
  }
}

export const generateCrossSectionalData = (metrics: Metric[], dimensionMap: DimensionMap) => {
  const seed = Math.floor(Math.random() * (10000 - 10 + 1)) + 10
  const rng = new SeededRandom(seed)

  const start = Date.now() - 6 * 60 * 60 * 1000 // 6 hours ago
  const end = Date.now()
  const timestamp = new Date((start + end) / 2).toISOString()

  const records = []

  if (dimensionMap) {
    const dimensions = Object.keys(dimensionMap)
    const dimensionValues = Object.values(dimensionMap)

    // Recursively create a record for each combination of dimension values
    const createRecords = (currentEvent: RecordEvent, index: number) => {
      if (index === dimensions.length) {
        // All dimensions have been added to the event, add metrics and push the record
        metrics.forEach(metric => {
          currentEvent[metric.name] = rng.next(50, 500)
        })
        records.push({
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

    records.push({
      version: '1.0',
      timestamp,
      event,
    })
  }

  const meta: AnalyticsExploreV2Meta = {
    startMs: start,
    endMs: end,
    queryId: '12345',
    metricNames: metrics.map(metric => metric.name),
    metricUnits: metrics.reduce((units: MetricUnit, metric) => {
      units[metric.name] = metric.unit
      return units
    }, {}),
    granularity: {
      type: 'period',
      period: 'P1D',
      timeZone: 'UTC',
    },
    truncated: false,
    limit: 50,
    dimensions: dimensionMap,
  }

  return {
    records,
    meta,
  }
}
