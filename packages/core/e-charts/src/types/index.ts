import type * as designTokens from '@kong/design-tokens'
import type { EChartsOption, HeatmapSeriesOption, TooltipComponentFormatterCallbackParams } from 'echarts'

// Re-export echarts option types for consumer convenience
export type { EChartsOption, HeatmapSeriesOption, TooltipComponentFormatterCallbackParams }

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

export interface ChartTooltipRow {
  /** Marker color, e.g. the series or cell color. Extra rows have no marker. */
  color?: string
  label: string
  /** Already formatted value. */
  value: string
  /** Supporting info (e.g. a total): neutral text and no color marker. */
  isExtra?: boolean
  /** Shows the label in italics, e.g. for an empty segment. */
  isSegmentEmpty?: boolean
}

export interface ChartTooltipProps {
  title?: string
  /** Left side of the subtitle, e.g. the hovered dimension. */
  context?: string
  /** Right side of the subtitle, e.g. the metric name. */
  metric?: string
  rows?: ChartTooltipRow[]
}

/**
 * Builds the shared tooltip's content from the hovered item's ECharts tooltip
 * params. Chart types provide one; consumers only set the title (`tooltipTitle`).
 */
export type ChartTooltipContent = (params: TooltipComponentFormatterCallbackParams) => ChartTooltipProps

interface BaseChartProps {
  /**
   * Raw echarts option, always deep-merged over the generated option: nested
   * plain objects merge recursively, arrays and primitive values replace the
   * generated ones. Passing `series` here replaces the generated series, so
   * use the chart's `seriesOption` prop to tweak it instead.
   */
  option?: EChartsOption
  /** Chart height. Defaults to `400px`. */
  height?: string
  /** Bold title of the shared tooltip, like `tooltipTitle` in `@kong-ui-public/analytics-chart`. Empty by default. */
  tooltipTitle?: string
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
  /** Formats values in the tooltip and the visual map labels. */
  valueFormatter?: (value: number) => string
  /**
   * Show at most this many rows, with a scrollbar on the right to scroll
   * through the rest.
   */
  visibleRows?: number
  /** Show each cell's value (formatted with `valueFormatter`) inside the cell. */
  showValues?: boolean
  /**
   * Deep-merged into the generated heatmap series, e.g. to change cell
   * borders or label styles. The series `data` still comes from `data`.
   */
  seriesOption?: HeatmapSeriesOption
}
