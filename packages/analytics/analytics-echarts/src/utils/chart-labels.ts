import type { ExploreAggregations, GranularityValues } from '@kong-ui-public/analytics-utilities'

export const translateChartLabel = (
  i18n: any,
  label: string,
) => {
  const key = `chartLabels.${label}`

  return i18n.te(key) ? i18n.t(key) : label
}

export const getMetricAxisTitle = ({
  i18n,
  metricName,
  metricUnit,
  metricAxesTitle,
  metricCount,
}: {
  i18n: any
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
    if (metricName.includes('latency')) {
      return i18n.t('metricAxisTitles.latency_in', {
        unit: i18n.t(`chartUnits.${metricUnit}`, { plural: 's' }),
      })
    }

    if (metricName.includes('size')) {
      return i18n.t('metricAxisTitles.size_in', {
        unit: i18n.t(`chartUnits.${metricUnit}`, { plural: 's' }),
      })
    }
  }

  const axisKey = `metricAxisTitles.${metricName}`
  const unitKey = `chartUnits.${metricUnit}`

  if (i18n.te(axisKey) && i18n.te(unitKey)) {
    return i18n.t(axisKey, {
      unit: i18n.t(unitKey, { plural: 's' }),
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
  i18n: any
  metricName?: string
  metricUnit?: string
  metricCount: number
}) => {
  if (!metricName) {
    return undefined
  }

  if (metricCount > 1 && metricUnit) {
    if (metricName.includes('latency')) {
      return i18n.t('metricAxisTitles.latency_in', {
        unit: i18n.t(`chartUnits.${metricUnit}`, { plural: 's' }),
      })
    }

    if (metricName.includes('size')) {
      return i18n.t('metricAxisTitles.size_in', {
        unit: i18n.t(`chartUnits.${metricUnit}`, { plural: 's' }),
      })
    }
  }

  return translateChartLabel(i18n, metricName)
}

export const getDimensionAxisTitle = ({
  i18n,
  dimensionAxesTitle,
  dimension,
}: {
  i18n: any
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
  i18n: any
  granularity?: GranularityValues
}) => {
  if (!granularity) {
    return undefined
  }

  const key = `granularityAxisTitles.${granularity}`

  return i18n.te(key) ? i18n.t(key) : granularity
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
