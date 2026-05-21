<!-- fallow-ignore-file unused-file -->
<template>
  <div class="sandbox">
    <header class="sandbox-header">
      <div>
        <h1>Analytics Datatable</h1>
        <p>Interactive mock-data playground for pagination, infinite loading, slots, selection, and table config state.</p>
      </div>
      <div class="sandbox-header-actions">
        <KButton
          appearance="secondary"
          @click="addWideColumn"
        >
          Add column
        </KButton>
        <KButton
          appearance="primary"
          @click="resetTableState"
        >
          Reset table state
        </KButton>
        <KSegmentedControl
          v-model="mode"
          :options="modeOptions"
        />
      </div>
    </header>

    <main class="sandbox-main">
      <section class="table-section">
        <div
          id="analytics-datatable-sandbox-outside-actions"
          class="sandbox-outside-actions-target"
        />
        <div class="sandbox-outside-controls">
          <div
            id="analytics-datatable-sandbox-outside-search"
            class="sandbox-outside-control-target"
          />
          <div
            id="analytics-datatable-sandbox-outside-filters"
            class="sandbox-outside-control-target"
          />
        </div>

        <AnalyticsDatatable
          :key="datatableResetKey"
          ref="datatable"
          v-model:filter-selection="filterSelection"
          :cell-attrs="getCellAttrs"
          :enable-search="enableSearch"
          :error="showErrorState"
          :fetcher="fetchRows"
          :headers="headers"
          :hide-bulk-actions="hideToolbarBuiltIns"
          :hide-column-visibility="hideColumnVisibility"
          :hide-toolbar="shouldHideToolbar"
          :loading="showLoadingState"
          :mode="mode"
          :outside-filters="outsideFiltersTarget"
          :outside-search="outsideSearchTarget"
          :row-attrs="getRowAttrs"
          row-key="id"
          :row-selection="rowSelection"
          :table-config="tableConfig"
          @cell:click="handleCellClick"
          @filter:apply="handleFilterApply"
          @filter:clear="handleFilterClear"
          @filter:close="logEvent('filter:close', $event)"
          @filter:open="logEvent('filter:open', $event)"
          @row:click="handleRowClick"
          @row:select="handleRowSelect"
          @sort="logEvent('sort', $event)"
          @state="logEvent('state', $event)"
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

          <template
            v-if="toolbarSlotMode === 'custom'"
            #toolbar="{ filterSelection: toolbarFilterSelection, selectedRows: toolbarSelectedRows }"
          >
            <div class="sandbox-custom-toolbar">
              <div class="sandbox-custom-toolbar-status">
                <KBadge appearance="info">
                  {{ toolbarSelectedRows.length }} selected
                </KBadge>
                <KBadge appearance="neutral">
                  {{ countActiveFilters(toolbarFilterSelection) }} filters
                </KBadge>
              </div>

              <div class="sandbox-custom-toolbar-actions">
                <KButton
                  appearance="secondary"
                  size="small"
                  @click="datatable?.refresh()"
                >
                  Refresh
                </KButton>
                <KButton
                  appearance="tertiary"
                  size="small"
                  @click="logEvent('toolbar:custom-action', summarizeRows(toolbarSelectedRows))"
                >
                  Custom action
                </KButton>
              </div>
            </div>
          </template>

          <template
            v-if="toolbarSlotMode === 'composed'"
            #toolbar-left="{ selectedRows: toolbarSelectedRows }"
          >
            <KButton
              appearance="secondary"
              size="small"
              @click="logEvent('toolbar:left-action', summarizeRows(toolbarSelectedRows))"
            >
              Left slot ({{ toolbarSelectedRows.length }})
            </KButton>
          </template>

          <template
            v-if="toolbarSlotMode === 'composed'"
            #toolbar-right="{ filterSelection: toolbarFilterSelection }"
          >
            <div class="sandbox-toolbar-right-slot">
              <KBadge appearance="info">
                {{ countActiveFilters(toolbarFilterSelection) }} filters
              </KBadge>
              <KButton
                appearance="tertiary"
                size="small"
                @click="datatable?.refresh()"
              >
                Refresh
              </KButton>
            </div>
          </template>

          <template
            v-if="usesOutsideActions"
            #outside-actions="{
              refresh,
              selectedRows: toolbarSelectedRows,
            }"
          >
            <Teleport to="#analytics-datatable-sandbox-outside-actions">
              <div class="sandbox-outside-actions">
                <KBadge appearance="info">
                  {{ toolbarSelectedRows.length }} selected
                </KBadge>

                <KButton
                  appearance="secondary"
                  size="small"
                  @click="refresh"
                >
                  Refresh
                </KButton>
              </div>
            </Teleport>
          </template>

          <template
            v-if="toolbarSlotMode === 'custom-filter'"
            #filter-method
          >
            <div
              class="sandbox-method-filter"
              data-testid="sandbox-method-filter"
            >
              <div class="sandbox-method-filter-heading">
                <strong>Custom Method filter slot</strong>
                <span>{{ selectedCustomMethod }} selected</span>
              </div>

              <div class="sandbox-method-filter-options">
                <KButton
                  v-for="method in methodFilterValues"
                  :key="method"
                  :appearance="selectedCustomMethod === method ? 'primary' : 'secondary'"
                  size="small"
                  @click="selectedCustomMethod = method"
                >
                  {{ method }}
                </KButton>
              </div>
            </div>
          </template>

          <template #status="{ row }">
            <KBadge :appearance="row.status >= 500 ? 'danger' : 'success'">
              {{ row.status }}
            </KBadge>
          </template>

          <template #route="{ row }">
            <code>{{ row.route }}</code>
          </template>

          <template #asyncValue="{ refreshCell: refreshAsyncCell, row }">
            <AsyncValueCell
              :refresh-cell="refreshAsyncCell"
              :row-id="row.id"
            />
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
      <section class="state-panel-section">
        <KCollapse
          v-model="collapsedSandboxSections.tableOptions"
          class="sandbox-section-collapse"
          title="Table options"
          @click.capture="toggleSandboxSectionOnHeaderClick('tableOptions', $event)"
        >
          <div class="control-grid">
            <KSelect
              v-model="rowSelection"
              :items="rowSelectionOptions"
              label="Row selection"
            />

            <KSelect
              v-model="selectedPageSize"
              :items="pageSizeSelectItems"
              label="Page size"
            />

            <KSelect
              v-model="toolbarSlotMode"
              :items="toolbarSlotModeOptions"
              label="Toolbar slots"
            />
          </div>

          <div class="toggle-list">
            <KCheckbox
              v-model="enableSearch"
              label="Enable search"
            />
            <KCheckbox
              v-model="hideToolbar"
              label="Hide toolbar"
            />
            <KCheckbox
              v-model="hideColumnVisibility"
              label="Hide column visibility"
            />
            <KCheckbox
              v-model="showLoadingState"
              label="Loading state"
            />
            <KCheckbox
              v-model="showErrorState"
              label="Error state"
            />
          </div>
        </KCollapse>
      </section>

      <section class="state-panel-section">
        <KCollapse
          v-model="collapsedSandboxSections.columnSettings"
          class="sandbox-section-collapse"
          title="Column settings"
          @click.capture="toggleSandboxSectionOnHeaderClick('columnSettings', $event)"
        >
          <div class="column-settings">
            <article
              v-for="column in columnSettings"
              :key="column.key"
              class="column-setting"
            >
              <div class="column-setting-header">
                <strong>{{ column.label }}</strong>
                <KCheckbox
                  label="Visible"
                  :model-value="tableConfig.columnVisibility?.[column.key] ?? true"
                  @update:model-value="setColumnVisibility(column.key, $event)"
                />
              </div>

              <div class="control-grid">
                <KSelect
                  :items="pinnedColumnOptions"
                  label="Pinned"
                  :model-value="tableConfig.pinnedColumns?.[column.key] || 'none'"
                  @update:model-value="setPinnedColumn(column.key, $event)"
                />
              </div>

              <div class="toggle-list compact">
                <KCheckbox
                  v-model="column.sortable"
                  label="Sortable"
                />
                <KCheckbox
                  v-model="column.resizable"
                  label="Resizable"
                />
                <KCheckbox
                  v-model="column.draggable"
                  label="Draggable"
                />
                <KCheckbox
                  v-model="column.hideable"
                  label="Hideable"
                />
                <KCheckbox
                  v-model="column.hideLabel"
                  label="Hide label"
                />
              </div>
            </article>
          </div>
        </KCollapse>
      </section>

      <section
        v-for="section in debugSections"
        :key="section.id"
        class="state-panel-section"
      >
        <KCollapse
          v-model="collapsedSandboxSections[section.id]"
          class="sandbox-section-collapse"
          :title="section.title"
          @click.capture="toggleSandboxSectionOnHeaderClick(section.id, $event)"
        >
          <pre class="debug-output">{{ section.value }}</pre>

          <template v-if="section.id === 'fetchDebug'">
            <h3>Fetch history</h3>
            <div class="fetch-history-list">
              <KCard
                v-for="entry in fetchHistoryEntries"
                :key="entry.id"
                class="fetch-history-card"
              >
                <KCollapse
                  v-model="collapsedFetchHistoryItems[entry.id]"
                  :title="entry.title"
                >
                  <dl class="fetch-history-summary">
                    <div>
                      <dt>Mode</dt>
                      <dd>{{ entry.request.mode }}</dd>
                    </div>
                    <div>
                      <dt>Page size</dt>
                      <dd>{{ entry.request.pageSize }}</dd>
                    </div>
                    <div>
                      <dt>Time</dt>
                      <dd>{{ entry.time }}</dd>
                    </div>
                    <div v-if="entry.responseCursor !== undefined">
                      <dt>Response cursor</dt>
                      <dd>{{ entry.responseCursor }}</dd>
                    </div>
                  </dl>

                  <h4>Request</h4>
                  <pre class="debug-output fetch-history-json">{{ formatDebugJson(entry.request) }}</pre>
                </KCollapse>
              </KCard>

              <p
                v-if="!fetchHistoryEntries.length"
                class="empty-history"
              >
                Fetch the table to populate history.
              </p>
            </div>
          </template>
        </KCollapse>
      </section>
    </aside>
  </div>
