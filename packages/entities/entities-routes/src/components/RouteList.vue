<template>
  <div class="kong-ui-entities-routes-list">
    <EntityBaseTable
      :cache-identifier="cacheIdentifier"
      :cell-attributes="getCellAttrs"
      :default-table-preferences="defaultTablePreferences"
      :disable-sorting="disableSorting"
      :empty-state-options="emptyStateOptions"
      enable-entity-actions
      :error-message="errorMessage"
      :fetcher="fetcher"
      :fetcher-cache-key="fetcherCacheKey"
      pagination-type="offset"
      preferences-storage-key="kong-ui-entities-routes-list"
      :query="filterQuery"
      :table-headers="tableHeaders"
      :title="title"
      :title-tag="titleTag"
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
              v-if="!isServicePage && showHeaderLHButton"
              appearance="secondary"
              class="open-learning-hub"
              data-testid="routes-learn-more-button"
              icon
              @click="$emit('click:learn-more')"
            >
              <BookIcon decorative />
            </KButton>
            <PermissionsWrapper :auth-function="() => canCreate()">
              <!-- Hide Create button if table is empty -->
              <KButton
                appearance="primary"
                data-testid="toolbar-add-route"
                :size="useActionOutside ? 'medium' : 'large'"
                :to="config.createRoute"
              >
                <AddIcon />
                {{ t('routes.list.toolbar_actions.new_route') }}
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
          :data-testid="config.serviceId ? 'nested-routes-entity-empty-state' : 'routes-entity-empty-state'"
          icon-background
          :message="t('routes.list.empty_state_v2.description')"
          :title="t('routes.list.empty_state_v2.title')"
        >
          <template #icon>
            <ForwardIcon decorative />
          </template>

          <template
            v-if="config?.isControlPlaneGroup"
            #default
          >
            {{ t('routes.list.empty_state_v2.group') }}
          </template>

          <template #action>
            <KButton
              v-if="userCanCreate"
              data-testid="entity-create-button"
              :to="config.createRoute"
            >
              <AddIcon decorative />
              {{ t('routes.list.toolbar_actions.new_route') }}
            </KButton>

            <KButton
              appearance="secondary"
              data-testid="entity-learn-more-button"
              @click="$emit('click:learn-more')"
            >
              <BookIcon decorative />
              {{ t('routes.list.empty_state_v2.learn_more') }}
            </KButton>
          </template>
        </KEmptyState>
      </template>

      <!-- Column Formatting -->
      <template #name="{ rowValue }">
        <b>{{ rowValue ?? '-' }}</b>
      </template>
      <template #protocols="{ rowValue }">
        <KTruncate>
          <KBadge
            v-for="protocol in rowValue"
            :key="protocol"
            appearance="neutral"
            @click.stop
          >
            {{ protocol }}
          </KBadge>
        </KTruncate>
      </template>
      <template #hosts="{ rowValue }">
        <KTruncate v-if="rowValue?.length > 0">
          <KBadge
            v-for="host in rowValue"
            :key="host"
            appearance="neutral"
            :tooltip="host"
            truncation-tooltip
            @click.stop
          >
            {{ host }}
          </KBadge>
        </KTruncate>
        <span v-else>-</span>
      </template>
      <template #methods="{ rowValue }">
        <KTruncate v-if="rowValue?.length > 0">
          <KBadge
            v-for="method in rowValue"
            :key="method"
            :appearance="Object.values(BadgeMethodAppearances).includes(method.toLowerCase() as BadgeMethodAppearance) ? method.toLowerCase() as BadgeMethodAppearance : 'custom'"
            @click.stop
          >
            {{ method }}
          </KBadge>
        </KTruncate>
        <span v-else>-</span>
      </template>
      <template #paths="{ rowValue }">
        <KTruncate v-if="rowValue?.length > 0">
          <KBadge
            v-for="path in rowValue"
            :key="path"
            appearance="neutral"
            :tooltip="path"
            truncation-tooltip
            @click.stop
          >
            {{ path }}
          </KBadge>
        </KTruncate>
        <span v-else>-</span>
      </template>
      <template #tags="{ rowValue }">
        <TableTags :tags="rowValue" />
      </template>
      <template #expression="{ rowValue }">
        <span class="route-list-cell-expression">
          {{ rowValue || '-' }}
        </span>
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
      :entity-name="routeToBeDeleted && (routeToBeDeleted.name || routeToBeDeleted.id)"
      :entity-type="EntityTypes.Route"
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
import type { AxiosError } from 'axios'
import { useRouter } from 'vue-router'

import { BadgeMethodAppearances } from '@kong/kongponents'
import type { BadgeMethodAppearance, HeaderTag } from '@kong/kongponents'
import { AddIcon, ForwardIcon, BookIcon } from '@kong/icons'
import {
  EntityBaseTable,
  EntityDeleteModal,
  EntityFilter,
  EntityTypes,
  FetcherStatus,
  PermissionsWrapper,
  useAxios,
  useFetcher,
  useTableState,
  useDeleteUrlBuilder,
  TableTags,
} from '@kong-ui-public/entities-shared'
import type {
  KongManagerRouteListConfig,
  KonnectRouteListConfig,
  EntityRow,
  CopyEventPayload,
} from '../types'
import type {
  BaseTableHeaders,
  EmptyStateOptions,
  ExactMatchFilterConfig,
  FilterFields,
  FuzzyMatchFilterConfig,
  TableErrorMessage,
} from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'

