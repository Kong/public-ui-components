import { describe, expect, it } from 'vitest'
import {
  clampScrollWindow,
  getVisibleCategoryCount,
  normalizeDataZoomWindow,
  resolveChartScrollWindow,
  shouldHideAnnotationsForBreakpoint,
} from './chart-scroll'

describe('chart-scroll', () => {
  it('normalizes direct and batched data zoom payloads', () => {
    expect(normalizeDataZoomWindow({ startValue: 2, endValue: 8 })).toEqual({
      startValue: 2,
      endValue: 8,
    })

    expect(normalizeDataZoomWindow({
      batch: [{ startValue: '3', endValue: '9' }],
    })).toEqual({
      startValue: 3,
      endValue: 9,
    })
  })

  it('normalizes percentage-based data zoom payloads against the category count', () => {
    expect(normalizeDataZoomWindow({ start: 10, end: 30 }, 21)).toEqual({
      startValue: 2,
      endValue: 6,
    })

    expect(normalizeDataZoomWindow({
      batch: [{ start: '20', end: '40' }],
    }, 11)).toEqual({
      startValue: 2,
      endValue: 4,
    })
  })

  it('returns null when the payload does not contain a usable value window', () => {
    expect(normalizeDataZoomWindow({})).toBeNull()
  })

  it('clamps windows to the current category range while preserving the visible window size', () => {
    expect(clampScrollWindow({
      startValue: 18,
      visibleCategoryCount: 7,
      categoryCount: 20,
    })).toEqual({
      startValue: 13,
      endValue: 19,
    })
  })

  it('derives the visible category count from the available axis size', () => {
    expect(getVisibleCategoryCount({ axisSize: 200, categoryCount: 20 })).toBe(7)
    expect(getVisibleCategoryCount({ axisSize: 640, categoryCount: 2 })).toBe(2)
  })

  it('resolves the default data zoom window from geometry', () => {
    expect(resolveChartScrollWindow({
      axisSize: 52,
      categoryCount: 4,
      scrollWindow: null,
    })).toEqual({
      startValue: 0,
      endValue: 1,
    })
  })

  it('preserves the seeded window size while clamping it into range', () => {
    expect(resolveChartScrollWindow({
      axisSize: 52,
      categoryCount: 4,
      scrollWindow: {
        startValue: 2,
        endValue: 4,
      },
    })).toEqual({
      startValue: 1,
      endValue: 3,
    })
  })

  it('disables scrolling when every category fits even if a smaller window was seeded', () => {
    expect(resolveChartScrollWindow({
      axisSize: 260,
      categoryCount: 4,
      scrollWindow: {
        startValue: 2,
        endValue: 3,
      },
    })).toBeNull()
  })

  it('suppresses annotations at the current responsive breakpoints', () => {
    expect(shouldHideAnnotationsForBreakpoint({
      chartWidth: 500,
      chartHeight: 420,
    })).toBe(true)

    expect(shouldHideAnnotationsForBreakpoint({
      chartWidth: 640,
      chartHeight: 200,
    })).toBe(true)

    expect(shouldHideAnnotationsForBreakpoint({
      chartWidth: 640,
      chartHeight: 420,
    })).toBe(false)
  })
})
