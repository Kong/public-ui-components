import type {
  TableDataGridHeader,
  TableDataGridIconMapping,
  TableDataGridThreshold,
} from '../types'
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

export type TableDataGridColumnStats = {
  sum: number
  max: number
}

export type TableDataGridPresentationContext = {
  mode: 'infinite' | 'unpaginated'
  locale: string
  stats: Record<string, TableDataGridColumnStats>
}

const providerIcon = (name: string, icon: Component): TableDataGridIconMapping => ({
  icon,
  pattern: new RegExp(`^${name}$`, 'i'),
})

/** Built-in provider mappings used by cells that contain provider names. */
const tableDataGridProviderIcons: readonly TableDataGridIconMapping[] = [
  providerIcon('anthropic', AnthropicIcon),
  providerIcon('azure', AzureIcon),
  providerIcon('bedrock', AmazonBedrockIcon),
  providerIcon('cerebras', CerebrasIcon),
  providerIcon('cohere', CohereIcon),
  providerIcon('databricks', DatabricksIcon),
  providerIcon('deepseek', DeepseekIcon),
  providerIcon('gemini', GeminiIcon),
  providerIcon('huggingface', HuggingFaceIcon),
  providerIcon('llama2', MetaLlamaIcon),
  providerIcon('mistral', MistralIcon),
  providerIcon('moonshot', KimiIcon),
  providerIcon('nvidia', NvidiaIcon),
  providerIcon('ollama', OllamaIcon),
  providerIcon('openai', OpenAiIcon),
  providerIcon('vertex', GoogleVertexIcon),
  providerIcon('vllm', VllmIcon),
  providerIcon('xai', GrokIcon),
]

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

const matchesPattern = (pattern: RegExp, value: string): boolean => {
  // Global/sticky regular expressions carry mutable lastIndex state. Matching
  // always starts at the beginning and restores the caller's state afterwards.
  const lastIndex = pattern.lastIndex
  pattern.lastIndex = 0

  try {
    return pattern.test(value)
  } finally {
    pattern.lastIndex = lastIndex
  }
}

const firstMatchingIcon = (
  mappings: readonly TableDataGridIconMapping[],
  values: readonly string[],
): Component | undefined => {
  for (const mapping of mappings) {
    if (values.some(value => matchesPattern(mapping.pattern, value))) {
      return mapping.icon
    }
  }

  return undefined
}

/**
 * Match raw or formatted content, preferring host mappings over built-in provider icons.
 *
 * @param options - Cell content and optional custom icon mappings.
 * @param options.rawValue - Unformatted cell value.
 * @param options.displayValue - Formatted or translated cell text.
 * @param options.icons - Custom mappings checked before built-in mappings.
 * @returns The first matching icon component, or undefined.
 */
export const getCellIcon = ({
  rawValue,
  displayValue,
  icons = [],
}: {
  rawValue: unknown
  displayValue: string
  icons?: readonly TableDataGridIconMapping[]
}): Component | undefined => {
  const values = [
    rawValue === null || rawValue === undefined ? '' : String(rawValue),
    displayValue,
  ].filter(Boolean)

  return firstMatchingIcon(
    [...icons, ...tableDataGridProviderIcons],
    values,
  )
}

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
