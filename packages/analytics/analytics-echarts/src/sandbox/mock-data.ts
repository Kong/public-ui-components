import {
  generateCrossSectionalData,
  generateMultipleMetricTimeSeriesData,
  generateSingleMetricTimeSeriesData,
} from '@kong-ui-public/analytics-utilities'
import type { DimensionMap, ExploreResultV4, Metric } from '@kong-ui-public/analytics-utilities'

export type SandboxMockDataType =
  | 'single_dimension'
  | 'status_codes'
  | 'status_code_groups'
  | 'multi_metric'
  | 'random'

type SandboxChartKind = 'timeseries' | 'cross_section'

const requestCountMetric: Metric = { name: 'request_count', unit: 'count' }
const latencyMetric: Metric = { name: 'response_latency_average', unit: 'ms' }
const multiMetrics = [requestCountMetric, latencyMetric]

const baseRouteDimensions = ['payments']
const baseStatusCodeDimensions = ['200', '204', '301', '404', '429', '500']
const baseStatusCodeGroupDimensions = ['1XX', '2XX', '3XX', '4XX', '5XX']
const randomPrefixes = ['atlas', 'beacon', 'cinder', 'delta', 'ember', 'forge', 'harbor', 'ion', 'juno', 'kepler']
const randomSuffixes = ['api', 'edge', 'mesh', 'proxy', 'route', 'service', 'stream', 'worker', 'zone', 'gateway']

export const canAddMockDimensions = (mockDataType: SandboxMockDataType) => {
  return mockDataType === 'single_dimension' || mockDataType === 'status_codes' || mockDataType === 'random'
}

const buildSyntheticDimensions = ({ prefix, count }: { prefix: string, count: number }) => {
  return Array.from({ length: count }, (_, index) => `${prefix}-${String(index + 1).padStart(2, '0')}`)
}

const buildSyntheticStatusCodes = (count: number) => {
  return Array.from({ length: count }, (_, index) => `${100 + index}`)
}

const buildRandomDimensions = ({ count, seed }: { count: number, seed: number }) => {
  return Array.from({ length: count }, (_, index) => {
    const prefix = randomPrefixes[(seed + index * 3) % randomPrefixes.length]
    const suffix = randomSuffixes[(seed * 2 + index * 5) % randomSuffixes.length]

    return `${prefix}-${suffix}-${String(index + 1).padStart(2, '0')}`
  })
}

const getDimensionMap = ({
  extraDimensionCount,
  mockDataType,
  randomSeed,
}: {
  extraDimensionCount: number
  mockDataType: SandboxMockDataType
  randomSeed: number
}): DimensionMap | undefined => {
  switch (mockDataType) {
    case 'single_dimension':
      return {
        route: [
          ...baseRouteDimensions,
          ...buildSyntheticDimensions({ prefix: 'route', count: extraDimensionCount }),
        ],
      }
    case 'status_codes':
      return {
        status_code: [
          ...baseStatusCodeDimensions,
          ...buildSyntheticStatusCodes(extraDimensionCount),
        ],
      }
    case 'status_code_groups':
      return {
        status_code_grouped: baseStatusCodeGroupDimensions,
      }
    case 'random':
      return {
        route: buildRandomDimensions({
          count: 6 + (randomSeed % 4) + extraDimensionCount,
          seed: randomSeed,
        }),
      }
    case 'multi_metric':
      return undefined
    default:
      return undefined
  }
}

export const generateSandboxMockData = ({
  chartKind,
  extraDimensionCount,
  mockDataType,
  randomSeed,
}: {
  chartKind: SandboxChartKind
  extraDimensionCount: number
  mockDataType: SandboxMockDataType
  randomSeed: number
}): ExploreResultV4 => {
  if (mockDataType === 'multi_metric') {
    return chartKind === 'timeseries'
      ? generateMultipleMetricTimeSeriesData(multiMetrics)
      : generateCrossSectionalData(multiMetrics)
  }

  const dimensionMap = getDimensionMap({ extraDimensionCount, mockDataType, randomSeed })
  const valueRange: [number, number] = mockDataType === 'random' ? [25, 1000] : [50, 500]

  return chartKind === 'timeseries'
    ? generateSingleMetricTimeSeriesData(requestCountMetric, dimensionMap, undefined, valueRange)
    : generateCrossSectionalData([requestCountMetric], dimensionMap, undefined, valueRange)
}
