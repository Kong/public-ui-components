<!-- fallow-ignore-file unused-file -->
<template>
  <div class="sandbox">
    <header class="sandbox-header">
      <div>
        <h1>TableDataGrid</h1>
        <p>Cursor-first infinite loading playground with refresh, states, and fetch history.</p>
      </div>

      <div class="sandbox-header-actions">
        <KButton
          appearance="secondary"
          @click="clearEventLog"
        >
          Clear log
        </KButton>
        <KButton
          appearance="primary"
          @click="refreshRows"
        >
          Refresh rows
        </KButton>
      </div>
    </header>

    <main class="sandbox-main">
      <section class="table-section">
        <TableDataGrid
          :key="tableResetKey"
          :error="showErrorState"
          :fetcher="fetchRows"
          :headers="headers"
          :page-size="pageSize"
          :refresh-key="refreshKey"
          @grid:ready="handleGridReady"
          @state="handleState"
        >
          <template #empty-state>
            <KEmptyState
              message="Switch back to the generated dataset or refresh after changing controls."
              title="No sandbox rows"
            />
          </template>

          <template #error-state>
            <KEmptyState
              icon-variant="error"
              message="Turn off the host error state to show the grid again."
              title="Sandbox error state"
            />
          </template>
        </TableDataGrid>
      </section>

      <section class="event-log-section">
        <div class="event-log-header">
          <h2>Event log</h2>
          <KButton
            appearance="tertiary"
            :disabled="!eventLog.length"
            size="small"
            @click="clearEventLog"
          >
            Clear
          </KButton>
        </div>
        <pre class="debug-output event-log-output">{{ eventLog.length ? eventLog : 'Interact with the sandbox to see emitted events.' }}</pre>
      </section>
    </main>

    <aside class="state-panel">
      <section class="state-panel-section">
        <KCollapse
          v-model="collapsedSections.tableOptions"
          class="sandbox-section-collapse"
          title="Table options"
          @click.capture="toggleSectionOnHeaderClick('tableOptions', $event)"
        >
          <div class="control-grid">
            <label>
              Dataset
              <select
                :value="datasetMode"
                @change="handleDatasetModeChange"
              >
                <option
                  v-for="option in datasetModeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label>
              Page size
              <select
                :value="String(pageSize)"
                @change="handlePageSizeChange"
              >
                <option
                  v-for="size in pageSizeOptions"
                  :key="size"
                  :value="String(size)"
                >
                  {{ size }}
                </option>
              </select>
            </label>

            <label>
              Fetch delay
              <select
                :value="String(fetchDelayMs)"
                @change="handleFetchDelayChange"
              >
                <option
                  v-for="delay in fetchDelayOptions"
                  :key="delay"
                  :value="String(delay)"
                >
                  {{ delay }} ms
                </option>
              </select>
            </label>
          </div>

          <div class="toggle-list">
            <KCheckbox
              v-model="showErrorState"
              label="Host error state"
            />
          </div>

          <div class="sandbox-panel-actions">
            <KButton
              appearance="secondary"
              size="small"
              @click="refreshRows"
            >
              Increment refreshKey
            </KButton>
            <KButton
              appearance="tertiary"
              size="small"
              @click="resetSandbox"
            >
              Reset sandbox
            </KButton>
          </div>
        </KCollapse>
      </section>

      <section class="state-panel-section">
        <KCollapse
          v-model="collapsedSections.fetchDebug"
          class="sandbox-section-collapse"
          title="Fetch debug"
          @click.capture="toggleSectionOnHeaderClick('fetchDebug', $event)"
        >
          <pre class="debug-output">{{ fetchDebug }}</pre>

          <h3>Fetch history</h3>
          <div class="fetch-history-list">
            <KCard
              v-for="entry in fetchHistoryEntries"
              :key="entry.id"
              class="fetch-history-card"
            >
              <dl class="fetch-history-summary">
                <div>
                  <dt>Request</dt>
                  <dd>{{ entry.fetchCount }}</dd>
                </div>
                <div>
                  <dt>Page size</dt>
                  <dd>{{ entry.request.pageSize }}</dd>
                </div>
                <div>
                  <dt>Request cursor</dt>
                  <dd>{{ formatCursor(entry.request.cursor) }}</dd>
                </div>
                <div>
                  <dt>Response cursor</dt>
                  <dd>{{ formatCursor(entry.responseCursor) }}</dd>
                </div>
                <div>
                  <dt>Rows</dt>
                  <dd>{{ entry.rowsReturned }}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>{{ entry.time }}</dd>
                </div>
              </dl>
            </KCard>

            <p
              v-if="!fetchHistoryEntries.length"
              class="empty-history"
            >
              Fetch rows to populate history.
            </p>
          </div>
        </KCollapse>
      </section>

      <section class="state-panel-section">
        <KCollapse
          v-model="collapsedSections.headers"
          class="sandbox-section-collapse"
          title="Headers"
          @click.capture="toggleSectionOnHeaderClick('headers', $event)"
        >
          <pre class="debug-output">{{ headers }}</pre>
        </KCollapse>
      </section>
    </aside>
  </div>
