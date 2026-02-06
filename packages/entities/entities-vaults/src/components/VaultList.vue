<template>
  <div class="kong-ui-entities-vaults-list">
    <EntityBaseTable
      :cache-identifier="cacheIdentifier"
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
      @clear-search-input="clearFilter"
      @click:row="(row: any) => rowClick(row as EntityRow)"
      @sort="resetPagination"
      @state="handleStateChange"
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
        <Teleport
          :disabled="!useActionOutside"
          to="#kong-ui-app-page-header-action-button"
        >
          <div class="button-row">
            <KButton
              v-if="showHeaderLHButton"
              appearance="secondary"
              class="open-learning-hub"
              data-testid="vault-learn-more-button"
              icon
              @click="$emit('click:learn-more')"
            >
              <BookIcon decorative />
            </KButton>
            <PermissionsWrapper :auth-function="() => canCreate()">
              <!-- Hide Create button if table is empty -->
              <KButton
                appearance="primary"
                data-testid="toolbar-add-vault"
                :size="useActionOutside ? 'medium' : 'large'"
                :to="config.createRoute"
              >
                <AddIcon />
                {{ t('vaults.list.toolbar_actions.new_vault') }}
              </KButton>
            </PermissionsWrapper>
          </div>
        </Teleport>
      </template>

      <template
        v-if="!filterQuery && config.app === 'konnect'"
        #empty-state
      >
        <KEmptyState
          data-testid="vaults-entity-empty-state"
          icon-background
          :message="t('vaults.list.empty_state_v2.description')"
          :title="t('vaults.list.empty_state_v2.title')"
        >
          <template #icon>
            <SecurityIcon decorative />
          </template>

          <template
            v-if="config?.isControlPlaneGroup"
            #default
          >
            {{ t('vaults.list.empty_state_v2.group') }}
          </template>

          <template #action>
            <KButton
              v-if="userCanCreate"
              data-testid="entity-create-button"
              @click="handleCreate"
            >
              <AddIcon decorative />
              {{ t('vaults.list.empty_state_v2.create_cta') }}
            </KButton>

            <KButton
              appearance="secondary"
              data-testid="entity-learn-more-button"
              @click="$emit('click:learn-more')"
            >
              <BookIcon decorative />
              {{ t('vaults.list.empty_state_v2.learn_more') }}
            </KButton>
          </template>
        </KEmptyState>
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
        <TableTags :tags="rowValue" />
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
import { AddIcon, BookIcon, SecurityIcon } from '@kong/icons'

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
  useTableState,
  TableTags,
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
  (e: 'error', error: AxiosError): void
  (e: 'click:learn-more'): void
  (e: 'copy:success', payload: CopyEventPayload): void
  (e: 'copy:error', payload: CopyEventPayload): void
  (e: 'delete:success', route: EntityRow): void
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

const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)
const { hasRecords, handleStateChange } = useTableState(() => filterQuery.value)
// Current empty state logic is only for Konnect, KM will pick up at GA.
// If new empty states are enabled, show the learning hub button when the empty state is hidden (for Konnect)
// If new empty states are not enabled, show the learning hub button (for Konnect)
const showHeaderLHButton = computed((): boolean => hasRecords.value && props.config.app === 'konnect')

/**
 * Table Headers
 */
const disableSorting = computed((): boolean => props.config.app !== 'kongManager' || !!props.config.disableSorting)
const fields: BaseTableHeaders = {
  // the Prefix column is non-hidable
  prefix: { label: t('vaults.list.table_headers.prefix'), searchable: true, sortable: true, hidable: false },
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
  let url = `${props.config.apiBaseUrl}${endpoints.list[props.config.app].getAll}`

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
      placeholder: t('search.placeholder_for_vaults.konnect'),
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

const {
  fetcher,
  fetcherState,
  fetcherCacheKey,
} = useFetcher(computed(() => ({ ...props.config, cacheIdentifier: props.cacheIdentifier })), fetcherBaseUrl)

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
const copyId = async (row: EntityRow, copyToClipboard: (val: string) => Promise<boolean>): Promise<void> => {
  const id = row.id as string

  if (!await copyToClipboard(id)) {
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
const copyJson = async (row: EntityRow, copyToClipboard: (val: string) => Promise<boolean>): Promise<void> => {
  const val = JSON.stringify(row)

  if (!await copyToClipboard(val)) {
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

const deleteAssociatedConfigStore = async (configStoreId: string): Promise<void> => {
  const { apiBaseUrl, app, controlPlaneId } = (props.config as KonnectVaultListConfig)
  const url = `${apiBaseUrl}${endpoints.list[app].deleteConfigStore}`
    .replace(/{controlPlaneId}/gi, controlPlaneId || '')
    .replace(/{id}/gi, configStoreId)
  try {
    await axiosInstance.delete(url)
  } catch {
    // There is a rare case where more than 1 vaults are linked to the config store (i.e. created via API).
    // In this case, the deletion will fail but the UI can safely ignore the error.
  }
}

const confirmDelete = async (): Promise<void> => {
  if (!vaultToBeDeleted.value?.id) {
    return
  }

  isDeletePending.value = true

  try {
    await axiosInstance.delete(buildDeleteUrl(vaultToBeDeleted.value.id))

    if (props.config.app === 'konnect' && vaultToBeDeleted.value.config?.config_store_id) {
      deleteAssociatedConfigStore(vaultToBeDeleted.value.config.config_store_id)
    }

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

/**
 * Add New Vault
 */
const handleCreate = (): void => {
  router.push(props.config.createRoute)
}

/**
 * Watchers
 */
watch(fetcherState, (state) => {
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
  message: `${t('vaults.list.empty_state.description')}${props.config.additionMessageForEmptyState ? ` ${props.config.additionMessageForEmptyState}` : ''}`,
  title: t('vaults.title'),
})

const userCanCreate = ref<boolean>(false)

onBeforeMount(async () => {
  // Evaluate if the user has create permissions
  userCanCreate.value = await props.canCreate()

  // If a user can create, we need to modify the empty state actions/messaging
  if (userCanCreate.value) {
    emptyStateOptions.value.title = t('vaults.list.empty_state.title')
    emptyStateOptions.value.ctaText = t('actions.create')
  }
})
</script>

<style lang="scss" scoped>
.button-row {
  align-items: center;
  display: flex;
  gap: var(--kui-space-50, $kui-space-50);
}

.kong-ui-entities-vaults-list {
  width: 100%;

  .kong-ui-entity-filter-input {
    margin-right: var(--kui-space-50, $kui-space-50);
  }

  .table-content-overflow-wrapper {
    max-width: 60ch;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
