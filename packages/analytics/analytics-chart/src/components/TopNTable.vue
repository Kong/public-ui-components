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

    <KTableView
      v-else
      class="top-n-table"
      :data="tableData"
      data-testid="top-n-table"
      :headers="tableHeaders"
      :hide-pagination="true"
      :hide-toolbar="true"
      row-key="id"
    >
      <template #name="{ row }">
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
      </template>

      <!--
        'value' is the primary metric in order to be backwards compatible
        with our original use of a single metric TopNTable
      -->
      <template #value="{ row }">
        <span :data-testid="`row-${row.id}`">{{ row.value }}</span>
      </template>
    </KTableView>
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
  TableViewHeader,
  TableViewData,
} from '@kong/kongponents'

import { computed } from 'vue'
import { unitFormatter } from '@kong-ui-public/analytics-utilities'
import composables from '../composables'

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
const tableHeaders = computed<TableViewHeader[]>(() => {
  const headers: TableViewHeader[] = [
    {
      key: 'name',
      label: i18n.t('topNTable.nameLabel') as string,
    },
  ]

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
 * - One property per metric key for KTableView (e.g. row['status_4xx'])
 */
const tableData = computed<TableViewData>(() => {
  if (!records.value?.length) {
    return []
  }

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

const translateChartUnit = (unit: string, value: number): string => {
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
    width: 100%;
  }

  :deep(.k-table-view .table-container .table-wrapper table) {
    // Line up first and last columns with the edge of the table
    thead tr th:first-child, td:first-child {
      padding: var(--kui-space-50, $kui-space-50) var(--kui-space-0, $kui-space-0);
    }

    thead tr th:last-child, td:last-child {
      padding: var(--kui-space-50, $kui-space-50) var(--kui-space-0, $kui-space-0);
      width: 110px;
    }

    thead tr th .table-headers-container .table-header-label {
      color: $kui-color-text;
      font-size: $kui-font-size-30;
      font-weight: $kui-font-weight-semibold;
      line-height: $kui-line-height-40;
    }
  }

  :deep(a) {
    color: $kui-color-text-primary;
    text-decoration: none;
  }
}
</style>
