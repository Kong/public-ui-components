import type { Ref } from 'vue'
import type { AllAggregations, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { TopNColumnOptionsMap, TopNThresholdType } from '../utils/topn-columns'
import type { TopTalkersCellData, TopTalkersColumnData, TopTalkersTooltipRow } from '../types/top-talkers'

type UnpaintedCell = Omit<TopTalkersCellData, 'color' | 'tint'>

import { computed } from 'vue'
import { color, unitFormatter } from '@kong-ui-public/analytics-utilities'

import useI18n from './useI18n'
import { isNoSuffixMetric } from '../utils'
import { getColumnOptions, getColumnStats, getRelativeValue, getThresholdType, toNumber } from '../utils/topn-columns'
import { EMPTY_DIMENSION_ID, OTHER_DIMENSION_ID } from '../constants'

const MIN_TINT = 18
const MAX_TINT = 85

export default function useTopTalkersData(
  data: Ref<ExploreResultV4 | undefined>,
  dimension: Ref<string>,
  sizeMetric: Ref<string | undefined>,
  columnOptions: Ref<TopNColumnOptionsMap | undefined>,
) {
  const { i18n } = useI18n()
  const { formatUnit } = unitFormatter({ i18n })

  const paintColumn = (ordered: UnpaintedCell[]): TopTalkersCellData[] => {
    return ordered.map((cell) => {
      // Any cell with 50% or more of the column ratio will be "painted" to the full
      // intensity, i.e. with the maximum tint value. This will cap the scale to 0.5
      const scaled = Math.min(cell.ratio, 0.5) / 0.5

      return { ...cell, color: color({ metric: sizeMetric.value }), tint: `${MIN_TINT + scaled * (MAX_TINT - MIN_TINT)}%` }
    })
  }

  const records = computed(() => data.value?.data ?? [])
  const metricKeys = computed((): AllAggregations[] => data.value?.meta?.metric_names ?? [])

  // The sizeMetric anchors block height and the percentage
  const sizeKey = computed((): AllAggregations | undefined => {
    const requested = sizeMetric.value as AllAggregations | undefined

    return requested && metricKeys.value.includes(requested) ? requested : metricKeys.value[0]
  })

  const tooltipKeys = computed((): AllAggregations[] => metricKeys.value.filter((key) => key !== sizeKey.value))
  const displayBlob = computed(() => data.value?.meta?.display?.[dimension.value] ?? {})

  const translateChartUnit = (unit: string, value: number): string => {
    if (isNoSuffixMetric(unit) || unit === 'count' || unit === 'requests') {
      return ''
    }

    const plural = value === 1 ? '' : 's'

    // @ts-ignore - dynamic i18n key
    return i18n.te(`chartUnits.${unit}`) ? i18n.t(`chartUnits.${unit}`, { plural }) : unit
  }

  // `formatUnit` always joins value and unit with a space, which leaves a trailing
  // space on percentages as "50 %". Rather than changing the formatter, we can just fix it here...
  // TODO: Can we please get rid of that formatting nonsense? Who would ever want to read a percentage
  // as "42 %"? No one, that's who.
  const removeSpace = (formatted: string): string => formatted.replace(/\s+%/, '%').trim()

  const formatPercent = (percent: number): string => {
    const format = (value: number) => removeSpace(formatUnit(value, '%', {
      translateUnit: (unitName) => translateChartUnit(unitName, value),
    }))

    return percent > 0 && percent < 0.01 ? `< ${format(0.01)}` : format(percent)
  }

  const formatMetric = (raw: number | null, metricKey: AllAggregations): string => {
    if (raw === null) {
      return '–'
    }

    const unit = data.value?.meta?.metric_units?.[metricKey] || 'count'

    if (unit === '%') {
      return formatPercent(raw)
    }

    return removeSpace(formatUnit(raw, unit, {
      isBytes1024: true,
      translateUnit: (unitName) => translateChartUnit(unitName, raw),
    }))
  }

  const getChartLabel = (key: string): string => {
    return i18n.te(`chartLabels.${key}` as any) ? i18n.t(`chartLabels.${key}` as any) as string : key
  }

  const getLabel = (key: string): string => {
    return getColumnOptions(columnOptions.value, key)?.label || getChartLabel(key)
  }

  // Sum across returned rows
  const stats = computed(() => {
    return getColumnStats(records.value.map((record) => (sizeKey.value ? toNumber(record.event[sizeKey.value]) : null)))
  })

  const buildTooltipRows = (event: Record<string, unknown>): TopTalkersTooltipRow[] => {
    return tooltipKeys.value.flatMap((metricKey): TopTalkersTooltipRow[] => {
      const raw = toNumber(event[metricKey])

      if (raw === null) {
        return []
      }

      const threshold: TopNThresholdType | undefined = getThresholdType(raw, getColumnOptions(columnOptions.value, metricKey)?.thresholds)

      return [{ key: metricKey, label: getLabel(metricKey), value: formatMetric(raw, metricKey), threshold }]
    })
  }

  const cells = computed((): TopTalkersCellData[] => {
    if (!sizeKey.value) {
      return []
    }

    const ordered = records.value
      .map((record): UnpaintedCell => {
        const event = record.event as Record<string, unknown>
        const id = String(event[dimension.value])
        const raw = toNumber(event[sizeKey.value!]) ?? 0
        const relative = getRelativeValue(raw, stats.value)
        const ratio = relative ?? 0
        const isOther = id === OTHER_DIMENSION_ID

        return {
          id,
          name: isOther ? getChartLabel(OTHER_DIMENSION_ID) : displayBlob.value[id]?.name || id,
          deleted: !!displayBlob.value[id]?.deleted,
          isOther,
          isEmpty: id === EMPTY_DIMENSION_ID,
          value: raw,
          ratio,
          display: formatMetric(raw, sizeKey.value!),
          relative: relative === null ? '' : formatPercent(relative * 100),
          tooltipRows: buildTooltipRows(event),
        }
      })
      .sort((a, b) => Number(a.isOther) - Number(b.isOther) || b.value - a.value)

    return paintColumn(ordered)
  })

  const column = computed((): TopTalkersColumnData => ({
    dimension: dimension.value,
    label: getLabel(dimension.value),
    total: formatMetric(stats.value.sum, sizeKey.value ?? 'count' as AllAggregations),
    cells: cells.value,
  }))

  return { column, cells, sizeKey }
}
