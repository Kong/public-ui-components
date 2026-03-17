<template>
  <div class="kong-ui-entities-partials-list">
    <EntityBaseTable
      :cache-identifier="cacheIdentifier"
      :disable-sorting="disableSorting"
      :empty-state-options="emptyStateOptions"
      enable-entity-actions
      :error-message="errorMessage"
      :fetcher="fetcher"
      :fetcher-cache-key="fetcherCacheKey"
      pagination-type="offset"
      preferences-storage-key="kong-ui-entities-redis-configuration-list"
      :query="filterQuery"
      :table-headers="tableHeaders"
      @clear-search-input="clearFilter"
      @click:row="(row: any) => rowClick(row as EntityRow)"
      @sort="refreshList"
    >
      <!-- Filter -->
      <template #toolbar-filter>
        <EntityFilter
          v-model="filterQuery"
          :config="filterConfig"
        />
        <PermissionsWrapper
          v-if="useToolbarCreationButton"
          :auth-function="canCreate"
        >
          <KButton
            :appearance="isKonnectManagedRedisEnabled ? 'secondary' : 'primary'"
            data-testid="toolbar-add-redis-configuration"
            size="large"
            :to="config.createRoute"
          >
            <AddIcon />
            {{ isKonnectManagedRedisEnabled ? t('list.action') : t('actions.create') }}
          </KButton>
        </PermissionsWrapper>
      </template>
      <!-- Create action -->
      <template #toolbar-button>
        <Teleport
          :disabled="!useActionOutside"
          to="#kong-ui-app-page-header-action-button"
        >
          <PermissionsWrapper
            v-if="!useToolbarCreationButton"
            :auth-function="canCreate"
          >
            <KButton
              appearance="primary"
              data-testid="toolbar-add-redis-configuration"
              size="large"
              :to="config.createRoute"
            >
              <AddIcon />
              {{ t('actions.create') }}
            </KButton>
          </PermissionsWrapper>
        </Teleport>
      </template>

      <!-- Column Formatting -->
      <template #name="{ rowValue }">
        <b>{{ rowValue ?? '-' }}</b>
      </template>
      <template #type="{ row }">
        {{ renderRedisType(row) }}
      </template>
      <template
        v-if="!isKonnectManagedRedisEnabled"
        #tags="{ rowValue }"
      >
        <TableTags :tags="rowValue" />
      </template>
      <template #plugins="{ row }">
        <LinkedPluginsInline
          v-if="!isKonnectManagedRedisEnabled || row.partial"
          :config="config"
          :partial-id="row.id"
          @click.stop="showLinkedPlugins(row.id)"
        />
        <span v-else>—</span>
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
        <PermissionsWrapper :auth-function="() => canRetrieve(row)">
          <KDropdownItem
            v-if="!isKonnectManagedRedisEnabled || row.partial"
            data-testid="action-entity-view"
            has-divider
            :item="getViewDropdownItem(row.id)"
          />
        </PermissionsWrapper>
        <PermissionsWrapper :auth-function="() => canEditRow(row)">
          <KDropdownItem
            v-if="!isKonnectManagedRedisEnabled || row.partial"
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

      <template
        #empty-state
      >
        <KEmptyState
          :action-button-text="emptyStateActionText"
          :action-button-visible="userCanCreate"
          data-testid="redis-entity-empty-state"
          :features="[
            {
              key: 'feature-1',
              title: t('list.empty_state.feature_1.title'),
              description: t('list.empty_state.feature_1.description'),
            },
            {
              key: 'feature-2',
              title: t('list.empty_state.feature_2.title'),
              description: t('list.empty_state.feature_2.description'),
            },
          ]"
          icon-background
          :message="emptyStateDescription"
          :title="emptyStateTitle"
          @click-action="handleCreate"
        >
          <template #icon>
            <DeployIcon decorative />
          </template>

          <template #feature-icon-feature-1>
            <ClipboardIcon />
          </template>

          <template #feature-icon-feature-2>
            <RefreshIcon />
          </template>

          <template #action-button-icon>
            <AddIcon decorative />
          </template>
        </KEmptyState>
      </template>
    </EntityBaseTable>

    <DeleteWarningModal
      :visible="isRemoveLinksModalVisible"
      @close="isRemoveLinksModalVisible = false"
    />

    <EntityDeleteModal
      :action-pending="isDeletePending"
      :description="t('delete.description')"
      :entity-name="entityToBeDeleted && (entityToBeDeleted.name || entityToBeDeleted.id)"
      :entity-type="EntityTypes.RedisConfiguration"
      :error="deleteModalError"
      :need-confirmation="true"
      :title="t('delete.title')"
      :visible="isDeleteModalVisible"
      @cancel="hideDeleteModal"
      @proceed="confirmDelete"
    />

    <LinkedPluginListModal
      :config="config"
      :redis-configuration-id="idToBeViewedPlugins"
      :visible="linkedPluginsModalVisible"
      @cancel="linkedPluginsModalVisible = false"
      @proceed="linkedPluginsModalVisible = false"
      @view-plugin="(param) => emit('click:plugin', param)"
    />
  </div>
