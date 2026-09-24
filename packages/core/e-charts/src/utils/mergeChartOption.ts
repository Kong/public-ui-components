import { deepMerge } from './deepMerge'
import type { EChartsOption } from 'echarts'

/**
 * Deep-merge an ECharts option like `deepMerge`, but when both `base` and
 * `override` provide a top-level `series` array, merge it by index instead
 * of replacing it wholesale. That way `{ series: [{ label: { show: true } }] }`
 * only overrides that one field and keeps the generated series' `data`.
 *
 * Any override series beyond `base`'s length are appended as-is.
 */
export const mergeChartOption = (base: EChartsOption, override?: EChartsOption | null): EChartsOption => {
  const merged = deepMerge(base, override)

  const baseSeries = base.series
  const overrideSeries = override?.series

  if (Array.isArray(baseSeries) && Array.isArray(overrideSeries)) {
    merged.series = baseSeries.map((series, index) => {
      const overrideEntry = overrideSeries[index]

      return overrideEntry ? deepMerge(series, overrideEntry) : series
    }).concat(overrideSeries.slice(baseSeries.length))
  }

  return merged
}