</template>

<script setup lang="ts">
import type {
  AnalyticsDatatableConfig,
  AnalyticsDatatableCellAttrs,
  AnalyticsDatatableFetcherParams,
  AnalyticsDatatableFetcherResult,
  AnalyticsDatatableHeader,
  AnalyticsDatatableMode,
  AnalyticsDatatablePinnedState,
  AnalyticsDatatableRowAttrs,
  AnalyticsDatatableRowSelectionMode,
} from '../src'
import type { FilterGroupSelection } from '@kong/kongponents'
import type { PropType } from 'vue'
import { computed, defineComponent, h, nextTick, onBeforeUnmount, ref, resolveComponent, watch } from 'vue'
import { AnalyticsDatatable } from '../src'
import { createDefaultAnalyticsDatatableConfig } from '../src/utils/tableConfig'

type MockRow = {
  [key: string]: number | string
  id: string
  service: string
  route: string
  method: string
  status: number
  latency: number
  region: string
}

type DatatableExposed = {
  refresh: () => void
}

type MethodFilterValue = 'GET' | 'POST' | 'PUT' | 'DELETE'
type ToolbarSlotMode = 'default' | 'composed' | 'custom' | 'custom-filter' | 'outside' | 'outside-filters' | 'outside-search'
type SandboxSectionId = 'tableOptions' | 'columnSettings' | 'lastRowClick' | 'selectedRows' | 'fetchDebug' | 'tableConfig' | 'headers' | 'filterSelection'

