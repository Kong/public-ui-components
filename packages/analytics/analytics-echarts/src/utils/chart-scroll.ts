import type { ChartScrollWindow } from '../types'

const MIN_CATEGORY_SIZE = 26
const RESPONSIVE_MAX_HEIGHT = 200
const RESPONSIVE_MEDIUM_MAX_WIDTH = 500

export interface DataZoomPayload {
  start?: number | string
  end?: number | string
  startValue?: number | string
  endValue?: number | string
  batch?: Array<{
    start?: number | string
    end?: number | string
    startValue?: number | string
    endValue?: number | string
  }>
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
  payload: DataZoomPayload,
  categoryCount?: number,
): ChartScrollWindow | null => {
  const source = payload.batch?.[0] || payload
  const startValue = Number(source.startValue)
  const endValue = Number(source.endValue)

  if (Number.isFinite(startValue) && Number.isFinite(endValue)) {
    return {
      startValue: Math.trunc(startValue),
      endValue: Math.trunc(endValue),
    }
  }

  const start = Number(source.start)
  const end = Number(source.end)

  if (!categoryCount || !Number.isFinite(start) || !Number.isFinite(end)) {
    return null
  }

  return clampScrollWindow({
    startValue: Math.round((start / 100) * (categoryCount - 1)),
    visibleCategoryCount: Math.max(1, Math.round(((end - start) / 100) * (categoryCount - 1)) + 1),
    categoryCount,
  })
}

const getScrollWindowSize = (scrollWindow: ChartScrollWindow | null) => {
  if (!scrollWindow) {
    return undefined
  }

  return Math.max(1, scrollWindow.endValue - scrollWindow.startValue + 1)
}

export const resolveChartScrollWindow = ({
  axisSize,
  categoryCount,
  scrollWindow,
}: {
  axisSize: number
  categoryCount: number
  scrollWindow: ChartScrollWindow | null
}): ChartScrollWindow | null => {
  const geometryVisibleCategoryCount = axisSize
    ? getVisibleCategoryCount({
      axisSize,
      categoryCount,
    })
    : categoryCount

  if (axisSize > 0 && geometryVisibleCategoryCount >= categoryCount) {
    return null
  }

  return clampScrollWindow({
    startValue: scrollWindow?.startValue ?? 0,
    categoryCount,
    visibleCategoryCount: getScrollWindowSize(scrollWindow) ?? geometryVisibleCategoryCount,
  })
}

export const shouldHideAnnotationsForBreakpoint = ({
  chartWidth,
  chartHeight,
}: {
  chartWidth: number
  chartHeight: number
}) => {
  return chartHeight <= RESPONSIVE_MAX_HEIGHT || chartWidth <= RESPONSIVE_MEDIUM_MAX_WIDTH
}
