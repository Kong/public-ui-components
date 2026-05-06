<template>
  <div class="sandbox">
    <header class="sandbox-header">
      <div>
        <h1>Analytics Datatable</h1>
        <p>Interactive mock-data playground for pagination, infinite loading, slots, selection, and table config state.</p>
      </div>
      <KSegmentedControl
        v-model="mode"
        :options="modeOptions"
      />
    </header>

    <main class="sandbox-main">
      <section class="table-section">
        <AnalyticsDatatable
          v-model:filter-selection="filterSelection"
          :error="showErrorState"
          :fetcher="fetchRows"
          :headers="headers"
          :hide-toolbar="hideToolbar"
          :loading="showLoadingState"
          :mode="mode"
          row-key="id"
          :row-selection="rowSelection"
          :table-config="tableConfig"
          @cell:click="handleCellClick"
          @row:click="handleRowClick"
          @row:select="handleRowSelect"
          @sort="logEvent('sort', $event)"
          @update:table-config="handleTableConfigUpdate"
        >
          <template #bulk-action-items="{ selectedRows: bulkRows }">
            <KDropdownItem
              class="bulk-delete-item"
              data-testid="sandbox-bulk-delete"
              @click="logEvent('bulk:delete', summarizeRows(bulkRows))"
            >
              Delete ({{ bulkRows.length }} items)
            </KDropdownItem>
          </template>

          <template #status="{ row }">
            <KBadge :appearance="row.status >= 500 ? 'danger' : 'success'">
              {{ row.status }}
            </KBadge>
          </template>

          <template #route="{ row }">
            <code>{{ row.route }}</code>
          </template>

          <template #latency="{ row }">
            <span :class="{ slow: row.latency > 500 }">{{ row.latency }} ms</span>
          </template>
        </AnalyticsDatatable>
      </section>

      <section class="event-log-section">
        <div class="event-log-header">
          <h2>Event log</h2>
          <KButton
            appearance="tertiary"
            :disabled="!eventLog.length"
            size="small"
            @click="eventLog = []"
          >
            Clear log
          </KButton>
        </div>

        <pre class="debug-output event-log-output">{{ eventLog.length ? eventLog : 'Interact with the table to see emitted events.' }}</pre>
      </section>
    </main>

    <aside class="state-panel">
      <section>
        <h2>Table options</h2>
        <div class="control-grid">
          <label>
            Row selection
            <select v-model="rowSelection">
              <option value="none">None</option>
              <option value="single">Single</option>
              <option value="multiple">Multiple</option>
            </select>
          </label>

          <label>
            Page size
            <select v-model.number="selectedPageSize">
              <option
                v-for="size in pageSizeOptions"
                :key="size"
                :value="size"
              >
                {{ size }}
              </option>
            </select>
          </label>
        </div>

        <div class="toggle-list">
          <label>
            <input
              v-model="hideToolbar"
              type="checkbox"
            >
            Hide toolbar
          </label>
          <label>
            <input
              v-model="showLoadingState"
              type="checkbox"
            >
            Loading state
          </label>
          <label>
            <input
              v-model="showErrorState"
              type="checkbox"
            >
            Error state
          </label>
        </div>
      </section>

      <section>
        <h2>Column settings</h2>
        <div class="column-settings">
          <article
            v-for="column in columnSettings"
            :key="column.key"
            class="column-setting"
          >
            <div class="column-setting-header">
              <strong>{{ column.label }}</strong>
              <label>
                Visible
                <input
                  :checked="tableConfig.columnVisibility?.[column.key] ?? true"
                  type="checkbox"
                  @change="setColumnVisibility(column.key, ($event.target as HTMLInputElement).checked)"
                >
              </label>
            </div>

            <div class="control-grid">
              <label>
                Pinned
                <select
                  :value="tableConfig.pinnedColumns?.[column.key] || 'none'"
                  @change="setPinnedColumn(column.key, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="none">None</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </label>
            </div>

            <div class="toggle-list compact">
              <label>
                <input
                  v-model="column.sortable"
                  type="checkbox"
                >
                Sortable
              </label>
              <label>
                <input
                  v-model="column.resizable"
                  type="checkbox"
                >
                Resizable
              </label>
              <label>
                <input
                  v-model="column.draggable"
                  type="checkbox"
                >
                Draggable
              </label>
              <label>
                <input
                  v-model="column.hideable"
                  type="checkbox"
                >
                Hideable
              </label>
              <label>
                <input
                  v-model="column.hideLabel"
                  type="checkbox"
                >
                Hide label
              </label>
            </div>
          </article>
        </div>

        <KButton
          appearance="tertiary"
          size="small"
          @click="resetTableState"
        >
          Reset table state
        </KButton>
      </section>

      <section
        v-for="section in debugSections"
        :key="section.title"
      >
        <h2>{{ section.title }}</h2>
        <pre class="debug-output">{{ section.value }}</pre>
      </section>
    </aside>
  </div>