type DebugSection = {
  id: SandboxSectionId
  title: string
  value: unknown
}

const createDefaultCollapsedSandboxSections = (): Record<SandboxSectionId, boolean> => ({
  columnSettings: true,
  fetchDebug: true,
  filterSelection: true,
  headers: true,
  lastRowClick: true,
  selectedRows: true,
  tableConfig: true,
  tableOptions: false,
})

const mode = ref<AnalyticsDatatableMode>('pagination')
const rowSelection = ref<AnalyticsDatatableRowSelectionMode>('multiple')
const enableSearch = ref(true)
const hideToolbar = ref(false)
const hideColumnVisibility = ref(false)
const toolbarSlotMode = ref<ToolbarSlotMode>('default')
const showLoadingState = ref(false)
const showErrorState = ref(false)
const selectedRows = ref<MockRow[]>([])
const filterSelection = ref<FilterGroupSelection>()
const selectedCustomMethod = ref<MethodFilterValue>('GET')
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
  fetchCount: number
  id: string
  request: AnalyticsDatatableFetcherParams
  responseCursor?: any
  title: string
  time: string
}>>([])
const collapsedSandboxSections = ref<Record<SandboxSectionId, boolean>>(createDefaultCollapsedSandboxSections())
const collapsedFetchHistoryItems = ref<Record<string, boolean>>({})

