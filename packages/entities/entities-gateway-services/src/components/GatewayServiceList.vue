<template>
  <div class="kong-ui-entities-gateway-services-list">
    <EntityBaseTable
      :cache-identifier="cacheIdentifier"
      :default-table-preferences="defaultTablePreferences"
      :disable-sorting="disableSorting"
      :empty-state-options="emptyStateOptions"
      enable-entity-actions
      :error-message="errorMessage"
      :fetcher="fetcher"
      :fetcher-cache-key="fetcherCacheKey"
      pagination-type="offset"
      preferences-storage-key="kong-ui-entities-gateway-services-list"
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
              data-testid="gateway-services-learn-more-button"
              icon
              @click="$emit('click:learn-more')"
            >
              <BookIcon decorative />
            </KButton>
            <PermissionsWrapper :auth-function="canCreate">
              <!-- Hide Create button if table is empty -->
              <KButton
                appearance="primary"
                data-testid="toolbar-add-gateway-service"
                :size="useActionOutside ? 'medium' : 'large'"
                :to="config.createRoute"
              >
                <AddIcon />
                {{ t('gateway_services.list.toolbar_actions.new_gateway_service') }}
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
          data-testid="gateway-services-entity-empty-state"
          icon-background
          :message="t('gateway_services.empty_state_v2.description')"
          :title="t('gateway_services.empty_state_v2.title')"
        >
          <template #icon>
            <ServicesIcon decorative />
          </template>

          <template
            v-if="config?.isControlPlaneGroup"
            #default
          >
            {{ t('gateway_services.empty_state_v2.group') }}
          </template>

          <template #action>
            <template v-if="userCanCreate">
              <KDropdown
                v-if="canImportSpecs"
                data-testid="entity-create-dropdown"
                show-caret
                :trigger-text="t('gateway_services.empty_state_v2.create')"
                width="220"
              >
                <template #items>
                  <KDropdownItem @click="handleCreate">
                    {{ t('gateway_services.empty_state_v2.create_new') }}
                  </KDropdownItem>
                  <KDropdownItem @click="$emit('click:import')">
                    {{ t('gateway_services.empty_state_v2.import_spec') }}
                  </KDropdownItem>
                </template>
              </KDropdown>
              <KButton
                v-else
                data-testid="entity-create-button"
                @click="handleCreate"
              >
                <AddIcon decorative />
                {{ t('gateway_services.empty_state_v2.create') }}
              </KButton>
            </template>

            <KButton
              appearance="secondary"
              data-testid="entity-learn-more-button"
              @click="$emit('click:learn-more')"
            >
              <BookIcon decorative />
              {{ t('gateway_services.empty_state_v2.learn_more') }}
            </KButton>
          </template>
        </KEmptyState>
      </template>

      <!-- Column Formatting -->
      <template #name="{ rowValue }">
        <b>{{ rowValue ?? '-' }}</b>
      </template>
      <template #control_plane="{ row }">
        <KBadge
          v-if="row.x_meta?.cluster_id"
          :tooltip="row.x_meta.cluster_id"
          truncation-tooltip
          @click.stop="handleControlPlaneClick(row.x_meta.cluster_id)"
        >
          {{ row.x_meta.cluster_id }}
        </KBadge>
        <b v-else>-</b>
      </template>
      <template #enabled="{ row }">
        <PermissionsWrapper
          :auth-function="() => canEdit(row)"
          force-show
        >
          <template #default="{ isAllowed }">
            <div @click.stop>
              <KInputSwitch
                v-model="row.enabled"
                :data-testid="`row-${row.id}-toggle-input`"
                :disabled="!isAllowed"
                @click.prevent="toggleEnableStatus(row)"
              />
            </div>
          </template>
        </PermissionsWrapper>
      </template>
      <template #tags="{ rowValue }">
        <TableTags :tags="rowValue" />
      </template>
      <template #created_at="{ rowValue }">
        {{ formatUnixTimeStamp(rowValue) }}
      </template>
      <template #updated_at="{ row, rowValue }">
        {{ formatUnixTimeStamp(rowValue ?? row.created_at) }}
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
        <PermissionsWrapper :auth-function="() => canDebug(row)">
          <KDropdownItem
            v-if="config.getDebugRoute"
            data-testid="action-entity-debug"
            :item="getDebugDropdownItem(row.id)"
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
            @click="confirmDelete(row)"
          >
            {{ t('actions.delete.menu_label') }}
          </KDropdownItem>
        </PermissionsWrapper>
      </template>
    </EntityBaseTable>

    <EntityToggleModal
      :action="modalContent.action"
      :entity-id="modalContent.id"
      :entity-name="modalContent.name"
      :entity-type="t('glossary.gateway_services')"
      :on-confirm="confirmSwitchEnablement"
      :visible="enablementModalVisible"
      @cancel="closeEnablementModal"
      @proceed="closeEnablementModal"
    />

    <EntityDeleteModal
      :action-pending="isDeletePending"
      :description="t('actions.delete.description')"
      :entity-name="gatewayServiceToBeDeleted && (gatewayServiceToBeDeleted.name || gatewayServiceToBeDeleted.id)"
      :entity-type="EntityTypes.GatewayService"
      :error="deleteModalError"
      :title="t('actions.delete.title')"
      :visible="isDeleteModalVisible"
      @cancel="hideDeleteModal"
      @proceed="deleteRow"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref, watch, onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'
