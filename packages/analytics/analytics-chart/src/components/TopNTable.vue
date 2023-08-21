<template>
  <KCard class="kong-ui-public-top-n-table">
    <template
      v-if="title"
      #title
    >
      {{ title }}
    </template>
    <template
      v-if="description"
      #actions
    >
      <div class="top-n-card-description">
        {{ description }}
      </div>
    </template>

    <template #body>
      <KEmptyState
        v-if="errorMessage"
        cta-is-hidden
        is-error
      >
        <template #title>
          {{ errorMessage }}
        </template>
      </KEmptyState>
      <div class="top-n-table">
        <div class="table-headings">
          <div class="table-row">
            <div class="column-1">
              <!-- TODO: translate -->
              Name
            </div>
            <div class="column-2">
              {{ columnName }}
            </div>
          </div>
        </div>

        <div class="table-body">
          <div
            v-for="(entry, idx) in records"
            :key="`entry-${idx}`"
            class="table-row"
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
              &nbsp;{{ getValue(entry) }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </KCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AnalyticsExploreRecord, RecordEvent } from '@kong-ui-public/analytics-utilities'
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
    // TODO: type
  //  type: Object as PropType<AnalyticsExploreResult | AnalyticsExploreV2Result>,
    type: Object,
    required: true,
  },
})

const { i18n } = composables.useI18n()
// TODO: types
const meta = computed(() => props.data.meta)
const records = computed(() => props.data.records)
const displayKey = computed(() => {
  const key = Object.keys(meta.value?.display)?.[0]

  if (!key) {
    return
  }

  return key
})
const displayRecords = computed(() => {
  if (!displayKey.value) {
    return
  }

  return meta.value?.display[displayKey.value]
})
const columnKey = computed((): string => meta.value?.metricNames?.[0] || '')
const columnName = computed((): string => {
  if (columnKey.value) {
    return i18n.t(`chartLabels.${columnKey.value}` as any) || columnKey.value
  }

  return ''
})
const errorMessage = computed((): string => {
  if (!meta.value) {
    return 'Error: response must contain `meta`'
  }

  if (!displayKey.value) {
    // TODO: translate
    return 'Error: `display` response incorrectly formatted (must have at least one key)'
  }

  if (!columnKey.value) {
    return 'Error: `metricNames` response incorrectly formatted (must have at least one key)'
  }

  return ''
})

// TODO: accept only v3, wait for API

const getEvent = (record: AnalyticsExploreRecord): RecordEvent => {
  return record.event
}

const getId = (record: AnalyticsExploreRecord): string => {
  if (!displayKey.value) {
    return '-'
  }

  const event = getEvent(record)

  return String(event[displayKey.value]) || '-'
}
const getName = (record: AnalyticsExploreRecord): string => {
  if (!displayRecords.value) {
    return '-'
  }

  const id = getId(record)

  return String(displayRecords.value[id]) || '-'
}
const getValue = (record: AnalyticsExploreRecord): string => {
  if (!columnKey.value) {
    return '-'
  }

  const event = getEvent(record)
  const val = event[columnKey.value]

  if (!val) {
    return '-'
  }

  return approxNum(val, { capital: true, round: true })
}
</script>

<style lang="scss" scoped>
.kong-ui-public-top-n-table {
  --kui-border-radius-20: 8px;
  --kui-font-size-60: 16px;

  :deep(.k-card-actions) {
    display: flex;
    align-self: baseline;
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
