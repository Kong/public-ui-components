<template>
  <EntityBaseTable
    :cache-identifier="cacheIdentifier"
    disable-sorting
    :empty-state-options="emptyStateOptions"
    enable-entity-actions
    :error-message="errorMessage"
    :fetcher="fetcher"
    :fetcher-cache-key="fetcherCacheKey"
    pagination-type="offset"
    preferences-storage-key="kong-ui-entities-secrets-list"
    :query="filterQuery"
    :row-attributes="rowAttrs"
    :table-headers="tableHeaders"
    @clear-search-input="clearFilter"
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
      <PermissionsWrapper :auth-function="() => canCreate()">
        <!-- Hide Create button if table is empty -->
        <KButton
          appearance="primary"
          data-testid="toolbar-add-secret"
          size="large"
          :to="config.createRoute"
        >
          <AddIcon />
          {{ t('secrets.list.toolbar_actions.new_secret') }}
        </KButton>
      </PermissionsWrapper>
    </template>

    <!-- Column Formatting -->
    <template #key="{ rowValue }">
      <div class="table-content-overflow-wrapper">
        <b>{{ rowValue ?? '-' }}</b>
      </div>
    </template>
    <template #updated_at="{ rowValue }">
      <span>{{ rowValue ? formatUnixTimeStamp(new Date(rowValue).getTime() / 1000) : '-' }}</span>
    </template>

    <!-- Row actions -->
    <template #actions="{ row }">
      <PermissionsWrapper :auth-function="() => canEdit(row)">
        <KDropdownItem
          data-testid="action-entity-edit"
          :item="getEditDropdownItem(row.key)"
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
    :entity-name="secretToBeDeleted && secretToBeDeleted.key"
    :entity-type="EntityTypes.Secret"
    :error="deleteModalError"
    :title="t('delete.title_for_secret')"
    :visible="isDeleteModalVisible"
    @cancel="hideDeleteModal"
    @proceed="confirmDelete"
  />
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref, watch, onBeforeMount } from 'vue'
import type { AxiosError } from 'axios'
import { AddIcon } from '@kong/icons'

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
  TableErrorMessage,
} from '@kong-ui-public/entities-shared'

import composables from '../composables'
import endpoints from '../secrets-endpoints'

import type {
  KonnectSecretListConfig,
  SecretEntityRow,
} from '../types'

import '@kong-ui-public/entities-shared/dist/style.css'

defineOptions({
  inheritAttrs: false,
})

const emit = defineEmits<{
  (e: 'error', error: AxiosError): void
  (e: 'delete:success', route: SecretEntityRow): void
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectSecretListConfig>,
    required: true,
    validator: (config: KonnectSecretListConfig): boolean => {
      if (!config || config?.app !== 'konnect') return false
      if (!config.createRoute || !config.getEditRoute) return false
      return true
    },
  },
  // The config store id for the secrets
  configStoreId: {
    type: String,
    required: true,
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
    type: Function as PropType<(row: SecretEntityRow) => boolean | Promise<boolean>>,
    required: false,
    default: async () => true,
  },
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can edit a given entity */
  canEdit: {
    type: Function as PropType<(row: SecretEntityRow) => boolean | Promise<boolean>>,
    required: false,
    default: async () => true,
  },
})

const { i18n: { t, formatUnixTimeStamp } } = composables.useI18n()

const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)

/**
 * Table Headers
 */
const fields: BaseTableHeaders = {
  // the Secret Key column is non-hidable
  key: { label: t('secrets.list.table_headers.key'), sortable: false, hidable: false },
  updated_at: { label: t('secrets.list.table_headers.updated_at'), sortable: false },
}
const tableHeaders: BaseTableHeaders = fields

const rowAttrs = (row: Record<string, any>) => ({
  'data-testid': row.key,
})

/**
 * Fetcher & Filtering
 */
const fetcherBaseUrl = computed<string>(() => {
  return `${props.config.apiBaseUrl}${endpoints.list[props.config.app]}`
    .replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
    .replace(/{id}/gi, props.configStoreId || '')
})

const filterQuery = ref<string>('')
const filterConfig: ExactMatchFilterConfig = {
  isExactMatch: true,
  placeholder: t('search.placeholder_for_secrets.konnect'),
}

const {
  fetcher,
  fetcherState,
  fetcherCacheKey,
} = useFetcher(computed(() => ({ ...props.config, cacheIdentifier: props.cacheIdentifier })), fetcherBaseUrl)

const clearFilter = (): void => {
  filterQuery.value = ''
}

/**
 * loading, Error, Empty state
 */
const errorMessage = ref<TableErrorMessage>(null)

/**
 * Edit action
 */
// Render the edit dropdown item as a router-link
const getEditDropdownItem = (key: string) => {
  return {
    label: t('actions.edit'),
    to: props.config.getEditRoute(key),
  }
}

/**
 * Delete action
 */
const secretToBeDeleted = ref<SecretEntityRow | undefined>(undefined)
const isDeleteModalVisible = ref<boolean>(false)
const isDeletePending = ref<boolean>(false)
const deleteModalError = ref<string>('')

const buildDeleteUrl = useDeleteUrlBuilder(props.config, fetcherBaseUrl.value)

const deleteRow = (row: SecretEntityRow): void => {
  secretToBeDeleted.value = row
  isDeleteModalVisible.value = true
}

const hideDeleteModal = (): void => {
  isDeleteModalVisible.value = false
}

const confirmDelete = async (): Promise<void> => {
  if (!secretToBeDeleted.value?.key) {
    return
  }

  isDeletePending.value = true

  try {
    await axiosInstance.delete(buildDeleteUrl(secretToBeDeleted.value.key))

    isDeletePending.value = false
    isDeleteModalVisible.value = false
    fetcherCacheKey.value++

    // Emit the success event for the host app
    emit('delete:success', secretToBeDeleted.value)
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
  message: `${t('secrets.list.empty_state.description')}${props.config.additionMessageForEmptyState ? ` ${props.config.additionMessageForEmptyState}` : ''}`,
  title: t('secrets.title'),
})

onBeforeMount(async () => {
  // Evaluate if the user has create permissions
  const userCanCreate = await props.canCreate()

  // If a user can create, we need to modify the empty state actions/messaging
  if (userCanCreate) {
    emptyStateOptions.value.title = t('secrets.list.empty_state.title')
    emptyStateOptions.value.ctaText = t('secrets.list.toolbar_actions.new_secret')
  }
})
</script>

<style lang="scss" scoped>
.kong-ui-entity-filter-input {
  margin-right: var(--kui-space-50, $kui-space-50);
}

.table-content-overflow-wrapper {
  max-width: 60ch;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
