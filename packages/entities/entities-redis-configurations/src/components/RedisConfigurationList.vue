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
            :appearance="useKonnectManagedRedisUi ? 'secondary' : 'primary'"
            data-testid="toolbar-add-redis-configuration"
            size="large"
            :to="config.createRoute"
          >
            <AddIcon />
            {{ useKonnectManagedRedisUi ? t('list.action') : t('actions.create') }}
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
        <b>{{ rowValue ?? '' }}</b>
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
        <span v-else />
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
            :disabled="isDeleteDisabled(row)"
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
import { computed, onBeforeUnmount, ref, watch } from 'vue'
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
  ManagedCacheAddOn,
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
  props.config.app === 'konnect' &&
  !!(props.config as KonnectRedisConfigurationListConfig).isKonnectManagedRedisEnabled &&
  // Konnect-managed Redis is only supported for Cloud Gateways
  // Other gateway types must keep using the legacy partials flow
  (props.config as KonnectRedisConfigurationListConfig).isCloudGateway !== false,
)

const useKonnectManagedRedisUi = computed<boolean>(() => {
  if (props.config.app !== 'konnect') {
    return false
  }

  const konnectConfig = props.config as KonnectRedisConfigurationListConfig

  // Keep backward compatibility: if UI-only flag is omitted, follow behavior flag
  if (typeof konnectConfig.useKonnectManagedRedisUi === 'boolean') {
    return konnectConfig.useKonnectManagedRedisUi
  }

  return !!konnectConfig.isKonnectManagedRedisEnabled
})

const cloudGatewaysBase = computed<string>(() => {
  const konnectConfig = props.config as KonnectRedisConfigurationListConfig
  return konnectConfig.cloudGatewaysApiBaseUrl ?? props.config.apiBaseUrl
})

const fetcherCacheKey = ref<number>(1)
const disableSorting = computed((): boolean => props.config.app !== 'kongManager' || !!props.config.disableSorting)

const { fetcher: rawFetcher, fetcherState } = useFetcher(props.config, fetcherBaseUrl)

// the API returns all partials, so we have to set a high page size to filter them on the frontend
const partialsPageSize = 1000

// Cloud Gateways add-ons API limits page size at 100
const addOnsPageSize = 100
const maxAddOnPagesFallback = 1000

const isRedisPartial = (item: RedisConfigurationResponse): boolean =>
  item.type === PartialType.REDIS_CE || item.type === PartialType.REDIS_EE

type ManagedCacheStateMetadata = { cache_config_id?: string }
type ManagedCacheConfigShape = { state_metadata?: ManagedCacheStateMetadata }

const getCacheConfigId = (addOn: ManagedCacheAddOn): string | undefined => {
  const managedCacheConfig = (addOn.config ?? addOn.attributes) as ManagedCacheConfigShape | undefined
  const meta = managedCacheConfig?.state_metadata ?? addOn.state_metadata
  return meta?.cache_config_id
}

// Cloud Gateways list filter contract
const isManagedCacheAddOn = (addOn: ManagedCacheAddOn): boolean => {
  const kind = addOn.config?.kind ?? addOn.attributes?.kind
  return kind === 'managed-cache.v0'
}

const isTerminatingState = (state?: string): boolean =>
  typeof state === 'string' && state.trim().toLowerCase() === 'terminating'