import composables from '../composables'
import endpoints from '../routes-endpoints'

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
    type: Object as PropType<KonnectRouteListConfig | KongManagerRouteListConfig>,
    required: true,
    validator: (config: KonnectRouteListConfig | KongManagerRouteListConfig): boolean => {
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
  hideTraditionalColumns: {
    type: Boolean,
    default: false,
  },
  hasExpressionColumn: {
    type: Boolean,
    default: false,
  },
})

const { i18n: { t, formatUnixTimeStamp } } = composables.useI18n()
const router = useRouter()

const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)
const { handleStateChange, hasRecords } = useTableState(() => filterQuery.value)
// Current empty state logic is only for Konnect, KM will pick up at GA.
// If new empty states are enabled, show the learning hub button when the empty state is hidden (for Konnect)
// If new empty states are not enabled, show the learning hub button (for Konnect)
const showHeaderLHButton = computed((): boolean => hasRecords.value && props.config.app === 'konnect')

// if the RouteList in nested in the routes tab on a service detail page
const isServicePage = computed<boolean>(() => !!props.config.serviceId)

/**
 * Table Headers
 */
const disableSorting = computed((): boolean => props.config.app !== 'kongManager' || !!props.config.disableSorting)
const fields: BaseTableHeaders = {
  // the Name column is non-hidable
  name: { label: t('routes.list.table_headers.name'), searchable: true, sortable: true, hidable: false },
  protocols: { label: t('routes.list.table_headers.protocols'), searchable: true },
  ...!props.hideTraditionalColumns && {
    hosts: { label: t('routes.list.table_headers.hosts'), searchable: true },
    methods: { label: t('routes.list.table_headers.methods'), searchable: true },
    paths: { label: t('routes.list.table_headers.paths'), searchable: true },
  },
  ...props.hasExpressionColumn && {
    expression: { label: t('routes.list.table_headers.expression'), tooltip: true },
  },
  tags: { label: t('routes.list.table_headers.tags'), sortable: false },
  updated_at: { label: t('routes.list.table_headers.updated_at'), sortable: true },
  created_at: { label: t('routes.list.table_headers.created_at'), sortable: true },
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
  let url = `${props.config.apiBaseUrl}${endpoints.list[props.config.app][props.config.serviceId ? 'forGatewayService' : 'all']}`

  if (props.config.app === 'konnect') {
    url = url
      .replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
      .replace(/{serviceId}/gi, props.config?.serviceId || '')
  } else if (props.config.app === 'kongManager') {
    url = url
      .replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
      .replace(/{serviceId}/gi, props.config?.serviceId || '')
  }

  return url
})

const filterQuery = ref<string>('')
const filterConfig = computed<InstanceType<typeof EntityFilter>['$props']['config']>(() => {
  const isExactMatch = (props.config.app === 'konnect' || props.config.isExactMatch)

  if (isExactMatch) {
    return {
      isExactMatch,
      // force exact placeholder if `props.config.isExactMatch` is true
      placeholder: t(`search.placeholder.${props.config.isExactMatch ? 'exact' : props.config.app}`),
    } as ExactMatchFilterConfig
  }

  const { name, protocols, hosts, methods, paths, expression } = fields
  const filterFields: FilterFields = {
    name, protocols, hosts, methods, paths, ...props.hasExpressionColumn && { expression },
  }

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

const getCellAttrs = (params: Record<string, any>): Record<string, any> => {
  if (params.headerKey === 'expression') {
    return {
      style: {
        maxWidth: '250px',
        overflowX: 'hidden',
        textOverflow: 'ellipsis',
      },
    }
  }

  return {}
}

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
  if (!await copyToClipboard(row.id)) {
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
    message: t('copy.success', { val: row.id }),
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

  router.push(props.config.getViewRoute(row.id))
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
  return {
    label: t('actions.debugger'),
    to: props.config.getDebugRoute(id),
  }
}

/**
 * Delete action
 */
const routeToBeDeleted = ref<EntityRow | undefined>(undefined)
const isDeleteModalVisible = ref<boolean>(false)
const isDeletePending = ref<boolean>(false)
const deleteModalError = ref<string>('')

const buildDeleteUrl = useDeleteUrlBuilder(props.config, fetcherBaseUrl.value)

const deleteRow = (row: EntityRow): void => {
  routeToBeDeleted.value = row
  isDeleteModalVisible.value = true
}

const hideDeleteModal = (): void => {
  isDeleteModalVisible.value = false
}

const confirmDelete = async (): Promise<void> => {
  if (!routeToBeDeleted.value?.id) {
    return
  }

  isDeletePending.value = true

  try {
    await axiosInstance.delete(buildDeleteUrl(routeToBeDeleted.value.id))

    isDeletePending.value = false
    isDeleteModalVisible.value = false
    fetcherCacheKey.value++

    // Emit the success event for the host app
    emit('delete:success', routeToBeDeleted.value)
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
  message: `${t('routes.list.empty_state.description')}${props.config.additionMessageForEmptyState ? ` ${props.config.additionMessageForEmptyState}` : ''}`,
  title: t('routes.title'),
})

const userCanCreate = ref<boolean>(false)

onBeforeMount(async () => {
  // Evaluate if the user has create permissions
  userCanCreate.value = await props.canCreate()

  // If a user can create, we need to modify the empty state actions/messaging
  if (userCanCreate.value) {
    emptyStateOptions.value.title = t('routes.list.empty_state.title')
    emptyStateOptions.value.ctaText = t('actions.create')
  }
})
</script>

<style lang="scss" scoped>
.button-row {
  align-items: center;
  display: flex;
  gap: $kui-space-50;
}

.kong-ui-entities-routes-list {
  width: 100%;

  .kong-ui-entity-filter-input {
    margin-right: $kui-space-50;
  }

  .route-list-cell-expression {
    font-family: $kui-font-family-code;
  }
}
</style>