</template>

<script setup lang="ts">
import type {
  TableDataGridFetcher,
  TableDataGridHeader,
  TableDataGridInfiniteFetcherParams,
  TableDataGridStatePayload,
} from '../src'
import type { GridApi } from 'ag-grid-community'
import { computed, ref } from 'vue'
import { TableDataGrid } from '../src'

type SandboxRow = {
  id: string
  name: string
  status: string
  latency: number
  region: string
}

type DatasetMode = 'generated' | 'empty'
type SandboxSectionId = 'tableOptions' | 'fetchDebug' | 'headers'

type FetchHistoryEntry = {
  fetchCount: number
  id: string
  request: TableDataGridInfiniteFetcherParams
  responseCursor?: unknown
  rowsReturned: number
  time: string
}

type EventLogEntry = {
  event: string
  payload: unknown
  time: string
}

const defaultPageSize = 25
const defaultFetchDelayMs = 350
const cursorPrefix = 'cursor:'
const cursorPattern = /^cursor:(\d+)$/

const datasetModeOptions: Array<{ label: string, value: DatasetMode }> = [
  { label: 'Generated rows', value: 'generated' },
  { label: 'Empty rows', value: 'empty' },
]
const pageSizeOptions = [10, 25, 50, 100]
const fetchDelayOptions = [0, 150, 350, 800]

const pageSize = ref(defaultPageSize)
const fetchDelayMs = ref(defaultFetchDelayMs)
const datasetMode = ref<DatasetMode>('generated')
const showErrorState = ref(false)
const refreshKey = ref(0)
const tableResetKey = ref(0)
const fetchCount = ref(0)
const lastRequest = ref<TableDataGridInfiniteFetcherParams>()
const lastResponseCursor = ref<unknown>()
const fetchHistory = ref<FetchHistoryEntry[]>([])
const eventLog = ref<EventLogEntry[]>([])
const collapsedSections = ref<Record<SandboxSectionId, boolean>>({
  fetchDebug: false,
  headers: true,
  tableOptions: false,
})

const headers: Array<TableDataGridHeader<SandboxRow>> = [
  { key: 'name', label: 'Name', width: 240 },
  { key: 'status', label: 'Status', width: 140 },
  { key: 'latency', label: 'Latency', width: 140 },
  { key: 'region', label: 'Region', width: 160 },
]

const generatedRows: SandboxRow[] = Array.from({ length: 140 }, (_, index) => {
  const rowNumber = index + 1

  return {
    id: `row-${rowNumber}`,
    latency: 35 + ((index * 29) % 800),
    name: `Service ${rowNumber}`,
    region: ['us', 'eu', 'au', 'me'][index % 4] ?? 'us',
    status: ['Active', 'Deploying', 'Inactive'][index % 3] ?? 'Active',
  }
})

const activeRows = computed<SandboxRow[]>(() => (
  datasetMode.value === 'empty'
    ? []
    : generatedRows
))

const fetchDebug = computed(() => ({
  datasetMode: datasetMode.value,
  fetchCount: fetchCount.value,
  fetchDelayMs: fetchDelayMs.value,
  lastRequest: lastRequest.value,
  lastResponseCursor: lastResponseCursor.value,
  pageSize: pageSize.value,
  refreshKey: refreshKey.value,
  showErrorState: showErrorState.value,
}))

const fetchHistoryEntries = computed(() => [...fetchHistory.value].reverse())

