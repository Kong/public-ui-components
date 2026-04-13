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
            v-if="canNavigateToRowDetails(row)"
            data-testid="action-entity-view"
            has-divider
            :item="getViewDropdownItem(row)"
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

          <!--
            CPG and CPG members need different empty-state alert for Konnect-managed Redis than a standalone CP
          -->
          <template
            v-if="showCpgRedisAlert"
            #action
          >
            <div class="cpg-redis-empty-action">
              <KAlert
                appearance="info"
                class="cpg-redis-alert cpg-redis-empty-state"
                data-testid="redis-cpg-alert"
              >
                {{ t(cpgRedisAlertKey) }}
                <KExternalLink
                  class="cpg-redis-doc-link"
                  hide-icon
                  :href="MANAGED_CACHE_FOR_REDIS_DOC_URL"
                >
                  {{ t('cpg_redis.doc_link') }}
                </KExternalLink>
              </KAlert>
              <KButton
                v-if="userCanCreate && emptyStateActionText"
                appearance="primary"
                data-testid="redis-empty-state-primary-cta"
                size="medium"
                @click="handleCreate"
              >
                <AddIcon decorative />
                {{ emptyStateActionText }}
              </KButton>
            </div>
          </template>
        </KEmptyState>
      </template>
    </EntityBaseTable>

    <DeleteWarningModal
      :plugin-count="deleteWarningPluginCount"
      :variant="deleteWarningVariant"
      :visible="isDeleteWarningVisible"
      @close="isDeleteWarningVisible = false"
    />

    <EntityDeleteModal
      :action-pending="isDeletePending"
      :confirmation-prompt="nameConfirmPrompt"
      :description="deleteNote"
      :entity-name="pendingDeleteLabel"
      :entity-type="EntityTypes.RedisConfiguration"
      :entity-type-display="deleteKindLabel"
      :error="deleteModalError"
      :need-confirm="true"
      :stacked-copy="isManagedCacheDelete"
      :title="deleteTitle"
      :visible="isDeleteModalVisible"
      @cancel="hideDeleteModal"
      @proceed="confirmDelete"
    >
      <template
        v-if="isManagedCacheDelete"
        #message
      >
        <i18n-t
          class="message"
          keypath="delete.konnect_managed_delete.sure_question"
          tag="p"
        >
          <template #entityName>
            <strong>{{ pendingDeleteLabel }}</strong>
          </template>
        </i18n-t>
      </template>
    </EntityDeleteModal>

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
import { KAlert, KExternalLink } from '@kong/kongponents'

import { getCpgRedisAlertMessageKey, shouldShowCpgRedisAlert } from '../cpgRedisAlert'
import { MANAGED_CACHE_FOR_REDIS_DOC_URL } from '../constants'
import endpoints from '../partials-endpoints'
import composables from '../composables'
import { getRedisType } from '../helpers'
import { parseManagedAddOn } from '../helpers/managed-cache-add-on-parse'
import { PartialType, RedisType, REDIS_CONFIGURATION_SOURCE } from '../types'
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
import { isAxiosError, type AxiosError } from 'axios'
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

// DeleteWarningModal: delete blocked while plugins still reference this cache
const isDeleteWarningVisible = ref<boolean>(false)
const deleteWarningVariant = ref<'default' | 'konnect-managed'>('default')
const deleteWarningPluginCount = ref<number>(0)

const buildDeleteUrl = useDeleteUrlBuilder(props.config, fetcherBaseUrl.value)

/** True when list shows both Koko partials and Cloud Gateways managed-cache add-ons (Konnect only) */
const isKonnectManagedRedisEnabled = computed<boolean>(() =>
  props.config.app === 'konnect' &&
  !!(props.config as KonnectRedisConfigurationListConfig).isKonnectManagedRedisEnabled &&
  // Konnect-managed Redis is only supported for Cloud Gateways
  // Require explicit true so hosts that omit this flag don't trigger Cloud Gateways add-ons calls
  // Other gateway types must keep using the legacy partials flow
  (props.config as KonnectRedisConfigurationListConfig).isCloudGateway === true,
)

