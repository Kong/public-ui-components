<template>
  <KCard
    class="kong-ui-entity-base-table"
    :title="title"
    :title-tag="titleTag"
  >
    <KTableData
      ref="tableRefs"
      :cache-identifier="cacheId"
      :cell-attrs="cellAttrs"
      :client-sort="enableClientSort"
      :empty-state-action-message="query ? t('baseTable.emptyState.noSearchResultsCtaText') : emptyStateOptions.ctaText"
      :empty-state-action-route="query ? undefined : emptyStateOptions.ctaPath"
      :empty-state-icon-variant="query ? 'search' : 'kong'"
      :empty-state-message="query ? t('baseTable.emptyState.noSearchResultsMessage') : emptyStateOptions.message"
      :empty-state-title="query ? t('baseTable.emptyState.noSearchResultsTitle') : emptyStateOptions.title"
      :error="tableErrorState.hasError"
      :error-state-message="tableErrorState.message"
      :error-state-title="tableErrorState.title"
      :fetcher="fetcher"
      :fetcher-cache-key="String(fetcherCacheKey)"
      :headers="headers"
      :hide-pagination="hidePagination"
      :hide-pagination-when-optional="hidePaginationWhenOptional"
      :hide-toolbar="hideToolbar ?? hideTableToolbar"
      :initial-fetcher-params="combinedInitialFetcherParams"
      :loading="isLoading"
      :pagination-attributes="tablePaginationAttributes"
      resize-columns
      :row-attrs="rowAttrs"
      :row-key="rowKey"
      :search-input="query"
      :sort-handler-function="enableClientSort ? sortHandlerFunction : undefined"
      :sortable="!disableSorting"
      :table-preferences="tablePreferences"
      @empty-state-action-click="handleEmptyStateCtaClicked"
      @row:click="handleRowClick"
      @sort="(params: any) => handleSortChanged(params)"
      @state="handleStateChangeAndEmit"
      @update:table-preferences="handleUpdateTablePreferences"
    >
      <template #toolbar>
        <div
          class="toolbar-container"
        >
          <slot name="toolbar-filter" />
          <div
            v-if="$slots['toolbar-button']"
            class="toolbar-button-container"
          >
            <slot name="toolbar-button" />
          </div>
        </div>
      </template>

      <template
        v-if="$slots['empty-state']"
        #empty-state
      >
        <slot name="empty-state" />
      </template>

      <template
        v-for="(header, key) in tableHeaders"
        :key="key"
        #[key]="{ row, rowValue }"
      >
        <EntityBaseTableCell
          :key-name="String(key)"
          :row-el="getRowEl(row)"
          :tooltip="header.tooltip"
        >
          <slot
            :name="key"
            :row="row"
            :row-key="rowKey"
            :row-value="rowValue"
          >
            {{ rowValue }}
          </slot>
        </EntityBaseTableCell>
      </template>

      <template #action-items="{ row }">
        <slot
          name="actions"
          :row="row"
        />
      </template>

      <template
        v-if="!query"
        #empty-state-action-icon
      >
        <AddIcon />
      </template>
    </KTableData>

    <!-- TODO: remove this slot when empty states M2 is cleaned up -->
    <!-- This slot is for teleported actions that should be visible even if the toolbar is hidden -->
    <div
      v-if="$slots['outside-actions'] && hideTableToolbar"
      class="hidden"
    >
      <slot name="outside-actions" />
    </div>
  </KCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref } from 'vue'
import type { TableStateParams } from '../../types'
import composables from '../../composables'
import { useTablePreferences } from '@kong-ui-public/core'
import type { HeaderTag, TablePreferences, SortHandlerFunctionParam, TableDataFetcherParams, TableDataProps, TablePaginationAttributes } from '@kong/kongponents'
import EntityBaseTableCell from './EntityBaseTableCell.vue'

import type {
  BaseTableHeaders,
  EmptyStateOptions,
  FetcherResponse,
  InternalHeader,
  TableSortParams,
  TableErrorMessage,
} from '../../types'
import { AddIcon } from '@kong/icons'

