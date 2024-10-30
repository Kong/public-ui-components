<template>
  <div class="kong-ui-entities-plugins-list">
    <EntityBaseTable
      :cache-identifier="cacheIdentifier"
      :disable-sorting="disableSorting"
      :empty-state-options="emptyStateOptions"
      enable-entity-actions
      :error-message="errorMessage"
      :fetcher="fetcher"
      :fetcher-cache-key="fetcherCacheKey"
      :hide-toolbar="hideTableToolbar"
      pagination-type="offset"
      preferences-storage-key="kong-ui-entities-plugins-list"
      :query="filterQuery"
      :table-headers="tableHeaders"
      :title="title"
      :title-tag="titleTag"
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
        <Teleport
          :disabled="!useActionOutside"
          to="#kong-ui-app-page-header-action-button"
        >
          <PermissionsWrapper :auth-function="() => canCreate()">
            <!-- Hide Create button if table is empty -->
            <KButton
              v-show="hasData"
              appearance="primary"
              data-testid="toolbar-add-plugin"
              :size="useActionOutside ? 'medium' : 'large'"
              :to="config.createRoute"
            >
              <AddIcon />
              {{ t('plugins.list.toolbar_actions.new_plugin') }}
            </KButton>
          </PermissionsWrapper>
        </Teleport>
      </template>

      <!-- Column Formatting -->
      <template #name="{ row }">
        <div class="name-cell-wrapper">
          <PluginIcon
            class="plugin-icon"
            :name="row.name"
            :width="24"
          />
          <div class="info-wrapper">
            <span
              v-if="row.instance_name"
              class="info-name"
            >{{ row.instance_name }}</span>
            <span
              v-else
              class="info-name"
            >{{ pluginMetaData.getDisplayName(row.name) }}</span>
            <span
              v-if="row.instance_name"
              class="info-type"
            >{{ pluginMetaData.getDisplayName(row.name) }}</span>
          </div>
        </div>
      </template>

      <template #appliedTo="{ row }">
        <KTruncate v-if="aggregateAppliedTo(row).length > 0">
          <PermissionsWrapper
            v-for="tag in aggregateAppliedTo(row)"
            :key="tag.badgeText"
            :auth-function="() => checkAppliedToPermission(tag.type, row)"
            force-show
          >
            <template #default="{ isAllowed }">
              <KBadge
                :class="isAllowed || 'disabled'"
                @click.stop="isAllowed && tag.type && handleAppliedToClick(tag.type, row)"
              >
                {{ tag.badgeText }}
              </KBadge>
            </template>
          </PermissionsWrapper>
        </KTruncate>
        <span v-else>-</span>
      </template>

      <template #enabled="{ row }">
        <PermissionsWrapper
          :auth-function="async () => !!(await canEdit(row) && await canToggle(row))"
          force-show
        >
          <template #default="{ isAllowed }">
            <div @click.stop>
              <KInputSwitch
                :disabled="!isAllowed"
                :disabled-tooltip-text="!isAllowed && config.getToggleDisabledTooltip?.(row) || undefined"
                :model-value="row.enabled"
                @click.stop.prevent="isAllowed && toggleEnableStatus(row)"
              />
            </div>
          </template>
        </PermissionsWrapper>
      </template>

      <template #ordering="{ rowValue }">
        <KBadge :appearance="rowValue ? 'warning' : 'info'">
          {{
            rowValue
              ? t('plugins.list.table_headers.ordering_badge.dynamic')
              : t('plugins.list.table_headers.ordering_badge.static')
          }}
        </KBadge>
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
            :item="getViewDropdownItem(row)"
          />
        </PermissionsWrapper>
        <PermissionsWrapper :auth-function="() => canEdit(row)">
          <KDropdownItem
            data-testid="action-entity-edit"
            :item="getEditDropdownItem(row)"
          />
        </PermissionsWrapper>
        <!-- Dynamic Plugin Ordering not supported for consumer/consumer-group plugins -->
        <PermissionsWrapper
          v-if="!isConsumerPage && !isConsumerGroupPage && isOrderingSupported"
          :auth-function="() => canConfigureDynamicOrdering(row)"
        >
          <KDropdownItem
            v-if="getConfigureDynamicOrderingDropdownItem(row)"
            data-testid="action-entity-config-dyn-order"
            :item="getConfigureDynamicOrderingDropdownItem(row)"
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

    <EntityToggleModal
      :action="modalContent.action"
      :entity-id="modalContent.id"
      :entity-name="modalContent.name"
      :entity-type="t('glossary.plugin')"
      :on-confirm="confirmSwitchEnablement"
      :visible="enablementModalVisible"
      @cancel="closeEnablementModal"
      @proceed="closeEnablementModal"
    />

    <EntityDeleteModal
      :action-pending="isDeletePending"
      :description="t('delete.description')"
      :entity-name="pluginToBeDeleted && (pluginToBeDeleted.instance_name || pluginToBeDeleted.name || pluginToBeDeleted.id)"
      :entity-type="EntityTypes.Plugin"
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
  EntityToggleModal,
  EntityFilter,
  EntityTypes,
  FetcherStatus,
  PermissionsWrapper,
  useAxios,
  useFetcher,
  useDeleteUrlBuilder,
  useGatewayFeatureSupported,
} from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'