const modeOptions = [
  { label: 'Pagination', value: 'pagination' },
  { label: 'Infinite', value: 'infinite' },
]
const rowSelectionOptions: Array<{ label: string, value: AnalyticsDatatableRowSelectionMode }> = [
  { label: 'None', value: 'none' },
  { label: 'Single', value: 'single' },
  { label: 'Multiple', value: 'multiple' },
]
const pageSizeOptions = [10, 15, 25, 50, 100]
const pageSizeSelectItems = pageSizeOptions.map(size => ({
  label: String(size),
  value: size,
}))
const methodFilterValues: MethodFilterValue[] = ['GET', 'POST', 'PUT', 'DELETE']
const toolbarSlotModeOptions: Array<{ label: string, value: ToolbarSlotMode }> = [
  { label: 'Default', value: 'default' },
  { label: 'Left/right slots', value: 'composed' },
  { label: 'Custom toolbar', value: 'custom' },
  { label: 'Custom filter slot', value: 'custom-filter' },
  { label: 'Outside actions', value: 'outside' },
  { label: 'Filters outside', value: 'outside-filters' },
  { label: 'Search outside', value: 'outside-search' },
]
const pinnedColumnOptions = [
  { label: 'None', value: 'none' },
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
]
const defaultPageSize = 15
const asyncColumnKey = 'asyncValue'
const asyncResolveDelayMs = 800
const fetchHistoryModeLabels: Record<AnalyticsDatatableMode, string> = {
  infinite: 'Infinite',
  pagination: 'Pagination',
}
const generatedColumnKeyPrefix = 'demoColumn'
const generatedColumnWidth = 640
const isPinnedColumnValue = (value: string): value is Exclude<AnalyticsDatatablePinnedState, false> => (
  value === 'left' || value === 'right'
)

const createGeneratedColumnKey = (index: number) => `${generatedColumnKeyPrefix}${index}`
const asyncValues = ref<Record<string, string>>({})
const asyncResolveTimers = new Map<string, ReturnType<typeof setTimeout>>()
const asyncCellRefreshCallbacks = new Map<string, Set<() => void>>()

const registerAsyncCellRefresh = (rowId: string, refreshCell: () => void) => {
  const refreshCallbacks = asyncCellRefreshCallbacks.get(rowId) ?? new Set<() => void>()
  refreshCallbacks.add(refreshCell)
  asyncCellRefreshCallbacks.set(rowId, refreshCallbacks)

  return () => {
    refreshCallbacks.delete(refreshCell)
    if (!refreshCallbacks.size) {
      asyncCellRefreshCallbacks.delete(rowId)
    }
  }
}

