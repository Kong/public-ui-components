<template>
  <div class="kong-ui-entities-assets-list">
    <EntityBaseTable
      :cache-identifier="cacheIdentifier"
      :empty-state-options="emptyStateOptions"
      enable-entity-actions
      :error-message="errorMessage"
      :fetcher="fetcher"
      :fetcher-cache-key="fetcherCacheKey"
      pagination-type="offset"
      :preferences-storage-key="preferencesStorageKey"
      :query="filterQuery"
      :row-attributes="rowAttributes"
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
        <component
          :is="useActionOutside ? 'Teleport' : 'div'"
          :to="useActionOutside ? '#kong-ui-app-page-header-action-button' : undefined"
        >
          <PermissionsWrapper :auth-function="() => canCreate()">
            <!-- Hide Create button if table is empty -->
            <KButton
              v-show="hasData"
              appearance="primary"
              data-testid="toolbar-add-asset"
              icon="plus"
              :to="config.createRoute"
            >
              {{ t('assets.actions.add_asset') }}
            </KButton>
          </PermissionsWrapper>
        </component>
      </template>

      <!-- Column Formatting -->
      <template #name="{ rowValue }">
        <b>{{ getRowValue(rowValue) }}</b>
      </template>

      <template #type="{ row }">
        <b>{{ row.metadata.type }}</b>
      </template>

      <template #url="{ rowValue }">
        <b>{{ getRowValue(rowValue) }}</b>
      </template>

      <!-- Row actions -->
      <template #actions="{ row }">
        <KClipboardProvider v-slot="{ copyToClipboard }">
          <KDropdownItem
            data-testid="action-entity-copy-id"
            @click="copyId(row, copyToClipboard)"
          >
            {{ t('assets.actions.copy_id') }}
          </KDropdownItem>
        </KClipboardProvider>
        <KClipboardProvider v-slot="{ copyToClipboard }">
          <KDropdownItem
            data-testid="action-entity-copy-json"
            @click="copyJson(row, copyToClipboard)"
          >
            {{ t('assets.actions.copy_json') }}
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
        <PermissionsWrapper :auth-function="() => canCreatePlugin()">
          <KDropdownItem
            data-testid="action-entity-create-plugin"
            :item="getCreatePluginDropdownItem(row.id)"
          >
            {{ t('assets.actions.create_plugin') }}
          </KDropdownItem>
        </PermissionsWrapper>
        <PermissionsWrapper :auth-function="() => canDelete(row)">
          <KDropdownItem
            danger
            data-testid="action-entity-delete"
            has-divider
            @click="() => deleteRow(row)"
          >
            {{ t('assets.actions.delete') }}
          </KDropdownItem>
        </PermissionsWrapper>
      </template>
    </EntityBaseTable>

    <EntityDeleteModal
      :action-pending="isDeletePending"
      data-testid="delete-asset-modal"
      :description="t('assets.delete.description')"
      :entity-name="assetToBeDeleted && (assetToBeDeleted.username || assetToBeDeleted.custom_id || assetToBeDeleted.id)"
      :entity-type="EntityTypes.Asset"
      :error="deleteModalError"
      :title="t('assets.delete.title')"
      :visible="isDeleteModalVisible"
      @cancel="hideDeleteModal"
      @proceed="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  BaseTableHeaders,
  EmptyStateOptions,
  ExactMatchFilterConfig,
  FuzzyMatchFilterConfig,
  TableErrorMessage,
} from '@kong-ui-public/entities-shared'
import {
  EntityBaseTable,
  EntityDeleteModal,
  EntityFilter,
  EntityTypes,
  FetcherStatus,
  PermissionsWrapper,
  useAxios,
  useDeleteUrlBuilder,
  useFetcher,
} from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'
import type { AxiosError } from 'axios'
import type { PropType } from 'vue'
import { computed, onBeforeMount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import endpoints from '../assets-endpoints'
import composables from '../composables'
import type {
  CopyEventPayload,
  EntityRow,
  KongManagerAssetListConfig,
  KonnectAssetListConfig,
} from '../types'

const emit = defineEmits<{
  (e: 'error', error: AxiosError): void,
  (e: 'copy:success', payload: CopyEventPayload): void,
  (e: 'copy:error', payload: CopyEventPayload): void,
  (e: 'delete:success', asset: EntityRow): void,
  (e: 'add:success', assets: string[]): void,
  (e: 'remove:success', asset: EntityRow): void,
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectAssetListConfig | KongManagerAssetListConfig>,
    required: true,
    validator: (config: KonnectAssetListConfig | KongManagerAssetListConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (!config.createRoute || !config.getViewRoute || !config.getEditRoute) return false
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
  canCreatePlugin: {
    type: Function as PropType<() => boolean | Promise<boolean>>,
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
const fetcherCacheKey = ref<number>(1)
const preferencesStorageKey = 'kong-ui-entities-assets-list'

/**
 * Table Headers
 */
const fields: BaseTableHeaders = {
  name: { label: t('assets.list.table_headers.name') },
  type: { label: t('assets.list.table_headers.type') },
  url: { label: t('assets.list.table_headers.url') },
}
const tableHeaders: BaseTableHeaders = fields

const rowAttributes = (row: Record<string, any>) => ({
  'data-testid': row.username ?? row.custom_id ?? row.id,
})

/**
 * Fetcher & Filtering
 */
const fetcherBaseUrl = computed<string>(() => {
  let url = `${props.config.apiBaseUrl}${endpoints.list[props.config.app].all}`

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
      isExactMatch,
      placeholder: t(`assets.search.placeholder.${props.config.app}`),
    } as ExactMatchFilterConfig
  }

  return {
    isExactMatch,
    fields: {
      name: fields.name,
    },
    schema: props.config.filterSchema,
  } as FuzzyMatchFilterConfig
})

const { fetcher, fetcherState } = useFetcher(props.config, fetcherBaseUrl.value)

const clearFilter = (): void => {
  filterQuery.value = ''
}

const resetPagination = (): void => {
  // Increment the cache key on sort
  fetcherCacheKey.value++
}

const getRowValue = (val: any) => {
  return val ?? '-'
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
      message: t('assets.errors.copy'),
    })

    return
  }

  // Emit the success event for the host app
  emit('copy:success', {
    entity: row,
    field: 'id',
    message: t('assets.copy.success', { val: id }),
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
      message: t('assets.errors.copy'),
    })

    return
  }

  // Emit the success event for the host app
  emit('copy:success', {
    entity: row,
    message: t('assets.copy.success_brief'),
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

const getCreatePluginDropdownItem = (id: string) => {
  return {
    label: t('assets.actions.create_plugin'),
    to: props.config.getCreatePluginRoute(id),
  }
}

// Render the view dropdown item as a router-link
const getViewDropdownItem = (id: string) => {
  return {
    label: t('assets.actions.view'),
    to: props.config.getViewRoute(id),
  }
}

/**
 * Edit action
 */
// Render the edit dropdown item as a router-link
const getEditDropdownItem = (id: string) => {
  return {
    label: t('assets.actions.edit'),
    to: props.config.getEditRoute(id),
  }
}

/**
 * Delete action
 */
const assetToBeDeleted = ref<EntityRow | undefined>(undefined)
const isDeleteModalVisible = ref<boolean>(false)
const isDeletePending = ref<boolean>(false)
const deleteModalError = ref<string>('')

const buildDeleteUrl = useDeleteUrlBuilder(props.config, fetcherBaseUrl.value)

const deleteRow = (row: EntityRow): void => {
  assetToBeDeleted.value = row
  isDeleteModalVisible.value = true
}

const hideDeleteModal = (): void => {
  isDeleteModalVisible.value = false
}

const confirmDelete = async (): Promise<void> => {
  if (!assetToBeDeleted.value?.id) {
    return
  }

  isDeletePending.value = true

  try {
    await axiosInstance.delete(buildDeleteUrl(assetToBeDeleted.value.id))

    isDeletePending.value = false
    isDeleteModalVisible.value = false
    fetcherCacheKey.value++

    // Emit the success event for the host app
    emit('delete:success', assetToBeDeleted.value)
  } catch (error: any) {
    deleteModalError.value = error.response?.data?.message ||
      error.message ||
      t('assets.errors.delete')

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
  // reset `hasData` to show/hide the teleported Create button
  if (Array.isArray(state?.response?.data)) {
    hasData.value = state.response!.data.length > 0
  }

  if (state.status === FetcherStatus.Error) {
    errorMessage.value = {
      title: t('assets.errors.general'),
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
  message: t('assets.list.empty_state.description'),
  title: t('assets.title'),
})

onBeforeMount(async () => {
  // Evaluate if the user has create permissions
  const userCanCreate = await props.canCreate()

  // If a user can create assets, we need to modify the empty state actions/messaging
  if (userCanCreate) {
    emptyStateOptions.value.title = t('assets.list.empty_state.title')
    emptyStateOptions.value.ctaText = t('assets.actions.create')
  }
})
</script>

<style lang="scss" scoped>
.kong-ui-entities-assets-list {
  width: 100%;

  .message {
    margin-top: 0;
  }

  .kong-ui-entity-filter-input {
    width: 300px;
  }
}
</style>
