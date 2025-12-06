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
      <table class="top-n-table-table">
        <thead data-testid="top-n-table-header">
          <tr class="top-n-table-header-row">
            <th
              v-for="header in tableHeaders"
              :key="header.key"
              class="top-n-table-header-cell"
              :class="{ 'top-n-table-header-cell-metric': header.key !== 'name' }"
              data-testid="top-n-table-header-column"
            >
              <span class="table-header-label">
                {{ header.label }}
              </span>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="row in tableData"
            :key="row.id"
            class="top-n-table-row"
          >
            <!-- Name / dimension column -->
            <td class="top-n-table-cell top-n-table-cell--name">
              <span :data-testid="`row-${row.id}`">
                <slot
                  name="name"
                  :record="{
                    id: row.id,
                    name: row.name,
                    deleted: row.deleted,
                    dimension: displayKey,
                  }"
                >
                  {{ row.name }}
                </slot>
              </span>
            </td>

            <!-- Metric columns (primary 'value' + additional metrics) -->
            <td
              v-for="header in metricHeaders"
              :key="header.key"
              class="top-n-table-cell top-n-table-cell-metric"
            >
              <span
                v-if="header.key === 'value'"
                :data-testid="`row-${row.id}`"
              >
                {{ getRowMetricDisplayValue(row, header.key) }}
              </span>
              <span
                v-else
                :data-testid="`row-${row.id}-${header.key}`"
              >
                {{ getRowMetricDisplayValue(row, header.key) }}
              </span>
            </td>
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

import { computed } from 'vue'
import { unitFormatter } from '@kong-ui-public/analytics-utilities'
import composables from '../composables'

type TableHeader = {
  key: string
  label: string
}

type TopNRow = {
  id: string
  name: string
  value?: string
  deleted: boolean
  original: AnalyticsExploreRecord
} & Record<string, unknown>

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  data: ExploreResultV4
  emptyStateTitle?: string
  isLoading?: boolean
  titleTag?: HeaderTag
}>(), {
  title: '',
  description: '',
  emptyStateTitle: '',
  isLoading: false,
  titleTag: 'h2',
})

const { i18n } = composables.useI18n()
const { formatUnit } = unitFormatter({ i18n })

const records = computed((): AnalyticsExploreRecord[] => props.data.data)
const hasData = computed((): boolean => !!(records.value?.length))

const displayKey = computed((): string => {
  if (!props.data.meta?.display) {
    return ''
  }

  return Object.keys(props.data.meta.display)?.[0] || ''
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

  return i18n.t(`chartLabels.${columnKey.value}` as any) || columnKey.value
})

/**
 * Headers:
 * - First column: dimension "Name"
 * - Second column: primary metric "value" for backwards compatibility
 * - Additional columns: one per extra metric, keyed by metric name
 */
/**
 * Determine if the incoming dataset includes more than one dimension.  The
 * `meta.display` object exposes one property per dimension, keyed by the
 * dimension name.  In a typical "Top N" table there will be one dimension
 * (e.g. "route").  When two dimensions are present, the first dimension
 * will be treated as the row dimension (e.g. "data_plane_node") and the
 * second dimension will be treated as the pivot dimension (e.g. "status_code").
 */
const dimensionKeys = computed((): string[] => {
  if (!props.data.meta?.display) {
    return []
  }

  return Object.keys(props.data.meta.display)
})

const rowDimensionKey = computed((): string => {
  return dimensionKeys.value[0] || ''
})

const pivotDimensionKey = computed((): string => {
  return dimensionKeys.value.length > 1 ? dimensionKeys.value[1] : ''
})

const pivotValues = computed((): string[] => {
  if (!pivotDimensionKey.value || !props.data.meta?.display) {
    return []
  }

  const pivotDisplay = props.data.meta.display[pivotDimensionKey.value] || {}

  return Object.keys(pivotDisplay)
})

const pivotDisplayMap = computed((): Record<string, { name: string, deleted: boolean }> => {
  if (!pivotDimensionKey.value || !props.data.meta?.display) {
    return {}
  }

  return (props.data.meta.display as any)[pivotDimensionKey.value] || {}
})

/**
 * Whether this dataset has a secondary dimension that should be pivoted.
 */
const hasPivotDimension = computed((): boolean => {
  return !!pivotDimensionKey.value
})

/**
 * Headers:
 * - Always include a "Name" column keyed by the primary (row) dimension.
 * - If a pivot dimension is present, include one column per unique pivot value,
 *   followed by a "Total" column for the primary metric.  Any additional
 *   metrics beyond the first will be aggregated across all pivot buckets and
 *   added as separate columns.
 * - In the absence of a pivot dimension, fall back to the legacy behaviour:
 *   "value" column for the first metric, plus one column per additional metric.
 */
