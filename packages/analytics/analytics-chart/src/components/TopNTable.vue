<template>
  <KCard
    class="kong-ui-public-top-n-table"
    :title-tag="titleTag"
  >
    <template
      v-if="title"
      #title
    >
      <span
        class="top-n-card-title"
        data-testid="top-n-card-title"
      >
        {{ title }}
      </span>
    </template>

    <template
      v-if="description"
      #actions
    >
      <div
        class="top-n-card-description"
        data-testid="top-n-card-description"
      >
        {{ description }}
      </div>
    </template>

    <KEmptyState
      v-if="errorMessage"
      :action-button-visible="false"
      data-testid="top-n-error-state"
      icon-variant="error"
    >
      <template #title>
        {{ i18n.t('topNTable.defaultErrorStateTitle') }}
      </template>
      <template #default>
        {{ errorMessage }}
      </template>
    </KEmptyState>

    <KSkeleton
      v-else-if="isLoading"
      :table-columns="2"
      type="table"
    />

    <KEmptyState
      v-else-if="!hasData"
      :action-button-visible="false"
      data-testid="top-n-empty-state"
    >
      <template #title>
        {{ emptyStateTitle || i18n.t('topNTable.defaultEmptyStateTitle') }}
      </template>
    </KEmptyState>

    <div
      v-else
      class="top-n-table"
      data-testid="top-n-table"
    >
      <table
        class="top-n-table-table"
        :class="{ 'top-n-table-table--multi-dimension': hasMultipleDimensions }"
      >
        <thead data-testid="top-n-table-header">
          <tr class="top-n-table-header-row">
            <th
              v-for="header in tableHeaders"
              :key="header.key"
              class="top-n-table-header-cell"
              :class="{
                'top-n-table-header-cell-metric': header.type === 'metric',
                'top-n-table-header-cell-dimension-compact': isCompactDimensionHeader(header),
              }"
              :colspan="isBarColumn(header) ? 2 : undefined"
              data-testid="top-n-table-header-column"
            >
              <span class="table-header-label">
                {{ header.label }}
              </span>
              <div class="top-n-table-header-cell-border" />
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="row in tableData"
            :key="row.rowKey"
            class="top-n-table-row"
          >
            <!-- Primary dimension column -->
            <td
              v-if="displayKeys.length"
              class="top-n-table-cell top-n-table-cell--name"
              :class="{ 'top-n-table-cell-dimension-compact': hasMultipleDimensions }"
            >
              <span
                class="top-n-table-cell-label"
                :data-testid="`row-${row.id}`"
              >
                <component
                  :is="getDimensionIcon(displayKey, row.id)"
                  v-if="getDimensionIcon(displayKey, row.id)"
                  class="top-n-table-cell-icon"
                  data-testid="top-n-table-cell-icon"
                  decorative
                  :size="`var(--kui-icon-size-30, ${KUI_ICON_SIZE_30})`"
                />
                <slot
                  name="name"
                  :record="{
                    id: row.id,
                    name: row.name,
                    deleted: row.deleted,
                    dimension: displayKey,
                    dimensions: row.dimensions,
                    isEmpty: row.id === 'empty',
                  }"
                >
                  {{ row.name }}
                </slot>
              </span>
            </td>

            <!-- Additional dimension columns -->
            <td
              v-for="header in additionalDimensionHeaders"
              :key="header.key"
              class="top-n-table-cell top-n-table-cell--dimension"
              :class="{ 'top-n-table-cell-dimension-compact': !isLastDimensionHeader(header) }"
            >
              <span class="top-n-table-cell-label">
                <component
                  :is="getDimensionIcon(header.key, getDimensionId(row, header.key))"
                  v-if="getDimensionIcon(header.key, getDimensionId(row, header.key))"
                  class="top-n-table-cell-icon"
                  data-testid="top-n-table-cell-icon"
                  decorative
                  :size="`var(--kui-icon-size-30, ${KUI_ICON_SIZE_30})`"
                />
                <slot
                  name="name"
                  :record="getDimensionSlotRecord(row, header.key)"
                >
                  {{ getDimensionDisplayValue(row, header.key) }}
                </slot>
              </span>
            </td>

            <!-- Metric columns (primary 'value' + additional metrics) -->
            <template
              v-for="header in metricHeaders"
              :key="header.key"
            >
              <td
                class="top-n-table-cell top-n-table-cell-metric"
                :class="{ 'top-n-table-cell-metric--has-bar': isBarColumn(header) }"
              >
                <TopNMetricCell
                  :data-testid="header.key === 'value' ? `row-${row.id}` : `row-${row.id}-${header.key}`"
                  :display="getRowMetricCell(row, header.key).display"
                  :has-bar="isBarColumn(header)"
                  :relative="getRowMetricCell(row, header.key).relative"
                  :threshold="getRowMetricCell(row, header.key).threshold"
                />
              </td>
              <td
                v-if="isBarColumn(header)"
                class="top-n-table-cell top-n-table-cell-bar"
              >
                <TopNMetricBar
                  :ratio="getRowMetricCell(row, header.key).barRatio ?? 0"
                  :threshold="getRowMetricCell(row, header.key).threshold"
                />
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </KCard>
</template>

