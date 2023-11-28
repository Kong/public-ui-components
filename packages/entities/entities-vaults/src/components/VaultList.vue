<template>
  <div class="kong-ui-entities-vaults-list">
    <EntityBaseTable
      :cache-identifier="cacheIdentifier"
      disable-pagination-page-jump
      :disable-sorting="disableSorting"
      :empty-state-options="emptyStateOptions"
      enable-entity-actions
      :error-message="errorMessage"
      :fetcher="fetcher"
      :fetcher-cache-key="fetcherCacheKey"
      pagination-type="offset"
      preferences-storage-key="kong-ui-entities-vaults-list"
      :query="filterQuery"
      :table-headers="tableHeaders"
      :use-action-outside="useActionOutside"
      @clear-search-input="clearFilter"
      @click:row="(row: any) => rowClick(row as EntityRow)"
      @sort="resetPagination"
    >
      <!-- Filter -->
      <template #toolbar-filter>
        <EntityFilter
          v-model="filterQuery"
          :config="filterConfig"
        />
      </template>
      <!-- Create action -->
      <template #toolbar-button>
        <!-- Hide Create button if table is empty -->
        <Teleport
          :disabled="!useActionOutside"
          to="#kong-ui-app-page-header-action-button"
        >
          <PermissionsWrapper :auth-function="() => canCreate()">
            <KButton
              v-show="hasData"
              appearance="primary"
              data-testid="toolbar-add-vault"
              icon="plus"
              :to="config.createRoute"
            >
              {{ t('vaults.list.toolbar_actions.new_vault') }}
            </KButton>
          </PermissionsWrapper>
        </Teleport>
      </template>

      <!-- Column Formatting -->
      <template #prefix="{ rowValue }">
        <div class="table-content-overflow-wrapper">
          <b>{{ rowValue ?? '-' }}</b>
        </div>
      </template>
      <template #name="{ rowValue }">
        <b>{{ rowValue ?? '-' }}</b>
      </template>
      <template #description="{ rowValue }">
        <div class="table-content-overflow-wrapper">
          {{ rowValue ?? '-' }}
        </div>
      </template>
      <template #tags="{ rowValue }">
        <KTruncate v-if="rowValue?.length > 0">
          <KBadge
            v-for="tag in rowValue"
            :key="tag"
            @click.stop
          >
            {{ tag }}
          </KBadge>
        </KTruncate>
        <span v-else>-</span>
      </template>

      <!-- Row actions -->
      <template #actions="{ row }">
        <KClipboardProvider v-slot="{ copyToClipboard }">
          <KDropdownItem
            data-testid="action-entity-copy-id"
            @click="copyId(row, copyToClipboard)"
          >
            {{ t('actions.copy_id') }}
          </KDropdownItem>
        </KClipboardProvider>
        <KClipboardProvider v-slot="{ copyToClipboard }">
          <KDropdownItem
            data-testid="action-entity-copy-json"
            @click="copyJson(row, copyToClipboard)"
          >
            {{ t('actions.copy_json') }}
          </KDropdownItem>
        </KClipboardProvider>
        <PermissionsWrapper :auth-function="() => canRetrieve(row)">
          <KDropdownItem
            data-testid="action-entity-view"
            has-divider
            :item="getViewDropdownItem(row.id)"
          />
        </PermissionsWrapper>
        <PermissionsWrapper :auth-function="() => canEdit(row)">
          <KDropdownItem
            data-testid="action-entity-edit"
            :item="getEditDropdownItem(row.id)"
          />
        </PermissionsWrapper>
        <PermissionsWrapper :auth-function="() => canDelete(row)">
          <KDropdownItem
            danger
            data-testid="action-entity-delete"
            has-divider
            @click="deleteRow(row)"
          >
            {{ t('actions.delete') }}
          </KDropdownItem>
        </PermissionsWrapper>
      </template>
    </EntityBaseTable>

    <EntityDeleteModal
      :action-pending="isDeletePending"
      :description="t('delete.description')"
      :entity-name="vaultToBeDeleted && (vaultToBeDeleted.prefix || vaultToBeDeleted.id)"
      :entity-type="EntityTypes.Vault"
      :error="deleteModalError"
      :title="t('delete.title')"
      :visible="isDeleteModalVisible"
      @cancel="hideDeleteModal"
      @proceed="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref, watch, onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosError } from 'axios'

