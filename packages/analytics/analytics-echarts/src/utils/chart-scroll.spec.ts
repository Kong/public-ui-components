import { describe, expect, it } from 'vitest'
import {
  clampScrollWindow,
  createStoredScrollWindow,
  getVisibleCategoryCount,
  normalizeDataZoomWindow,
  resolveCrossSectionViewportState,
  resolveChartScrollWindow,
  resolveStoredScrollWindow,
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

  it('returns null when the payload does not contain a usable value window', () => {
    expect(normalizeDataZoomWindow({})).toBeNull()
  })

  it('clamps stored windows to the current category range while preserving the visible window size', () => {
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

  it('resolves a stored anchor back into the current label window after reorder', () => {
    expect(resolveStoredScrollWindow({
      labels: ['Gamma', 'Alpha', 'Beta', 'Delta'],
      visibleCategoryCount: 2,
      scrollWindow: {
        anchorLabel: 'Beta',
        visibleCategoryCount: 2,
      },
    })).toEqual({
      startValue: 2,
      endValue: 3,
    })
  })

  it('falls back to the first window when the stored anchor disappears', () => {
    expect(resolveStoredScrollWindow({
      labels: ['Alpha', 'Beta', 'Gamma'],
      visibleCategoryCount: 2,
      scrollWindow: {
        anchorLabel: 'Missing',
        visibleCategoryCount: 2,
      },
    })).toEqual({
      startValue: 0,
      endValue: 1,
    })
  })

  it('uses one shared resolution path to normalize persisted windows', () => {
    expect(resolveChartScrollWindow({
      axisSize: 52,
      labels: ['Alpha', 'Beta', 'Gamma', 'Delta'],
      scrollWindow: {
        anchorLabel: 'Gamma',
        visibleCategoryCount: 3,
      },
    })).toEqual({
      visibleCategoryCount: 2,
      scrollWindow: {
        startValue: 2,
        endValue: 3,
      },
      storedScrollWindow: {
        anchorLabel: 'Gamma',
        visibleCategoryCount: 2,
      },
    })
  })

  it('stores the leading visible label as the scroll anchor', () => {
    expect(createStoredScrollWindow({
      labels: ['Alpha', 'Beta', 'Gamma'],
      scrollWindow: {
        startValue: 1,
        endValue: 2,
      },
    })).toEqual({
      anchorLabel: 'Beta',
      visibleCategoryCount: 2,
    })
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

  it('reports scrollable and annotation suppression state through one shared viewport helper', () => {
    expect(resolveCrossSectionViewportState({
      chartType: 'horizontal_bar',
      chartWidth: 640,
      chartHeight: 52,
      labels: ['Alpha', 'Beta', 'Gamma', 'Delta'],
      scrollWindow: {
        anchorLabel: 'Gamma',
        visibleCategoryCount: 3,
      },
    })).toEqual({
      visibleCategoryCount: 2,
      scrollWindow: {
        startValue: 2,
        endValue: 3,
      },
      storedScrollWindow: {
        anchorLabel: 'Gamma',
        visibleCategoryCount: 2,
      },
      isScrollable: true,
      annotationsHiddenByBreakpoint: true,
      annotationsSuppressed: true,
    })
  })
})
