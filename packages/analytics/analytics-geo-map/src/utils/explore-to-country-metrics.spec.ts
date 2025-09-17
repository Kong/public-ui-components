import { describe, it, expect } from 'vitest'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import { exploreResultToCountryMetrics } from './explore-to-country-metrics'

describe('exploreResultToCountryMetrics', () => {
  it('returns an empty object when exploreResult is undefined', () => {
    // @ts-expect-error intentional undefined for test
    expect(exploreResultToCountryMetrics(undefined)).toEqual({})
  })

  it('returns an empty object when data is missing', () => {
    const exploreResult = {
      data: undefined,
      meta: { metric_names: ['requests'] },
    } as unknown as ExploreResultV4

    expect(exploreResultToCountryMetrics(exploreResult)).toEqual({})
  })

  it('maps country_code values to metric values', () => {
    const exploreResult = {
      data: [
        { event: { country_code: 'US', requests: 100 } },
        { event: { country_code: 'FR', requests: 50 } },
      ],
      meta: { metric_names: ['requests'] },
    } as unknown as ExploreResultV4

    expect(exploreResultToCountryMetrics(exploreResult)).toEqual({
      US: 100,
      FR: 50,
    })
  })
})