import {
  EntityBaseTable,
  EntityDeleteModal,
  EntityFilter,
  EntityTypes,
  FetcherStatus,
  PermissionsWrapper,
  useAxios,
  useFetcher,
  useDeleteUrlBuilder,
} from '@kong-ui-public/entities-shared'

import type {
  BaseTableHeaders,
  EmptyStateOptions,
  ExactMatchFilterConfig,
  FilterFields,
  FuzzyMatchFilterConfig,
  TableErrorMessage,
} from '@kong-ui-public/entities-shared'

import composables from '../composables'
import endpoints from '../vaults-endpoints'

import type {
  KongManagerVaultListConfig,
  KonnectVaultListConfig,
  EntityRow,
  CopyEventPayload,
} from '../types'

import '@kong-ui-public/entities-shared/dist/style.css'

const emit = defineEmits<{
  (e: 'error', error: AxiosError): void,
  (e: 'copy:success', payload: CopyEventPayload): void,
  (e: 'copy:error', payload: CopyEventPayload): void,
  (e: 'delete:success', route: EntityRow): void,
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectVaultListConfig | KongManagerVaultListConfig>,
    required: true,
    validator: (config: KonnectVaultListConfig | KongManagerVaultListConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (!config.createRoute || !config.getViewRoute || !config.getEditRoute) return false
      if (config.app === 'kongManager' && !config.isExactMatch && !config.filterSchema) return false
      return true
    },
  },
  // used to override the default identifier for the cache entry
  cacheIdentifier: {
    type: String,
    default: '',
  },
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can create a new entity */
  canCreate: {
    type: Function as PropType<() => boolean | Promise<boolean>>,
    required: false,
    default: async () => true,
  },
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can delete a given entity */
  canDelete: {
    type: Function as PropType<(row: EntityRow) => boolean | Promise<boolean>>,
    required: false,
    default: async () => true,
  },
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can edit a given entity */
  canEdit: {
    type: Function as PropType<(row: EntityRow) => boolean | Promise<boolean>>,
    required: false,
    default: async () => true,
  },
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can retrieve (view details) a given entity */
  canRetrieve: {
    type: Function as PropType<(row: EntityRow) => boolean | Promise<boolean>>,
    required: false,
    default: async () => true,
  },
  /** default to false, setting to true will teleport the toolbar button to the destination in the consuming app */
  useActionOutside: {
    type: Boolean,
    default: false,
  },
})

const { i18n: { t } } = composables.useI18n()
const router = useRouter()

const { axiosInstance } = useAxios({
  headers: props.config?.requestHeaders,
})

/**
 * Table Headers
 */
const disableSorting = computed((): boolean => props.config.app !== 'kongManager' || !!props.config.disableSorting)
const fields: BaseTableHeaders = {
  prefix: { label: t('vaults.list.table_headers.prefix'), searchable: true, sortable: true },
  // it's "Vault Type" on display, but we still use "name" to fit API schema
  name: { label: t('vaults.list.table_headers.name'), searchable: true, sortable: true },
  description: { label: t('vaults.list.table_headers.description'), sortable: false },
  tags: { label: t('vaults.list.table_headers.tags'), sortable: false },
}
const tableHeaders: BaseTableHeaders = fields

/**
 * Fetcher & Filtering
 */
