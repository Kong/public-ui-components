<template>
  <KCard
    class="kong-ui-entity-base-table"
    :title="title"
  >
    <KTable
      ref="tableRefs"
      :cache-identifier="cacheId"
      :cell-attrs="cellAttrs"
      :disable-pagination-page-jump="disablePaginationPageJump"
      :disable-sorting="disableSorting"
      :empty-state-action-message="emptyStateOptions.ctaText"
      :empty-state-action-route="emptyStateOptions.ctaPath"
      empty-state-icon-variant="search"
      :empty-state-message="t('baseTable.emptySearch.noSearchResultsMessage')"
      :empty-state-title="t('baseTable.emptySearch.noSearchResultsTitle')"
      :enable-client-sort="enableClientSort"
      :error-state-message="tableErrorState.message"
      :error-state-title="tableErrorState.title"
      :fetcher="fetcher"
      :fetcher-cache-key="String(fetcherCacheKey)"
      :has-error="tableErrorState.hasError"
      :headers="headers"
      hide-pagination-when-optional
      :initial-fetcher-params="combinedInitialFetcherParams"
      :is-loading="isLoading"
      :pagination-type="paginationType"
      :row-attrs="rowAttrs"
      :search-input="query"
      @ktable-empty-state-cta-clicked="handleEmptyStateCtaClicked"
      @row:click="handleRowClick"
      @sort="(params: any) => handleSortChanged(params)"
      @update:table-preferences="handleUpdateTablePreferences"
    >
      <template #toolbar="{ state }">
        <div
          v-show="showToolbar(state)"
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
        v-for="(_, key) in tableHeaders"
        :key="key"
        #[key]="{ row, rowKey, rowValue }"
      >
        <EntityBaseTableCell
          :key-name="String(key)"
          :row-el="getRowEl(row)"
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
      <template #actions="{ row, rowKey, rowValue }">
        <div
          class="actions-container"
          :data-testid="row.name"
        >
          <KDropdown
            :kpop-attributes="{ placement: 'bottomEnd' }"
            :width="dropdownMenuWidth"
          >
            <KButton
              class="actions-trigger"
              data-testid="overflow-actions-button"
              size="small"
            >
              <template #icon>
                <KIcon
                  :color="KUI_COLOR_TEXT_NEUTRAL_STRONGER"
                  icon="more"
                  size="16"
                />
              </template>
            </KButton>
            <template #items>
              <slot
                name="actions"
                :row="row"
                :row-key="rowKey"
                :row-value="rowValue"
              />
            </template>
          </KDropdown>
        </div>
      </template>
      <template
        v-if="!query"
        #empty-state
      >
        <!-- When no search query is present - show custom empty state with plus icon in action button -->
        <!-- Standard KTable empty state will only be shown when there is a search query or error -->
        <KEmptyState
          icon-variant="search"
          :message="emptyStateOptions.message || t('baseTable.emptyState.message')"
          :title="emptyStateOptions.title || t('baseTable.emptyState.title')"
        >
          <template #icon>
            <KongIcon />
          </template>
          <template
            v-if="emptyStateOptions.ctaText"
            #action
          >
            <KButton
              :data-testid="getTestIdString(emptyStateOptions.ctaText)"
              @click="handleEmptyStateCtaClicked"
            >
              <AddIcon />
              {{ emptyStateOptions.ctaText }}
            </KButton>
          </template>
        </KEmptyState>
      </template>
    </KTable>
  </KCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref } from 'vue'
import composables from '../../composables'
import { useTablePreferences } from '@kong-ui-public/core'
import type { UserTablePreferences } from '@kong-ui-public/core'
import type { SwrvStateData } from '@kong/kongponents'
import { KUI_COLOR_TEXT_NEUTRAL_STRONGER } from '@kong/design-tokens'
import EntityBaseTableCell from './EntityBaseTableCell.vue'