const props = defineProps({
  // table header configuration
  tableHeaders: {
    type: Object as PropType<BaseTableHeaders>,
    required: true,
    default: () => ({}),
  },
  // fetcher function
  fetcher: {
    type: Function as PropType<(param: TableDataFetcherParams) => Promise<FetcherResponse>>,
    required: true,
    default: async () => ({
      data: [],
      total: 0,
    }),
  },
  initialFetcherParams: {
    type: Object as PropType<Partial<Omit<TableDataFetcherParams<string, string>, 'query'>>>,
    default: null,
  },
  rowKey: {
    type: [String, Function] as PropType<TableDataProps['rowKey']>,
    default: 'id',
  },
  // used to identify the cache entry
  cacheIdentifier: {
    type: String,
    default: '',
  },
  // cache key for the fetcher
  fetcherCacheKey: {
    type: Number,
    default: 1,
  },
  // whether the table is loading
  isLoading: {
    type: Boolean,
    default: false,
  },
  // search query
  query: {
    type: String,
    default: '',
  },
  // Enable client-side sort (e.g. for Koko endpoints that do not support sort)
  enableClientSort: {
    type: Boolean,
    default: false,
  },
  sortHandlerFunction: {
    type: Function as PropType<(param: SortHandlerFunctionParam) => Array<Record<string, any>>>,
    default: null,
  },
  // whether to show the actions column
  enableEntityActions: {
    type: Boolean,
    default: true,
  },
  // options for the empty state
  emptyStateOptions: {
    type: Object as PropType<EmptyStateOptions>,
    default: () => ({}),
  },
  // error message to show in the error state
  // this prop being set (or empty) determines if the KTable is in an error state
  // please use `TableErrorMessage` since `string` is only for backwards compatibility
  errorMessage: {
    type: [String, Object] as PropType<string | TableErrorMessage>,
    default: null,
  },
  paginationAttributes: {
    type: Object as PropType<TablePaginationAttributes>,
    default: () => ({}),
  },
  hidePaginationWhenOptional: {
    type: Boolean,
    default: true,
  },
  disableSorting: {
    type: Boolean,
    default: undefined,
  },
  // A function for applying attributes to cells
  cellAttributes: {
    type: Function as PropType<(params: Record<string, any>) => Record<string, any>>,
    default: () => ({}),
  },
  // A function for applying attributes to rows
  rowAttributes: {
    type: Function as PropType<(row: Record<string, any>) => Record<string, any>>,
    default: () => ({}),
  },
  /** tableKey to use for user table preferences. If empty, will fallback to default preferences */
  preferencesStorageKey: {
    type: String,
    default: '',
  },
  /** default table preferences to use if no user preferences are found */
  defaultTablePreferences: {
    type: Object as PropType<TablePreferences>,
    default: null,
    required: false,
  },
  title: {
    type: String,
    default: '',
  },
  titleTag: {
    type: String as PropType<HeaderTag>,
    default: 'h2',
  },
  /** default to false, setting to true will suppress the row click event even if "@click:row" is attached */
  disableRowClick: {
    type: Boolean,
    default: false,
  },
  hidePagination: {
    type: Boolean,
    default: false,
  },
  hideToolbar: {
    type: Boolean,
    default: undefined,
  },
  /**
   * @deprecated in favour of `paginationAttributes`
   */
  disablePaginationPageJump: {
    type: Boolean,
    default: undefined,
    validator: (value: boolean) => {
      if (value) {
        console.warn('EntityBaseTable: `disablePaginationPageJump` is deprecated in favour of `paginationAttributes`. Please update your code to use `paginationAttributes` instead.')
      }
      return typeof value === 'boolean'
    },
  },
  /**
   * @deprecated in favour of `paginationAttributes`
   */
  paginationType: {
    type: String as PropType<'default' | 'offset'>,
    default: undefined,
    validator: (value: string) => {
      if (value) {
        console.warn('EntityBaseTable: `paginationType` is deprecated in favour of `paginationAttributes`. Please update your code to use `paginationAttributes` instead.')
      }
      return ['default', 'offset'].includes(value)
    },
  },
})

const emit = defineEmits<{
  (e: 'click:row', row: BaseTableHeaders) : void
  (e: 'sort', sortParams: TableSortParams) : void
  (e: 'clear-search-input'): void
  (e: 'empty-state-cta-clicked'): void
  (e: 'state', state: TableStateParams): void
}>()

const { i18n: { t } } = composables.useI18n()

