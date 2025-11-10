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
      <div class="table-headings">
        <div class="table-row">
          <div class="column-1">
            {{ i18n.t('topNTable.nameLabel') }}
          </div>
          <div class="column-2">
            {{ columnName }}
          </div>
        </div>
      </div>

      <div
        class="table-body"
        data-testid="top-n-data"
      >
        <div
          v-for="(entry, idx) in records"
          :key="`entry-${idx}`"
          class="table-row"
          :data-testid="`row-${getId(entry)}`"
        >
          <div class="column-1">
            <slot
              name="name"
              :record="{
                id: getId(entry),
                name: getName(entry),
                deleted: getDeleted(entry),
                dimension: displayKey,
              }"
            >
              {{ getName(entry) }}
            </slot>
          </div>
          <div class="column-2">
            &nbsp; {{ getValue(entry) }}
          </div>
        </div>
      </div>
    </div>
  </KCard>
</template>

<script setup lang="ts">
import type { AllAggregations, AnalyticsExploreRecord, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { HeaderTag } from '@kong/kongponents'

import { computed } from 'vue'
import { unitFormatter } from '@kong-ui-public/analytics-utilities'
import composables from '../composables'

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

const columnKey = computed((): AllAggregations | undefined => props.data.meta?.metric_names?.[0])
const columnUnit = computed((): string => {
  if (!columnKey.value) {
    return 'count'
  }

  return props.data.meta?.metric_units?.[columnKey.value] || 'count'
})
const columnName = computed((): string => {
  if (!columnKey.value) {
    return ''
  }

  return i18n.t(`chartLabels.${columnKey.value}` as any) || columnKey.value
})

const errorMessage = computed((): string => {
  if (!hasData.value) {
    return ''
  }

  if (!props.data.meta) {
    return i18n.t('topNTable.errors.meta')
  } else if (displayRecord.value && !Object.keys(displayRecord.value).length) {
    return i18n.t('topNTable.errors.display')
  } else if (!columnKey.value) {
    return i18n.t('topNTable.errors.metricNames')
  }

  return ''
})

const getId = (record: AnalyticsExploreRecord): string => {
  const event = record.event

  return String(event[displayKey.value])
}
const getName = (record: AnalyticsExploreRecord): string => {
  const id = getId(record)
  const idRecord = displayRecord.value && displayRecord.value[id]

  if (!idRecord) {
    return '-'
  }

  return idRecord.name
}
const getDeleted = (record: AnalyticsExploreRecord): boolean => {
  const id = getId(record)
  const idRecord = displayRecord.value && displayRecord.value[id]

  if (!idRecord) {
    return false
  }

  return !!idRecord.deleted
}
const getValue = (record: AnalyticsExploreRecord): string => {
  if (!columnKey.value) {
    return '–'
  }

  const val = record.event[columnKey.value]

  if (!val) {
    return '–'
  }

  const value = typeof val === 'number' ? val : Number(val)

  if (Number.isNaN(value)) {
    return '–'
  }

  // Only counts should use approximation
  const approximate = ['count', 'count/minute', 'token count'].includes(columnUnit.value)

  return formatUnit(value, columnUnit.value, {
    approximate,
    isBytes1024: true,
    translateUnit: (unit) => translateChartUnit(unit, value),
  })
}

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

    .table-headings {
      flex-shrink: 0;
      font-size: $kui-font-size-30;
      font-weight: $kui-font-weight-semibold;
      line-height: $kui-line-height-40;
    }

    .table-row {
      align-self: stretch;
      border-bottom: $kui-border-width-10 solid $kui-color-border;
      display: flex;
      justify-content: space-between;

      &:last-of-type {
        border-bottom: none;
      }
    }

    .column-1 {
      flex: 1;
      padding: $kui-space-0 $kui-space-80 $kui-space-50 $kui-space-0;
    }

    .column-2 {
      flex: 1;
      max-width: 110px;
      padding: $kui-space-0 $kui-space-0 $kui-space-50 $kui-space-0;
    }

    .table-body {
      overflow-y: auto;

      .table-row:first-of-type {
        border-top: $kui-border-width-10 solid $kui-color-border;
      }

      .column-1, .column-2 {
        padding-top: $kui-space-50;
      }

      .column-1 {
        color: $kui-color-text-neutral-stronger;
        font-size: $kui-font-size-30;

        :deep(a) {
          color: $kui-color-text-primary;
          font-weight: $kui-font-weight-bold;
          text-decoration: none;
        }
      }
    }
  }
}
</style>

<style lang="scss">
// TODO: clean up these styles after KCard redesign - KHCP-8971
.kong-ui-public-top-n-table.kong-card.border {
  border-radius: $kui-border-radius-20;
  padding: $kui-space-70;

  .k-card-header {
    align-items: baseline;
    margin-bottom: $kui-space-0 !important;

    .k-card-title {
      margin-bottom: $kui-space-60;

      h4 {
        font-size: $kui-font-size-40;
        font-weight: $kui-font-weight-semibold;
      }
    }
  }
}
</style>