// Fetch one managed-cache add-on by id - use this when the user searches by add-on id (while cache is still provisioning) and Koko doesn't have a partial for that id
const fetchManagedAddOnById = async (managedCacheAddOnId: string): Promise<ManagedCacheAddOn | null> => {
  const konnectConfig = props.config as KonnectRedisConfigurationListConfig
  const singleAddOnUrl = `${cloudGatewaysBase.value}/v2/cloud-gateways/add-ons/${encodeURIComponent(managedCacheAddOnId)}`

  try {
    const addOnResponse = await axiosInstance.get(singleAddOnUrl)
    const addOnData = addOnResponse.data

    const parsedAddOn = addOnData && typeof addOnData === 'object' && !Array.isArray(addOnData)
      ? (addOnData as ManagedCacheAddOn)
      : null
    if (!parsedAddOn?.id || !isManagedCacheAddOn(parsedAddOn)) {
      return null
    }

    const controlPlaneIdOnAddOn = parsedAddOn.owner?.control_plane_id

    // Keep the list scoped to selected CP
    if (controlPlaneIdOnAddOn != null && controlPlaneIdOnAddOn !== konnectConfig.controlPlaneId) {
      return null
    }

    return parsedAddOn
  } catch (error: any) {
    const httpStatus = error.response?.status ?? error.status

    if (httpStatus === 404) {
      // Treat "not found" as "no match" so the table shows an empty/no-results state instead of an error.
      return null
    }
    throw error
  }
}

const fetchRedisPartialById = async (kokoPartialId: string): Promise<RedisConfigurationResponse | null> => {
  // When the user searches by add-on id, use `cache_config_id` to fetch the matching Koko partial
  const singlePartialUrl = `${fetcherBaseUrl.value}/${encodeURIComponent(kokoPartialId)}`

  try {
    const partialResponse = await axiosInstance.get(singlePartialUrl)
    const responseBody = partialResponse.data

    // Koko can return the partial in different ways, normalize it into a single object for join logic
    let entityFromResponse: unknown = responseBody?.data ?? responseBody

    if (Array.isArray(entityFromResponse)) {
      entityFromResponse = entityFromResponse[0]
    }

    if (!entityFromResponse || typeof entityFromResponse !== 'object') {
      return null
    }

    const maybeRedisPartial = entityFromResponse as RedisConfigurationResponse

    return isRedisPartial(maybeRedisPartial) ? maybeRedisPartial : null
  } catch (error: any) {
    const httpStatus = error.response?.status ?? error.status

    if (httpStatus === 404) {
      // Partial isn't available yet/id is wrong— treat as no result and keep the list usable
      return null
    }
    throw error
  }
}

const doesRowMatchExactListSearch = (tableRow: EntityRow, searchText: string): boolean => {
  // Row id is the Koko partial id once cache exists
  if (tableRow.id === searchText) {
    return true
  }

  // While Koko partial doesn't exist yet, row uses Cloud Gateways add-on id as its id
  if (tableRow.addOn?.id === searchText) {
    return true
  }

  const kokoPartialIdFromAddOn = tableRow.addOn ? getCacheConfigId(tableRow.addOn) : undefined

  return !!kokoPartialIdFromAddOn && kokoPartialIdFromAddOn === searchText
}

const fetchAllAddOns = async (): Promise<ManagedCacheAddOn[]> => {
  const addOnsUrl = `${cloudGatewaysBase.value}/v2/cloud-gateways/add-ons`
  const allAddOns: ManagedCacheAddOn[] = []
  const konnectConfig = props.config as KonnectRedisConfigurationListConfig
  let pageNumber = 1
  let totalPagesFromMeta: number | null = null

  // If meta is missing, stop on the first short page; otherise continue until meta total pages are reached
  while (pageNumber <= maxAddOnPagesFallback) {
    const addOnsResponse = await axiosInstance.get(addOnsUrl, {
      params: {
        'page[size]': addOnsPageSize,
        'page[number]': pageNumber,
        'config.kind': 'managed-cache.v0',
        'owner.control_plane_id': konnectConfig.controlPlaneId,
        ...(konnectConfig.controlPlaneGeo ? { 'owner.control_plane_geo': konnectConfig.controlPlaneGeo } : {}),
      },
    })

    const raw = addOnsResponse.data?.data ?? addOnsResponse.data
    const pageItems = Array.isArray(raw) ? (raw as ManagedCacheAddOn[]) : []
    const totalPages = addOnsResponse.data?.meta?.page?.total_pages as number | undefined

    allAddOns.push(...pageItems)

    if (typeof totalPages === 'number' && Number.isFinite(totalPages) && totalPages > 0) {
      totalPagesFromMeta = totalPages
    }

    // Stop when either explicit total pages from meta reached or small page response
    if ((totalPagesFromMeta != null && pageNumber >= totalPagesFromMeta) ||
      !Array.isArray(raw) ||
      pageItems.length < addOnsPageSize) {
      break
    }

    pageNumber++
  }

  return allAddOns
}