<script setup lang="ts">
import type {
  AllAggregations,
  AnalyticsExploreRecord,
  ExploreResultV4,
} from '@kong-ui-public/analytics-utilities'
import type {
  HeaderTag,
} from '@kong/kongponents'

import type { Component } from 'vue'
import type { TopNColumnOptionsMap, TopNColumnStats, TopNThresholdType } from '../utils/topn-columns'

import { computed } from 'vue'
import { unitFormatter } from '@kong-ui-public/analytics-utilities'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import composables from '../composables'
import { isNoSuffixMetric } from '../utils'
import {
  getBarRatio,
  getColumnOptions,
  getColumnStats,
  getRelativeValue,
  getThresholdType,
  toNumber,
} from '../utils/topn-columns'
import { getColumnIcon } from '../utils/dimension-icons'
import TopNMetricBar from './top-n/TopNMetricBar.vue'
import TopNMetricCell from './top-n/TopNMetricCell.vue'

type TableHeader = {
  key: string
  columnKey: string
  label: string
  type: 'dimension' | 'metric'
}

type TopNMetricCellData = {
  display: string
  relative?: string
  barRatio?: number
  threshold?: TopNThresholdType
}

type TopNDimensionValue = {
  dimension: string
  id: string
  name: string
  deleted: boolean
}

type TopNRow = {
  id: string
  rowKey: string
  name: string
  deleted: boolean
  dimensions: TopNDimensionValue[]
  metrics: Record<string, TopNMetricCellData>
  original: AnalyticsExploreRecord
}

const MAX_DIMENSIONS = 3

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  data: ExploreResultV4
  emptyStateTitle?: string
  isLoading?: boolean
  titleTag?: HeaderTag
  columnOptions?: TopNColumnOptionsMap
}>(), {
  title: '',
  description: '',
  emptyStateTitle: '',
  isLoading: false,
  titleTag: 'h2',
  columnOptions: undefined,
})

const { i18n } = composables.useI18n()
const { formatUnit } = unitFormatter({ i18n })

const records = computed((): AnalyticsExploreRecord[] => props.data.data)
const hasData = computed((): boolean => !!(records.value?.length))

const displayKeys = computed((): string[] => {
  if (!props.data.meta?.display) {
    return []
  }

  return Object.keys(props.data.meta.display).slice(0, MAX_DIMENSIONS)
})

const displayKey = computed((): string => {
  return displayKeys.value[0] || ''
})

const hasMultipleDimensions = computed((): boolean => {
  return displayKeys.value.length > 1
})

const lastDimensionKey = computed((): string => {
  return displayKeys.value[displayKeys.value.length - 1] || ''
})