import type {
  BaseTableHeaders,
  EmptyStateOptions,
  FetcherParams,
  FetcherResponse,
  InternalHeader,
  TableSortParams,
  TableErrorMessage,
} from '../../types'
import { AddIcon, KongIcon } from '@kong/icons'

const props = defineProps({
  // table header configuration
  tableHeaders: {
    type: Object as PropType<BaseTableHeaders>,
    required: true,
    default: () => ({}),
  },
  // fetcher function
  fetcher: {
    type: Function as PropType<(params: FetcherParams) => Promise<FetcherResponse>>,
    required: true,
    default: async () => ({
      data: [],
      total: 0,
    }),
  },
  initialFetcherParams: {
    type: Object as PropType<Partial<Omit<FetcherParams, 'query'>>>,
    default: null,
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
  disablePaginationPageJump: {
    type: Boolean,
    default: undefined,
  },
  disableSorting: {
    type: Boolean,
    default: undefined,
  },
  paginationType: {
    type: String as PropType<'default' | 'offset'>,
    default: undefined,
  },
  // A function for applying attributes to cells
  cellAttributes: {
    type: Function as PropType<(params: Record<string, any>) => Object>,
    default: () => ({}),
  },
  // A function for applying attributes to rows
  rowAttributes: {
    type: Function as PropType<(row: Record<string, any>) => Object>,
    default: () => ({}),
  },
  /** tableKey to use for user table preferences. If empty, will fallback to default preferences */
  preferencesStorageKey: {
    type: String,
    default: '',
    required: true,
  },
  /** dropdown menu width, default to 200px, defined in kPop */
  dropdownMenuWidth: {
    type: String,
    default: '',
    required: false,
  },
  title: {
    type: String,
    default: '',
  },
  /** default to false, setting to true will suppress the row click event even if "@click:row" is attached */
  disableRowClick: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'click:row', row: BaseTableHeaders) : void,
  (e: 'sort', sortParams: TableSortParams) : void,
  (e: 'clear-search-input'): void,
  (e: 'empty-state-cta-clicked'): void,
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

const showToolbar = (state: SwrvStateData): boolean => {
  return state.hasData || !!props.query
}

const headers = computed<Array<InternalHeader>>(() => {
  const arr = []
  const fieldKeys = Object.keys(props.tableHeaders)
  fieldKeys.forEach(key => {
    const field = props.tableHeaders[key]

    arr.push({
      label: field.label ?? key,
      key,
      sortable: field.sortable ?? false,
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

const getTestIdString = (message: string): string => {
  const msg = message.toLowerCase().replace(/[^[a-z0-9]/gi, '-')

  return msg
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

const { setTablePreferences, getTablePreferences } = useTablePreferences()
const combinedInitialFetcherParams = computed((): Partial<FetcherParams> => {
  // Pass the preferencesStorageKey regardless; if no entry is found, it will return the default
  const userTablePreferences = getTablePreferences(props.preferencesStorageKey)

  // Return the props.initialFetcherParams, appending any stored user preferences
  return {
    ...props.initialFetcherParams,
    ...userTablePreferences,
  }
})

const handleUpdateTablePreferences = (tablePreferences: UserTablePreferences): void => {
  if (props.preferencesStorageKey) {
    setTablePreferences(props.preferencesStorageKey, tablePreferences)
  }
}
</script>

<style lang="scss" scoped>
.kong-ui-entity-base-table {
  .toolbar-container {
    align-items: center;
  }

  .toolbar-button-container {
    margin-left: auto;
  }

  .actions-container {
    float: right;

    :deep(.k-dropdown-item-trigger) {
      margin-bottom: 0;
      margin-top: 0;
    }
  }

  .actions-trigger {
    background-color: $kui-color-background-transparent!important;
    border: none!important;
    cursor: pointer!important;
    font-weight: $kui-font-weight-regular!important;
  }
}
</style>

<style lang="scss">
.kong-ui-entity-base-table {
  :deep(.k-table) {
    table-layout: fixed;
  }
}
</style>
