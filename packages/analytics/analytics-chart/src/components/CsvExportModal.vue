<template>
  <div class="kong-ui-public-csv-export-modal">
    <KPrompt
      class="vitals-report"
      data-testid="csv-export-modal"
      is-visible
      show-dismiss-icon
      text-align="left"
      :title="i18n.t('csvExport.exportPreview')"
      @canceled="closeModal"
      @keyup.esc="closeModal"
    >
      <template #body-content>
        <div>
          <div
            v-if="hasData"
            class="selected-range"
          >
            <p v-if="modalDescription">
              {{ modalDescription }}
            </p>
            <p v-else>
              {{ i18n.t('csvExport.exportDescription') }}
            </p>
            <p>
              {{ i18n.t('csvExport.exportTimeRange') }}: {{ selectedRange }}
            </p>
          </div>
          <KTable
            class="vitals-table"
            disable-pagination
            disable-sorting
            :fetcher="fetcher"
            :fetcher-cache-key="String(fetcherCacheKey)"
            :has-hover="false"
            :headers="tableData?.headers || []"
          >
            <template #empty-state>
              <KEmptyState
                cta-is-hidden
                icon="stateNoData"
                icon-size="96"
              >
                <template #title>
                  <h5>{{ i18n.t('csvExport.noDataRange') }}</h5>
                </template>
                <template #message>
                  <p>{{ i18n.t('csvExport.noDataRetry') }}</p>
                </template>
              </KEmptyState>
            </template>
          </KTable>
          <div
            v-if="!isLoading && hasData"
            class="text-muted"
            tag="span"
          >
            {{ previewMessage }}
          </div>
        </div>
      </template>
      <template #action-buttons>
        <KButton
          appearance="secondary"
          class="cancel-btn"
          @click="closeModal"
        >
          {{ i18n.t('csvExport.cancelButton') }}
        </KButton>
        <DownloadCsv
          class="vitals-report-export-button"
          :filename="reportFilename"
          :headers="tableData.csvHeaders"
          :rows="tableData.rows"
        >
          <KButton
            appearance="primary"
            data-testid="csv-download-button"
            :disabled="isLoading || !hasData"
          >
            {{ i18n.t('csvExport.downloadButton') }}
          </KButton>
        </DownloadCsv>
      </template>
    </KPrompt>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

import DownloadCsv from './DownloadCsv.vue'
import composables from '../composables'
import type { AnalyticsExploreResult, AnalyticsExploreV2Result } from '@kong-ui-public/analytics-utilities'
import { format } from 'date-fns-tz'
const { i18n } = composables.useI18n()

const props = withDefaults(defineProps<{
  modalTitle: string,
  modalDescription?: string,
  selectedRange: string,
  chartData: AnalyticsExploreResult | AnalyticsExploreV2Result,
}>(), {
  modalDescription: undefined,
})

interface Header {
  label: string
  key: string
}

interface TimeseriesColumn {
  label: string;
  key: string;
}

const emit = defineEmits(['toggleModal'])

const MAX_ROWS = 3
const reportFilename = `${props.modalTitle.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
const isLoading = ref(true)
const hasData = computed(() => !!props.chartData?.records?.length)
const fetcherCacheKey = ref(1)
const rowsTotal = computed(() => tableData.value.rows.length)

const previewMessage = computed(() => {
  return i18n.t('csvExport.previewRows', {
    rowsMax: Math.min(MAX_ROWS, rowsTotal.value),
    rowsTotal: rowsTotal.value,
    plural: rowsTotal.value === 1 ? '' : 's',
  })
})

const closeModal = () => {
  emit('toggleModal', false)
}

const tableData = computed(() => {
  if (!hasData.value || !props.chartData?.meta.metricNames) {
    return { headers: [], rows: [], csvHeaders: {} }
  }

  const isTimeseries = props.chartData.records.some(r => r.timestamp !== props.chartData.records[0].timestamp)

  const rows = props.chartData.records.map(rec => {
    const recTs = new Date(rec.timestamp)

    return {
      ...rec.event,
      ...(isTimeseries
        ? {
          timestamp: format(recTs, 'yyyy-MM-dd HH:mm:ss'),
          tzOffset: format(recTs, 'XXX'),
        }
        : {}),
    }
  })

  let timeseriesColumns: TimeseriesColumn[] = []

  if (isTimeseries) {
    timeseriesColumns = [
      { label: 'Timestamp', key: 'timestamp' },
      { label: 'UtcOffset', key: 'tzOffset' },
    ]
  }

  const dimensions = ('dimensions' in props.chartData.meta) && props.chartData.meta?.dimensions
    ? props.chartData.meta?.dimensions
    : {}

  const displayHeaders: Header[] = [
    ...timeseriesColumns,

    // `dimensions` are present in v1 and v2 explore meta
    ...Object.keys(dimensions).map(key => ({
      label: key,
      key,
    })),

    // `metricNames` are common to all explore versions
    ...props.chartData.meta.metricNames.map(key => ({
      label: key,
      key,
    })),
  ]

  interface AccumulatorRow {
    [key: string]: string;
  }

  const csvHeaders: Record<string, string> = displayHeaders.reduce((accum: AccumulatorRow, h: TimeseriesColumn) => {
    accum[h.key] = h.label

    return accum
  }, {})

  return {
    headers: displayHeaders,
    csvHeaders,
    rows,
  }
})

const fetcher = () => {
  const { rows } = tableData.value

  isLoading.value = false

  return {
    total: Number(rows.length) || 0,
    data: rows.slice(0, MAX_ROWS),
  }
}

// Parent component could send new data while modal is open
watch(tableData, () => {
  fetcherCacheKey.value++
})
</script>

<style lang="scss">
.kong-ui-public-csv-export-modal {
  .k-modal-dialog {
    min-width: 580px;

    .k-empty-state-message {
      max-width: 80%;
    }

    .cancel-btn {
      margin-right: $kui-space-40;
    }

    .selected-range {
      font-size: $kui-font-size-30;
    }

    .text-muted {
      color: rgba(0, 0, 0, 0.45) !important;
      font-size: $kui-font-size-30;
    }

    .vitals-table {
      font-size: $kui-font-size-30;
      margin-bottom: $kui-space-70;
      margin-top: $kui-space-30;
      width: 100%;
    }

    .k-table {
      thead {
        border-top: $kui-border-width-10 solid $kui-color-border;
        height: auto;   // Match KTable legacy styling
      }
    }
    .k-modal-footer {
      .vitals-report-export-button {
        display: inline-flex;
      }
    }
  }
}
</style>