const tableHeaders = computed<TableHeader[]>(() => {
  const headers: TableHeader[] = [
    {
      key: 'name',
      label: i18n.t('topNTable.nameLabel') as string,
    },
  ]

  // Pivoted dataset: build headers for each pivot value and a total column.
  if (hasPivotDimension.value && columnKey.value) {
    // For each pivot value, use the display name if available.
    pivotValues.value.forEach((val) => {
      const displayRecord = pivotDisplayMap.value[val]
      const label = displayRecord?.name || val

      headers.push({
        key: val,
        label,
      })
    })

    // Create a totals column header.  Attempt to translate the total key; fall
    // back to "Total <metric>" if no translation is found.
    let totalLabel = ''

    // @ts-ignore - dynamic i18n key
    if (i18n.te(`metricAxisTitles.${columnKey.value}`)) {
      // @ts-ignore - dynamic i18n key with parameter
      totalLabel = i18n.t(`metricAxisTitles.${columnKey.value}`)
    }

    // Fallback: if the translation isn't available, compose the label directly.
    if (!totalLabel) {
      totalLabel = `Total ${columnName.value}`.trim()
    }

    headers.push({
      key: 'total',
      label: totalLabel,
    })

    // For any additional metrics (index > 0), include an aggregated column.
    metricKeys.value.forEach((metricKey, index) => {
      if (index === 0) {
        return
      }

      const label = i18n.t(`chartLabels.${metricKey}` as any) || metricKey

      headers.push({
        key: metricKey,
        label,
      })
    })

    return headers
  }

  // Non-pivoted dataset: legacy behaviour.
  if (columnKey.value) {
    headers.push({
      key: 'value',
      label: columnName.value,
    })
  }

  metricKeys.value.forEach((metricKey, index) => {
    if (index === 0) {
      return
    }

    const label = i18n.t(`chartLabels.${metricKey}` as any) || metricKey

    headers.push({
      key: metricKey,
      label,
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
  return tableHeaders.value.filter((header) => header.key !== 'name')
})

const getId = (record: AnalyticsExploreRecord): string => {
  const event = record.event

  return String(event[displayKey.value])
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

  // Only counts should use approximation
  const approximate = ['count', 'count/minute', 'token count'].includes(unit)

  return formatUnit(value, unit, {
    approximate,
    isBytes1024: true,
    translateUnit: (unitName) => translateChartUnit(unitName, value),
  })
}

/**
 * Legacy "single metric" formatter
 */
const getValue = (record: AnalyticsExploreRecord): string => {
  if (!columnKey.value) {
    return '–'
  }

  return getMetricValue(record, columnKey.value)
}

/**
 * Table rows:
 * - Always include id/name/deleted/original
 * - `value` is the primary metric for backwards compatibility
 * - One property per metric key (e.g. row['status_4xx'])
 */
const tableData = computed<TopNRow[]>(() => {
  if (!records.value?.length) {
    return []
  }

  // Pivoted dataset: group by the row dimension and aggregate metrics.
  if (hasPivotDimension.value && columnKey.value) {
    type Group = {
      id: string
      total: number
      pivotSums: Record<string, number>
      additionalSums: Record<string, number>
      original?: AnalyticsExploreRecord
    }
    const groups: Record<string, Group> = {}

    records.value.forEach((entry) => {
      // Determine the row identifier and pivot identifier
      const rowId = String(entry.event[rowDimensionKey.value])
      const pivotVal = String(entry.event[pivotDimensionKey.value])

      if (!groups[rowId]) {
        groups[rowId] = {
          id: rowId,
          total: 0,
          pivotSums: {},
          additionalSums: {},
          original: entry,
        }

        // Initialize pivot sums to zero for all possible pivot values
        pivotValues.value.forEach((pv) => {
          groups[rowId].pivotSums[pv] = 0
        })

        // Initialize additional metric sums to zero.
        metricKeys.value.forEach((metricKey, index) => {
          if (index === 0) {
            return
          }

          groups[rowId].additionalSums[metricKey] = 0
        })
      }

      const group = groups[rowId]

      // Aggregate the first metric across pivot buckets and total
      const firstMetricKey = metricKeys.value[0]
      const rawVal = entry.event[firstMetricKey]
      let numVal = typeof rawVal === 'number' ? rawVal : Number(rawVal)

      if (!Number.isNaN(numVal)) {
        group.pivotSums[pivotVal] += numVal
        group.total += numVal
      }

      // Aggregate additional metrics across all pivot buckets
      metricKeys.value.forEach((metricKey, index) => {
        if (index === 0) {
          return
        }

        const rawMetric = entry.event[metricKey]
        let metricNum = typeof rawMetric === 'number' ? rawMetric : Number(rawMetric)

        if (!Number.isNaN(metricNum)) {
          group.additionalSums[metricKey] += metricNum
        }
      })
    })

    const rows: TopNRow[] = []

    // Determine the unit for the primary metric; default to 'count'
    const primaryMetricKey = columnKey.value
    const primaryUnit = props.data.meta?.metric_units?.[primaryMetricKey] || 'count'
    const approximateUnits = ['count', 'count/minute', 'token count'].includes(primaryUnit)

    // Build each row from the group aggregates.
    Object.keys(groups).forEach((rowId) => {
      const group = groups[rowId]

      // Retrieve display name and deletion status from display metadata
      const rowDisplayRecord = (props.data.meta.display as any)[rowDimensionKey.value]?.[rowId] || {}
      const rowName = rowDisplayRecord.name || rowId
      const rowDeleted = !!rowDisplayRecord.deleted

      const row: TopNRow = {
        id: rowId,
        name: rowName,
        deleted: rowDeleted,
        original: group.original as AnalyticsExploreRecord,
      }

      // Format each pivot bucket value using the primary metric's unit.
      pivotValues.value.forEach((pv) => {
        const val = group.pivotSums[pv] || 0

        row[pv] = formatUnit(val, primaryUnit, {
          approximate: approximateUnits,
          isBytes1024: true,
          translateUnit: (unitName) => translateChartUnit(unitName, val),
        })
      })

      // Format the total column.
      const totalVal = group.total

      row.total = formatUnit(totalVal, primaryUnit, {
        approximate: approximateUnits,
        isBytes1024: true,
        translateUnit: (unitName) => translateChartUnit(unitName, totalVal),
      })

      // Format aggregated additional metrics.
      metricKeys.value.forEach((metricKey, index) => {
        if (index === 0) {
          return
        }

        const aggVal = group.additionalSums[metricKey] || 0
        const unit = props.data.meta?.metric_units?.[metricKey] || 'count'
        const approx = ['count', 'count/minute', 'token count'].includes(unit)

        row[metricKey] = formatUnit(aggVal, unit, {
          approximate: approx,
          isBytes1024: true,
          translateUnit: (unitName) => translateChartUnit(unitName, aggVal),
        })
      })

      rows.push(row)
    })

    return rows
  }

  // Non-pivot dataset: legacy behaviour (one row per record)
  return records.value.map((entry) => {
    const id = getId(entry)

    const row: TopNRow = {
      id,
      name: getName(entry),
      deleted: getDeleted(entry),
      original: entry,
    }

    if (columnKey.value) {
      row.value = getValue(entry)
    }

    metricKeys.value.forEach((metricKey, index) => {
      if (index === 0) {
        return
      }

      row[metricKey] = getMetricValue(entry, metricKey)
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
  } else if (displayKey.value && !Object.keys(displayRecord.value).length) {
    return i18n.t('topNTable.errors.display') as string
  } else if (!columnKey.value) {
    return i18n.t('topNTable.errors.metricNames') as string
  }

  return ''
})

/**
 * Safe accessor for any metric column in the row.
 * This keeps the template type-clean and lets you tweak formatting here
 * if you ever need to.
 */
const getRowMetricDisplayValue = (row: TopNRow, key: string): string => {
  const value = row[key]

  if (typeof value === 'string') {
    return value
  }

  if (value === null || value === undefined) {
    return '–'
  }

  return String(value)
}

const translateChartUnit = (unit: string, value: number): string => {
  if (unit === 'count' || unit === 'requests') {
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
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-20;
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

    &-header-row {
      border-bottom: $kui-border-width-10 solid $kui-color-border;
    }

    &-header-cell {
      padding: 0 var(--kui-space-80, $kui-space-80) var(--kui-space-50, $kui-space-50) 0;
      text-align: left;

      &:last-child {
        padding-right: 0;
      }

      .table-header-label {
        color: $kui-color-text;
        font-size: $kui-font-size-30;
        font-weight: $kui-font-weight-semibold;
        line-height: $kui-line-height-40;
      }
    }

    &-row {
      border-bottom: $kui-border-width-10 solid $kui-color-border;

      &:first-of-type {
        border-top: $kui-border-width-10 solid $kui-color-border;
      }

      &:last-of-type {
        border-bottom: none;
      }
    }

    &-header-cell-metric,
    &-cell-metric {
      white-space: nowrap;
      width: 1%;
    }

    &-cell {
      min-width: 110px;
      padding: var(--kui-space-50, $kui-space-50) var(--kui-space-0, $kui-space-0);

      &--name {
        color: $kui-color-text-neutral-stronger;
        font-size: $kui-font-size-30;
        min-width: 200px;
        padding-right: var(--kui-space-80, $kui-space-80);
      }
    }
  }

  :deep(a) {
    color: $kui-color-text-primary;
    font-weight: $kui-font-weight-bold;
    text-decoration: none;
  }
}
</style>