const displayRecord = computed(() => {
  if (!displayKey.value) {
    return {}
  }

  return props.data.meta.display[displayKey.value]
})

const metricKeys = computed<AllAggregations[]>(() => {
  if (!props.data.meta?.metric_names?.length) {
    return []
  }

  return props.data.meta.metric_names
})

const columnKey = computed((): AllAggregations | undefined => {
  return metricKeys.value[0]
})

const columnName = computed((): string => {
  if (!columnKey.value) {
    return ''
  }

  return getChartLabel(columnKey.value)
})

/**
 * Headers:
 * - Dimension columns: "Name" for single-dimension responses, translated
 *   dimension labels for multi-dimension responses.
 * - Primary metric column: "value" for backwards compatibility
 * - Additional columns: one per extra metric, keyed by metric name
 */
const tableHeaders = computed<TableHeader[]>(() => {
  const headers: TableHeader[] = displayKeys.value.map((key) => {
    return {
      key,
      columnKey: key,
      label: getColumnLabel(key, hasMultipleDimensions.value ? getChartLabel(key) : i18n.t('topNTable.nameLabel') as string),
      type: 'dimension',
    }
  })

  if (columnKey.value) {
    headers.push({
      key: 'value',
      columnKey: columnKey.value,
      label: getColumnLabel(columnKey.value, columnName.value),
      type: 'metric',
    })
  }

  metricKeys.value.forEach((metricKey, index) => {
    if (index === 0) {
      return
    }

    headers.push({
      key: metricKey,
      columnKey: metricKey,
      label: getColumnLabel(metricKey, getChartLabel(metricKey)),
      type: 'metric',
    })
  })

  return headers
})

/**
 * All metric-related headers (everything except the "name" column).
 * Order is preserved: primary "value" first (if present), then any
 * additional metrics.
 */
const metricHeaders = computed<TableHeader[]>(() => {
  return tableHeaders.value.filter((header) => header.type === 'metric')
})

const additionalDimensionHeaders = computed<TableHeader[]>(() => {
  return tableHeaders.value.filter((header) => header.type === 'dimension').slice(1)
})

const isLastDimensionHeader = (header: TableHeader): boolean => {
  return header.type === 'dimension' && header.key === lastDimensionKey.value
}

const isBarColumn = (header: TableHeader): boolean => {
  return header.type === 'metric' && !!getColumnOptions(props.columnOptions, header.columnKey)?.bar
}

const isCompactDimensionHeader = (header: TableHeader): boolean => {
  return hasMultipleDimensions.value && header.type === 'dimension' && !isLastDimensionHeader(header)
}

const getId = (record: AnalyticsExploreRecord): string => {
  const event = record.event

  return String(event[displayKey.value])
}

const getDimensionValue = (record: AnalyticsExploreRecord, key: string): TopNDimensionValue => {
  const id = String(record.event[key])
  const idRecord = props.data.meta?.display?.[key]?.[id]

  return {
    dimension: key,
    id,
    name: idRecord?.name || '-',
    deleted: !!idRecord?.deleted,
  }
}

const getName = (record: AnalyticsExploreRecord): string => {
  const id = getId(record)
  const idRecord = displayRecord.value && (displayRecord.value as any)[id]

  if (!idRecord) {
    return '-'
  }

  return idRecord.name
}

const getDeleted = (record: AnalyticsExploreRecord): boolean => {
  const id = getId(record)
  const idRecord = displayRecord.value && (displayRecord.value as any)[id]

  if (!idRecord) {
    return false
  }

  return !!idRecord.deleted
}

const formatPercent = (percent: number): string => {
  const format = (value: number) => formatUnit(value, '%', {
    translateUnit: (unitName) => translateChartUnit(unitName, value),
  })

  if (percent > 0 && percent < 0.01) {
    return `< ${format(0.01)}`
  }

  return format(percent)
}

