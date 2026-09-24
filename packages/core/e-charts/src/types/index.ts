import type * as designTokens from '@kong/design-tokens'
import type { EChartsOption } from 'echarts'

// Re-export echarts option types for consumer convenience
export type { EChartsOption }

/**
 * Color token values resolved at runtime, keyed by the design token names
 * (`KUI_COLOR_TEXT_DISABLED` → `--kui-color-text-disabled`, etc.).
 * Keyed by exactly the color tokens exported by `@kong/design-tokens`,
 * derived from its type declarations so no per-token list is maintained
 * here and no runtime code is pulled in.
 *
 * Mapped with an `as` key filter rather than `Record<ColorTokenName, string>`
 * because only that form preserves the per-token JSDoc on hover.
 */
export type ChartColors = {
  readonly [K in keyof typeof designTokens as K extends `KUI_COLOR${string}` ? K : never]: string
}

/** `[column, row, value]` point, where `column`/`row` are indexes into `xAxisLabels`/`yAxisLabels`. */
export type HeatmapDataPoint = [number, number, number]

interface BaseChartProps {
  /**
   * Raw echarts option, always deep-merged over the generated option: nested
   * plain objects merge recursively, arrays and primitive values replace the
   * generated ones (including `series`).
   */
  option?: EChartsOption
  /** Chart height. Defaults to `400px`. */
  height?: string
}

export interface HeatmapChartProps extends BaseChartProps {
  /** `[column, row, value]` points. Renders an empty chart when omitted. */
  data?: HeatmapDataPoint[]
  /** Category labels for the x-axis (e.g. week labels). */
  xAxisLabels?: string[]
  /** Category labels for the y-axis (e.g. weekday names). */
  yAxisLabels?: string[]
  seriesName?: string
  /** Lower bound of the visual map. Defaults to `0`. */
  min?: number
  /** Upper bound of the visual map. Defaults to the largest data value (at least `1`). */
  max?: number
  /** Gradient colors for the visual map, from low to high (two or more). Defaults to theme token colors. */
  colorRange?: string[]
}
