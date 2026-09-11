import type { EChartsOption, TooltipComponentFormatterCallbackParams } from 'echarts'

// Re-export echarts option types for consumer convenience
export type { EChartsOption, TooltipComponentFormatterCallbackParams }

/**
 * Token values resolved at runtime, keyed by the design token names
 * (`KUI_COLOR_TEXT_DISABLED` → `--kui-color-text-disabled`, etc.).
 */
export interface ChartColors {
  KUI_COLOR_BACKGROUND: string
  KUI_COLOR_BACKGROUND_ACCENT: string
  KUI_COLOR_BACKGROUND_DANGER: string
  KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE: string
  KUI_COLOR_BACKGROUND_INFO_STRONG: string
  KUI_COLOR_BACKGROUND_INFO_WEAKEST: string
  KUI_COLOR_BACKGROUND_OVERLAY: string
  KUI_COLOR_BACKGROUND_SUCCESS_WEAK: string
  KUI_COLOR_BACKGROUND_WARNING: string
  KUI_COLOR_BACKGROUND_WARNING_WEAK: string
  KUI_COLOR_TEXT_DISABLED: string
}

export type HeatmapDataPoint = [number, number, number]

export type HeatmapTooltipFormatter = (params: TooltipComponentFormatterCallbackParams) => string

interface BaseChartProps {
  /**
   * Raw echarts option. When data props are also provided, this option is
   * deep-merged over the generated option; when provided alone, it is passed
   * through to the underlying chart untouched.
   */
  option?: EChartsOption
  /** Chart height. Defaults to `400px`. */
  height?: string
}

export interface HeatmapChartProps extends BaseChartProps {
  /** `[column, row, value]` points. Renders an empty chart when omitted (unless `option` is provided). */
  data?: HeatmapDataPoint[]
  /** Category labels for the x-axis (e.g. week labels). */
  xAxisLabels?: string[]
  /** Category labels for the y-axis (e.g. weekday names). */
  yAxisLabels?: string[]
  seriesName?: string
  /** Lower bound of the visual map. Defaults to `0`. */
  min?: number
  /** Upper bound of the visual map. Defaults to the largest data value. */
  max?: number
  /** `[low, high]` colors for the visual map. Defaults to theme token colors. */
  colorRange?: [string, string]
  /** Custom tooltip formatter. */
  tooltipFormatter?: HeatmapTooltipFormatter
}
