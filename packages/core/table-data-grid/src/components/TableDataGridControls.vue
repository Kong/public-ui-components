<template>
  <div
    aria-hidden="true"
    class="datatable-outside-actions-host"
    inert
  >
    <slot
      name="outside-actions"
      v-bind="toolbarSlotProps"
    />
  </div>

  <Teleport
    v-if="showOutsideSearch"
    defer
    :to="outsideSearch"
  >
    <TableDataGridSearch v-model="search" />
  </Teleport>

  <Teleport
    v-if="showOutsideFilters"
    defer
    :to="outsideFilters"
  >
    <TableDataGridFilters
      v-model="filterSelection"
      :forwarded-filter-slot-names="getForwardedFilterSlotNames()"
      :headers="headers"
      @apply="(filterKey, selection) => emit('filter:apply', filterKey, selection)"
      @clear="(filterKey, selection) => emit('filter:clear', filterKey, selection)"
      @close="filterKey => emit('filter:close', filterKey)"
      @open="filterKey => emit('filter:open', filterKey)"
    >
      <template
        v-for="slotName in getForwardedFilterSlotNames()"
        :key="slotName"
        #[slotName]
      >
        <slot :name="slotName" />
      </template>
    </TableDataGridFilters>
  </Teleport>

  <TableDataGridToolbar
    v-if="showToolbar"
    v-model:column-visibility="columnVisibilityModel"
    v-model:filter-selection="filterSelection"
    v-model:search="search"
    :forwarded-filter-slot-names="getForwardedFilterSlotNames()"
    :headers="headers"
    :show-bulk-actions="showBulkActions"
    :show-column-visibility="showColumnVisibility"
    :show-toolbar-filters="showToolbarFilters"
    :show-toolbar-search="showToolbarSearch"
    :toolbar-slot-props="toolbarSlotProps"
    @filter:apply="(filterKey, selection) => emit('filter:apply', filterKey, selection)"
    @filter:clear="(filterKey, selection) => emit('filter:clear', filterKey, selection)"
    @filter:close="filterKey => emit('filter:close', filterKey)"
    @filter:open="filterKey => emit('filter:open', filterKey)"
  >
    <template
      v-if="$slots.toolbar"
      #toolbar="slotProps"
    >
      <slot
        name="toolbar"
        v-bind="slotProps"
      />
    </template>

    <template #toolbar-left="slotProps">
      <slot
        name="toolbar-left"
        v-bind="slotProps"
      />
    </template>

    <template #toolbar-right="slotProps">
      <slot
        name="toolbar-right"
        v-bind="slotProps"
      />
    </template>

    <template #bulk-action-items="slotProps">
      <slot
        name="bulk-action-items"
        v-bind="slotProps"
      />
    </template>

    <template
      v-for="slotName in getForwardedFilterSlotNames()"
      :key="slotName"
      #[slotName]
    >
      <slot :name="slotName" />
    </template>
  </TableDataGridToolbar>
</template>

<script setup lang="ts" generic="Row extends Record<string, any>">
import type {
  TableDataGridHeader,
  TableDataGridRowSelectionMode,
  TableDataGridToolbarSlotProps,
  TableDataGridTeleportTarget,
} from '../types'
import type { FilterGroupSelection } from '@kong/kongponents'
import { computed, useSlots } from 'vue'
import TableDataGridFilters from './TableDataGridFilters.vue'
import TableDataGridSearch from './TableDataGridSearch.vue'
import TableDataGridToolbar from './TableDataGridToolbar.vue'
import { getFilterGroupFilters, getFilterSlotName } from '../utils/headers'

const props = defineProps<{
  columnVisibility: Record<string, boolean>
  enableSearch: boolean
  headers: Array<TableDataGridHeader<Row>>
  hideBulkActions: boolean
  hideColumnVisibility: boolean
  outsideFilters?: TableDataGridTeleportTarget
  outsideSearch?: TableDataGridTeleportTarget
  rowSelection: TableDataGridRowSelectionMode
  selectedRows: Row[]
  showToolbar: boolean
}>()

const filterSelection = defineModel<FilterGroupSelection>('filterSelection', { required: true })
const search = defineModel<string>('search', { required: true })

defineSlots<{
  'bulk-action-items': (props: { selectedRows: Row[] }) => any
  'outside-actions': (props: TableDataGridToolbarSlotProps<Row>) => any
  'toolbar': (props: TableDataGridToolbarSlotProps<Row>) => any
  'toolbar-left': (props: TableDataGridToolbarSlotProps<Row>) => any
  'toolbar-right': (props: TableDataGridToolbarSlotProps<Row>) => any
  [key: string]: (props: any) => any
}>()
const runtimeSlots = useSlots()

const emit = defineEmits<{
  (e: 'filter:apply', filterKey: string, selection: FilterGroupSelection): void
  (e: 'filter:clear', filterKey: string, selection: FilterGroupSelection): void
  (e: 'filter:open', filterKey: string): void
  (e: 'filter:close', filterKey: string): void
  (e: 'refresh'): void
  (e: 'update:columnVisibility', columnVisibility: Record<string, boolean>): void
}>()

const filterGroupFilters = computed(() => getFilterGroupFilters(props.headers))
const getForwardedFilterSlotNames = () => Object.keys(filterGroupFilters.value)
  .map(getFilterSlotName)
  .filter(slotName => Boolean(runtimeSlots[slotName]))

const updateFilterSelection = (selectionValue: FilterGroupSelection) => {
  filterSelection.value = { ...selectionValue }
  emit('refresh')
}

const updateSearch = (nextSearch: string) => {
  search.value = nextSearch
}

const toolbarSlotProps = computed<TableDataGridToolbarSlotProps<Row>>(() => ({
  selectedRows: props.selectedRows,
  filterSelection: filterSelection.value,
  filters: filterGroupFilters.value,
  search: search.value,
  updateFilterSelection,
  updateSearch,
  refresh: () => emit('refresh'),
}))

const hasFilters = computed(() => props.headers.some(header => header.filter != null))
const hasOutsideFiltersTarget = computed(() => Boolean(props.outsideFilters))
const hasOutsideSearchTarget = computed(() => Boolean(props.outsideSearch))
const showOutsideFilters = computed(() => hasFilters.value && hasOutsideFiltersTarget.value)
const showOutsideSearch = computed(() => props.enableSearch && hasOutsideSearchTarget.value)
const showBulkActions = computed(() => props.rowSelection !== 'none' && !props.hideBulkActions)
const showToolbarFilters = computed(() => hasFilters.value && !hasOutsideFiltersTarget.value)
const showToolbarSearch = computed(() => props.enableSearch && !hasOutsideSearchTarget.value)
const showColumnVisibility = computed(() => !props.hideColumnVisibility)
const columnVisibilityModel = computed({
  get: () => props.columnVisibility,
  set: (columnVisibility: Record<string, boolean>) => {
    emit('update:columnVisibility', columnVisibility)
  },
})
</script>

<style lang="scss" scoped>
.datatable-outside-actions-host {
  height: 0;
  overflow: hidden;
  pointer-events: none;
  position: absolute;
  width: 0;
}
</style>