</template>

<script setup lang="ts">
import {
  EntityBaseTable,
  EntityFilter,
  useFetcher,
  PermissionsWrapper,
  EntityTypes,
  useAxios,
  useDeleteUrlBuilder,
  EntityDeleteModal,
  FetcherStatus,
  TableTags,
} from '@kong-ui-public/entities-shared'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { AddIcon, RefreshIcon, DeployIcon, ClipboardIcon } from '@kong/icons'

import endpoints from '../partials-endpoints'
import composables from '../composables'
import { getRedisType } from '../helpers'
import { PartialType, RedisType } from '../types'
import LinkedPluginsInline from './LinkedPluginsInline.vue'
import LinkedPluginListModal from './LinkedPluginListModal.vue'
import { useLinkedPluginsFetcher } from '../composables/useLinkedPlugins'
import DeleteWarningModal from './DeleteWarningModal.vue'

import type { PropType } from 'vue'
import type {
  KonnectRedisConfigurationListConfig,
  KongManagerRedisConfigurationListConfig,
  EntityRow,
  RedisConfigurationFields,
  CopyEventPayload,
  RedisConfigurationResponse,
} from '../types'
import type { BaseTableHeaders, EmptyStateOptions, ExactMatchFilterConfig, FilterFields, FuzzyMatchFilterConfig, TableErrorMessage, FetcherResponse } from '@kong-ui-public/entities-shared'
import type { AxiosError } from 'axios'
import type { TableDataFetcherParams } from '@kong/kongponents'

const emit = defineEmits<{
  (e: 'click:learn-more'): void
  (e: 'click:plugin', param: { id: string, plugin: string }): void
  (e: 'copy:error', payload: CopyEventPayload): void
  (e: 'copy:success', payload: CopyEventPayload): void
  (e: 'delete:success', key: EntityRow): void
  (e: 'error', error: AxiosError): void
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectRedisConfigurationListConfig | KongManagerRedisConfigurationListConfig>,
    required: true,
    validator: (config: KonnectRedisConfigurationListConfig | KongManagerRedisConfigurationListConfig): boolean => {
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
  /** default to false, setting to true will place create button on top right of list */
  useToolbarCreationButton: {
    type: Boolean,
    default: false,
  },
})

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

const linkedPluginsModalVisible = ref<boolean>(false)
const idToBeViewedPlugins = ref<string>('')
/**
 * loading, Error, Empty state
 */
const errorMessage = ref<TableErrorMessage>(null)

const entityToBeDeleted = ref<EntityRow | undefined>(undefined)
const isDeleteModalVisible = ref<boolean>(false)
const isDeletePending = ref<boolean>(false)
const deleteModalError = ref<string>('')

const isRemoveLinksModalVisible = ref<boolean>(false)

const buildDeleteUrl = useDeleteUrlBuilder(props.config, fetcherBaseUrl.value)

/** True when list shows both Koko partials and Cloud Gateways managed-cache add-ons (Konnect only) */
const isKonnectManagedRedisEnabled = computed<boolean>(() =>
  props.config.app === 'konnect' && !!(props.config as KonnectRedisConfigurationListConfig).isKonnectManagedRedisEnabled,
)

const fetcherCacheKey = ref<number>(1)
const disableSorting = computed((): boolean => props.config.app !== 'kongManager' || !!props.config.disableSorting)

const { fetcher: rawFetcher, fetcherState } = useFetcher(props.config, fetcherBaseUrl)

// the API returns all partials, so we have to set a high page size to filter them on the frontend
const partialsPageSize = 1000

// Cloud Gateways add-ons API limits page size at 100
const addOnsPageSize = 100

type ManagedCacheAddOn = {
  id: string
  config?: {
    state_metadata?: {
      cache_config_id?: string
      control_plane_id?: string
    }
  }
}

