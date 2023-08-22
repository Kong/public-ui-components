<template>
  <KCard class="kong-ui-public-top-n-table">
    <template
      v-if="title"
      #title
    >
      <div data-testid="top-n-card-title">
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

    <template #body>
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
    </template>
  </KCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { AnalyticsExploreV3Result, AnalyticsExploreV3Meta, AnalyticsExploreRecord, RecordEvent } from '@kong-ui-public/analytics-utilities'
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
    type: Object as PropType<AnalyticsExploreV3Result>,
    required: true,
  },
  emptyStateTitle: {
    type: String,
    default: '',
  },
})

const { i18n } = composables.useI18n()
const meta = computed((): AnalyticsExploreV3Meta => props.data.meta)
const records = computed((): AnalyticsExploreRecord[] => props.data.records)
const hasData = computed((): boolean => !!(records.value?.length))
const displayKey = computed((): string => {
  if (!meta.value?.display) {
    return ''
  }

  return Object.keys(meta.value.display)?.[0]
})
const displayRecord = computed(() => {
  if (!displayKey.value) {
    return {}
  }

  return meta.value.display[displayKey.value]
})
const columnKey = computed((): string => {
  if (!meta.value?.metricNames?.length) {
    return ''
  }

  return meta.value.metricNames[0]
})
const columnName = computed((): string => {
  if (!columnKey.value) {
    return ''
  }

  return i18n.t(`chartLabels.${columnKey.value}` as any) || columnKey.value
})

const errorMessage = computed((): string => {
  if (hasData.value) {
    if (!meta.value) {
      return i18n.t('topNTable.errors.meta')
    }

    if (!Object.keys(displayRecord.value).length) {
      return i18n.t('topNTable.errors.display')
    }

    if (!columnKey.value) {
      return i18n.t('topNTable.errors.metricNames')
    }
  }

  return ''
})

const getEvent = (record: AnalyticsExploreRecord): RecordEvent => {
  return record.event
}

const getId = (record: AnalyticsExploreRecord): string => {
  const event = getEvent(record)

  return String(event[displayKey.value])
}
const getName = (record: AnalyticsExploreRecord): string => {
  const id = getId(record)

  return String(displayRecord.value[id]) || '–'
}
const getValue = (record: AnalyticsExploreRecord): string => {
  if (!columnKey.value) {
    return '–'
  }

  const event = getEvent(record)
  const val = event[columnKey.value]

  if (!val) {
    return '–'
  }

  return approxNum(val, { capital: true, round: true })
}
</script>

<style lang="scss" scoped>
.kong-ui-public-top-n-table {
  --kui-border-radius-20: 8px;
  --kui-font-size-60: 16px;

  :deep(.k-card-actions) {
    align-self: baseline;
    display: flex;
    line-height: 22px;

    .top-n-card-description {
      color: #6F7787;
      font-size: 12px;
      text-align: right;
    }
  }

  .top-n-table {
    display: flex;
    flex-direction: column;
    width: 100%;

    .table-headings {
      font-size: 14px;
      font-weight: 600;
      line-height: 24px;
    }

    .table-row {
      align-self: stretch;
      border-bottom: 1px solid #E7E7EC;
      display: flex;
      justify-content: space-between;
    }

    .column-1 {
      padding: 0 24px 15px 0;
    }

    .column-2 {
      flex: 1;
      max-width: 110px;
      padding: 0 0 15px 0;
    }

    .table-body {
      .column-1, .column-2 {
        padding-top: 15px;
      }

      .column-1 {
        color: #3C4557;
        font-size: 13px;

        :deep(a) {
          color: #1155CB;
          font-weight: 700;
          text-decoration: none;
        }
      }
    }
  }
}
</style>