// Merged rows used to follow this order (partials, then placeholders, then unlinked add-ons), so items moved when
// provisioning finished or during delete transitions. Sort by created_at when both rows have one (managed: add-on date, then
// partial), then name, then id
const getRedisListRowSortTimeMs = (row: EntityRow): number | null => {
  const primary = row.addOn?.created_at
  const fallback = typeof row.created_at === 'string' ? row.created_at : undefined
  const candidates = row.addOn != null ? [primary, fallback] : [fallback]

  for (const value of candidates) {
    if (typeof value !== 'string' || value === '') {
      continue
    }

    const ms = Date.parse(value)

    if (Number.isFinite(ms)) {
      return ms
    }
  }

  return null
}

const compareRedisListRows = (rowA: EntityRow, rowB: EntityRow): number => {
  const sortTimeMsA = getRedisListRowSortTimeMs(rowA)
  const sortTimeMsB = getRedisListRowSortTimeMs(rowB)

  if (sortTimeMsA != null && sortTimeMsB != null && sortTimeMsA !== sortTimeMsB) {
    return sortTimeMsA - sortTimeMsB
  }

  const nameA = (rowA.name ?? rowA.id ?? '').toLocaleLowerCase()
  const nameB = (rowB.name ?? rowB.id ?? '').toLocaleLowerCase()
  const byName = nameA.localeCompare(nameB)

  if (byName !== 0) {
    return byName
  }

  return String(rowA.id ?? '').localeCompare(String(rowB.id ?? ''))
}

const pickAddOnFieldsForLinkedRow = (addOn: ManagedCacheAddOn) => ({
  id: addOn.id,
  config: addOn.config,
  state: addOn.state,
  created_at: addOn.created_at,
})

// List row backed only by a managed-cache add-on (provisioning or unlinked after partial disappeared)
const konnectManagedRowFromAddOn = (addOn: ManagedCacheAddOn): EntityRow => ({
  id: addOn.id,
  name: addOn.name ?? addOn.id,
  source: 'konnect-managed',
  partial: undefined,
  addOn,
})

