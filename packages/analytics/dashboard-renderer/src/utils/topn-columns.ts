import type {
  AllAggregations,
  AnalyticsExploreRecord,
  ExploreResultV4,
  TopNColumnOptions,
} from '@kong-ui-public/analytics-utilities'
import { unitFormatter } from '@kong-ui-public/analytics-utilities'
import type { IntlShapeEx } from '@kong-ui-public/i18n'
import type english from '../locales/en.json'
import type { TableDataGridHeader } from '@kong-ui-public/table-data-grid'
import type { Component } from 'vue'
import {
  AmazonBedrockIcon,
  AnthropicIcon,
  AzureIcon,
  CerebrasIcon,
  CohereIcon,
  DatabricksIcon,
  DeepseekIcon,
  GeminiIcon,
  GoogleVertexIcon,
  GrokIcon,
  HuggingFaceIcon,
  KimiIcon,
  MetaLlamaIcon,
  MistralIcon,
  NvidiaIcon,
  OllamaIcon,
  OpenAiIcon,
  VllmIcon,
} from '@kong/icons'

export type TopNColumnOptionsMap = Record<string, TopNColumnOptions>

export type TopNDimensionValue = {
  id: string
  label: string
  deleted: boolean
}

export type TopNGridRow = {
  record: AnalyticsExploreRecord
  [key: string]: unknown
}

export type TopNTableHeader = TableDataGridHeader<TopNGridRow> & {
  type: 'dimension' | 'metric'
}

export type TopNPresentation = {
  headers: TopNTableHeader[]
  errorMessage: string
  getDimension: (row: TopNGridRow, key: string) => TopNDimensionValue
}

const MAX_DIMENSIONS = 3

const aiProviderIcons: Readonly<Record<string, Component>> = {
  anthropic: AnthropicIcon,
  azure: AzureIcon,
  bedrock: AmazonBedrockIcon,
  cerebras: CerebrasIcon,
  cohere: CohereIcon,
  databricks: DatabricksIcon,
  deepseek: DeepseekIcon,
  gemini: GeminiIcon,
  huggingface: HuggingFaceIcon,
  llama2: MetaLlamaIcon,
  mistral: MistralIcon,
  moonshot: KimiIcon,
  nvidia: NvidiaIcon,
  ollama: OllamaIcon,
  openai: OpenAiIcon,
  vertex: GoogleVertexIcon,
  vllm: VllmIcon,
  xai: GrokIcon,
}

/**
 * Prefer an exact option key, falling back to case-insensitive dashboard keys.
 *
 * @param options - Dashboard column options keyed by field name.
 * @param key - Field name to resolve.
 * @returns Matching options, or undefined when none exist.
 */
export const getColumnOptions = (
  options: TopNColumnOptionsMap | undefined,
  key: string,
): TopNColumnOptions | undefined => {
  if (!options || !key) {
    return undefined
  }

  const lowerKey = key.toLowerCase()

  return (
    options[key] ??
    Object.entries(options).find(
      ([optionKey]) => optionKey.toLowerCase() === lowerKey,
    )?.[1]
  )
}

/** Resolve only an opted-in provider column's raw id to an icon. */
export const getTopNProviderIcon = ({
  columnOptions,
  columnKey,
  rawValue,
}: {
  columnOptions: TopNColumnOptionsMap | undefined
  columnKey: string
  rawValue: unknown
}): Component | undefined => {
  if (getColumnOptions(columnOptions, columnKey)?.icon_set !== 'ai_provider' || typeof rawValue !== 'string') {
    return undefined
  }

  return aiProviderIcons[rawValue.toLowerCase()]
}

/**
 * Normalize Explore metric values, treating empty or non-finite values as missing.
 *
 * @param value - Raw Explore metric value.
 * @returns A finite numeric value, or null for missing or invalid input.
 */
export const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const num = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(num) ? num : null
}

const isNoSuffixMetric = (unit: string): boolean =>
  unit.toLocaleLowerCase().endsWith('count')

/**
 * Map up to three dimensions and all metrics, retaining the original record for entity lookup and metric formatting.
 *
 * @param data - Explore response containing records and column metadata.
 * @returns Grid rows in backend order, each retaining its original record.
 */
export const createTopNGridRows = (data?: ExploreResultV4): TopNGridRow[] => {
  const displayKeys = Object.keys(data?.meta?.display ?? {}).slice(
    0,
    MAX_DIMENSIONS,
  )
  const metricKeys = data?.meta?.metric_names ?? []

  return (data?.data ?? []).map((record) => {
    const row: TopNGridRow = { record }

    displayKeys.forEach((key) => {
      row[key] = record.event[key]
    })
    metricKeys.forEach((key) => {
      row[key] = toNumber(record.event[key])
    })

    return row
  })
}