const tableErrorState = computed((): { hasError: boolean, title?: string, message?: string } => {
  if (typeof props.errorMessage === 'string') {
    return {
      hasError: !!props.errorMessage,
      title: props.errorMessage,
      message: undefined,
    }
  } else {
    return {
      hasError: !!props.errorMessage,
      title: props.errorMessage?.title,
      message: props.errorMessage?.message,
    }
  }
})

const cacheId = computed((): string => {
  // Utilize the cacheIdentifier if provided; otherwise, fallback to the preferencesStorageKey that should always be defined
  return props.cacheIdentifier || props.preferencesStorageKey
})

const headers = computed<InternalHeader[]>(() => {
  const arr = []
  const fieldKeys = Object.keys(props.tableHeaders)
  fieldKeys.forEach(key => {
    const field = props.tableHeaders[key]

    arr.push({
      label: field?.label ?? key,
      key,
      sortable: field?.sortable ?? false,
      hidable: field?.hidable ?? true,
    })
  })

  if (props.enableEntityActions) {
    arr.push({
      key: 'actions',
      hideLabel: true,
    })
  }

  return arr
})

const rowAttrs = (row: Record<string, any>) => ({
  'data-rowid': row.id,
  'data-testid': row.name,
  ...props.rowAttributes(row),
})

const tableRefs = ref<Record<string, any>>({})

const getRowEl = (row: Record<string, any>): HTMLElement => {
  return tableRefs.value?.$el.querySelector(`[data-rowid="${row.id}"]`)
}

const cellAttrs = (params: Record<string, any>) => {
  const result: Record<string, any> = {
    'data-testid': params.headerKey,
    ...props.cellAttributes(params),
  }

  if (params.colIndex === 0) {
    result.style = {
      maxWidth: '250px',
      overflowX: 'hidden',
      textOverflow: 'ellipsis',
    }
  }

  return result
}

const handleStateChangeAndEmit = (state: TableStateParams) => {
  handleStateChange(state)
  emit('state', state)
}

const handleEmptyStateCtaClicked = () => {
  emit('empty-state-cta-clicked')
  clearSearchInput()
}

const clearSearchInput = () => {
  emit('clear-search-input')
}

const handleRowClick = computed(() => {
  return props.disableRowClick
    ? undefined
    : (_: MouseEvent, row: BaseTableHeaders) => {
      emit('click:row', row)
    }
})

const handleSortChanged = (sortParams: TableSortParams): void => {
  emit('sort', sortParams)
}

const { hideTableToolbar, handleStateChange } = composables.useTableState(() => props.query)

const { setTablePreferences, getTablePreferences } = useTablePreferences()

// Use unique key cacheId (passed down from consuming app and derived from controlPlaneId)
// for localStorage of user's table preferences across tables, orgs and users

const tablePreferences = ref<TablePreferences>(getTablePreferences(cacheId.value, props.defaultTablePreferences))

const combinedInitialFetcherParams = computed((): Partial<TableDataFetcherParams<string, string>> => {
  // Pass the preferencesStorageKey regardless; if no entry is found, it will return the default
  const userTablePreferences = getTablePreferences(cacheId.value)
  // Return the props.initialFetcherParams, appending any stored user preferences
  return {
    ...props.initialFetcherParams,
    ...userTablePreferences,
  }
})

const handleUpdateTablePreferences = (newTablePreferences: TablePreferences): void => {
  tablePreferences.value = newTablePreferences
  // Iterate over each header and check if it's non-hidable
  headers.value.forEach((header: InternalHeader) => {
    if (!('hidable' in header) || !tablePreferences.value.columnVisibility) {
      return
    }
    // If the header is non-hidable, always make it visible
    if (header.hidable === false) {
      tablePreferences.value.columnVisibility[header.key] = true
    }
  })

  if (cacheId.value) {
    setTablePreferences(cacheId.value, newTablePreferences)
  }
}

const tablePaginationAttributes = computed((): TablePaginationAttributes => ({
  disablePageJump: props.disablePaginationPageJump,
  offset: props.paginationType === 'offset',
  ...props.paginationAttributes,
}))
</script>

<style lang="scss" scoped>
.kong-ui-entity-base-table {
  .toolbar-container {
    align-items: center;
    display: flex;
    width: 100%;
  }

  .toolbar-button-container {
    margin-left: auto;
  }

  .hidden {
    display: none;
  }
}
</style>