</template>

<script setup lang="ts">
import type {
  AnalyticsDatatableConfig,
  AnalyticsDatatableFetcherParams,
  AnalyticsDatatableFetcherResult,
  AnalyticsDatatableHeader,
  AnalyticsDatatableMode,
  AnalyticsDatatablePinnedState,
  AnalyticsDatatableRowSelectionMode,
} from '../src'
import type { FilterGroupSelection } from '@kong/kongponents'
import { computed, ref, watch } from 'vue'
import { AnalyticsDatatable } from '../src'
import { createDefaultAnalyticsDatatableConfig } from '../src/utils/tableConfig'

type MockRow = {
  id: string
  service: string
  route: string
  method: string
  status: number
  latency: number
  region: string
}

const mode = ref<AnalyticsDatatableMode>('pagination')
const rowSelection = ref<AnalyticsDatatableRowSelectionMode>('multiple')
const hideToolbar = ref(false)
const showLoadingState = ref(false)
const showErrorState = ref(false)
const selectedRows = ref<MockRow[]>([])
const filterSelection = ref<FilterGroupSelection>()
const lastRowClick = ref<MockRow>()
const eventLog = ref<Array<{
  event: string
  payload: any
  time: string
}>>([])
const fetchCount = ref(0)
const lastRequest = ref<AnalyticsDatatableFetcherParams>()
const lastResponseCursor = ref<any>()
const fetchHistory = ref<Array<{
  request: AnalyticsDatatableFetcherParams
  responseCursor?: any
}>>([])

const modeOptions = [
  { label: 'Pagination', value: 'pagination' },
  { label: 'Infinite', value: 'infinite' },
]
const pageSizeOptions = [10, 15, 25, 50, 100]
const defaultPageSize = 15
const isPinnedColumnValue = (value: string): value is Exclude<AnalyticsDatatablePinnedState, false> => (
  value === 'left' || value === 'right'
)