import type {
  BaseTableHeaders,
  EmptyStateOptions,
  ExactMatchFilterConfig,
  FilterFields,
  FuzzyMatchFilterConfig,
  TableErrorMessage,
} from '@kong-ui-public/entities-shared'
import { AddIcon } from '@kong/icons'

import composables from '../composables'
import endpoints from '../plugins-endpoints'

import type {
  KongManagerPluginListConfig,
  KonnectPluginListConfig,
  ViewRouteType,
  EntityRow,
  CopyEventPayload,
} from '../types'

import PluginIcon from './PluginIcon.vue'

import type { HeaderTag } from '@kong/kongponents'

const pluginMetaData = composables.usePluginMetaData()

const emit = defineEmits<{
  (e: 'error', error: AxiosError): void,
  (e: 'copy:success', payload: CopyEventPayload): void,
  (e: 'copy:error', payload: CopyEventPayload): void,
  (e: 'delete:success', plugin: EntityRow): void,
  (e: 'toggle-enabled', isEnabled: boolean, plugin: EntityRow): void,
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectPluginListConfig | KongManagerPluginListConfig>,
    required: true,
    validator: (config: KonnectPluginListConfig | KongManagerPluginListConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (!config.createRoute || !config.getViewRoute || !config.getEditRoute || !config.getConfigureDynamicOrderingRoute) return false
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
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can toggle (enable/disable) a given entity */
  canToggle: {
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
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can retrieve (view details) a given scoped entity (e.g. route linked with the plugin) */
  canRetrieveScopedEntity: {
    type: Function as PropType<(entityType: string, entityId: string) => boolean | Promise<boolean>>,
    required: false,
    default: async () => true,
  },
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can configure dynamic ordering for a given entity */
  canConfigureDynamicOrdering: {
    type: Function as PropType<(row: EntityRow) => boolean | Promise<boolean>>,
    required: false,
    default: async () => true,
  },
  title: {
    type: String,
    default: '',
  },
  titleTag: {
    type: String as PropType<HeaderTag>,
    default: 'h2',
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

const isConsumerPage = computed((): boolean => props.config?.entityType === 'consumers')
const isConsumerGroupPage = computed((): boolean => props.config?.entityType === 'consumer_groups')

const isOrderingSupported = props.config.app === 'konnect' || useGatewayFeatureSupported({
  gatewayInfo: props.config.gatewayInfo,
  // dynamic ordering is not supported in Gateway Community Edition or before Gateway Enterprise Edition 3.0
  supportedRange: {
    enterprise: ['3.0'],
  },
})

/**
 * Table Headers
 */
const disableSorting = computed((): boolean => props.config.app !== 'kongManager' || !!props.config.disableSorting)
const fields: BaseTableHeaders = {
  // the Name column is non-hidable
  name: { label: t('plugins.list.table_headers.name'), searchable: true, sortable: true, hidable: false },
}
// conditional display of Applied To column - hide if on an entity's details page (ie. plugins card on route details view)
if (!props.config?.entityId) {
  fields.appliedTo = { label: t('plugins.list.table_headers.applied_to'), sortable: false }
}

fields.enabled = { label: t('plugins.list.table_headers.enabled'), searchable: true, sortable: true }

if (isOrderingSupported) {
  fields.ordering = { label: t('plugins.list.table_headers.ordering'), sortable: true }
}

fields.tags = { label: t('plugins.list.table_headers.tags'), sortable: false }

const tableHeaders: BaseTableHeaders = fields

/**
 * Fetcher & Filtering
 */
const fetcherBaseUrl = computed<string>(() => {
  let url = props.config.entityType
    ? `${props.config.apiBaseUrl}${endpoints.list[props.config.app].forEntity}`
    : `${props.config.apiBaseUrl}${endpoints.list[props.config.app].all}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  return url
    .replace(/{entityType}/gi, props.config?.entityType || '')
    .replace(/{entityId}/gi, props.config?.entityId || '')
})

const { flattenPluginMap, filterPlugin } = composables.usePluginSelect({
  config: {
    apiBaseUrl: props.config.apiBaseUrl,
    axiosRequestConfig: props.config.axiosRequestConfig,
    entityId: props.config.entityId,
    entityType: props.config.entityType,
    ...props.config.app === 'konnect' ? {
      app: 'konnect',
      controlPlaneId: props.config.controlPlaneId,
    } : {
      app: 'kongManager',
      workspace: props.config.workspace,
    },
  },
  availableOnServer: true,
  disabledPlugins: {},
  ignoredPlugins: [],
})

const filterQuery = ref<string>('')
const filterConfig = computed<InstanceType<typeof EntityFilter>['$props']['config']>(() => {
  const isExactMatch = (props.config.app === 'konnect' || props.config.isExactMatch)
  const isEqMatch = (props.config.app === 'kongManager' || props.config.isEqMatch)

  if (isExactMatch) {
    return {
      isExactMatch: true,
      fields: {
        name: fields.name,
        id: { label: t('plugins.list.table_headers.id'), sortable: true },
      },
      placeholder: t(`search.placeholder.${props.config.app}`),
      ...isEqMatch ? {
        selectItems: Object.entries(flattenPluginMap.value).map(([name, plugin]) => {
          return { value: name, label: plugin.name, plugin }
        }),
        selectFilterFunction: ({ query, items }) => {
          return items.filter(({ plugin }) => filterPlugin(query, plugin))
        },
      } : {},
    } as ExactMatchFilterConfig
  }

  const filterFields: FilterFields = {
    enabled: { ...fields.enabled, label: t('search.filter.field.enabled') },
    name: fields.name,
    instance_name: { label: t('plugins.list.table_headers.instance_name'), searchable: true },
  }

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
// hide table toolbar in initial loading state or when no records are found
const hideTableToolbar = ref<boolean>(false)

/**
 * Applied To ...
 */
// transform the entity row to "Applied To" badges
const aggregateAppliedTo = (row: EntityRow): ({ type: ViewRouteType | null, badgeText: string })[] => {
  const badges = [] as ({ type: ViewRouteType | null, badgeText: string })[]
  // compatible with different data structures in the List and Filter APIs, see KM-590 and KM-100
  if (row.route?.id || row.route_id) {
    badges.push({ type: 'route', badgeText: t('plugins.list.table_headers.applied_to_badges.route') })
  }
  if (row.service?.id || row.service_id) {
    badges.push({ type: 'service', badgeText: t('plugins.list.table_headers.applied_to_badges.service') })
  }
  if (row.consumer?.id || row.consumer_id) {
    badges.push({ type: 'consumer', badgeText: t('plugins.list.table_headers.applied_to_badges.consumer') })
  }
  if (row.consumer_group?.id || row.consumer_group_id) {
    badges.push({ type: 'consumer_group', badgeText: t('plugins.list.table_headers.applied_to_badges.consumer_group') })
  }
  if (badges.length) {
    return badges
  }
  return [{ type: null, badgeText: t('plugins.list.table_headers.applied_to_badges.global') }]
}

const checkAppliedToPermission = async (type: ViewRouteType | null, row: EntityRow) => {
  if (type === null) {
    return false
  }
  return await props.canRetrieveScopedEntity?.(type, row.id)
}

const handleAppliedToClick = (type: ViewRouteType, row: EntityRow) => {
  let id = null

  switch (type) {
    case 'route':
      id = row.route?.id
      break
    case 'service':
      id = row.service?.id
      break
    case 'consumer':
      id = row.consumer?.id
      break
    case 'consumer_group':
      id = row.consumer_group?.id
      break
    default:
      break
  }

  if (id && props.config?.getScopedEntityViewRoute) {
    router.push(props.config.getScopedEntityViewRoute(type, id))
  }
}

/**
 * Enable / Disable action
 */
const enablementModalVisible = ref(false)
const switchEnablementTarget = ref<EntityRow | null>(null)

const modalContent = computed(() => {
  const props = {
    action: 'disable',
    id: '',
    name: '',
  }

  if (switchEnablementTarget.value) {
    const { enabled, id, name } = switchEnablementTarget.value
    props.action = enabled ? 'disable' : 'enable'
    props.id = id
    props.name = pluginMetaData.getDisplayName(name) || id
  }

  return props
})

const toggleEnableStatus = (row: EntityRow) => {
  enablementModalVisible.value = true
  switchEnablementTarget.value = row
}

const closeEnablementModal = () => {
  enablementModalVisible.value = false
  switchEnablementTarget.value = null
}

const confirmSwitchEnablement = async () => {
  const isAllowed = await props.canEdit?.(switchEnablementTarget.value!)

  if (!isAllowed || !switchEnablementTarget.value) {
    return
  }

  let url = `${props.config.apiBaseUrl}${
    endpoints.item[props.config.app]?.[props.config?.entityType ? 'forEntity' : 'all']
      .replace(/{entityType}/gi, props.config?.entityType || '')
      .replace(/{entityId}/gi, props.config?.entityId || '')
  }`
    .replace(/{id}/gi, switchEnablementTarget.value.id || '')

  if (props.config.app === 'konnect') {
    url = url
      .replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url
      .replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  const enabled = !switchEnablementTarget.value.enabled

  try {
    const { data } = props.config?.app === 'konnect'
      // TODO: add timeout because when the plugin configuration is too big, the request can take very long.
      // Remove timeout when the request is optimized. KM-267
      ? await axiosInstance.put(url, { ...switchEnablementTarget.value, enabled }, { timeout: 120000 })
      : await axiosInstance.patch(url, { ...switchEnablementTarget.value, enabled }, { timeout: 120000 })
    // Emit the success event for the host app
    emit('toggle-enabled', enabled, data)
    // Update switchEnablementTarget
    switchEnablementTarget.value.enabled = enabled
  } catch (e: any) {
    emit('error', e)
  }
}

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

  router.push(props.config.getViewRoute(row))
}

// Render the view dropdown item as a router-link
const getViewDropdownItem = (row: EntityRow) => {
  return {
    label: t('actions.view'),
    to: props.config.getViewRoute(row),
  }
}

/**
 * Edit action
 */
// Render the edit dropdown item as a router-link
const getEditDropdownItem = (row: EntityRow) => {
  return {
    label: t('actions.edit'),
    to: props.config.getEditRoute(row),
  }
}

/**
 * Configure Dynamic Ordering action
 */
const getConfigureDynamicOrderingDropdownItem = (row: EntityRow) => {
  return {
    label: t('actions.configure_dynamic_ordering'),
    to: props.config.getConfigureDynamicOrderingRoute(row),
  }
}

/**
 * Delete action
 */
const pluginToBeDeleted = ref<EntityRow | undefined>(undefined)
const isDeleteModalVisible = ref<boolean>(false)
const isDeletePending = ref<boolean>(false)
const deleteModalError = ref<string>('')

const buildDeleteUrl = useDeleteUrlBuilder(props.config, fetcherBaseUrl.value)

const deleteRow = (row: EntityRow): void => {
  pluginToBeDeleted.value = row
  isDeleteModalVisible.value = true
}

const hideDeleteModal = (): void => {
  isDeleteModalVisible.value = false
}

const confirmDelete = async (): Promise<void> => {
  if (!pluginToBeDeleted.value?.id) {
    return
  }

  isDeletePending.value = true

  try {
    await axiosInstance.delete(buildDeleteUrl(pluginToBeDeleted.value.id))

    isDeletePending.value = false
    isDeleteModalVisible.value = false
    fetcherCacheKey.value++

    // Emit the success event for the host app
    emit('delete:success', pluginToBeDeleted.value)
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

const hasData = ref(false)

/**
 * Watchers
 */
watch(fetcherState, (state) => {
  // reset `hasData` to show/hide the teleported Create button
  if (Array.isArray(state?.response?.data)) {
    hasData.value = state.response!.data.length > 0
  }

  if (state.status === FetcherStatus.NoRecords) {
    hideTableToolbar.value = true
  } else {
    hideTableToolbar.value = false
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
  message: `${t('plugins.list.empty_state.description')}${props.config.additionMessageForEmptyState ? ` ${props.config.additionMessageForEmptyState}` : ''}`,
  title: t('plugins.title'),
})

onBeforeMount(async () => {
  // Evaluate if the user has create permissions
  const userCanCreate = await props.canCreate()

  // If a user can create, we need to modify the empty state actions/messaging
  if (userCanCreate) {
    emptyStateOptions.value.title = t('plugins.list.empty_state.title')
    emptyStateOptions.value.ctaText = t('actions.create')
  }
})
</script>

<style lang="scss" scoped>
.kong-ui-entities-plugins-list {
  width: 100%;

  :deep(.kong-ui-entity-filter-input) {
    margin-right: $kui-space-50;
  }

  .table-content-overflow-wrapper {
    max-width: 60ch;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .name-cell-wrapper {
    align-items: center;
    display: flex;

    .plugin-icon {
      margin-right: 12px;
    }

    .info-wrapper {
      display: flex;
      flex-direction: column;

      .info-name {
        color: $kui-color-text-neutral-stronger;
        font-size: $kui-font-size-30;
        font-weight: 600;
        line-height: 20px;
      }

      .info-type {
        color: $kui-color-text-neutral;
        font-size: $kui-font-size-30;
        line-height: 16px;
        margin-top: 4px;
      }
    }
  }

  .k-badge.disabled {
    cursor: default;
  }
}
</style>
