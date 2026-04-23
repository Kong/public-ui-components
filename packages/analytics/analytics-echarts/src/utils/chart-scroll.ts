import type { ChartScrollWindow } from '../types'

const MIN_CATEGORY_SIZE = 26

export interface StoredChartScrollWindow {
  anchorLabel: string
  visibleCategoryCount: number
}

export const getVisibleCategoryCount = ({
  axisSize,
  categoryCount,
}: {
  axisSize: number
  categoryCount: number
}) => {
  if (!axisSize || categoryCount <= 0) {
    return categoryCount
  }

  return Math.max(1, Math.min(categoryCount, Math.floor(axisSize / MIN_CATEGORY_SIZE)))
}

export const clampScrollWindow = ({
  startValue,
  visibleCategoryCount,
  categoryCount,
}: {
  startValue: number
  visibleCategoryCount: number
  categoryCount: number
}): ChartScrollWindow | null => {
  if (visibleCategoryCount >= categoryCount || categoryCount <= 0) {
    return null
  }

  const windowSize = Math.max(1, visibleCategoryCount)
  const maxStart = Math.max(0, categoryCount - windowSize)
  const clampedStartValue = Math.min(Math.max(0, startValue), maxStart)

  return {
    startValue: clampedStartValue,
    endValue: Math.min(categoryCount - 1, clampedStartValue + windowSize - 1),
  }
}

export const normalizeDataZoomWindow = (
  payload: {
    startValue?: number | string
    endValue?: number | string
    batch?: Array<{
      startValue?: number | string
      endValue?: number | string
    }>
  },
): ChartScrollWindow | null => {
  const source = payload.batch?.[0] || payload
  const startValue = Number(source.startValue)
  const endValue = Number(source.endValue)

  if (!Number.isFinite(startValue) || !Number.isFinite(endValue)) {
    return null
  }

  return {
    startValue: Math.trunc(startValue),
    endValue: Math.trunc(endValue),
  }
}

export const createStoredScrollWindow = ({
  labels,
  scrollWindow,
}: {
  labels: string[]
  scrollWindow: ChartScrollWindow | null
}): StoredChartScrollWindow | null => {
  if (!scrollWindow || labels.length === 0) {
    return null
  }

  const anchorLabel = labels[Math.max(0, scrollWindow.startValue)]

  if (!anchorLabel) {
    return null
  }

  return {
    anchorLabel,
    visibleCategoryCount: Math.max(1, scrollWindow.endValue - scrollWindow.startValue + 1),
  }
}

export const resolveStoredScrollWindow = ({
  labels,
  visibleCategoryCount,
  scrollWindow,
}: {
  labels: string[]
  visibleCategoryCount: number
  scrollWindow: StoredChartScrollWindow | null
}): ChartScrollWindow | null => {
  if (labels.length === 0) {
    return null
  }

  const anchorIndex = scrollWindow ? labels.indexOf(scrollWindow.anchorLabel) : 0

  return clampScrollWindow({
    startValue: anchorIndex >= 0 ? anchorIndex : 0,
    visibleCategoryCount,
    categoryCount: labels.length,
  })
}

export const resolveChartScrollWindow = ({
  axisSize,
  labels,
  scrollWindow,
}: {
  axisSize: number
  labels: string[]
  scrollWindow: StoredChartScrollWindow | null
}) => {
  const fallbackVisibleCategoryCount = scrollWindow?.visibleCategoryCount ?? labels.length
  const visibleCategoryCount = axisSize
    ? getVisibleCategoryCount({
      axisSize,
      categoryCount: labels.length,
    })
    : fallbackVisibleCategoryCount
  const resolvedWindow = resolveStoredScrollWindow({
    labels,
    visibleCategoryCount,
    scrollWindow,
  })

  return {
    visibleCategoryCount,
    scrollWindow: resolvedWindow,
    storedScrollWindow: resolvedWindow
      ? createStoredScrollWindow({
        labels,
        scrollWindow: resolvedWindow,
      })
      : null,
  }
}
