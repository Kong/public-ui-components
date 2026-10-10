import type { ChartTooltipRow } from '../types'
import type { DefaultLabelFormatterCallbackParams, TooltipComponentFormatterCallbackParams } from 'echarts'

/** Helpers for building a chart type's `tooltipContent` (see `ChartTooltipContent`). */

/** The hovered items as a list, for both `item` and `axis` tooltip triggers. */
export const tooltipItems = (params: TooltipComponentFormatterCallbackParams): DefaultLabelFormatterCallbackParams[] => (
  Array.isArray(params) ? params : [params]
)

/** A category axis value can be an index into the labels or the category name itself. */
export const categoryLabel = (value: string | number, labels?: string[]): string => (
  typeof value === 'number' ? labels?.[value] ?? String(value) : value
)

/** A tooltip row for a hovered item: its marker color, a label and the formatted value. */
export const tooltipRow = (
  item: DefaultLabelFormatterCallbackParams,
  label: string,
  value: unknown,
  formatter?: (value: number) => string,
): ChartTooltipRow => ({
  color: typeof item.color === 'string' ? item.color : undefined,
  label,
  value: formatter ? formatter(Number(value)) : String(value ?? ''),
})