const getMetricValue = (record: AnalyticsExploreRecord, metricKey: AllAggregations): string => {
  const val = record.event[metricKey]

  if (val === null || val === undefined) {
    return '–'
  }

  const value = typeof val === 'number' ? val : Number(val)

  if (Number.isNaN(value)) {
    return '–'
  }

  const unit = props.data.meta?.metric_units?.[metricKey] || 'count'

  if (unit === '%') {
    return formatPercent(value)
  }

  // Only counts should use approximation
  const approximate = ['count', 'count/minute', 'token count'].includes(unit)

  return formatUnit(value, unit, {
    approximate,
    isBytes1024: true,
    translateUnit: (unitName) => translateChartUnit(unitName, value),
  })
}

const columnStats = computed((): Record<string, TopNColumnStats> => {
  return Object.fromEntries(metricKeys.value.map((metricKey) => [
    metricKey,
    getColumnStats(records.value.map((record) => toNumber(record.event[metricKey]))),
  ]))
})

const getMetricCell = (record: AnalyticsExploreRecord, metricKey: AllAggregations): TopNMetricCellData => {
  const options = getColumnOptions(props.columnOptions, metricKey)
  const raw = toNumber(record.event[metricKey])

  if (!options || raw === null) {
    return { display: getMetricValue(record, metricKey) }
  }

  const stats = columnStats.value[metricKey]
  const relative = options.value === 'relative' ? getRelativeValue(raw, stats) : null

  return {
    display: getMetricValue(record, metricKey),
    relative: relative === null ? undefined : formatPercent(relative * 100),
    barRatio: options.bar ? getBarRatio(raw, stats, options.bar) : undefined,
    threshold: getThresholdType(raw, options.thresholds),
  }
}

/**
 * Table rows:
 * - Always include id/name/deleted/original
 * - `metrics.value` is the primary metric for backwards compatibility
 * - One `metrics` entry per additional metric key (e.g. row.metrics['status_4xx'])
 */
const tableData = computed<TopNRow[]>(() => {
  if (!records.value?.length) {
    return []
  }

  return records.value.map((entry) => {
    const dimensions = displayKeys.value.map((key) => getDimensionValue(entry, key))
    const primaryDimension = dimensions[0]
    const id = primaryDimension?.id || getId(entry)

    const row: TopNRow = {
      id,
      rowKey: dimensions.map((dimension) => `${dimension.dimension}:${dimension.id}`).join('|') || id,
      name: primaryDimension?.name || getName(entry),
      deleted: getDeleted(entry),
      dimensions,
      metrics: {},
      original: entry,
    }

    metricKeys.value.forEach((metricKey, index) => {
      row.metrics[index === 0 ? 'value' : metricKey] = getMetricCell(entry, metricKey)
    })

    return row
  })
})

const errorMessage = computed((): string => {
  if (!hasData.value) {
    return ''
  }

  if (!props.data.meta) {
    return i18n.t('topNTable.errors.meta') as string
  } else if (displayKeys.value.some((key) => !Object.keys(props.data.meta.display[key] || {}).length)) {
    return i18n.t('topNTable.errors.display') as string
  } else if (!columnKey.value) {
    return i18n.t('topNTable.errors.metricNames') as string
  }

  return ''
})

const getRowMetricCell = (row: TopNRow, key: string): TopNMetricCellData => {
  return row.metrics[key] ?? { display: '–' }
}

const getDimensionId = (row: TopNRow, key: string): string => {
  return row.dimensions.find((dimension) => dimension.dimension === key)?.id || ''
}

const getDimensionIcon = (key: string, id: string): Component | undefined => {
  return getColumnIcon(getColumnOptions(props.columnOptions, key)?.icon_set, id)
}

const getColumnLabel = (key: string | undefined, fallback: string): string => {
  return (key && getColumnOptions(props.columnOptions, key)?.label) || fallback
}

