<template>
  <KCard class="kong-ui-public-top-n-table">
    <template
      v-if="title"
      #title
    >
      <div
        class="top-n-card-title"
        data-testid="top-n-card-title"
      >
        {{ title }}
      </div>
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
      cta-is-hidden
      data-testid="top-n-error-state"
      is-error
    >
      <template #title>
        {{ i18n.t('topNTable.defaultErrorStateTitle') }}
      </template>
      <template #message>
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
      cta-is-hidden
      data-testid="top-n-empty-state"
      icon="stateNoData"
      icon-size="80"
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
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { AnalyticsExploreRecord, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
// @ts-ignore - approximate-number no exported module
import approxNum from 'approximate-number'
import composables from '../composables'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  data: {
    type: Object as PropType<ExploreResultV4>,
    required: true,
  },
  emptyStateTitle: {
    type: String,
    default: '',
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const { i18n } = composables.useI18n()
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
const columnKey = computed((): string => {
  if (!props.data.meta?.metric_names?.length) {
    return ''
  }

  return props.data.meta.metric_names[0]
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

  const event = record.event
  const val = event[columnKey.value]

  if (!val) {
    return '–'
  }

  return approxNum(val, { capital: true, round: true })
}
</script>

<style lang="scss" scoped>
.kong-ui-public-top-n-table {
  border-radius: $kui-border-radius-40 !important;

  .top-n-card-title {
    font-size: $kui-font-size-40;
  }

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

  .top-n-table {
    display: flex;
    flex-direction: column;
    width: 100%;

    .table-headings {
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
      padding: $kui-space-0 $kui-space-80 $kui-space-50 $kui-space-0;
    }

    .column-2 {
      flex: 1;
      max-width: 110px;
      padding: $kui-space-0 $kui-space-0 $kui-space-50 $kui-space-0;
    }

    .table-body {
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