const isRedisPartial = (item: RedisConfigurationResponse): boolean =>
  item.type === PartialType.REDIS_CE || item.type === PartialType.REDIS_EE

/**
* a hack to filter out non-redis configurations from the list,
* this is needed because the API returns all partials, not just redis configurations.
*/
const fetcher = async (params: TableDataFetcherParams): Promise<FetcherResponse> => {
  // Legacy Konnect/ KM: use the existing partials-only fetcher
  if (!isKonnectManagedRedisEnabled.value) {
    const res = await rawFetcher({ ...params, pageSize: partialsPageSize })
    res.data = res.data.filter(isRedisPartial)
    return res
  }

  // Konnect managed Redis: combine partials from Koko with managed-cache add-ons from Cloud Gateways
  try {
    errorMessage.value = null

    // Fetch partials
    const partialsRes = await rawFetcher({ ...params, pageSize: partialsPageSize })
    const partials: RedisConfigurationResponse[] = partialsRes.data.filter(isRedisPartial)

    // Fetch managed-cache add-ons for this CP from Cloud Gateways
    const konnectConfig = props.config as KonnectRedisConfigurationListConfig
    const cloudGatewaysBase = konnectConfig.cloudGatewaysApiBaseUrl ?? props.config.apiBaseUrl
    const addOnsUrl = `${cloudGatewaysBase}/v2/cloud-gateways/add-ons`

    let addOns: ManagedCacheAddOn[] = []
    try {
      const addOnsResponse = await axiosInstance.get(addOnsUrl, {
        params: {
          'page[size]': addOnsPageSize,
          'page[number]': 1,
        },
      })
      addOns = (addOnsResponse.data?.data ?? []) as ManagedCacheAddOn[]
    } catch {
      // no op - if the add-ons can't be fetched, we still show the partials self-managed Redis
    }

    // Join add-ons to partials via state_metadata.cache_config_id === partial.id
    // Konnect managed vs self-managed is derived from BE: when partial has tags, it is Konnect-managed
    const rows: EntityRow[] = partials.map((partial) => {
      const matchingAddOn = addOns.find((addOn) =>
        addOn.config?.state_metadata?.cache_config_id === partial.id,
      )
      const hasTags = Array.isArray(partial.tags) && partial.tags.length > 0
      const source: EntityRow['source'] = hasTags ? 'konnect-managed' : 'self-managed'

      if (matchingAddOn) {
        return {
          ...partial,
          id: partial.id,
          name: partial.name,
          source,
          partial,
          addOn: {
            id: matchingAddOn.id,
            config: matchingAddOn.config,
          },
        }
      }

      return {
        ...partial,
        id: partial.id,
        name: partial.name,
        source,
        partial,
      }
    })

    // When a managed-cache add-on is being created, Cloud Gateways creates the add-on first and only later provisions the Redis partial in Koko. During that window
    // state_metadata.cache_config_id is empty, so the join above won't find a match and the Redis partial will not yet exist. To avoid showing an empty list while the cache
    // initializes, we surface a placeholder row derived from that `initializing` add-on until a real partial appears
    const partialIds = new Set(partials.map(partial => partial.id))
    const initializingAddOns = addOns
      // Cloud Gateways API doesn't support filtering so filter client-side for managed-cache add-ons that belong to this CP
      .filter(addOn =>
        (addOn.config as any)?.kind === 'managed-cache.v0' &&
        addOn.config?.state_metadata?.control_plane_id === konnectConfig.controlPlaneId,
      )
      .filter(addOn => !addOn.config?.state_metadata?.cache_config_id)

    const placeholderRows: EntityRow[] = initializingAddOns
      // Doon't create a placeholder if we already have a partial row
      .filter(addOn => !partialIds.has(addOn.id))
      .map((addOn) => ({
        // Use the add-on id as a stable row id while the partial is not yet created
        id: addOn.id,
        name: addOn.id,
        source: 'konnect-managed',
        partial: undefined,
        addOn,
      }))

    const allRows = [...rows, ...placeholderRows]

    return {
      data: allRows,
      total: partialsRes.total ?? allRows.length,
    }
  } catch (error: any) {
    errorMessage.value = { title: t('errors.general'), message: error.response?.data?.message ?? error.message }
    emit('error', error)
    return { data: [], total: 0 }
  }
}

const { i18n: { t } } = composables.useI18n()
const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)
const router = useRouter()

