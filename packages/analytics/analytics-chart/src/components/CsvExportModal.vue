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
            v-if="exportState.status === 'success' && hasData"
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
            v-if="exportState.status === 'loading'"
            class="chart-skeleton"
            type="table"
          />
          <KTableData
            v-else-if="exportState.status === 'success'"
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
          <KEmptyState
            v-else-if="exportState.status === 'error'"
            :action-button-visible="false"
          >
            <template #title>
              <h5>{{ i18n.t('csvExport.dataError') }}</h5>
            </template>
          </KEmptyState>
          <div
            v-if="exportState.status === 'success' && hasData"
            class="text-muted"
            tag="span"
          >
            {{ previewMessage }}
            <KTooltip
              class="preview-tooltip"
              placement="right"
              :text="i18n.t('csvExport.maximumRecordAmount', { value: EXPORT_RECORD_LIMIT })"
            >
              <InfoIcon
                :color="`var(--kui-color-text-neutral, ${KUI_COLOR_TEXT_NEUTRAL})`"
                :size="KUI_ICON_SIZE_30"
              />
            </KTooltip>
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
            :disabled="exportState.status !== 'success' || !hasData"
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

import {
  KUI_ICON_SIZE_30,
  KUI_COLOR_TEXT_NEUTRAL,
} from '@kong/design-tokens'
import { InfoIcon } from '@kong/icons'
import type { AllAggregations, ExploreExportState, ExploreResultV4, GroupByResult, RecordEvent } from '@kong-ui-public/analytics-utilities'
import { EXPORT_RECORD_LIMIT } from '@kong-ui-public/analytics-utilities'
import DownloadCsv from './DownloadCsv.vue'
import composables from '../composables'
import { format } from 'date-fns-tz'
import type { CsvData, Header, TimeseriesColumn } from '../types'

const { i18n } = composables.useI18n()

const props = withDefaults(defineProps<{
  exportState: ExploreExportState
  filename: string
  modalDescription?: string
}>(), {
  modalDescription: undefined,
})

const emit = defineEmits(['closeModal'])

const MAX_ROWS = 3
const reportFilename = `${props.filename.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
const fetcherCacheKey = ref(1)

const rowsTotal = computed(() => tableData.value.rows.length)
const hasData = computed(() => props.exportState.status === 'success' && !!props.exportState.chartData?.data?.length)
const selectedRange = computed(() => {
  if (props.exportState.status !== 'success') {
    return ''
  }

  return composables.useChartSelectedRange(toRef(props.exportState, 'chartData'))
})

const previewMessage = computed(() => {
  if (props.exportState.status !== 'success') {
    return ''
  }

  return i18n.t('csvExport.previewRows', {
    rowsMax: Math.min(MAX_ROWS, rowsTotal.value),
    rowsTotal: rowsTotal.value,
    plural: rowsTotal.value === 1 ? '' : 's',
  })
})

const closeModal = () => {
  emit('closeModal')
}

const tableData = computed(() => {
  if (props.exportState.status !== 'success' || !hasData.value || !props.exportState.chartData?.meta.metric_names) {
    return { headers: [], rows: [], csvHeaders: {} }
  }

  const chartData: ExploreResultV4 = props.exportState.chartData
  const isTimeseries = chartData.data.some((result: GroupByResult) => result.timestamp !== chartData.data[0].timestamp)

  const rows = chartData.data.map((result: GroupByResult) => {
    const resultTimestamp = new Date(result.timestamp)

    const translatedEvent = Object.keys(result.event).reduce((acc: RecordEvent, key) => {
      if (key in chartData.meta.display) {
        const dimensionId = result.event[key]
        const displayEntry = chartData.meta.display[key]
        acc[key] = (dimensionId && displayEntry && displayEntry[dimensionId].name) || result.event[key]
      } else {
        acc[key] = result.event[key]
      }
      return acc
    }, {})

    return {
      ...translatedEvent,
      ...(isTimeseries
        ? {
          timestamp: format(resultTimestamp, 'yyyy-MM-dd HH:mm:ss'),
          tzOffset: format(resultTimestamp, 'XXX'),
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

  const dimensions = ('display' in props.exportState.chartData.meta) && props.exportState.chartData.meta?.display
    ? props.exportState.chartData.meta?.display
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
    ...props.exportState.chartData.meta.metric_names.map((key: AllAggregations) => ({
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
  if (props.exportState.status !== 'success') {
    return { total: 0, data: [] }
  }

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
      font-size: var(--kui-font-size-30, $kui-font-size-30);
    }

    .text-muted {
      color: rgba(0, 0, 0, 0.45) !important;
      font-size: var(--kui-font-size-30, $kui-font-size-30);
    }

    .vitals-table {
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      margin-bottom: var(--kui-space-70, $kui-space-70);
      margin-top: var(--kui-space-30, $kui-space-30);
      width: 100%;
    }

    .k-table {
      thead {
        border-top: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
        height: auto;   // Match KTable legacy styling
      }
    }

    .modal-footer {
      .vitals-report-export-button {
        display: inline-flex;
      }
    }

    .preview-tooltip {
      display: inline-flex;
      margin: var(--kui-space-auto, $kui-space-auto)
        var(--kui-space-0, $kui-space-0)
        var(--kui-space-auto, $kui-space-auto)
        var(--kui-space-20, $kui-space-20);
      vertical-align: middle;
    }
  }
}
</style>