const wait = (delayMs: number) => new Promise(resolve => setTimeout(resolve, delayMs))

const createCursor = (offset: number): string | undefined => (
  offset > 0 ? `${cursorPrefix}${offset}` : undefined
)

const getOffsetFromCursor = (cursor: unknown): number => {
  const [, offset = '0'] = cursorPattern.exec(String(cursor ?? '')) ?? []

  return Number(offset)
}

const formatCursor = (cursor: unknown): string => (
  cursor === undefined ? 'undefined' : String(cursor)
)

const logEvent = (event: string, payload: unknown) => {
  eventLog.value = [
    {
      event,
      payload,
      time: new Date().toLocaleTimeString(),
    },
    ...eventLog.value,
  ].slice(0, 30)
}

const clearFetchHistory = () => {
  fetchCount.value = 0
  lastRequest.value = undefined
  lastResponseCursor.value = undefined
  fetchHistory.value = []
}

const refreshRows = () => {
  clearFetchHistory()
  refreshKey.value += 1
  logEvent('refreshKey:change', { refreshKey: refreshKey.value })
}

const resetSandbox = () => {
  pageSize.value = defaultPageSize
  fetchDelayMs.value = defaultFetchDelayMs
  datasetMode.value = 'generated'
  showErrorState.value = false
  refreshKey.value = 0
  tableResetKey.value += 1
  clearFetchHistory()
  clearEventLog()
}

const clearEventLog = () => {
  eventLog.value = []
}

const recordFetch = ({
  request,
  responseCursor,
  rowsReturned,
}: {
  request: TableDataGridInfiniteFetcherParams
  responseCursor?: unknown
  rowsReturned: number
}) => {
  const nextFetchCount = fetchCount.value + 1
  const entry: FetchHistoryEntry = {
    fetchCount: nextFetchCount,
    id: `fetch-${nextFetchCount}`,
    request,
    responseCursor,
    rowsReturned,
    time: new Date().toLocaleTimeString(),
  }

  fetchCount.value = nextFetchCount
  lastRequest.value = request
  lastResponseCursor.value = responseCursor
  fetchHistory.value = [...fetchHistory.value, entry].slice(-8)
}

const fetchRows: TableDataGridFetcher<SandboxRow> = async ({ pageSize, cursor }) => {
  const request: TableDataGridInfiniteFetcherParams = {
    cursor,
    mode: 'infinite',
    pageSize,
  }

  if (fetchDelayMs.value > 0) {
    await wait(fetchDelayMs.value)
  }

  const offset = getOffsetFromCursor(cursor)
  const data = activeRows.value.slice(offset, offset + pageSize)
  const nextOffset = offset + data.length
  const hasMore = nextOffset < activeRows.value.length
  const responseCursor = hasMore ? createCursor(nextOffset) : undefined

  recordFetch({
    request,
    responseCursor,
    rowsReturned: data.length,
  })

  return {
    cursor: responseCursor,
    data,
    hasMore,
  }
}

const handleState = (payload: TableDataGridStatePayload) => {
  logEvent('state', payload)
}

const handleGridReady = (api: GridApi<SandboxRow>) => {
  logEvent('grid:ready', {
    displayedRows: api.getDisplayedRowCount(),
  })
}

const refreshAfterControlChange = () => {
  refreshRows()
}

const handleDatasetModeChange = (event: Event) => {
  const value = event.target instanceof HTMLSelectElement
    ? event.target.value
    : 'generated'

  datasetMode.value = value === 'empty' ? 'empty' : 'generated'
  refreshAfterControlChange()
}

const handlePageSizeChange = (event: Event) => {
  const value = event.target instanceof HTMLSelectElement
    ? Number(event.target.value)
    : defaultPageSize

  pageSize.value = pageSizeOptions.includes(value) ? value : defaultPageSize
  refreshAfterControlChange()
}

const handleFetchDelayChange = (event: Event) => {
  const value = event.target instanceof HTMLSelectElement
    ? Number(event.target.value)
    : defaultFetchDelayMs

  fetchDelayMs.value = fetchDelayOptions.includes(value) ? value : defaultFetchDelayMs
  logEvent('fetchDelay:change', { fetchDelayMs: fetchDelayMs.value })
}