const filterQuery = ref<string>('')

const emptyStateDescription = computed<string>(() => {
  // When managed Redis is enabled in Konnect, use the expanded onboarding message
  if (props.config.app === 'konnect' && isKonnectManagedRedisEnabled.value) {
    return t('list.empty_state.description_with_managed_konnect')
  }

  return t('list.empty_state.description')
})

const emptyStateTitle = computed<string>(() => {
  if (props.config.app === 'konnect' && isKonnectManagedRedisEnabled.value) {
    return t('redis.empty_state.title_with_managed_konnect')
  }

  return t('redis.title')
})

const emptyStateActionText = computed<string>(() => {
  if (props.config.app === 'konnect' && isKonnectManagedRedisEnabled.value) {
    return t('list.action_with_managed_konnect')
  }

  return t('list.action')
})

const filterConfig = computed<InstanceType<typeof EntityFilter>['$props']['config']>(() => {
  const isExactMatch = (props.config.app === 'konnect' || props.config.isExactMatch)

  if (isExactMatch) {
    return {
      isExactMatch: true,
      placeholder: t('search.placeholder_for_exact_match'),
    } as ExactMatchFilterConfig
  }

  const { name } = tableHeaders.value
  const filterFields: FilterFields = {
    name,
  }

  return {
    isExactMatch,
    fields: filterFields,
    schema: props.config.filterSchema,
  } as FuzzyMatchFilterConfig
})

const { fetcher: fetchLinks } = useLinkedPluginsFetcher(props.config)

// Initialize the empty state options assuming a user does not have create permissions
// IMPORTANT: you must initialize this object assuming the user does **NOT** have create permissions so that the onBeforeMount hook can properly evaluate the props.canCreate function.
const emptyStateOptions = ref<EmptyStateOptions>({
  ctaPath: props.config.createRoute,
  ctaText: undefined,
  message: `${emptyStateDescription.value}${props.config.additionMessageForEmptyState ? ` ${props.config.additionMessageForEmptyState}` : ''}`,
  title: emptyStateTitle.value,
})

const tableHeaders = computed<BaseTableHeaders>(() => ({
  name: { label: t('list.table_headers.name'), searchable: true, hidable: false, sortable: true },
  type: { label: t('list.table_headers.type') },
  ...(!isKonnectManagedRedisEnabled.value && { tags: { label: t('list.table_headers.tags') } }),
  plugins: { label: t('list.table_headers.plugins') },
}))

const getViewDropdownItem = (id: string) => ({
  label: t('actions.view'),
  to: props.config.getViewRoute(id),
})

const getEditDropdownItem = (id: string) => ({
  label: t('actions.edit'),
  to: props.config.getEditRoute(id),
})

// Row can not be edited for Konnect-managed otherwise follow canEdit prop
const canEditRow = async (row: EntityRow): Promise<boolean> => {
  if (isKonnectManagedRedisEnabled.value && row.source === 'konnect-managed') {
    return false
  }
  return props.canEdit(row)
}

const deleteRow = async (row: EntityRow) => {
  // Konnect-managed: skip client-side links check; Cloud Gateways add-ons API will return error if partial still in use
  if (isKonnectManagedRedisEnabled.value && row.source === 'konnect-managed') {
    entityToBeDeleted.value = row
    isDeleteModalVisible.value = true
    return
  }
  // check if the partial still has plugins linked to it
  const { count } = await fetchLinks({ partialId: row.id as string })
  if (count > 0) {
    // show warning modal
    isRemoveLinksModalVisible.value = true
  } else {
    // show delete modal
    entityToBeDeleted.value = row
    isDeleteModalVisible.value = true
  }
}

const clearFilter = (): void => {
  filterQuery.value = ''
}

const rowClick = async (row: EntityRow): Promise<void> => {
  // In combined Konnect-managed mode we can only navigate to details once the underlying Redis partial exists; placeholder rows from add-ons don't yet
  // have a valid details route.
  if (isKonnectManagedRedisEnabled.value && !row.partial) {
    return
  }

  const isAllowed = await props.canRetrieve?.(row)

  if (!isAllowed) {
    return
  }

  router.push(props.config.getViewRoute(row.id as string))
}

const hideDeleteModal = (): void => {
  isDeleteModalVisible.value = false
}

const showLinkedPlugins = (id: string): void => {
  idToBeViewedPlugins.value = id
  linkedPluginsModalVisible.value = true
}

