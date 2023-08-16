<template>
  <KCard class="kong-ui-public-top-n-table">
    <template #title>
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
      <div class="top-n-table">
        <div class="table-headings">
          <div class="table-row">
            <div class="column-1">
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
              {{ getName(entry) }}
            </div>
            <div class="column-2">
              {{ getValue(entry) }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </KCard>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue'
import { AnalyticsExploreResult, AnalyticsExploreV2Result, AnalyticsExploreRecord, RecordEvent, AnalyticsExploreMeta, AnalyticsExploreV2Meta } from '@kong-ui-public/analytics-utilities'
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
    type: Object as PropType<AnalyticsExploreResult | AnalyticsExploreV2Result>,
    required: true,
  },
  dataKey: {
    type: String,
    required: true,
  },
})

const { i18n } = composables.useI18n()
// TODO: strip table in favor of flex? Alignment of second column
const meta = computed((): AnalyticsExploreMeta | AnalyticsExploreV2Meta => props.data.meta)
const records = computed((): AnalyticsExploreRecord[] => props.data.records)
const columnKey = computed((): string => meta.value?.metricNames?.[0] || '')
const columnName = computed((): string => {
  if (columnKey.value) {
    return i18n.t(`chartLabels.${columnKey.value}` as any) || columnKey.value
  }

  return ''
})

// TODO: error state - missing required fields, or response incorrectly formatted, styling for links, approxnum
// TODO: accept only v3, wait for API
// TODO: remove `dataKey` prop, use `display`, first key in response - look up name from display
// TODO: slot for column one value, slot param = id, name, and dimension (columnName)
// TODO: translation

const getEvent = (record: AnalyticsExploreRecord): RecordEvent => {
  return record.event
}

const getName = (record: AnalyticsExploreRecord): string => {
  const event = getEvent(record)

  return String(event[props.dataKey]) || '-'
}
const getValue = (record: AnalyticsExploreRecord): string => {
  if (!columnKey.value) {
    return '-'
  }

  const event = getEvent(record)

  return String(event[columnKey.value]) || '-'
}
</script>

<style lang="scss" scoped>
.kong-ui-public-top-n-table {
  // TODO: use correct tokens
  /* --KCardTitleColor: #0B172D;
  --KCardTitleFontSize: 16px; */

  .top-n-card-description {
    color: #6F7787;
    font-size: 12px;
    text-align: right;
  }

  .top-n-table {
    display: flex;
    flex-direction: column;
    width: 100%;

    .table-row {
      border-bottom: 1px solid #E7E7EC;
      display: flex;
      justify-content: space-between;
      padding: 15px;
    }

    .column-2 {
      padding-left: 24px;
    }
  }
}
</style>