// Determines whether to use Konnect-managed Redis UI (copy, combined fetch, empty state). Kong Manager always false
const useKonnectManagedRedisUi = computed<boolean>(() => {
  if (props.config.app !== 'konnect') {
    return false
  }

  const konnectConfig = props.config as KonnectRedisConfigurationListConfig

  // Keep backward compatibility: if UI-only flag is omitted, follow behavior flag
  if (typeof konnectConfig.useKonnectManagedRedisUi === 'boolean') {
    return konnectConfig.useKonnectManagedRedisUi
  }

  return isKonnectManagedRedisEnabled.value
})

// Show CPG-specific empty-state messaging when Konnect-managed Redis UI is enabled and the CP is either the group
// itself (isControlPlaneGroup) or a member CP (isControlPlaneGroupMember). Standalone CPs skip this
const showCpgRedisAlert = computed<boolean>(() => {
  const konnectConfig = props.config as KonnectRedisConfigurationListConfig
  return shouldShowCpgRedisAlert({
    useKonnectManagedRedisUi: useKonnectManagedRedisUi.value,
    isControlPlaneGroup: konnectConfig.isControlPlaneGroup,
    isControlPlaneGroupMember: konnectConfig.isControlPlaneGroupMember,
  })
})

const cpgRedisAlertKey = computed(() => {
  const konnectConfig = props.config as KonnectRedisConfigurationListConfig
  return getCpgRedisAlertMessageKey(konnectConfig.isControlPlaneGroupMember)
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

// Avoid Konnect exact-match `GET …/partials/{toolbarQuery}`; combined list filters partials client-side after merging add-ons
const partialsListParamsWithoutToolbarQuery = (params: TableDataFetcherParams): TableDataFetcherParams => ({
  ...params,
  query: '',
  pageSize: partialsPageSize,
})

// Cloud Gateways add-ons API limits page size at 100
const addOnsPageSize = 100
const maxAddOnPagesFallback = 1000

const isRedisPartial = (item: RedisConfigurationResponse): boolean =>
  item.type === PartialType.REDIS_CE || item.type === PartialType.REDIS_EE

type ManagedCacheStateMetadata = { cache_config_id?: string }
type ManagedCacheConfigShape = { state_metadata?: ManagedCacheStateMetadata }

const getCacheConfigId = (addOn: ManagedCacheAddOn): string | undefined => {
  const managedCacheConfig = addOn.config as ManagedCacheConfigShape | undefined
  const meta = managedCacheConfig?.state_metadata
  return meta?.cache_config_id
}

// Partial id for `…/partials/{id}/links`,  not the Cloud Gateways add-on id
const getPartialIdForPluginLinks = (row: EntityRow): string | null => {
  if (row.source === REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED && !row.partial) {
    const cacheId = row.addOn ? getCacheConfigId(row.addOn) : undefined
    return cacheId && cacheId !== '' ? cacheId : null
  }
  if (typeof row.id === 'string' && row.id !== '') {
    return row.id
  }
  return null
}

// Cloud Gateways list filter contract
const isManagedCacheAddOn = (addOn: ManagedCacheAddOn): boolean => {
  const kind = addOn.config?.kind
  return kind === 'managed-cache.v0'
}

const isTerminatingState = (state?: string): boolean =>
  typeof state === 'string' && state.trim().toLowerCase() === 'terminating'

// Exact search by add-on id (same parsing as managed-cache-add-on-api)
const fetchManagedAddOnById = async (managedCacheAddOnId: string): Promise<ManagedCacheAddOn | null> => {
  const konnectConfig = props.config as KonnectRedisConfigurationListConfig
  const singleAddOnUrl = `${cloudGatewaysBase.value}/v2/cloud-gateways/add-ons/${encodeURIComponent(managedCacheAddOnId)}`

  try {
    const { data } = await axiosInstance.get(singleAddOnUrl)
    const parsedAddOn = parseManagedAddOn(data)
    if (!parsedAddOn?.id || !isManagedCacheAddOn(parsedAddOn)) {
      return null
    }

    const controlPlaneIdOnAddOn = parsedAddOn.owner?.control_plane_id
    if (controlPlaneIdOnAddOn != null && controlPlaneIdOnAddOn !== konnectConfig.controlPlaneId) {
      return null
    }

    return parsedAddOn
  } catch (error) {
    if (!isAxiosError(error)) {
      throw error
    }

    if (error.response?.status === 404) {
      return null
    }
    throw error
  }
}

const fetchRedisPartialById = async (kokoPartialId: string): Promise<RedisConfigurationResponse | null> => {
  // When the user searches by add-on id, use `cache_config_id` to fetch the matching Koko partial
  const singlePartialUrl = `${fetcherBaseUrl.value}/${encodeURIComponent(kokoPartialId)}`

  try {
    const partialResponse = await axiosInstance.get<{ data: RedisConfigurationResponse }>(singlePartialUrl)
    const { data: responseBody } = partialResponse
    const maybeRedisPartial = responseBody.data

    return isRedisPartial(maybeRedisPartial) ? maybeRedisPartial : null
  } catch (error) {
    if (!isAxiosError(error)) {
      throw error
    }

    if (error.response?.status === 404) {
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
        'filter[config.kind]': 'managed-cache.v0',
        'filter[owner.control_plane_id]': konnectConfig.controlPlaneId,
        ...(konnectConfig.controlPlaneGeo ? { 'filter[owner.control_plane_geo]': konnectConfig.controlPlaneGeo } : {}),
      },
    })

    const raw = addOnsResponse.data?.data
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
const parseSortTimestampToMs = (value: string | number | undefined | null): number | null => {
  if (value == null || value === '') {
    return null
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null
    }
    // Koko commonly returns unix seconds; Date uses ms. Treat <1e12 as seconds.
    const ms = value < 1e12 ? value * 1000 : value

    return Number.isFinite(ms) ? ms : null
  }

  const fromIso = Date.parse(value)
  if (Number.isFinite(fromIso)) {
    return fromIso
  }

  const asNum = Number(value)
  return Number.isFinite(asNum) ? parseSortTimestampToMs(asNum) : null
}

const getRedisListRowSortTimeMs = (row: EntityRow): number | null => {
  const primary = row.addOn?.created_at
  const created = row.created_at
  const fallback = typeof created === 'string' || typeof created === 'number' ? created : undefined
  const candidates = row.addOn != null ? [primary, fallback] : [fallback]

  for (const value of candidates) {
    const ms = parseSortTimestampToMs(value)

    if (ms != null) {
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
  source: REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED,
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

    // Konnect `useFetchUrlBuilder` maps toolbar search to `GET …/partials/{query}`. That 404s while a
    // managed-cache add-on is still provisioning (partial not created in Koko yet) even though the
    // row exists via add-ons. Always load the partials collection here and filter client-side instead
    const partialsPromise = rawFetcher(partialsListParamsWithoutToolbarQuery(params))

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

    // When the typed id is not already in the partials page, resolve add-on and/or single partial (same as legacy `GET …/partials/{id}`).
    if (filterQueryTrimmed && !partials.some((p) => p.id === filterQueryTrimmed)) {
      const addOnFoundBySearchId = await fetchManagedAddOnById(filterQueryTrimmed)

      if (addOnFoundBySearchId) {
        const addOnAlreadyInPage = addOns.some((existingAddOn) => existingAddOn.id === addOnFoundBySearchId.id)

        if (!addOnAlreadyInPage) {
          addOns = [...addOns, addOnFoundBySearchId]
        }

        const linkedKokoPartialId = getCacheConfigId(addOnFoundBySearchId)

        if (linkedKokoPartialId) {
          const redisPartialFromKoko = await fetchRedisPartialById(linkedKokoPartialId)

          if (redisPartialFromKoko && !partials.some((p) => p.id === redisPartialFromKoko.id)) {
            partials = [...partials, redisPartialFromKoko]
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
      const source: EntityRow['source'] = hasTags
        ? REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED
        : REDIS_CONFIGURATION_SOURCE.SELF_MANAGED

      // If add-ons data is available, treat a managed partial without a linked
      // add-on as stale. This avoids showing a stale partial row alongside
      // the managed add-on lifecycle row during delete propagation
      if (isAddOnsLoaded && source === REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED && !matchingAddOn) {
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

    const transitionalAddOnsExist = addOns.some((addOn) => isTransitionalManagedCacheState(addOn.state))

    if (transitionalAddOnsExist) scheduleNextPoll()
    else clearPolling()

    return {
      data: allRows,
      total: Math.max(partialsRes.total ?? 0, allRows.length),
    }
  } catch (error) {
    clearPolling()
    if (isAxiosError(error)) {
      errorMessage.value = { title: t('errors.general'), message: error.response?.data?.message ?? error.message }
      emit('error', error)
    } else {
      errorMessage.value = { title: t('errors.general'), message: t('errors.general') }
    }
    return { data: [], total: 0 }
  }
}

const { i18n: { t }, i18nT } = composables.useI18n()
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

const pendingDeleteLabel = computed((): string => {
  const row = entityToBeDeleted.value
  return row ? (row.name || row.id) : ''
})

// Konnect-managed delete mirrors Konnect overview delete
const isManagedCacheDelete = computed((): boolean => {
  const row = entityToBeDeleted.value
  return !!row &&
    isKonnectManagedRedisEnabled.value &&
    row.source === REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED
})

const deleteTitle = computed(() => isManagedCacheDelete.value ? t('delete.konnect_managed_delete.title') : t('delete.title'))

const deleteNote = computed(() => isManagedCacheDelete.value ? t('delete.konnect_managed_delete.description') : t('delete.description'))

const deleteKindLabel = computed(() => isManagedCacheDelete.value ? t('delete.konnect_managed_delete.entity_type_label') : '')

// KPrompt splits on `{confirmationText}`; use `promptToken` so full sentence stays in one i18n string
const KPROMPT_CONFIRMATION_MARKER = '{confirmationText}' as const

const nameConfirmPrompt = computed((): string | undefined =>
  isManagedCacheDelete.value
    ? t('delete.konnect_managed_delete.confirmation_prompt', {
      promptToken: KPROMPT_CONFIRMATION_MARKER,
    })
    : undefined,
)

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

const getNavigableRowId = (row: EntityRow): string => {
  if (!isKonnectManagedRedisEnabled.value || row.source !== REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED) {
    return typeof row.id === 'string' ? row.id : ''
  }

  if (row.partial?.id) {
    return String(row.partial.id)
  }

  const linkedPartialId = row.addOn ? getCacheConfigId(row.addOn) : undefined
  if (linkedPartialId) {
    return linkedPartialId
  }

  // Non-ready state: no Koko partial yet; host detail is keyed by add-on id
  const addOnId = row.addOn?.id
  if (addOnId) {
    return addOnId
  }

  return typeof row.id === 'string' && row.id ? row.id : ''
}

const canNavigateToRowDetails = (row: EntityRow): boolean =>
  getNavigableRowId(row) !== ''

const getViewDropdownItem = (row: EntityRow) => ({
  label: t('actions.view'),
  to: props.config.getViewRoute(getNavigableRowId(row)),
})

const getEditDropdownItem = (id: string) => ({
  label: t('actions.edit'),
  to: props.config.getEditRoute(id),
})

// Row can not be edited for Konnect-managed otherwise follow canEdit prop
const canEditRow = async (row: EntityRow): Promise<boolean> => {
  if (isKonnectManagedRedisEnabled.value && row.source === REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED) {
    return false
  }
  return props.canEdit(row)
}
// Disable delete for Konnect-managed Redis rows that are in terminating state to avoid confusion during the delete process
const isDeleteDisabled = (row: EntityRow): boolean => {
  return isKonnectManagedRedisEnabled.value &&
    row.source === REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED &&
    isTerminatingState(row.addOn?.state)
}

const deleteRow = async (row: EntityRow) => {
  const partialId = getPartialIdForPluginLinks(row)

  if (partialId) {
    const { count } = await fetchLinks({ partialId })

    if (count > 0) {
      deleteWarningPluginCount.value = count
      deleteWarningVariant.value = isKonnectManagedRedisEnabled.value && row.source === REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED ? 'konnect-managed' : 'default'
      isDeleteWarningVisible.value = true
      return
    }
  }

  entityToBeDeleted.value = row
  isDeleteModalVisible.value = true
}

const clearFilter = (): void => {
  filterQuery.value = ''
}

/**
 * Combined Konnect list only - Konnect app + FF + cloud gateway
 * Otherwise caller does not use this. Navigate by partial id, or by add-on id for konnect-managed rows with no Koko partial yet
 */
const canNavigateCombinedKonnectRow = (row: EntityRow): boolean =>
  canNavigateToRowDetails(row)

const rowClick = async (row: EntityRow): Promise<void> => {
  if (isKonnectManagedRedisEnabled.value && !canNavigateCombinedKonnectRow(row)) {
    return
  }

  const isAllowed = await props.canRetrieve?.(row)

  if (!isAllowed) {
    return
  }

  const rowViewId = getNavigableRowId(row)

  if (rowViewId === '') {
    return
  }

  router.push(props.config.getViewRoute(rowViewId))
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
    if (isKonnectManagedRedisEnabled.value && entityToBeDeleted.value.source === REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED && entityToBeDeleted.value.addOn?.id) {
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
    if (isKonnectManagedRedisEnabled.value && entityToBeDeleted.value.source === REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED) {
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

const clearPolling = (): void => {
  if (pollTimeoutId.value) {
    clearTimeout(pollTimeoutId.value)
    pollTimeoutId.value = null
  }
  pollStartAt.value = null
  currentPollDelayMs.value = POLL_INITIAL_DELAY_MS
}

const pollManagedAddOnsState = async (): Promise<void> => {
  const konnectConfig = props.config as KonnectRedisConfigurationListConfig
  const cpId = konnectConfig.controlPlaneId

  // Keep polling while any managed add-on is in non-ready state
  let transitionalAddOnsExist = false

  try {
    const addOns = await fetchAllAddOns()

    const relevantAddOns = addOns.filter((addOn) => {
      if (!isManagedCacheAddOn(addOn)) return false

      const addOnCpId = addOn.owner?.control_plane_id
      if (addOnCpId != null && addOnCpId !== cpId) return false

      return true
    })

    transitionalAddOnsExist = relevantAddOns.some((addOn) => isTransitionalManagedCacheState(addOn.state))
  } catch (error) {
    clearPolling()
    if (isAxiosError(error)) {
      errorMessage.value = { title: t('errors.general'), message: error.response?.data?.message ?? error.message }
      emit('error', error)
    } else {
      errorMessage.value = { title: t('errors.general'), message: t('errors.general') }
    }
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

const isReadyManagedCacheState = (state: string): boolean => {
  const cacheState = state.trim().toLowerCase()
  // Managed-cache add-on states: initializing/ready/terminating
  return cacheState === 'ready'
}

const isTransitionalManagedCacheState = (state?: string): boolean => {
  if (typeof state !== 'string' || !state.trim()) {
    return false
  }

  return !isReadyManagedCacheState(state)
}

const renderRedisType = (item: RedisConfigurationFields | EntityRow): string | undefined => {
  const row = item as EntityRow
  if (isKonnectManagedRedisEnabled.value && row.source === REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED) {
    return t('list.type.konnect_managed_redis')
  }

  const fields = row.partial ?? item
  if (!fields || typeof (fields as Record<string, unknown>).type === 'undefined') {
    return
  }
  const typedFields = fields as RedisConfigurationFields
  const redisType = getRedisType(typedFields)
  const typeLabelFromPartial = getRedisTypeLabelFromPartial(typedFields)

  if (isKonnectManagedRedisEnabled.value && row.source) {
    return row.source === REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED
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

  .cpg-redis-empty-state {
    text-align: start;
    width: 100%;
  }

  .cpg-redis-empty-action {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-60, $kui-space-60);
    max-width: 640px;
    width: 100%;
  }

  .cpg-redis-alert :deep(.k-external-link.cpg-redis-doc-link) {
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .kong-ui-entity-filter-input {
    margin-right: var(--kui-space-50, $kui-space-50);
  }
}
</style>