const confirmDelete = async (): Promise<void> => {
  if (!entityToBeDeleted.value?.id) {
    return
  }

  isDeletePending.value = true
  deleteModalError.value = ''

  try {
    if (isKonnectManagedRedisEnabled.value && entityToBeDeleted.value.source === 'konnect-managed' && entityToBeDeleted.value.addOn?.id) {
      // Konnect-managed: delete the managed cache add-on via Cloud Gateways API
      const konnectConfig = props.config as KonnectRedisConfigurationListConfig
      const cloudGatewaysBase = konnectConfig.cloudGatewaysApiBaseUrl ?? props.config.apiBaseUrl
      const addOnDeleteUrl = `${cloudGatewaysBase}/v2/cloud-gateways/add-ons/${entityToBeDeleted.value.addOn.id}`
      await axiosInstance.delete(addOnDeleteUrl)
    } else {
      // Legacy Konnect or KM: delete the underlying partial as before
      await axiosInstance.delete(buildDeleteUrl(entityToBeDeleted.value.id))
    }

    isDeletePending.value = false
    isDeleteModalVisible.value = false
    refreshList()

    // Emit the success event for the host app
    emit('delete:success', entityToBeDeleted.value)
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

const refreshList = (): void => {
  // Increment the cache key on sort
  fetcherCacheKey.value++
}

// Type label from partial's Redis type (type + config). Used for self-managed rows in combined list
const getRedisTypeLabelFromPartial = (fields: RedisConfigurationFields): string => {
  const redisType = getRedisType(fields)
  switch (redisType) {
    case RedisType.HOST_PORT_CE:
      return `${t('form.options.type.host_port')} - ${t('form.options.type.open_source')}`
    case RedisType.HOST_PORT_EE:
      return `${t('form.options.type.host_port')} - ${t('form.options.type.enterprise')}`
    case RedisType.SENTINEL:
      return `${t('form.options.type.sentinel')} - ${t('form.options.type.enterprise')}`
    case RedisType.CLUSTER:
      return `${t('form.options.type.cluster')} - ${t('form.options.type.enterprise')}`
    default:
      return '—'
  }
}

const renderRedisType = (item: RedisConfigurationFields | EntityRow): string => {
  const fields = (item as EntityRow).partial ?? item
  if (!fields || typeof (fields as Record<string, unknown>).type === 'undefined') {
    return '—'
  }
  const typedFields = fields as RedisConfigurationFields
  const redisType = getRedisType(typedFields)
  const typeLabelFromPartial = getRedisTypeLabelFromPartial(typedFields)

  if (isKonnectManagedRedisEnabled.value && (item as EntityRow).source) {
    return (item as EntityRow).source === 'konnect-managed'
      ? t('list.type.konnect_managed_redis')
      : `${t('list.type.self_managed_redis')} (${typeLabelFromPartial})`
  }
  // Single-source list: show type with Open Source / Enterprise suffix
  const suffix = redisType === RedisType.HOST_PORT_CE
    ? t('form.options.type.suffix_open_source')
    : t('form.options.type.suffix_enterprise')
  const baseLabel = redisType === RedisType.HOST_PORT_CE || redisType === RedisType.HOST_PORT_EE
    ? t('form.options.type.host_port')
    : redisType === RedisType.SENTINEL
      ? t('form.options.type.sentinel')
      : t('form.options.type.cluster')
  return `${baseLabel}${suffix}`
}

const handleCreate = (): void => {
  router.push(props.config.createRoute)
}

/**
 * Copy ID action
 */
const copyId = async (row: EntityRow, copyToClipboard: (val: string) => Promise<boolean>): Promise<void> => {
  const id = row.id as string

  if (!await copyToClipboard(id)) {
    // Emit the error event for the host app
    emit('copy:error', {
      entity: row as any,
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

const userCanCreate = ref<boolean>(false)

watch(props.canCreate, async (canCreate) => {
  // Evaluate if the user has create permissions
  userCanCreate.value = await canCreate

  // If a user can create, we need to modify the empty state actions/messaging
  if (userCanCreate.value) {
    emptyStateOptions.value.ctaText = emptyStateActionText.value
  } else {
    emptyStateOptions.value.ctaText = undefined
  }
}, {
  immediate: true,
})
</script>

<style lang="scss" scoped>
.kong-ui-entities-partials-list {
  width: 100%;

  .kong-ui-entity-filter-input {
    margin-right: $kui-space-70;
  }
}
</style>