import { AddIcon, BookIcon, ServicesIcon } from '@kong/icons'
import composables from '../composables'
import endpoints from '../gateway-services-endpoints'
import type { AxiosError } from 'axios'
import type {
  BaseTableHeaders,
  EmptyStateOptions,
  ExactMatchFilterConfig,
  FilterFields,
  FuzzyMatchFilterConfig,
  TableErrorMessage,
} from '@kong-ui-public/entities-shared'
import type {
  KongManagerGatewayServiceListConfig,
  KonnectGatewayServiceListConfig,
  EntityRow,
  CopyEventPayload,
} from '../types'
import {
  EntityBaseTable,
  EntityDeleteModal,
  EntityFilter,
  EntityToggleModal,
  EntityTypes,
  FetcherStatus,
  PermissionsWrapper,
  useAxios,
  useTableState,
  useFetcher,
  useDeleteUrlBuilder,
  TableTags,
} from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'

const emit = defineEmits<{
  (e: 'error', error: AxiosError): void
  (e: 'click:learn-more'): void
  (e: 'copy:success', payload: CopyEventPayload): void
  (e: 'copy:error', payload: CopyEventPayload): void
  (e: 'delete:success', gatewayService: EntityRow): void
  (e: 'toggle:success', gatewayService: EntityRow): void
  (e: 'click:import'): void
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectGatewayServiceListConfig | KongManagerGatewayServiceListConfig>,
    required: true,
    validator: (config: KonnectGatewayServiceListConfig | KongManagerGatewayServiceListConfig): boolean => {
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
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can start debugger session on a given entity */
  canDebug: {
    type: Function as PropType<(row: EntityRow) => boolean | Promise<boolean>>,
    required: false,
    default: async () => false,
  },
  /** default to false, setting to true will teleport the toolbar button to the destination in the consuming app */
  useActionOutside: {
    type: Boolean,
    default: false,
  },
  /** user is onboarding, use onboarding text */
  isServerless: {
    type: Boolean,
    default: false,
  },
  canImportSpecs: {
    type: Boolean,
    default: false,
  },
})

const { i18n: { t, formatUnixTimeStamp } } = composables.useI18n()
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
  // the Name column is non-hidable
  name: { label: t('gateway_services.list.table_headers.name'), searchable: true, sortable: true, hidable: false },
  ...(props.config.showControlPlaneColumn ? { control_plane: { label: t('gateway_services.list.table_headers.control_plane') } } : {}),
  protocol: { label: t('gateway_services.list.table_headers.protocol'), searchable: true, sortable: true },
  host: { label: t('gateway_services.list.table_headers.host'), searchable: true, sortable: true },
  port: { label: t('gateway_services.list.table_headers.port'), searchable: true, sortable: true },
  path: { label: t('gateway_services.list.table_headers.path'), searchable: true, sortable: true },
  enabled: { label: t('gateway_services.list.table_headers.enabled'), searchable: true, sortable: true },
  tags: { label: t('gateway_services.list.table_headers.tags'), sortable: false },
  updated_at: { label: t('gateway_services.list.table_headers.updated_at'), sortable: true },
  created_at: { label: t('gateway_services.list.table_headers.created_at'), sortable: true },
}

const defaultTablePreferences = {
  columnVisibility: {
    created_at: false,
  },
}
const tableHeaders: BaseTableHeaders = fields

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
const baseRequestUrl = computed((): URL => {
  return props.config.apiBaseUrl.startsWith('/')
    ? new URL(`${window.location.origin}${fetcherBaseUrl.value}`)
    : new URL(fetcherBaseUrl.value)
})

