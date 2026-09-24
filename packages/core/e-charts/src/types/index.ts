import type * as designTokens from '@kong/design-tokens'
import type { EChartsOption, TooltipComponentFormatterCallbackParams } from 'echarts'

// Re-export echarts option types for consumer convenience
export type { EChartsOption, TooltipComponentFormatterCallbackParams }

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

/**
 * `[column, row, value]` point. `column`/`row` can be either the category's
 * index in `xAxisLabels`/`yAxisLabels`, or the category name itself.
 */
export type HeatmapDataPoint = [string | number, string | number, number]

export type HeatmapTooltipFormatter = (params: TooltipComponentFormatterCallbackParams) => string

interface BaseChartProps {
  /**
   * Raw echarts option, always deep-merged over the generated option (see
   * `mergeChartOption`): nested plain objects merge recursively, the
   * top-level `series` array merges by index, and any other array or
   * primitive value replaces the generated one.
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
  /** `[low, high]` colors for the visual map. Defaults to theme token colors. */
  colorRange?: [string, string]
  /** Formats values in the tooltip and the visual map labels. */
  valueFormatter?: (value: number) => string
  /** Custom tooltip formatter. Defaults to ECharts' built-in tooltip. */
  tooltipFormatter?: HeatmapTooltipFormatter
}