// The partials endpoint returns every partial type, keep only redis rows in this list
const fetcher = async (params: TableDataFetcherParams): Promise<FetcherResponse> => {
  // Legacy Konnect/ KM: use the existing partials-only fetcher
  if (!isKonnectManagedRedisEnabled.value) {
    const res = await rawFetcher({ ...params, pageSize: partialsPageSize })
    res.data = res.data.filter(isRedisPartial)
    return res
  }

  // Merge Redis partials from Koko with managed-cache add-ons from Cloud Gateways
  // This only runs when FF is enabled for Cloud Gateway CP
  try {
    errorMessage.value = null

    const partialsPromise = rawFetcher({ ...params, pageSize: partialsPageSize })
    const addOnsPromise = fetchAllAddOns()
      .then((items) => ({ items, isLoaded: true }))
      .catch(() => {
        // no op - if the add-ons can't be fetched, we still show partials self-managed Redis
        return { items: [] as ManagedCacheAddOn[], isLoaded: false }
      })
    const [partialsRes, addOnsResult] = await Promise.all([partialsPromise, addOnsPromise])
    let { items: addOns, isLoaded: isAddOnsLoaded } = addOnsResult
    let partials: RedisConfigurationResponse[] = partialsRes.data.filter(isRedisPartial)
    const filterQueryTrimmed = typeof params.query === 'string' ? params.query.trim() : ''

    if (filterQueryTrimmed && partials.length === 0) {
      // Toolbar search uses GET …/partials/{typedValue}. That works for Koko ids but 404s when the user typed the add-on id instead.
      // When managed Redis is still provisioning, the ID the user copies/searches for is often Cloud Gateways add-on id, not the Koko partial id.
      // So if Koko returns nothing, we resolve the add-on by id and then if available follow `cache_config_id` back to the Koko partial
      const addOnFoundBySearchId = await fetchManagedAddOnById(filterQueryTrimmed)

      if (addOnFoundBySearchId) {
        const addOnAlreadyInPage = addOns.some((existingAddOn) => existingAddOn.id === addOnFoundBySearchId.id)

        if (!addOnAlreadyInPage) {
          addOns = [...addOns, addOnFoundBySearchId]
        }

        const linkedKokoPartialId = getCacheConfigId(addOnFoundBySearchId)

        if (linkedKokoPartialId) {
          // Add-on is wired to a partial — load that partial so join logic matches what you see with no filter
          const redisPartialFromKoko = await fetchRedisPartialById(linkedKokoPartialId)

          if (redisPartialFromKoko) {
            partials = [redisPartialFromKoko]
          }
        }
      }
    }

    const konnectConfig = props.config as KonnectRedisConfigurationListConfig

    // The partials list can be very large (1000s), while add-ons are usually few. Build an index once to avoid an O(partials × add-ons) join
    const addOnByCacheConfigId = new Map<string, ManagedCacheAddOn>()
    for (const addOn of addOns) {
      const cacheConfigId = getCacheConfigId(addOn)
      if (cacheConfigId) {
        addOnByCacheConfigId.set(cacheConfigId, addOn)
      }
    }

    const rows: EntityRow[] = partials.flatMap((partial) => {
      const matchingAddOn = addOnByCacheConfigId.get(partial.id)
      const hasTags = Array.isArray(partial.tags) && partial.tags.length > 0
      const source: EntityRow['source'] = hasTags ? 'konnect-managed' : 'self-managed'

      // If add-ons data is available, treat a managed partial without a linked
      // add-on as stale. This avoids showing a stale partial row alongside
      // the managed add-on lifecycle row during delete propagation
      if (isAddOnsLoaded && source === 'konnect-managed' && !matchingAddOn) {
        return []
      }

      if (matchingAddOn) {
        return [{
          ...partial,
          id: partial.id,
          // Keep the add-on name so the row label stays stable from 'initializing' to 'ready'
          name: matchingAddOn.name ?? partial.name,
          source,
          partial,
          addOn: pickAddOnFieldsForLinkedRow(matchingAddOn),
        }]
      }

      return [{
        ...partial,
        id: partial.id,
        name: partial.name,
        source,
        partial,
      }]
    })

    // When a managed-cache add-on is being created, Cloud Gateways creates the add-on first and only later provisions the Redis partial in Koko. During that window
    // state_metadata.cache_config_id is empty, so the join above won't find a match and the Redis partial will not yet exist. surface a placeholder row for every such add-on
    const cpId = konnectConfig.controlPlaneId
    // Cloud Gateways API: owner.control_plane_id identifies the CP; config.state_metadata.cache_config_id links to Koko partial when ready
    // Add-ons with no cache_config_id yet: Cloud Gateways created the add-on but Koko partial not provisioned
    const initializingAddOns = addOns.filter((addOn) => {
      // Already linked to a partial, not initializing
      const cacheConfigId = getCacheConfigId(addOn)
      if (cacheConfigId != null && cacheConfigId !== '') return false

      // Only managed-cache add-ons (or unknown kind) get a placeholder
      if (!isManagedCacheAddOn(addOn)) return false

      // Must belong to this CP (or have no CP id)
      const addOnCpId = addOn.owner?.control_plane_id
      if (addOnCpId != null && addOnCpId !== cpId) return false

      return true
    })

    const placeholderRows: EntityRow[] = initializingAddOns.map(konnectManagedRowFromAddOn)

    // If an add-on still exists but its linked partial is no longer returned by Koko,
    // keep showing the add-on row so the list doesn't look empty during BE lag
    const partialIds = new Set(partials.map((partial) => partial.id))

    const unlinkedAddOnRows: EntityRow[] = addOns
      .filter((addOn) => {
        const cacheConfigId = getCacheConfigId(addOn)
        if (!cacheConfigId) return false

        if (!isManagedCacheAddOn(addOn)) return false

        const addOnCpId = addOn.owner?.control_plane_id
        if (addOnCpId != null && addOnCpId !== cpId) return false

        return !partialIds.has(cacheConfigId)
      })
      .map(konnectManagedRowFromAddOn)

    let allRows = [...rows, ...placeholderRows, ...unlinkedAddOnRows]

    if (filterQueryTrimmed) {
      // When a search string is present, only keep rows where the search string matches one of these- partial id, add-on id, or cache_config_id
      allRows = allRows.filter((row) => doesRowMatchExactListSearch(row, filterQueryTrimmed))
    }

    allRows.sort(compareRedisListRows)

    // Keep row state labels fresh while any managed add-on is in non-ready state
    managedAddOnStateById.value = addOns.reduce((acc, addOn) => {
      const state = typeof addOn.state === 'string' ? addOn.state : ''

      if (!isTransitionalManagedCacheState(state)) {
        return acc
      }

      acc[addOn.id] = state
      const cacheConfigId = getCacheConfigId(addOn)

      if (cacheConfigId) {
        acc[cacheConfigId] = state
      }

      return acc
    }, {} as Record<string, string>)

    const transitionalAddOnsExist = addOns.some((addOn) => isTransitionalManagedCacheState(addOn.state))

    if (transitionalAddOnsExist) scheduleNextPoll()
    else clearPolling()

    return {
      data: allRows,
      total: Math.max(partialsRes.total ?? 0, allRows.length),
    }
  } catch (error: any) {
    clearPolling()
    managedAddOnStateById.value = {}
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
  // Use expanded onboarding copy when managed-Konnect UI is enabled
  if (props.config.app === 'konnect' && useKonnectManagedRedisUi.value) {
    return t('list.empty_state.description_with_managed_konnect')
  }

  return t('list.empty_state.description')
})