const createDefaultColumnSettings = (): Array<AnalyticsDatatableHeader<MockRow>> => {
  const columns: Array<AnalyticsDatatableHeader<MockRow>> = [
    { key: 'service', label: 'Service', sortable: true, pinned: 'left', hideable: false, width: 180 },
    { key: 'route', label: 'Route', sortable: true, width: 260 },
    {
      key: 'method',
      label: 'Method',
      sortable: true,
      width: 120,
      filter: {
        label: 'Method',
        options: ['GET', 'POST', 'PUT', 'DELETE'].map(method => ({ label: method, value: method })),
        pinned: true,
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: 120,
      filter: {
        label: 'Status',
        multiple: true,
        options: ['200', '201', '204', '400', '404', '429', '500'].map(status => ({ label: status, value: status })),
      },
    },
    { key: 'latency', label: 'Latency', sortable: true, width: 140 },
    {
      key: 'region',
      label: 'Region',
      sortable: true,
      width: 140,
      tooltip: 'Region',
      filter: {
        label: 'Region',
        options: [
          { label: 'United States', value: 'us' },
          { label: 'Europe', value: 'eu' },
          { label: 'Australia', value: 'au' },
          { label: 'Middle East', value: 'me' },
        ],
      },
    },
  ]

  return columns.map(column => ({
    draggable: true,
    hideable: true,
    resizable: true,
    ...column,
  }))
}

const createDefaultTableConfig = (): AnalyticsDatatableConfig => {
  const columns = createDefaultColumnSettings()

  return {
    ...createDefaultAnalyticsDatatableConfig({
      headers: columns,
      pageSize: defaultPageSize,
    }),
    pinnedColumns: columns.reduce<Record<string, AnalyticsDatatablePinnedState>>((pinnedColumns, column) => {
      if (column.pinned) {
        pinnedColumns[column.key] = column.pinned
      }
      return pinnedColumns
    }, {}),
  }
}

const tableConfig = ref<AnalyticsDatatableConfig>(createDefaultTableConfig())
const columnSettings = ref<Array<AnalyticsDatatableHeader<MockRow>>>(createDefaultColumnSettings())
const selectedPageSize = computed({
  get: () => tableConfig.value.pageSize ?? defaultPageSize,
  set: (pageSize: number) => {
    tableConfig.value = {
      ...tableConfig.value,
      pageSize,
    }
  },
})

const headers = computed<Array<AnalyticsDatatableHeader<MockRow>>>(() => columnSettings.value.map(column => ({ ...column })))

const mockRows = Array.from({ length: 130 }, (_, index): MockRow => {
  const status = [200, 201, 204, 400, 404, 429, 500][index % 7] ?? 200

  return {
    id: `request-${index + 1}`,
    service: `gateway-service-${(index % 8) + 1}`,
    route: `/api/v${(index % 3) + 1}/resource/${index + 1}`,
    method: ['GET', 'POST', 'PUT', 'DELETE'][index % 4] ?? 'GET',
    status,
    latency: 40 + ((index * 37) % 900),
    region: ['us', 'eu', 'au', 'me'][index % 4] ?? 'us',
  }
})

const applySort = (rows: MockRow[], sort: AnalyticsDatatableConfig['sort']) => {
  if (!sort) {
    return rows
  }

  return [...rows].sort((a, b) => {
    const left = a[sort.key as keyof MockRow]
    const right = b[sort.key as keyof MockRow]
    const result = typeof left === 'number' && typeof right === 'number'
      ? left - right
      : String(left).localeCompare(String(right))

    return sort.order === 'asc' ? result : -result
  })
}

const applyFilters = (rows: MockRow[], selection: FilterGroupSelection | undefined) => {
  const activeFilters = Object.entries(selection ?? {}).filter((entry): entry is [keyof MockRow, NonNullable<FilterGroupSelection[string]>] => Boolean(entry[1]))

  if (!activeFilters.length) {
    return rows
  }

  return rows.filter(row => activeFilters.every(([key, filter]) => {
    const rowValue = String(row[key])
    const selectedValues = Array.isArray(filter.value) ? filter.value : [filter.value]
    return selectedValues.includes(rowValue)
  }))
}

const recordFetch = ({
  request,
  responseCursor,
}: {
  request: AnalyticsDatatableFetcherParams
  responseCursor?: any
}) => {
  lastResponseCursor.value = responseCursor
  fetchHistory.value = [
    ...fetchHistory.value,
    {
      request,
      responseCursor,
    },
  ].slice(-5)
}

const fetchRows = async ({
  mode: fetchMode,
  page = 1,
  pageSize,
  startRow = 0,
  cursor,
  sort,
  search,
  filterSelection: requestFilterSelection,
}: AnalyticsDatatableFetcherParams): Promise<AnalyticsDatatableFetcherResult<MockRow>> => {
  const request = {
    mode: fetchMode,
    page,
    pageSize,
    startRow,
    cursor,
    sort,
    search,
    filterSelection: requestFilterSelection,
  }
  fetchCount.value += 1
  lastRequest.value = request

  await new Promise(resolve => setTimeout(resolve, 250))

  const rows = applySort(applyFilters(mockRows, requestFilterSelection), sort)

  if (fetchMode === 'infinite') {
    const offset = typeof cursor === 'number' ? cursor : 0
    const data = rows.slice(offset, offset + pageSize)
    const nextCursor = offset + data.length
    recordFetch({ request, responseCursor: nextCursor })

    return {
      data,
      cursor: nextCursor,
      hasMore: offset + data.length < rows.length,
    }
  }

  const offset = (page - 1) * pageSize
  recordFetch({ request })

  return {
    data: rows.slice(offset, offset + pageSize),
    total: rows.length,
  }
}

const fetchDebug = computed(() => ({
  mode: mode.value,
  fetchCount: fetchCount.value,
  request: lastRequest.value,
  responseCursor: lastResponseCursor.value,
  history: fetchHistory.value,
}))

const debugSections = computed(() => [
  {
    title: 'Last row click event',
    value: lastRowClick.value ?? 'Click a row',
  },
  {
    title: 'Selected rows',
    value: selectedRows.value.length ? selectedRows.value : 'No selected rows',
  },
  {
    title: 'Fetch debug',
    value: fetchDebug.value,
  },
  {
    title: 'tableConfig',
    value: tableConfig.value,
  },
  {
    title: 'filterSelection',
    value: filterSelection.value ?? {},
  },
])

const summarizeRows = (rows: MockRow[]) => rows.map(row => ({
  id: row.id,
  service: row.service,
  route: row.route,
}))

const logEvent = (event: string, payload: any) => {
  eventLog.value = [
    {
      event,
      payload,
      time: new Date().toLocaleTimeString(),
    },
    ...eventLog.value,
  ].slice(0, 25)
}

const handleRowClick = (row: MockRow) => {
  lastRowClick.value = row
  logEvent('row:click', {
    id: row.id,
    service: row.service,
    route: row.route,
  })
}

const handleRowSelect = (rows: MockRow[]) => {
  selectedRows.value = rows
  logEvent('row:select', summarizeRows(rows))
}

const handleTableConfigUpdate = (config: AnalyticsDatatableConfig) => {
  tableConfig.value = config
  logEvent('update:table-config', config)
}

const handleCellClick = ({ row, columnKey, value }: { row: MockRow, columnKey: string, value: any }) => {
  logEvent('cell:click', {
    columnKey,
    rowId: row.id,
    value,
  })
}

const setColumnVisibility = (key: string, visible: boolean) => {
  tableConfig.value = {
    ...tableConfig.value,
    columnVisibility: {
      ...tableConfig.value.columnVisibility,
      [key]: visible,
    },
  }
}

const setPinnedColumn = (key: string, value: string) => {
  tableConfig.value = {
    ...tableConfig.value,
    pinnedColumns: {
      ...tableConfig.value.pinnedColumns,
      [key]: isPinnedColumnValue(value) ? value : false,
    },
  }
}

const resetTableState = () => {
  tableConfig.value = createDefaultTableConfig()
  columnSettings.value = createDefaultColumnSettings()
  selectedRows.value = []
  filterSelection.value = undefined
  lastRowClick.value = undefined
  eventLog.value = []
}

watch(rowSelection, (nextSelection) => {
  if (nextSelection === 'none') {
    selectedRows.value = []
  }
})
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

.sandbox-main {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-50, $kui-space-50);
  grid-column: 1;
  grid-row: 2;
  min-width: 0;
}

.table-section {
  height: 800px;
  min-width: 0;
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
  grid-row: 2;

  h2 {
    font-size: 16px;
    margin: 0 0 var(--kui-space-30, $kui-space-30);
  }
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
  input,
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

  &.compact {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-top: var(--kui-space-30, $kui-space-30);
  }
}

.column-settings {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);
  margin-bottom: var(--kui-space-40, $kui-space-40);
  max-height: 520px;
  overflow: auto;
  padding-right: var(--kui-space-20, $kui-space-20);
}

.column-setting {
  border: 1px solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  padding: var(--kui-space-40, $kui-space-40);
}

.column-setting-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--kui-space-40, $kui-space-40);

  strong {
    color: var(--kui-color-text, $kui-color-text);
  }

  label {
    align-items: center;
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    display: flex;
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    gap: var(--kui-space-20, $kui-space-20);
  }
}

.bulk-delete-item {
  color: var(--kui-color-text-danger, $kui-color-text-danger);
}

.slow {
  color: var(--kui-color-text-danger, $kui-color-text-danger);
  font-weight: 600;
}
</style>
