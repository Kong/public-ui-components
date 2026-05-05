import type { ChartLegendItem, ChartLegendSortFn, ChartTooltipSortFn, TooltipEntry } from '../types'

export const createDefaultChartLegendSort = (
  otherLabel: string,
): ChartLegendSortFn => {
  return (a: ChartLegendItem, b: ChartLegendItem) => {
    if (a.label === otherLabel) {
      return 1
    }

    if (b.label === otherLabel) {
      return -1
    }

    if (!isNaN(parseInt(a.label, 10)) && !isNaN(parseInt(b.label, 10))) {
      return a.label < b.label ? -1 : 1
    }

    return a.value && b.value ? b.value.raw - a.value.raw : 0
  }
}

export const createDefaultChartTooltipSort = (
  otherLabel: string,
): ChartTooltipSortFn => {
  return (a: TooltipEntry, b: TooltipEntry) => {
    if (a.label === otherLabel) {
      return 1
    }

    if (b.label === otherLabel) {
      return -1
    }

    if (!isNaN(parseInt(a.label, 10)) && !isNaN(parseInt(b.label, 10))) {
      return a.label < b.label ? -1 : 1
    }

    return b.rawValue - a.rawValue
  }
}