const emptyStateTitle = computed<string>(() => {
  if (props.config.app === 'konnect' && useKonnectManagedRedisUi.value) {
    return t('redis.empty_state.title_with_managed_konnect')
  }

  return t('redis.title')
})

const emptyStateActionText = computed<string>(() => {
  if (props.config.app === 'konnect' && useKonnectManagedRedisUi.value) {
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
// Disable delete for Konnect-managed Redis rows that are in terminating state to avoid confusion during the delete process
const isDeleteDisabled = (row: EntityRow): boolean => {
  return isKonnectManagedRedisEnabled.value &&
    row.source === 'konnect-managed' &&
    isTerminatingState(row.addOn?.state)
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
      const addOnDeleteUrl = `${cloudGatewaysBase.value}/v2/cloud-gateways/add-ons/${entityToBeDeleted.value.addOn.id}`
      await axiosInstance.delete(addOnDeleteUrl)
    } else {
      // Legacy Konnect or KM: delete the underlying partial as before
      await axiosInstance.delete(buildDeleteUrl(entityToBeDeleted.value.id))
    }

    isDeletePending.value = false
    isDeleteModalVisible.value = false

    // Konnect-managed deletions can still keep placeholders around when transitioning from`initializing` -> `terminating`
    // Restart from the initial delay for the next refresh cycle
    if (isKonnectManagedRedisEnabled.value && entityToBeDeleted.value.source === 'konnect-managed') {
      clearPolling()
    }
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

const managedFetchReady = computed<boolean>(() => {
  if (!isKonnectManagedRedisEnabled.value) {
    return false
  }

  if (props.config.app !== 'konnect') {
    return false
  }

  const konnectConfig = props.config as KonnectRedisConfigurationListConfig
  // Need CP id before Konnect list calls are valid
  return typeof konnectConfig.controlPlaneId === 'string' && konnectConfig.controlPlaneId.trim() !== ''
})

// Polling for Konnect-managed Redis:
// Cloud Gateways creates the add-on before Koko provisions the Redis partial, so we show a placeholder row
// Without polling, the list can stay stuck in a non-ready placeholder state as state transitions can take ~15-20 minutes
// Start polling when placeholders are present, stop immediately once placeholders disappear

// Starting delay before the first retry
const POLL_INITIAL_DELAY_MS = 10000

// After delay increase, we never poll more frequently than this (2 minutes)
const POLL_MAX_DELAY_MS = 120000

// Increase the delay after each unsuccessful polling
const POLL_DELAY_MULTIPLIER = 1.8

// Hard cap for the polling window (30 minutes)
const POLL_MAX_TOTAL_DURATION_MS = 30 * 60 * 1000

// Make retry timing slightly different so requests don't line up
const POLL_RANDOM_DELAY_RATIO = 0.2

const pollTimeoutId = ref<ReturnType<typeof setTimeout> | null>(null)
const pollStartAt = ref<number | null>(null)
const currentPollDelayMs = ref<number>(POLL_INITIAL_DELAY_MS)
const managedAddOnStateById = ref<Record<string, string>>({})

const clearPolling = (): void => {
  if (pollTimeoutId.value) {
    clearTimeout(pollTimeoutId.value)
    pollTimeoutId.value = null
  }
  pollStartAt.value = null
  currentPollDelayMs.value = POLL_INITIAL_DELAY_MS
  managedAddOnStateById.value = {}
}

const pollManagedAddOnsState = async (): Promise<void> => {
  const konnectConfig = props.config as KonnectRedisConfigurationListConfig
  const cpId = konnectConfig.controlPlaneId

  // Keep polling while any managed add-on is in non-ready state
  let transitionalAddOnsExist = false
  const nextStateById: Record<string, string> = {}

  try {
    const addOns = await fetchAllAddOns()

    const relevantAddOns = addOns.filter((addOn) => {
      if (!isManagedCacheAddOn(addOn)) return false

      const addOnCpId = addOn.owner?.control_plane_id
      if (addOnCpId != null && addOnCpId !== cpId) return false

      return true
    })

    transitionalAddOnsExist = relevantAddOns.some((addOn) => isTransitionalManagedCacheState(addOn.state))

    for (const addOn of relevantAddOns) {
      const state = typeof addOn.state === 'string' ? addOn.state : ''
      if (!isTransitionalManagedCacheState(state)) {
        continue
      }

      nextStateById[addOn.id] = state
      const cacheConfigId = getCacheConfigId(addOn)

      if (cacheConfigId) {
        nextStateById[cacheConfigId] = state
      }
    }

    managedAddOnStateById.value = nextStateById
  } catch (error: any) {
    // Stop polling and surface error if we can't refresh state
    clearPolling()
    errorMessage.value = { title: t('errors.general'), message: error.response?.data?.message ?? error.message }

    emit('error', error)
    return
  }

  // Once non-ready states settle, do a single full refresh to render stable rows
  if (!transitionalAddOnsExist) {
    clearPolling()
    refreshList()
    return
  }

  // Non-ready states still exist: schedule the next state poll
  scheduleNextPoll()
}

const scheduleNextPoll = (): void => {
  if (!isKonnectManagedRedisEnabled.value) return
  if (pollTimeoutId.value) return

  const now = Date.now()

  if (pollStartAt.value == null) {
    pollStartAt.value = now
    // Reset state at the beginning of a polling window
    currentPollDelayMs.value = POLL_INITIAL_DELAY_MS
  }

  const elapsedMs = now - (pollStartAt.value ?? now)
  if (elapsedMs >= POLL_MAX_TOTAL_DURATION_MS) {
    clearPolling()
    return
  }

  // Randomized delay spreads retries
  const randomMultiplier = 1 + (Math.random() * 2 - 1) * POLL_RANDOM_DELAY_RATIO
  const delayMs = Math.round(currentPollDelayMs.value * randomMultiplier)

  pollTimeoutId.value = setTimeout(() => {
    pollTimeoutId.value = null
    void pollManagedAddOnsState()
  }, delayMs)

  // Increase the interval for the next attempt
  currentPollDelayMs.value = Math.min(POLL_MAX_DELAY_MS, currentPollDelayMs.value * POLL_DELAY_MULTIPLIER)
}

onBeforeUnmount(() => {
  clearPolling()
})

// Type label from partial's Redis type (type + config). Used for self-managed rows in combined list
const getRedisTypeLabelFromPartial = (fields: RedisConfigurationFields): string | undefined => {
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
      return
  }
}

const formatManagedCacheState = (state: string): string => {
  const normalized = state.trim().replace(/[_-]+/g, ' ')
  const words = normalized.split(/\s+/).filter(Boolean)
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
}

const isReadyManagedCacheState = (state: string): boolean => {
  const cacheState = state.trim().toLowerCase()
  // Managed-cache add-on states: initializing/ready/terminating
  return cacheState === 'ready'
}

const isTransitionalManagedCacheState = (state?: string): boolean => {
  if (typeof state !== 'string' || state.trim() === '') {
    return false
  }

  return !isReadyManagedCacheState(state)
}

const renderRedisType = (item: RedisConfigurationFields | EntityRow): string | undefined => {
  const row = item as EntityRow
  // Konnect-managed row- display the add-on's state while it is non-ready
  // Applies to both placeholder rows (no partial yet) and linked rows (partial already exists)
  if (isKonnectManagedRedisEnabled.value && row.source === 'konnect-managed') {
    const mappedState = managedAddOnStateById.value[row.id]
    const state = (typeof mappedState === 'string' && mappedState.trim() !== '')
      ? mappedState
      : row.addOn?.state

    // Fallback in case state is missing
    if (typeof state !== 'string' || state.trim() === '') {
      return t('list.type.konnect_managed_redis_initializing')
    }

    if (isReadyManagedCacheState(state)) {
      return t('list.type.konnect_managed_redis')
    }

    return `${t('list.type.konnect_managed_redis')} (${formatManagedCacheState(state)})`
  }

  const fields = row.partial ?? item
  if (!fields || typeof (fields as Record<string, unknown>).type === 'undefined') {
    return
  }
  const typedFields = fields as RedisConfigurationFields
  const redisType = getRedisType(typedFields)
  const typeLabelFromPartial = getRedisTypeLabelFromPartial(typedFields)

  if (isKonnectManagedRedisEnabled.value && row.source) {
    return row.source === 'konnect-managed'
      ? t('list.type.konnect_managed_redis')
      : typeLabelFromPartial
        ? `${t('list.type.self_managed_redis')} (${typeLabelFromPartial})`
        : t('list.type.self_managed_redis')
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
    // Stop polling on errors to avoid repeated failing requests
    clearPolling()
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

  if (!isKonnectManagedRedisEnabled.value) {
    clearPolling()
    return
  }
})

watch(managedFetchReady, (isReadyNow, wasReadyBefore) => {
  // Trigger one refresh when managed mode becomes ready after mount; otherwise list gets/stays empty
  if (isReadyNow && !wasReadyBefore) {
    refreshList()
  }
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
    margin-right: var(--kui-space-50, $kui-space-50);
  }
}
</style>