const filterQuery = ref<string>('')
const filterConfig = computed<InstanceType<typeof EntityFilter>['$props']['config']>(() => {
  const isExactMatch = (props.config.app === 'konnect' || props.config.isExactMatch)

  if (isExactMatch) {
    return {
      isExactMatch,
      placeholder: t(`search.placeholder.${props.config.app}`),
    } as ExactMatchFilterConfig
  }

  const { name, enabled, protocol, host, port, path } = fields
  const filterFields: FilterFields = { name, enabled, protocol, host, port, path }

  return {
    isExactMatch,
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

const emptyStateOptions = computed((): EmptyStateOptions => {
  return {
    ctaPath: props.config.createRoute,
    ctaText: userCanCreate.value ? props.isServerless ? t('actions.serverless_create') : t('actions.create') : undefined,
    message: `${t('gateway_services.list.empty_state.description')}${props.config.additionMessageForEmptyState ? ` ${props.config.additionMessageForEmptyState}` : ''}`,
    title: userCanCreate.value ? props.isServerless ? t('gateway_services.list.empty_state.serverless_title') : t('gateway_services.list.empty_state.title') : t('gateway_services.title'),
  }
})

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
    props.name = name || id
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

  const url = `${baseRequestUrl.value.href}/${switchEnablementTarget.value.id}`

  const enabled = !switchEnablementTarget.value.enabled

  try {
    const app = props.config?.app
    let filteredTargetEntity: EntityRow | undefined = undefined
    if (filterQuery.value && app === 'konnect') {
      // Fetch the full entity data before updating enablement status
      // This is needed because in Konnect the data returned from the filtered list endpoint
      // 1. does not contain all the fields required for the PUT request to succeed
      // 2. contains fields that are not recognized in the PUT request payload
      filteredTargetEntity = await axiosInstance.get(url)
    }

    const { data } = app === 'konnect'
      ? await axiosInstance.put(url, { ...(filteredTargetEntity?.data || switchEnablementTarget.value), enabled })
      : await axiosInstance.patch(url, { ...switchEnablementTarget.value, enabled })
    // Emit the success event for the host app
    emit('toggle:success', data)
    // Update switchEnablementTarget
    switchEnablementTarget.value.enabled = enabled
  } catch (e: any) {
    emit('error', e)
  }
}

/**
 * Redirect to control plane
 */
const handleControlPlaneClick = (id: string) => {
  if (!props.config.getControlPlaneRoute) {
    return
  }
  router.push(props.config.getControlPlaneRoute(id))
}

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

const getDebugDropdownItem = (id: string) => {
  if (props.config.getDebugRoute) {
    return {
      label: t('actions.debugger'),
      to: props.config.getDebugRoute(id),
    }
  }
}

/**
 * Delete action
 */
const gatewayServiceToBeDeleted = ref<EntityRow | undefined>(undefined)
const isDeleteModalVisible = ref<boolean>(false)
const isDeletePending = ref<boolean>(false)
const deleteModalError = ref<string>('')

const buildDeleteUrl = useDeleteUrlBuilder(props.config, fetcherBaseUrl.value)

const confirmDelete = (row: EntityRow): void => {
  gatewayServiceToBeDeleted.value = row
  isDeleteModalVisible.value = true
  deleteModalError.value = ''
}

const hideDeleteModal = (): void => {
  isDeleteModalVisible.value = false
  gatewayServiceToBeDeleted.value = undefined
}

const deleteRow = async (): Promise<void> => {
  if (!gatewayServiceToBeDeleted.value?.id) {
    return
  }

  isDeletePending.value = true

  try {
    await axiosInstance.delete(buildDeleteUrl(gatewayServiceToBeDeleted.value.id))

    // Emit the success event for the host app
    emit('delete:success', gatewayServiceToBeDeleted.value)

    hideDeleteModal()
    fetcherCacheKey.value++
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
 * Add Gateway Service
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

const userCanCreate = ref(false)
onBeforeMount(async () => {
  userCanCreate.value = await props.canCreate()
})
</script>

<style lang="scss" scoped>
.button-row {
  align-items: center;
  display: flex;
  gap: $kui-space-50;
}

.kong-ui-entities-gateway-services-list {
  width: 100%;

  .kong-ui-entity-filter-input {
    margin-right: $kui-space-50;
  }
}
</style>
