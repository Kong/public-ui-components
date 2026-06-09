<template>
  <div class="datatable-toolbar">
    <slot
      name="toolbar"
      v-bind="toolbarSlotProps"
    >
      <div class="datatable-toolbar-primary">
        <slot
          name="toolbar-left"
          v-bind="toolbarSlotProps"
        />

        <!-- region: search -->
        <TableDataGridSearch
          v-if="showToolbarSearch"
          v-model="search"
        />

        <!-- region: filters -->
        <TableDataGridFilters
          v-if="showToolbarFilters"
          v-model="filterSelection"
          :forwarded-filter-slot-names="forwardedFilterSlotNames"
          :headers="headers"
          @apply="(filterKey, selection) => emit('filter:apply', filterKey, selection)"
          @clear="(filterKey, selection) => emit('filter:clear', filterKey, selection)"
          @close="filterKey => emit('filter:close', filterKey)"
          @open="filterKey => emit('filter:open', filterKey)"
        >
          <template
            v-for="slotName in forwardedFilterSlotNames"
            :key="slotName"
            #[slotName]
          >
            <slot :name="slotName" />
          </template>
        </TableDataGridFilters>
      </div>

      <div class="datatable-toolbar-secondary">
        <slot
          name="toolbar-right"
          v-bind="toolbarSlotProps"
        />

        <!-- region: bulk actions -->
        <div
          v-if="showBulkActions"
          class="datatable-toolbar-selection"
        >
          <KDropdown
            class="datatable-bulk-actions-dropdown"
            data-testid="table-data-grid-bulk-actions-dropdown"
            :disabled="!toolbarSlotProps.selectedRows.length"
            :kpop-attributes="{ placement: 'bottom-start' }"
          >
            <KButton
              appearance="secondary"
              class="datatable-bulk-actions-trigger"
              data-testid="table-data-grid-bulk-actions-trigger"
              :disabled="!toolbarSlotProps.selectedRows.length"
              size="large"
            >
              ({{ toolbarSlotProps.selectedRows.length }}) {{ i18n.t('datatable.bulkActions') }}
            </KButton>

            <template #items>
              <slot
                name="bulk-action-items"
                :selected-rows="toolbarSlotProps.selectedRows"
              />
            </template>
          </KDropdown>
        </div>
      </div>
    </slot>

    <!-- region: column visibility -->
    <TableDataGridColumnVisibilityMenu
      v-if="showColumnVisibility"
      v-model:column-visibility="columnVisibility"
      :headers="headers"
    />
  </div>
</template>

<script setup lang="ts" generic="Row extends Record<string, any>">
import type {
  TableDataGridHeader,
  TableDataGridToolbarSlotProps,
} from '../types'
import type { FilterGroupSelection } from '@kong/kongponents'
import TableDataGridColumnVisibilityMenu from './TableDataGridColumnVisibilityMenu.vue'
import TableDataGridFilters from './TableDataGridFilters.vue'
import TableDataGridSearch from './TableDataGridSearch.vue'
import composables from '../composables'

const {
  forwardedFilterSlotNames,
  headers,
  showBulkActions,
  showColumnVisibility,
  showToolbarFilters,
  showToolbarSearch,
  toolbarSlotProps,
} = defineProps<{
  headers: Array<TableDataGridHeader<Row>>
  forwardedFilterSlotNames: string[]
  toolbarSlotProps: TableDataGridToolbarSlotProps<Row>
  showToolbarSearch: boolean
  showToolbarFilters: boolean
  showBulkActions: boolean
  showColumnVisibility: boolean
}>()

defineSlots<{
  'bulk-action-items': (props: { selectedRows: Row[] }) => any
  'toolbar': (props: TableDataGridToolbarSlotProps<Row>) => any
  'toolbar-left': (props: TableDataGridToolbarSlotProps<Row>) => any
  'toolbar-right': (props: TableDataGridToolbarSlotProps<Row>) => any
  [key: string]: (props: any) => any
}>()

const search = defineModel<string>('search', { required: true })
const filterSelection = defineModel<FilterGroupSelection>('filterSelection', { required: true })
const columnVisibility = defineModel<Record<string, boolean>>('columnVisibility', { required: true })

const emit = defineEmits<{
  (e: 'filter:apply', filterKey: string, selection: FilterGroupSelection): void
  (e: 'filter:clear', filterKey: string, selection: FilterGroupSelection): void
  (e: 'filter:open', filterKey: string): void
  (e: 'filter:close', filterKey: string): void
}>()

const { i18n } = composables.useI18n()
</script>

<style lang="scss" scoped>
.datatable-toolbar {
  align-items: center;
  background: var(--kui-color-background, $kui-color-background);
  border-bottom: 1px solid var(--kui-color-border, $kui-color-border);
  display: flex;
  gap: var(--kui-space-40, $kui-space-40);
  justify-content: space-between;
  padding: var(--kui-space-30, $kui-space-30);
}

.datatable-toolbar-primary {
  align-items: center;
  display: flex;
  flex: 1 1 auto;
  gap: var(--kui-space-40, $kui-space-40);
  min-width: 0;
}

.datatable-toolbar-secondary {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  gap: var(--kui-space-40, $kui-space-40);
  min-width: 0;
}

.datatable-toolbar-selection {
  align-items: center;
  display: flex;
  min-width: 0;
}

.datatable-bulk-actions-dropdown {
  :deep(.k-button.datatable-bulk-actions-trigger) {
    border-width: var(--kui-border-width-10, $kui-border-width-10);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    width: 140px;
  }
}
</style>