const refreshAsyncCells = (rowId: string) => {
  asyncCellRefreshCallbacks.get(rowId)?.forEach(refreshCell => refreshCell())
}

const clearAsyncResolveTimers = () => {
  asyncResolveTimers.forEach(timer => clearTimeout(timer))
  asyncResolveTimers.clear()
}

const scheduleAsyncValues = (rows: MockRow[]) => {
  const nextAsyncValues = { ...asyncValues.value }

  rows.forEach((row) => {
    const existingTimer = asyncResolveTimers.get(row.id)
    if (existingTimer) {
      clearTimeout(existingTimer)
      asyncResolveTimers.delete(row.id)
    }
    delete nextAsyncValues[row.id]
  })

  asyncValues.value = nextAsyncValues
  rows.forEach((row) => {
    const timer = setTimeout(() => {
      asyncValues.value = {
        ...asyncValues.value,
        [row.id]: `Resolved value for ${row.id}`,
      }
      refreshAsyncCells(row.id)
      asyncResolveTimers.delete(row.id)
    }, asyncResolveDelayMs)

    asyncResolveTimers.set(row.id, timer)
  })
}

const AsyncValueCell = defineComponent({
  name: 'AsyncValueCell',
  props: {
    refreshCell: {
      required: true,
      type: Function as PropType<() => void>,
    },
    rowId: {
      required: true,
      type: String,
    },
  },
  setup(props) {
    const value = computed(() => asyncValues.value[props.rowId])
    let unregisterRefreshCell = registerAsyncCellRefresh(props.rowId, props.refreshCell)

    watch(() => props.rowId, (rowId) => {
      unregisterRefreshCell()
      unregisterRefreshCell = registerAsyncCellRefresh(rowId, props.refreshCell)
    })

    onBeforeUnmount(() => {
      unregisterRefreshCell()
    })

    return () => value.value
      ? h('span', { class: 'async-value' }, value.value)
      : h(resolveComponent('KSkeleton'), { type: 'spinner' })
  },
})

