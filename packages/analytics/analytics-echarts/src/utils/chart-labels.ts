import type { ExploreAggregations } from '@kong-ui-public/analytics-utilities'
import type useI18n from '../composables/useI18n'

type AnalyticsI18n = ReturnType<typeof useI18n>['i18n']
type TranslationParams = Record<string, string>

const hasTranslation = (i18n: AnalyticsI18n, key: string) => {
  return (i18n.te as (key: string) => boolean)(key)
}

const translate = (i18n: AnalyticsI18n, key: string, params?: TranslationParams) => {
  return (i18n.t as (key: string, params?: TranslationParams) => string)(key, params)
}

export const translateChartLabel = (
  i18n: AnalyticsI18n,
  label: string,
) => {
  const key = `chartLabels.${label}`

  return hasTranslation(i18n, key) ? translate(i18n, key) : label
}

const getMultiMetricUnitLabel = (i18n: AnalyticsI18n, metricName: string, metricUnit: string): string | undefined => {
  if (metricName.includes('latency')) {
    return i18n.t('metricAxisTitles.latency_in', { unit: translate(i18n, `chartUnits.${metricUnit}`, { plural: 's' }) })
  }

  if (metricName.includes('size')) {
    return i18n.t('metricAxisTitles.size_in', { unit: translate(i18n, `chartUnits.${metricUnit}`, { plural: 's' }) })
  }

  return undefined
}

export const getMetricAxisTitle = ({
  i18n,
  metricName,
  metricUnit,
  metricAxesTitle,
  metricCount,
}: {
  i18n: AnalyticsI18n
  metricName?: string
  metricUnit?: string
  metricAxesTitle?: string
  metricCount: number
}) => {
  if (metricAxesTitle) {
    return metricAxesTitle
  }

  if (!metricName || !metricUnit) {
    return undefined
  }

  if (metricCount > 1) {
    const multiMetricLabel = getMultiMetricUnitLabel(i18n, metricName, metricUnit)

    if (multiMetricLabel) {
      return multiMetricLabel
    }
  }

  const axisKey = `metricAxisTitles.${metricName}`
  const unitKey = `chartUnits.${metricUnit}`

  if (hasTranslation(i18n, axisKey) && hasTranslation(i18n, unitKey)) {
    return translate(i18n, axisKey, {
      unit: translate(i18n, unitKey, { plural: 's' }),
    })
  }

  return metricName
}

export const getTooltipMetricDisplay = ({
  i18n,
  metricName,
  metricUnit,
  metricCount,
}: {
  i18n: AnalyticsI18n
  metricName?: string
  metricUnit?: string
  metricCount: number
}) => {
  if (!metricName) {
    return undefined
  }

  if (metricCount > 1 && metricUnit) {
    const multiMetricLabel = getMultiMetricUnitLabel(i18n, metricName, metricUnit)

    if (multiMetricLabel) {
      return multiMetricLabel
    }
  }

  return translateChartLabel(i18n, metricName)
}

export const getDimensionAxisTitle = ({
  i18n,
  dimensionAxesTitle,
  dimension,
}: {
  i18n: AnalyticsI18n
  dimensionAxesTitle?: string
  dimension?: string
}) => {
  if (dimensionAxesTitle) {
    return dimensionAxesTitle
  }

  if (!dimension) {
    return undefined
  }

  return translateChartLabel(i18n, dimension)
}

export const getGranularityAxisTitle = ({
  i18n,
  granularity,
}: {
  i18n: AnalyticsI18n
  granularity?: string
}) => {
  if (!granularity) {
    return undefined
  }

  const key = `granularityAxisTitles.${granularity}`

  return hasTranslation(i18n, key) ? translate(i18n, key) : granularity
}

export const getMetricUnit = (
  metricUnits: Partial<Record<ExploreAggregations, string>> | undefined,
  metricName?: string,
) => {
  if (!metricUnits || !metricName) {
    return ''
  }

  return metricUnits[metricName as ExploreAggregations] || ''
}
