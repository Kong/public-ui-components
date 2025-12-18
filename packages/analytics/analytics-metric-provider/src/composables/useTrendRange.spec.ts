import type { TimeRangeV4, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'

import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import useTrendRange from './useTrendRange'

describe('useTrendRange', () => {
  describe('relative time ranges', () => {
    it('returns empty string when withTrend is false', () => {
      const timeRange = ref<TimeRangeV4>({
        type: 'relative',
        time_range: '24h',
      })
      const withTrend = ref(false)

      const result = useTrendRange(withTrend, timeRange)

      expect(result.value).toBe('')
    })

    it('returns correct translation for 24h relative time range with trend', () => {
      const timeRange = ref<TimeRangeV4>({
        type: 'relative',
        time_range: '24h',
      })
      const withTrend = ref(true)

      const result = useTrendRange(withTrend, timeRange)

      expect(result.value).toBe('vs previous 24 hours')
    })

    it('returns correct translation for 7d relative time range with trend', () => {
      const timeRange = ref<TimeRangeV4>({
        type: 'relative',
        time_range: '7d',
      })
      const withTrend = ref(true)

      const result = useTrendRange(withTrend, timeRange)

      expect(result.value).toBe('vs previous 7 days')
    })
  })

  describe('absolute time ranges with timeRange object', () => {
    it('calculates hours correctly for 1 day range with trend (halved to 12 hours)', () => {
      const timeRange = ref<TimeRangeV4>({
        type: 'absolute',
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-02T00:00:00Z'),
      })
      const withTrend = ref(true)

      const result = useTrendRange(withTrend, timeRange)

      // 24 hours / 2 = 12 hours when withTrend is true
      expect(result.value).toBe('vs previous 12 hours')
    })

    it('calculates days correctly for 1 day range without trend', () => {
      const timeRange = ref<TimeRangeV4>({
        type: 'absolute',
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-02T00:00:00Z'),
      })
      const withTrend = ref(false)

      const result = useTrendRange(withTrend, timeRange)

      expect(result.value).toBe('vs previous day')
    })

    it('calculates days correctly for 7 day range with trend', () => {
      const timeRange = ref<TimeRangeV4>({
        type: 'absolute',
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-08T00:00:00Z'),
      })
      const withTrend = ref(true)

      const result = useTrendRange(withTrend, timeRange)

      // 7 days / 2 = 3.5 days, rounds to 4 days
      expect(result.value).toBe('vs previous 4 days')
    })

    it('calculates hours correctly when less than 1 day with trend', () => {
      const timeRange = ref<TimeRangeV4>({
        type: 'absolute',
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-01T12:00:00Z'),
      })
      const withTrend = ref(true)

      const result = useTrendRange(withTrend, timeRange)

      expect(result.value).toBe('vs previous 6 hours')
    })

    it('calculates minutes correctly when less than 1 hour with trend', () => {
      const timeRange = ref<TimeRangeV4>({
        type: 'absolute',
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-01T00:30:00Z'),
      })
      const withTrend = ref(true)

      const result = useTrendRange(withTrend, timeRange)

      expect(result.value).toBe('vs previous 15 minutes')
    })

    it('returns empty string when start/end are missing', () => {
      const timeRange = ref<TimeRangeV4>({
        type: 'absolute',
        start: undefined as any,
        end: undefined as any,
      })
      const withTrend = ref(true)

      const result = useTrendRange(withTrend, timeRange)

      expect(result.value).toBe('')
    })
  })

  describe('absolute time ranges with meta object', () => {
    it('calculates hours correctly from meta when timeRange is not provided (1 day halved)', () => {
      const withTrend = ref(true)
      const meta = ref<ExploreResultV4['meta']>({
        start_ms: new Date('2024-01-01T00:00:00Z').getTime(),
        end_ms: new Date('2024-01-02T00:00:00Z').getTime(),
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z',
        granularity_ms: 86400000,
        query_id: '',
        metric_names: ['request_count'],
        metric_units: { request_count: 'count' },
        display: {},
      })

      const result = useTrendRange(withTrend, undefined, meta)

      // 24 hours / 2 = 12 hours when withTrend is true
      expect(result.value).toBe('vs previous 12 hours')
    })

    it('prefers meta over timeRange when both are provided', () => {
      const timeRange = ref<TimeRangeV4>({
        type: 'absolute',
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-03T00:00:00Z'),
      })
      const withTrend = ref(true)
      const meta = ref<ExploreResultV4['meta']>({
        start_ms: new Date('2024-01-01T00:00:00Z').getTime(),
        end_ms: new Date('2024-01-02T00:00:00Z').getTime(),
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z',
        granularity_ms: 86400000,
        query_id: '',
        metric_names: ['request_count'],
        metric_units: { request_count: 'count' },
        display: {},
      })

      const result = useTrendRange(withTrend, timeRange, meta)

      // Should use meta (24 hours / 2 = 12 hours) instead of timeRange (48 hours / 2 = 24 hours = 1 day)
      expect(result.value).toBe('vs previous 12 hours')
    })

    it('calculates hours correctly from meta with trend', () => {
      const withTrend = ref(true)
      const meta = ref<ExploreResultV4['meta']>({
        start_ms: new Date('2024-01-01T00:00:00Z').getTime(),
        end_ms: new Date('2024-01-01T12:00:00Z').getTime(),
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-01T12:00:00Z',
        granularity_ms: 3600000,
        query_id: '',
        metric_names: ['request_count'],
        metric_units: { request_count: 'count' },
        display: {},
      })

      const result = useTrendRange(withTrend, undefined, meta)

      expect(result.value).toBe('vs previous 6 hours')
    })

    it('returns empty string when meta is missing start_ms or end_ms', () => {
      const withTrend = ref(true)
      const meta = ref<ExploreResultV4['meta']>({
        start_ms: undefined as any,
        end_ms: undefined as any,
        start: undefined as any,
        end: undefined as any,
        granularity_ms: 86400000,
        query_id: '',
        metric_names: ['request_count'],
        metric_units: { request_count: 'count' },
        display: {},
      })

      const result = useTrendRange(withTrend, undefined, meta)

      expect(result.value).toBe('')
    })
  })

  describe('edge cases', () => {
    it('returns empty string when no timeRange or meta provided with trend', () => {
      const withTrend = ref(true)

      const result = useTrendRange(withTrend)

      expect(result.value).toBe('')
    })

    it('returns empty string when no timeRange or meta provided without trend', () => {
      const withTrend = ref(false)

      const result = useTrendRange(withTrend)

      expect(result.value).toBe('')
    })

    it('handles withTrend halving the duration correctly', () => {
      const timeRange = ref<TimeRangeV4>({
        type: 'absolute',
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-03T00:00:00Z'), // 2 days
      })
      const withTrend = ref(true)

      const result = useTrendRange(withTrend, timeRange)

      // 2 days / 2 = 1 day when withTrend is true
      expect(result.value).toBe('vs previous day')
    })

    it('does not halve duration when withTrend is false for absolute ranges', () => {
      const timeRange = ref<TimeRangeV4>({
        type: 'absolute',
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-03T00:00:00Z'), // 2 days
      })
      const withTrend = ref(false)

      const result = useTrendRange(withTrend, timeRange)

      // Should be 2 days when withTrend is false
      expect(result.value).toBe('vs previous 2 days')
    })

    it('rounds fractional days correctly', () => {
      const timeRange = ref<TimeRangeV4>({
        type: 'absolute',
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-01T18:00:00Z'), // 0.75 days = 18 hours
      })
      const withTrend = ref(false)

      const result = useTrendRange(withTrend, timeRange)

      // 18 hours should be shown as hours, not rounded to 1 day
      expect(result.value).toBe('vs previous 18 hours')
    })
  })
})