const createDefaultColumnSettings = (): Array<AnalyticsDatatableHeader<MockRow>> => {
  const columns: Array<AnalyticsDatatableHeader<MockRow>> = [
    { key: 'service', label: 'Service', sortable: true, pinned: 'left', width: 180 },
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
      key: asyncColumnKey,
      label: 'Async value',
      minWidth: 180,
      tooltip: 'Simulates row-level async cell data',
      width: 180,
    },
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
const addedColumnCount = ref(0)
const datatableResetKey = ref(0)
const datatable = ref<DatatableExposed>()
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
const hideToolbarBuiltIns = computed(() => toolbarSlotMode.value === 'custom')
const usesOutsideActions = computed(() => toolbarSlotMode.value === 'outside')
const shouldHideToolbar = computed(() => hideToolbar.value || toolbarSlotMode.value === 'outside')
const outsideFiltersTarget = computed(() => toolbarSlotMode.value === 'outside-filters'
  ? '#analytics-datatable-sandbox-outside-filters'
  : undefined)
const outsideSearchTarget = computed(() => toolbarSlotMode.value === 'outside-search'
  ? '#analytics-datatable-sandbox-outside-search'
  : undefined)

const createGeneratedColumn = (index: number): AnalyticsDatatableHeader<MockRow> => ({
  draggable: true,
  hideable: true,
  key: createGeneratedColumnKey(index),
  label: `Demo column ${index}`,
  resizable: true,
  sortable: true,
  tooltip: 'Generated sandbox column with an initial wide width',
  width: generatedColumnWidth,
})

const addWideColumn = async () => {
  const nextIndex = addedColumnCount.value + 1
  const column = createGeneratedColumn(nextIndex)

  addedColumnCount.value = nextIndex
  columnSettings.value = [
    ...columnSettings.value,
    column,
  ]
  tableConfig.value = {
    ...tableConfig.value,
    columnOrder: [
      ...(tableConfig.value.columnOrder ?? []),
      column.key,
    ],
    columnVisibility: {
      ...tableConfig.value.columnVisibility,
      [column.key]: true,
    },
    columnWidths: {
      ...tableConfig.value.columnWidths,
      [column.key]: generatedColumnWidth,
    },
    pinnedColumns: {
      ...tableConfig.value.pinnedColumns,
      [column.key]: false,
    },
  }

  await nextTick()
  datatable.value?.refresh()
}

const mockRows = Array.from({ length: 130 }, (_, index): MockRow => {
  const status = [200, 201, 204, 400, 404, 429, 500][index % 7] ?? 200

  return {
    id: `request-${index + 1}`,
    service: `row-${index}`,
    route: `/api/v${(index % 3) + 1}/resource/${index + 1}`,
    method: ['GET', 'POST', 'PUT', 'DELETE'][index % 4] ?? 'GET',
    status,
    latency: 40 + ((index * 37) % 900),
    region: ['us', 'eu', 'au', 'me'][index % 4] ?? 'us',
  }
})

const getGeneratedColumnKeys = () => columnSettings.value
  .map(column => column.key)
  .filter(key => key.startsWith(generatedColumnKeyPrefix))

const addGeneratedColumnValues = (rows: MockRow[]): MockRow[] => {
  const generatedColumnKeys = getGeneratedColumnKeys()

  if (!generatedColumnKeys.length) {
    return rows
  }

  return rows.map(row => generatedColumnKeys.reduce<MockRow>((nextRow, columnKey) => ({
    ...nextRow,
    [columnKey]: `${columnKey} value for ${row.id}`,
  }), { ...row }))
}

const applySort = (
  rows: MockRow[],
  { sortColumnKey, sortColumnOrder }: Pick<AnalyticsDatatableConfig, 'sortColumnKey' | 'sortColumnOrder'>,
) => {
  if (!sortColumnKey || !sortColumnOrder) {
    return rows
  }

  return [...rows].sort((a, b) => {
    const left = a[sortColumnKey as keyof MockRow]
    const right = b[sortColumnKey as keyof MockRow]
    const result = typeof left === 'number' && typeof right === 'number'
      ? left - right
      : String(left).localeCompare(String(right))

    return sortColumnOrder === 'asc' ? result : -result
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

const applySearch = (rows: MockRow[], search: string | undefined) => {
  const normalizedSearch = search?.trim().toLowerCase()

  if (!normalizedSearch) {
    return rows
  }

  return rows.filter(row => [
    row.service,
    row.route,
    row.method,
    row.status,
    row.region,
  ].some(value => String(value).toLowerCase().includes(normalizedSearch)))
}

const recordFetch = ({
  request,
  responseCursor,
}: {
  request: AnalyticsDatatableFetcherParams
  responseCursor?: any
}) => {
  const id = `fetch-${fetchCount.value}`
  const positionLabels: Record<AnalyticsDatatableMode, string> = {
    infinite: `start ${request.startRow ?? 0}`,
    pagination: `page ${request.page ?? 1}`,
  }
  const nextFetchHistory = [
    ...fetchHistory.value,
    {
      fetchCount: fetchCount.value,
      id,
      request,
      responseCursor,
      title: `Fetch ${fetchCount.value} - ${fetchHistoryModeLabels[request.mode]} - ${positionLabels[request.mode]}`,
      time: new Date().toLocaleTimeString(),
    },
  ].slice(-5)
  const nextFetchHistoryIds = new Set(nextFetchHistory.map(entry => entry.id))

  lastResponseCursor.value = responseCursor
  collapsedFetchHistoryItems.value = Object.fromEntries(
    Object.entries({
      ...collapsedFetchHistoryItems.value,
      [id]: true,
    }).filter(([entryId]) => nextFetchHistoryIds.has(entryId)),
  )
  fetchHistory.value = nextFetchHistory
}

const fetchRows = async ({
  mode: fetchMode,
  page = 1,
  pageSize,
  startRow = 0,
  cursor,
  sortColumnKey,
  sortColumnOrder,
  search,
  filterSelection: requestFilterSelection,
}: AnalyticsDatatableFetcherParams): Promise<AnalyticsDatatableFetcherResult<MockRow>> => {
  const request = {
    mode: fetchMode,
    page,
    pageSize,
    startRow,
    cursor,
    sortColumnKey,
    sortColumnOrder,
    search,
    filterSelection: requestFilterSelection,
  }
  fetchCount.value += 1
  lastRequest.value = request

  await new Promise(resolve => setTimeout(resolve, 250))

  const rows = applySort(
    applySearch(applyFilters(addGeneratedColumnValues(mockRows), requestFilterSelection), search),
    { sortColumnKey, sortColumnOrder },
  )

  if (fetchMode === 'infinite') {
    const offset = typeof cursor === 'number' ? cursor : 0
    const data = rows.slice(offset, offset + pageSize)
    const nextCursor = offset + data.length
    scheduleAsyncValues(data)
    recordFetch({ request, responseCursor: nextCursor })

    return {
      data,
      cursor: nextCursor,
      hasMore: offset + data.length < rows.length,
    }
  }

  const offset = (page - 1) * pageSize
  const data = rows.slice(offset, offset + pageSize)
  scheduleAsyncValues(data)
  recordFetch({ request })

  return {
    data,
    total: rows.length,
  }
}

const fetchDebug = computed(() => ({
  mode: mode.value,
  fetchCount: fetchCount.value,
  request: lastRequest.value,
  responseCursor: lastResponseCursor.value,
}))

const fetchHistoryEntries = computed(() => [...fetchHistory.value].reverse())

const formatDebugJson = (value: unknown) => JSON.stringify(value, null, 2)

const toggleSandboxSectionOnHeaderClick = (sectionId: SandboxSectionId, event: MouseEvent) => {
  const target = event.target

  if (!(target instanceof Element)) {
    return
  }

  const clickedHeader = target.closest('.collapse-heading')
  const clickedDefaultTrigger = target.closest('.collapse-trigger-content')

  if (!clickedHeader || clickedDefaultTrigger) {
    return
  }

  collapsedSandboxSections.value[sectionId] = !collapsedSandboxSections.value[sectionId]
}

const debugSections = computed<DebugSection[]>(() => [
  {
    id: 'lastRowClick',
    title: 'Last row click event',
    value: lastRowClick.value ?? 'Click a row',
  },
  {
    id: 'selectedRows',
    title: 'Selected rows',
    value: selectedRows.value.length ? selectedRows.value : 'No selected rows',
  },
  {
    id: 'fetchDebug',
    title: 'Fetch debug',
    value: fetchDebug.value,
  },
  {
    id: 'tableConfig',
    title: 'tableConfig',
    value: tableConfig.value,
  },
  {
    id: 'headers',
    title: 'headers',
    value: headers.value,
  },
  {
    id: 'filterSelection',
    title: 'filterSelection',
    value: filterSelection.value ?? {},
  },
])

const summarizeRows = (rows: MockRow[]) => rows.map(row => ({
  id: row.id,
  service: row.service,
  route: row.route,
}))

const countActiveFilters = (selection: FilterGroupSelection | undefined): number => (
  Object.values(selection ?? {}).filter(Boolean).length
)

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

const getRowAttrs: AnalyticsDatatableRowAttrs<MockRow> = row => ({
  'data-testid': `sandbox-row-${row.id}`,
})

const getCellAttrs: AnalyticsDatatableCellAttrs<MockRow> = ({ column, rowValue }) => ({
  'data-testid': `sandbox-cell-${column.key}`,
  'data-row-value': rowValue,
})

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

const isCustomMethodFilter = (filterKey: string) => toolbarSlotMode.value === 'custom-filter' && filterKey === 'method'

const handleFilterApply = (filterKey: string, rawSelection: FilterGroupSelection) => {
  if (isCustomMethodFilter(filterKey)) {
    filterSelection.value = {
      ...(filterSelection.value ?? {}),
      method: {
        operator: 'eq',
        text: selectedCustomMethod.value,
        value: selectedCustomMethod.value,
      },
    }
  }

  logEvent('filter:apply', { filterKey, rawSelection, effectiveSelection: filterSelection.value })
}

const handleFilterClear = (filterKey: string, rawSelection: FilterGroupSelection) => {
  if (isCustomMethodFilter(filterKey)) {
    filterSelection.value = {
      ...(filterSelection.value ?? {}),
      method: undefined,
    }
  }

  logEvent('filter:clear', { filterKey, rawSelection, effectiveSelection: filterSelection.value })
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

const setPinnedColumn = (key: string, value: string | null) => {
  tableConfig.value = {
    ...tableConfig.value,
    pinnedColumns: {
      ...tableConfig.value.pinnedColumns,
      [key]: value && isPinnedColumnValue(value) ? value : false,
    },
  }
}

const resetTableState = () => {
  clearAsyncResolveTimers()
  addedColumnCount.value = 0
  asyncValues.value = {}
  columnSettings.value = createDefaultColumnSettings()
  tableConfig.value = createDefaultTableConfig()
  enableSearch.value = true
  hideColumnVisibility.value = false
  selectedRows.value = []
  filterSelection.value = undefined
  selectedCustomMethod.value = 'GET'
  toolbarSlotMode.value = 'default'
  lastRowClick.value = undefined
  fetchCount.value = 0
  lastRequest.value = undefined
  lastResponseCursor.value = undefined
  fetchHistory.value = []
  collapsedSandboxSections.value = createDefaultCollapsedSandboxSections()
  collapsedFetchHistoryItems.value = {}
  eventLog.value = []
  datatableResetKey.value += 1
}

watch(rowSelection, (nextSelection) => {
  if (nextSelection === 'none') {
    selectedRows.value = []
  }
})

onBeforeUnmount(() => {
  clearAsyncResolveTimers()
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

.sandbox-header-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: var(--kui-space-30, $kui-space-30);
  justify-content: flex-end;
}

.sandbox-outside-actions-target:empty {
  display: none;
}

.sandbox-outside-controls {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: var(--kui-space-30, $kui-space-30);
}

.sandbox-outside-control-target:empty {
  display: none;
}

.sandbox-outside-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: var(--kui-space-30, $kui-space-30);
  justify-content: flex-start;
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
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-30, $kui-space-30);
  min-width: 0;

  :deep(.kong-ui-public-analytics-datatable) {
    flex: 0 0 800px;
    height: 800px;
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
  grid-row: 2;

  h2 {
    font-size: 16px;
    margin: 0 0 var(--kui-space-30, $kui-space-30);
  }

  h3 {
    font-size: 14px;
    margin: var(--kui-space-40, $kui-space-40) 0 var(--kui-space-30, $kui-space-30);
  }

  h4 {
    font-size: 13px;
    margin: var(--kui-space-40, $kui-space-40) 0 var(--kui-space-20, $kui-space-20);
  }
}

.sandbox-section-collapse {
  :deep(.collapse-heading) {
    cursor: pointer;
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

.fetch-history-json {
  max-height: 220px;
}

.empty-history {
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  margin: 0;
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

.sandbox-custom-toolbar {
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.sandbox-custom-toolbar-actions,
.sandbox-custom-toolbar-status,
.sandbox-toolbar-right-slot {
  align-items: center;
  display: flex;
  gap: var(--kui-space-30, $kui-space-30);
}

.sandbox-method-filter {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-30, $kui-space-30);
  min-width: 260px;
}

.sandbox-method-filter-heading {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-10, $kui-space-10);

  span {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
  }
}

.sandbox-method-filter-options {
  display: grid;
  gap: var(--kui-space-30, $kui-space-30);
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.async-value {
  color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
}

.slow {
  color: var(--kui-color-text-danger, $kui-color-text-danger);
  font-weight: 600;
}
</style>