const fetcherBaseUrl = computed<string>(() => {
  let url = `${props.config.apiBaseUrl}${endpoints.list[props.config.app]}`

  if (props.config.app === 'konnect') {
    url = url
      .replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url
      .replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  return url
})

const filterQuery = ref<string>('')
const filterConfig = computed<InstanceType<typeof EntityFilter>['$props']['config']>(() => {
  const isExactMatch = (props.config.app === 'konnect' || props.config.isExactMatch)

  if (isExactMatch) {
    return {
      isExactMatch: true,
      placeholder: t('search.placeholder.konnect'),
    } as ExactMatchFilterConfig
  }

  const { prefix, name } = fields
  const filterFields: FilterFields = { name, prefix }

  return {
    isExactMatch: false,
    fields: filterFields,
    schema: props.config.filterSchema,
  } as FuzzyMatchFilterConfig
})

const fetcherCacheKey = ref<number>(1)

const { fetcher, fetcherState } = useFetcher(props.config, fetcherBaseUrl.value)

const clearFilter = (): void => {
  filterQuery.value = ''
}

const resetPagination = (): void => {
  // Increment the cache key on sort
  fetcherCacheKey.value++
}

/**
 * loading, Error, Empty state
 */
const errorMessage = ref<TableErrorMessage>(null)

/**
 * Copy ID action
 */
const copyId = (row: EntityRow, copyToClipboard: (val: string) => boolean): void => {
  const id = row.id as string

  if (!copyToClipboard(id)) {
    // Emit the error event for the host app
    emit('copy:error', {
      entity: row,
      field: 'id',
      message: t('errors.copy'),
    })

    return
  }

  // Emit the success event for the host app
  emit('copy:success', {
    entity: row,
    field: 'id',
    message: t('copy.success', { val: id }),
  })
}

/**
 * Copy JSON action
 */
const copyJson = (row: EntityRow, copyToClipboard: (val: string) => boolean): void => {
  const val = JSON.stringify(row)

  if (!copyToClipboard(val)) {
    // Emit the error event for the host app
    emit('copy:error', {
      entity: row,
      message: t('errors.copy'),
    })

    return
  }

  // Emit the success event for the host app
  emit('copy:success', {
    entity: row,
    message: t('copy.success_brief'),
  })
}

/**
 * Row Click + View Details action
 */
const rowClick = async (row: EntityRow): Promise<void> => {
  const isAllowed = await props.canRetrieve?.(row)

  if (!isAllowed) {
    return
  }

  router.push(props.config.getViewRoute(row.id as string))
}

// Render the view dropdown item as a router-link
const getViewDropdownItem = (id: string) => {
  return {
    label: t('actions.view'),
    to: props.config.getViewRoute(id),
  }
}

/**
 * Edit action
 */
// Render the edit dropdown item as a router-link
const getEditDropdownItem = (id: string) => {
  return {
    label: t('actions.edit'),
    to: props.config.getEditRoute(id),
  }
}

/**
 * Delete action
 */
const vaultToBeDeleted = ref<EntityRow | undefined>(undefined)
const isDeleteModalVisible = ref<boolean>(false)
const isDeletePending = ref<boolean>(false)
const deleteModalError = ref<string>('')

const buildDeleteUrl = useDeleteUrlBuilder(props.config, fetcherBaseUrl.value)

const deleteRow = (row: EntityRow): void => {
  vaultToBeDeleted.value = row
  isDeleteModalVisible.value = true
}

const hideDeleteModal = (): void => {
  isDeleteModalVisible.value = false
}

const confirmDelete = async (): Promise<void> => {
  if (!vaultToBeDeleted.value?.id) {
    return
  }

  isDeletePending.value = true

  try {
    await axiosInstance.delete(buildDeleteUrl(vaultToBeDeleted.value.id))

    isDeletePending.value = false
    isDeleteModalVisible.value = false
    fetcherCacheKey.value++

    // Emit the success event for the host app
    emit('delete:success', vaultToBeDeleted.value)
  } catch (error: any) {
    deleteModalError.value = error.response?.data?.message ||
      error.message ||
      t('errors.delete')

    // Emit the error event for the host app
    emit('error', error)
  } finally {
    isDeletePending.value = false
  }
}

const hasData = ref(true)

/**
 * Watchers
 */
watch(fetcherState, (state) => {
  // if table is empty, hide the teleported Create button
  if (state.status === FetcherStatus.NoResults) {
    hasData.value = false
  }

  if (state.status === FetcherStatus.Error) {
    errorMessage.value = {
      title: t('errors.general'),
    }
    if (state.error?.response?.data?.message) {
      errorMessage.value.message = state.error.response.data.message
    }
    // Emit the error for the host app
    emit('error', state.error)

    return
  }

  errorMessage.value = null
})

// Initialize the empty state options assuming a user does not have create permissions
// IMPORTANT: you must initialize this object assuming the user does **NOT** have create permissions so that the onBeforeMount hook can properly evaluate the props.canCreate function.
const emptyStateOptions = ref<EmptyStateOptions>({
  ctaPath: props.config.createRoute,
  ctaText: undefined,
  message: t('vaults.list.empty_state.description'),
  title: t('vaults.title'),
})

onBeforeMount(async () => {
  // Evaluate if the user has create permissions
  const userCanCreate = await props.canCreate()

  // If a user can create, we need to modify the empty state actions/messaging
  if (userCanCreate) {
    emptyStateOptions.value.title = t('vaults.list.empty_state.title')
    emptyStateOptions.value.ctaText = t('actions.create')
  }
})
</script>

<style lang="scss" scoped>
.kong-ui-entities-vaults-list {
  width: 100%;

  .kong-ui-entity-filter-input {
    width: 300px;
  }

  .table-content-overflow-wrapper {
    max-width: 60ch;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