const toggleSectionOnHeaderClick = (sectionId: SandboxSectionId, event: MouseEvent) => {
  const target = event.target

  if (!(target instanceof Element)) {
    return
  }

  const clickedHeader = target.closest('.collapse-heading')
  const clickedDefaultTrigger = target.closest('.collapse-trigger-content')

  if (!clickedHeader || clickedDefaultTrigger) {
    return
  }

  collapsedSections.value[sectionId] = !collapsedSections.value[sectionId]
}
</script>

<style lang="scss" scoped>
.sandbox {
  display: grid;
  gap: var(--kui-space-70, $kui-space-70);
  grid-template-columns: minmax(0, 1fr) 360px;
  padding: var(--kui-space-70, $kui-space-70);
}

.sandbox-header {
  align-items: center;
  display: flex;
  gap: var(--kui-space-50, $kui-space-50);
  grid-column: 1 / -1;
  justify-content: space-between;

  h1 {
    font-size: 28px;
    margin: 0 0 var(--kui-space-20, $kui-space-20);
  }

  p {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    margin: 0;
  }
}

.sandbox-header-actions,
.sandbox-panel-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: var(--kui-space-30, $kui-space-30);
}

.sandbox-header-actions {
  justify-content: flex-end;
}

.sandbox-main {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-50, $kui-space-50);
  grid-column: 1;
  min-width: 0;
}

.table-section {
  display: flex;
  min-width: 0;

  :deep(.kong-ui-public-table-data-grid) {
    flex: 0 0 760px;
    height: 760px;
    min-height: 0;
  }
}

.event-log-section {
  min-width: 0;

  h2 {
    font-size: 16px;
    margin: 0;
  }
}

.event-log-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--kui-space-30, $kui-space-30);
}

.state-panel {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-50, $kui-space-50);
  grid-column: 2;

  h3 {
    font-size: 14px;
    margin: var(--kui-space-40, $kui-space-40) 0 var(--kui-space-30, $kui-space-30);
  }
}

.sandbox-section-collapse {
  :deep(.collapse-heading) {
    cursor: pointer;
  }
}

.control-grid {
  display: grid;
  gap: var(--kui-space-40, $kui-space-40);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.control-grid,
.toggle-list {
  label {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    display: flex;
    flex-direction: column;
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    gap: var(--kui-space-20, $kui-space-20);
  }
}

.control-grid {
  select {
    border: 1px solid var(--kui-color-border, $kui-color-border);
    border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
    color: var(--kui-color-text, $kui-color-text);
    min-height: 32px;
    min-width: 0;
    padding: 0 var(--kui-space-30, $kui-space-30);
    width: 100%;
  }
}

.toggle-list {
  display: grid;
  gap: var(--kui-space-30, $kui-space-30);
  margin-top: var(--kui-space-40, $kui-space-40);

  label {
    align-items: center;
    color: var(--kui-color-text, $kui-color-text);
    flex-direction: row;
  }
}

.sandbox-panel-actions {
  margin-top: var(--kui-space-40, $kui-space-40);
}

.debug-output {
  background: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
  border: 1px solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  font-size: 12px;
  margin: 0;
  max-height: 340px;
  overflow: auto;
  padding: var(--kui-space-40, $kui-space-40);
  white-space: pre-wrap;
}

.event-log-output {
  max-height: 300px;
}

.fetch-history-list {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-30, $kui-space-30);
  max-height: 420px;
  overflow: auto;
  padding-right: var(--kui-space-20, $kui-space-20);
}

.fetch-history-card {
  :deep(.k-card-content) {
    padding: var(--kui-space-40, $kui-space-40);
  }
}

.fetch-history-summary {
  display: grid;
  gap: var(--kui-space-30, $kui-space-30);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;

  div {
    min-width: 0;
  }

  dt {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
  }

  dd {
    color: var(--kui-color-text, $kui-color-text);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    margin: var(--kui-space-10, $kui-space-10) 0 0;
    overflow-wrap: anywhere;
  }
}

.empty-history {
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  margin: 0;
}

@media (max-width: 980px) {
  .sandbox {
    grid-template-columns: minmax(0, 1fr);
  }

  .sandbox-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .sandbox-header-actions {
    justify-content: flex-start;
  }

  .state-panel {
    grid-column: 1;
  }
}
</style>
