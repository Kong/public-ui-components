import type {
  TableDataGridHeader,
  TableDataGridThreshold,
} from '../types'

export type TableDataGridColumnStats = {
  sum: number
  max: number
}

/** Longest value and percentage text in a bar column, used to size a shared label track. */
export type TableDataGridLabelSizer = {
  value: string
  relative?: string
}

export type TableDataGridPresentationContext = {
  mode: 'infinite' | 'unpaginated'
  locale: string
  stats: Record<string, TableDataGridColumnStats>
  labelSizers: Record<string, TableDataGridLabelSizer>
}

/**
 * Return the text a cell displays: the header's `valueFormatter` output, or the raw value as a string.
 * Shared by the AG Grid column formatter and the label sizer so both measure the same text.
 *
 * @param header - Column whose optional value formatter applies.
 * @param row - Row that owns the value.
 * @returns Display text for the cell.
 */
export const formatCellValue = <Row extends object>(
  header: Pick<TableDataGridHeader<Row>, 'key' | 'valueFormatter'>,
  row: Row,
): string => {
  const value: unknown = Reflect.get(row, header.key)

  return header.valueFormatter
    ? header.valueFormatter(value, row)
    : String(value ?? '')
}

/**
 * Accept numeric values only; generic grid cells must not coerce strings or booleans.
 *
 * @param value - Raw cell value.
 * @returns The finite number unchanged, or null without coercion.
 */
export const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value !== 'number') {
    return null
  }

  return Number.isFinite(value) ? value : null
}

/**
 * Calculate sum and maximum from the complete returned result, ignoring missing or invalid values.
 *
 * @param rows - Complete result for the current query.
 * @param header - Column key to aggregate.
 * @returns Column sum and maximum, with the maximum floored at zero.
 */
export const getColumnStats = (
  rows: readonly object[],
  header: Pick<TableDataGridHeader, 'key'>,
): TableDataGridColumnStats => rows.reduce<TableDataGridColumnStats>(
  (stats, row) => {
    const value = toFiniteNumber(Reflect.get(row, header.key))

    if (value === null) {
      return stats
    }

    return {
      sum: stats.sum + value,
      max: Math.max(stats.max, value),
    }
  },
  { sum: 0, max: 0 },
)

/**
 * Preserve TopN threshold precedence: highest crossed value wins, with error winning ties.
 *
 * @param value - Numeric cell value.
 * @param thresholds - Optional warning and error thresholds.
 * @returns The highest crossed threshold type, or undefined.
 */
export const getThresholdType = (
  value: number,
  thresholds: readonly TableDataGridThreshold[] | undefined,
): TableDataGridThreshold['type'] | undefined => {
  const crossed = (thresholds ?? []).filter(threshold => (
    Number.isFinite(threshold.value) && value >= threshold.value
  ))

  if (!crossed.length) {
    return undefined
  }

  const highestValue = Math.max(...crossed.map(threshold => threshold.value))
  const highest = crossed.filter(threshold => threshold.value === highestValue)

  return highest.some(threshold => threshold.type === 'error') ? 'error' : 'warning'
}

/**
 * Return a clamped 0–1 ratio: relative uses the column sum; absolute uses its maximum.
 *
 * @param value - Numeric cell value, or null when missing.
 * @param stats - Sum and maximum of the complete column.
 * @param mode - Relative (sum) or absolute (maximum) scaling.
 * @returns A ratio between zero and one; zero for missing values or nonpositive denominators.
 */
export const getBarRatio = (
  value: number | null,
  stats: TableDataGridColumnStats,
  mode: TableDataGridHeader['bar'],
): number => {
  if (value === null) {
    return 0
  }

  const denominator = mode === 'relative' ? stats.sum : stats.max

  if (!denominator || denominator <= 0) {
    return 0
  }

  return Math.min(Math.max(value / denominator, 0), 1)
}

/**
 * Format a percentage already on the 0–100 scale, preserving the small-value placeholder.
 *
 * @param percentage - Percentage expressed on the 0–100 scale.
 * @param locale - Number formatting locale; defaults to en-US.
 * @returns Localized percentage text, including the small-value placeholder.
 */
export const formatPercentage = (percentage: number, locale = 'en-US'): string => {
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })
  const formatted = formatter.format(percentage)

  return percentage > 0 && percentage < 0.01
    ? `< ${formatter.format(0.01)} %`
    : `${formatted} %`
}

/**
 * Format a value as its share of the column total.
 *
 * @param value - Numeric cell value, or null when missing.
 * @param stats - Sum and maximum of the complete column.
 * @param header - Column whose optional percentage formatter applies.
 * @param locale - Number formatting locale.
 * @returns Percentage text, or undefined when the share is undefined.
 */
export const formatRelativeValue = ({
  value,
  stats,
  header,
  locale,
}: {
  value: number | null
  stats: TableDataGridColumnStats
  header: Pick<TableDataGridHeader, 'percentageFormatter'>
  locale: string
}): string | undefined => {
  if (value === null || stats.sum <= 0) {
    return undefined
  }

  const percentage = value / stats.sum * 100

  return header.percentageFormatter?.(percentage) ?? formatPercentage(percentage, locale)
}

const longest = (current: string | undefined, next: string | undefined): string | undefined => (
  next !== undefined && next.length > (current?.length ?? -1) ? next : current
)

/**
 * Find the longest value and percentage text in the complete result.
 *
 * Every bar cell reserves this text's width, so bars start at the same offset across rows.
 * Length approximates rendered width, which holds for numeric text. Host slot content and
 * cell icons are not measured.
 *
 * @param rows - Complete result for the current query.
 * @param header - Bar column to measure.
 * @param stats - Sum and maximum of the complete column.
 * @param locale - Number formatting locale.
 * @returns The longest value text and, when percentages show, the longest percentage text.
 */
export const getLabelSizer = <Row extends object>({
  rows,
  header,
  stats,
  locale,
}: {
  rows: readonly Row[]
  header: TableDataGridHeader<Row>
  stats: TableDataGridColumnStats
  locale: string
}): TableDataGridLabelSizer => rows.reduce<TableDataGridLabelSizer>(
  (sizer, row) => ({
    value: longest(sizer.value, formatCellValue(header, row)) ?? '',
    relative: header.showPercentage
      ? longest(sizer.relative, formatRelativeValue({
        value: toFiniteNumber(Reflect.get(row, header.key)),
        stats,
        header,
        locale,
      }))
      : undefined,
  }),
  { value: '' },
)