/**
 * Build grid headers and formatters from Explore metadata.
 *
 * @param options - Explore data and presentation configuration.
 * @param options.data - Current Explore response.
 * @param options.columnOptions - Dashboard labels and metric display options.
 * @param options.i18n - Renderer translations and locale-aware formatting.
 * @returns Headers, metadata validation message, and dimension lookup.
 */
export const createTopNPresentation = ({
  data,
  columnOptions,
  i18n,
}: {
  data?: ExploreResultV4
  columnOptions?: TopNColumnOptionsMap
  i18n: IntlShapeEx<typeof english>
}): TopNPresentation => {
  const { formatUnit } = unitFormatter({ i18n })
  const records = data?.data ?? []
  const meta = data?.meta
  const display = meta?.display ?? {}
  const displayKeys = Object.keys(display).slice(0, MAX_DIMENSIONS)
  const metricKeys = meta?.metric_names ?? []
  const firstMetric = metricKeys[0]
  const hasMultipleDimensions = displayKeys.length > 1
  const getChartLabel = (key: string): string => {
    const translationKey = `chartLabels.${key}`

    return i18n.messages[translationKey]
      ? i18n.formatMessage({ id: translationKey })
      : key
  }
  const getColumnLabel = (key: string, fallback: string): string => {
    return getColumnOptions(columnOptions, key)?.label || fallback
  }
  const translateChartUnit = (unit: string, value: number): string => {
    if (isNoSuffixMetric(unit) || unit === 'requests') {
      return ''
    }

    const plural = value === 1 ? '' : 's'
    const translationKey = `chartUnits.${unit}`

    return i18n.messages[translationKey]
      ? i18n.formatMessage({ id: translationKey }, { plural })
      : unit
  }
  const formatPercent = (percent: number): string => {
    const format = (value: number) =>
      formatUnit(value, '%', {
        translateUnit: translateChartUnit,
      })

    if (percent > 0 && percent < 0.01) {
      return `< ${format(0.01)}`
    }

    return format(percent)
  }
  const getMetricValue = (
    record: AnalyticsExploreRecord,
    metricKey: AllAggregations,
  ): string => {
    const raw = record.event[metricKey]

    if (raw === null || raw === undefined) {
      return '–'
    }

    const value = typeof raw === 'number' ? raw : Number(raw)

    if (Number.isNaN(value)) {
      return '–'
    }

    const unit = meta?.metric_units?.[metricKey] || 'count'

    if (unit === '%') {
      return formatPercent(value)
    }

    return formatUnit(value, unit, {
      approximate: ['count', 'count/minute', 'token count'].includes(unit),
      isBytes1024: true,
      translateUnit: translateChartUnit,
    })
  }
  const getDimension = (row: TopNGridRow, key: string): TopNDimensionValue => {
    const id = String(row.record.event[key])
    const idRecord = display[key]?.[id]

    return {
      id,
      label: idRecord?.name || '-',
      deleted: !!idRecord?.deleted,
    }
  }
  const headers: TopNTableHeader[] = displayKeys.map((key) => ({
    key,
    label: getColumnLabel(
      key,
      hasMultipleDimensions
        ? getChartLabel(key)
        : i18n.t('topNTable.nameLabel'),
    ),
    type: 'dimension',
    valueFormatter: (_value, row) => getDimension(row, key).label,
    sortable: false,
  }))

  metricKeys.forEach((metricKey) => {
    const options = getColumnOptions(columnOptions, metricKey)

    headers.push({
      key: metricKey,
      label: getColumnLabel(metricKey, getChartLabel(metricKey)),
      type: 'metric',
      dataType: 'number',
      valueFormatter: (_value, row) => getMetricValue(row.record, metricKey),
      showPercentage: options?.value === 'relative',
      percentageFormatter: formatPercent,
      bar: options?.bar === 'max' ? 'absolute' : options?.bar,
      thresholds: options?.thresholds,
      sortable: false,
    })
  })

  const errorMessage = records.length
    ? !meta
      ? i18n.t('topNTable.errors.meta')
      : displayKeys.some((key) => !Object.keys(display[key] || {}).length)
        ? i18n.t('topNTable.errors.display')
        : !firstMetric
          ? i18n.t('topNTable.errors.metricNames')
          : ''
    : ''

  return {
    headers,
    errorMessage,
    getDimension,
  }
}