const getDimensionDisplayValue = (row: TopNRow, key: string): string => {
  return row.dimensions.find((dimension) => dimension.dimension === key)?.name || '–'
}

const getDimensionSlotRecord = (row: TopNRow, key: string) => {
  const dimension = row.dimensions.find((rowDimension) => rowDimension.dimension === key)

  return {
    id: dimension?.id || '',
    name: dimension?.name || '–',
    deleted: dimension?.deleted || false,
    dimension: key,
    dimensions: row.dimensions,
    isEmpty: dimension?.id === 'empty',
  }
}

const getChartLabel = (key: string): string => {
  return i18n.te(`chartLabels.${key}` as any) ? i18n.t(`chartLabels.${key}` as any) as string : key
}

const translateChartUnit = (unit: string, value: number): string => {
  if (isNoSuffixMetric(unit) || unit === 'count' || unit === 'requests') {
    return ''
  }

  const plural = value === 1 ? '' : 's'

  // @ts-ignore - dynamic i18n key
  return i18n.te(`chartUnits.${unit}`) ? i18n.t(`chartUnits.${unit}`, { plural }) : unit
}
</script>

<style lang="scss" scoped>
@use "../styles/globals" as *;

.kong-ui-public-top-n-table {
  border: none !important;
  max-height: 100%;
  padding: 0 !important;
  width: 100%;

  .top-n-card-description {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    text-align: right;
  }

  :deep(.k-card-actions) {
    align-self: baseline;
    display: flex;
    line-height: 22px;
  }

  :deep(.card-content) {
    overflow-y: auto;

    // fixing mixed-decls deprecation: https://sass-lang.com/d/mixed-decls
    // stylelint-disable-next-line no-duplicate-selectors
    & {
      @include scrollbarBase;
    }
  }

  .top-n-table {
    display: flex;
    flex-direction: column;
    max-height: 100%;
    overflow-x: auto;

    &-table {
      border-collapse: collapse;
      table-layout: auto;
    }

    &-header-cell {
      background-color: var(--kui-color-background, $kui-color-background);
      padding: 0 var(--kui-space-80, $kui-space-80) var(--kui-space-20, $kui-space-20) 0;
      position: sticky;
      text-align: left;
      top: 0;

      &-border {
        border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
        bottom: 0;
        left: 0;
        position: absolute;
        right: 0;
      }

      &:last-child {
        padding-right: 0;
      }

      .table-header-label {
        color: var(--kui-color-text, $kui-color-text);
        font-size: var(--kui-font-size-30, $kui-font-size-30);
        font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
        line-height: var(--kui-line-height-40, $kui-line-height-40);
      }
    }

    &-row {
      border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);

      &:first-of-type {
        border-top: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
      }

      &:last-of-type {
        border-bottom: none;
      }
    }

    &-header-cell-metric,
    &-header-cell-dimension-compact,
    &-cell-dimension-compact,
    &-cell-metric {
      white-space: nowrap;
      width: 1%;
    }

    &-cell {
      min-width: 110px;
      padding: var(--kui-space-50, $kui-space-50) var(--kui-space-0, $kui-space-0);

      &--name {
        color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
        font-size: var(--kui-font-size-30, $kui-font-size-30);
        min-width: 200px;
        padding-right: var(--kui-space-80, $kui-space-80);
      }

      &-dimension-compact,
      &-bar {
        padding-right: var(--kui-space-80, $kui-space-80);
      }

      &-bar {
        min-width: 200px;
      }

      &-metric--has-bar {
        padding-right: var(--kui-space-50, $kui-space-50);
      }

      &-dimension-compact {
        min-width: 110px;
      }

      &-label {
        display: inline-flex;
        gap: var(--kui-space-40, $kui-space-40);
      }

      &-icon {
        flex-shrink: 0;
      }
    }
  }

  :deep(a) {
    color: var(--kui-color-text-primary, $kui-color-text-primary);
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
    text-decoration: none;
  }
}
</style>
