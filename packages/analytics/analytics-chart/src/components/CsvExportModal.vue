<template>
  <div class="kong-ui-public-csv-export-modal">
    <KModal
      class="vitals-report"
      data-testid="csv-export-modal"
      show-dismiss-icon
      :title="i18n.t('csvExport.exportPreview')"
      visible
      @cancel="closeModal"
      @keyup.esc="closeModal"
    >
      <template #default>
        <div>
          <div
            v-if="hasData"
            class="selected-range"
          >
            <p>
              {{ modalDescription ? modalDescription : i18n.t('csvExport.exportDescription') }}
            </p>
            <p>
              {{ i18n.t('csvExport.exportTimeRange') }}: {{ selectedRange }}
            </p>
          </div>
          <KSkeleton
            v-if="isLoadingRef"
            class="chart-skeleton"
            type="table"
          />
          <KTableData
            v-else
            class="vitals-table"
            :fetcher="fetcher"
            :fetcher-cache-key="String(fetcherCacheKey)"
            :headers="tableData?.headers || []"
            hide-pagination
            :row-hover="false"
            :sortable="false"
          >
            <template #empty-state>
              <KEmptyState
                :action-button-visible="false"
              >
                <template #title>
                  <h5>{{ i18n.t('csvExport.noDataRange') }}</h5>
                </template>
                <template #default>
                  <p>{{ i18n.t('csvExport.noDataRetry') }}</p>
                </template>
              </KEmptyState>
            </template>
          </KTableData>
          <div
            v-if="!isLoadingRef && hasData"
            class="text-muted"
            tag="span"
          >
            {{ previewMessage }}
          </div>
        </div>
      </template>
      <template #footer-actions>
        <KButton
          appearance="tertiary"
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
            :disabled="isLoadingRef || !hasData"
          >
            {{ i18n.t('csvExport.downloadButton') }}
          </KButton>
        </DownloadCsv>
      </template>
    </KModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRef } from 'vue'

import DownloadCsv from './DownloadCsv.vue'
import composables from '../composables'
import type { ExploreResultV4, RecordEvent } from '@kong-ui-public/analytics-utilities'
import { format } from 'date-fns-tz'
import type { CsvData, Header, TimeseriesColumn } from '../types'

const { i18n } = composables.useI18n()

const props = withDefaults(defineProps<{
  filename: string
  modalDescription?: string
  chartData: ExploreResultV4
  isLoading: boolean
}>(), {
  modalDescription: undefined,
  isLoading: true,
})

const emit = defineEmits(['toggleModal'])

const MAX_ROWS = 3
const reportFilename = `${props.filename.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
const isLoadingRef = toRef(props, 'isLoading')
const hasData = computed(() => !!props.chartData?.data?.length)
const fetcherCacheKey = ref(1)
const rowsTotal = computed(() => tableData.value.rows.length)
const selectedRange = composables.useChartSelectedRange(toRef(props, 'chartData'))

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
  if (!hasData.value || !props.chartData?.meta.metric_names) {
    return { headers: [], rows: [], csvHeaders: {} }
  }

  const isTimeseries = props.chartData.data.some(r => r.timestamp !== props.chartData.data[0].timestamp)

  const rows = props.chartData.data.map(rec => {
    const recTs = new Date(rec.timestamp)

    const translatedEvent = Object.keys(rec.event).reduce((acc: RecordEvent, key) => {
      if (key in props.chartData.meta.display) {
        const dimensionId = rec.event[key]
        const displayEntry = props.chartData.meta.display[key]
        acc[key] = (dimensionId && displayEntry && displayEntry[dimensionId].name) || rec.event[key]
      } else {
        acc[key] = rec.event[key]
      }
      return acc
    }, {})

    return {
      ...translatedEvent,
      ...(isTimeseries
        ? {
          timestamp: format(recTs, 'yyyy-MM-dd HH:mm:ss'),
          tzOffset: format(recTs, 'XXX'),
        }
        : {}),
    }
  }) as CsvData

  let timeseriesColumns: TimeseriesColumn[] = []

  if (isTimeseries) {
    timeseriesColumns = [
      { label: i18n.t('csvExport.Timestamp'), key: 'timestamp' },
      { label: i18n.t('csvExport.UtcOffset'), key: 'tzOffset' },
    ]
  }

  const dimensions = ('display' in props.chartData.meta) && props.chartData.meta?.display
    ? props.chartData.meta?.display
    : {}

  const displayHeaders: Header[] = [
    ...timeseriesColumns,

    // `dimensions` are present in v1 and v2 explore meta
    ...Object.keys(dimensions).map(key => ({
      // @ts-ignore - dynamic i18n key
      label: i18n.t(`chartLabels.${key}`),
      key,
    })),

    // `metricNames` are common to all explore versions
    ...props.chartData.meta.metric_names.map(key => ({
      // @ts-ignore - dynamic i18n key
      label: i18n.t(`chartLabels.${key}`),
      key,
    })),
  ]

  interface AccumulatorRow {
    [key: string]: string
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

const fetcher = async (): Promise<any> => {
  const { rows } = tableData.value

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
  .modal-container {
    min-width: 580px;

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

    .modal-footer {
      .vitals-report-export-button {
        display: inline-flex;
      }
    }
  }
}
</style>
