import { describe, expect, it } from 'vitest'
import { generateSandboxMockData } from './mock-data'

describe('generateSandboxMockData', () => {
  it('builds arbitrary single-dimension data for theme palette demos', () => {
    const result = generateSandboxMockData({
      chartKind: 'cross_section',
      extraDimensionCount: 0,
      mockDataType: 'single_dimension',
      randomSeed: 1,
    })

    expect(Object.keys(result.meta.display || {})).toEqual(['route'])
    expect(Object.keys(result.meta.display?.route || {})).toEqual(['payments'])
    expect(result.meta.metric_names).toEqual(['request_count'])
  })

  it('adds synthetic series to single-dimension data when requested', () => {
    const result = generateSandboxMockData({
      chartKind: 'cross_section',
      extraDimensionCount: 2,
      mockDataType: 'single_dimension',
      randomSeed: 1,
    })

    expect(Object.keys(result.meta.display?.route || {})).toEqual(['payments', 'route-01', 'route-02'])
  })

  it('builds semantic status-code group data separately from arbitrary dimensions', () => {
    const result = generateSandboxMockData({
      chartKind: 'timeseries',
      extraDimensionCount: 0,
      mockDataType: 'status_code_groups',
      randomSeed: 1,
    })

    expect(Object.keys(result.meta.display || {})).toEqual(['status_code_grouped'])
    expect(Object.keys(result.meta.display?.status_code_grouped || {})).toEqual(['1XX', '2XX', '3XX', '4XX', '5XX'])
  })

  it('builds multi-metric data without dimension fields', () => {
    const result = generateSandboxMockData({
      chartKind: 'cross_section',
      extraDimensionCount: 10,
      mockDataType: 'multi_metric',
      randomSeed: 1,
    })

    expect(result.meta.display).toEqual({})
    expect(result.meta.metric_names).toEqual(['request_count', 'response_latency_average'])
  })

  it('changes random arbitrary dimension labels when the random seed changes', () => {
    const first = generateSandboxMockData({
      chartKind: 'cross_section',
      extraDimensionCount: 0,
      mockDataType: 'random',
      randomSeed: 1,
    })
    const second = generateSandboxMockData({
      chartKind: 'cross_section',
      extraDimensionCount: 0,
      mockDataType: 'random',
      randomSeed: 2,
    })

    expect(Object.keys(first.meta.display?.route || {})).not.toEqual(Object.keys(second.meta.display?.route || {}))
  })
})
