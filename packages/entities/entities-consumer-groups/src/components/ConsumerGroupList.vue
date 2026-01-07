<template>
  <div class="kong-ui-entities-consumer-groups-list">
    <EntityBaseTable
      :cache-identifier="cacheIdentifier"
      :disable-pagination="isConsumerPage && !config.paginatedEndpoint"
      :disable-sorting="disableSorting"
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
      @clear-search-input="clearFilter"
      @click:row="(row: any) => rowClick(row as EntityRow)"
      @empty-state-cta-clicked="handleEmptyStateCtaClicked"
      @sort="resetPagination"
      @state="handleStateChange"
    >
      <!-- Filter -->
      <template #toolbar-filter>
        <EntityFilter
          v-if="!isConsumerPage"
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
              data-testid="consumer-groups-learn-more-button"
              icon
              @click="$emit('click:learn-more')"
            >
              <BookIcon decorative />
            </KButton>
            <PermissionsWrapper :auth-function="() => canCreate()">
              <!-- Hide Create button if table is empty -->
              <KButton
                appearance="primary"
                data-testid="toolbar-add-consumer-group"
                :size="useActionOutside ? 'medium' : 'large'"
                @click="handleCreateClick"
              >
                <AddIcon />
                {{ config.consumerId ? t('consumer_groups.actions.add_to_group') : t('consumer_groups.list.toolbar_actions.new_consumer_group') }}
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
          data-testid="consumer-groups-entity-empty-state"
          icon-background
          :message="t('consumer_groups.list.empty_state_v2.description')"
          :title="t('consumer_groups.list.empty_state_v2.title')"
        >
          <template #icon>
            <TeamIcon decorative />
          </template>

          <template
            v-if="config?.isControlPlaneGroup"
            #default
          >
            {{ t('consumer_groups.list.empty_state_v2.group') }}
          </template>

          <template #action>
            <KButton
              v-if="userCanCreate"
              data-testid="entity-create-button"
              @click="handleCreateClick"
            >
              <AddIcon decorative />
              {{ t('consumer_groups.list.toolbar_actions.new_consumer_group') }}
            </KButton>

            <KButton
              appearance="secondary"
              data-testid="entity-learn-more-button"
              @click="$emit('click:learn-more')"
            >
              <BookIcon decorative />
              {{ t('consumer_groups.list.empty_state_v2.learn_more') }}
            </KButton>
          </template>
        </KEmptyState>
      </template>

      <!-- Column Formatting -->
      <template #name="{ rowValue }">
        <b>{{ rowValue ?? '-' }}</b>
      </template>
      <template #consumers_count="{ rowValue }">
        {{ rowValue ?? '-' }}
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
            {{ t('consumer_groups.actions.copy_id') }}
          </KDropdownItem>
        </KClipboardProvider>
        <KClipboardProvider v-slot="{ copyToClipboard }">
          <KDropdownItem
            data-testid="action-entity-copy-json"
            @click="copyJson(row, copyToClipboard)"
          >
            {{ t('consumer_groups.actions.copy_json') }}
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
            @click="() => config.consumerId ? handleExitGroupClick(row) : deleteRow(row)"
          >
            {{ config.consumerId ? t('consumer_groups.actions.exit') : t('consumer_groups.actions.delete') }}
          </KDropdownItem>
        </PermissionsWrapper>
      </template>
    </EntityBaseTable>

    <EntityDeleteModal
      :action-pending="isDeletePending"
      data-testid="delete-consumer-group-modal"
      :description="t('consumer_groups.delete.description')"
      :entity-name="consumerGroupToBeDeleted && (consumerGroupToBeDeleted.name || consumerGroupToBeDeleted.id)"
      :entity-type="EntityTypes.ConsumerGroup"
      :error="deleteModalError"
      :title="t('consumer_groups.delete.title')"
      :visible="isDeleteModalVisible"
      @cancel="hideDeleteModal"
      @proceed="confirmDelete"
    />

    <AddToGroupModal
      v-if="config.consumerId"
      :config="config"
      data-testid="add-to-group-modal"
      :visible="isAddModalVisible"
      @add:partial-success="(data: any) => handleAddSuccess(data, true)"
      @add:success="(data: any) => handleAddSuccess(data)"
      @cancel="hideAddToGroupModal"
    />

    <KPrompt
      v-if="config.consumerId && groupToExit"
      action-button-appearance="danger"
      data-testid="exit-group-modal"
      :title="t('consumer_groups.consumers.exit.title')"
      :visible="isExitModalVisible"
      @cancel="hideExitGroupModal"
      @proceed="exitGroups"
    >
      <template #default>
        <i18n-t
          class="exit-modal-message"
          :keypath="config.consumerUsername ? 'consumer_groups.consumers.exit.confirmation' : 'consumer_groups.consumers.exit.confirmationNoUsername'"
          tag="p"
        >
          <template #consumerGroup>
            <strong>
              {{ groupToExit.name || groupToExit.id }}
            </strong>
          </template>
          <template
            v-if="config.consumerUsername"
            #consumer
          >
            <strong>
              {{ config.consumerUsername }}
            </strong>
          </template>
        </i18n-t>
        <p>
          {{ t('consumer_groups.consumers.exit.description') }}
        </p>
      </template>
    </KPrompt>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref, watch, onBeforeMount } from 'vue'
import type { AxiosError } from 'axios'
import { useRouter } from 'vue-router'
import { AddIcon, BookIcon, TeamIcon } from '@kong/icons'
import composables from '../composables'
import endpoints from '../consumer-groups-endpoints'
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
  TableTags,
  useTableState,
} from '@kong-ui-public/entities-shared'
import type {
  KongManagerConsumerGroupListConfig,
  KonnectConsumerGroupListConfig,
  EntityRow,
  CopyEventPayload,
} from '../types'
import type {
  BaseTableHeaders,
  EmptyStateOptions,
  ExactMatchFilterConfig,
  FuzzyMatchFilterConfig,
  TableErrorMessage,
} from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'
import AddToGroupModal from './AddToGroupModal.vue'

const emit = defineEmits<{
  (e: 'error', error: AxiosError): void
  (e: 'click:learn-more'): void
  (e: 'copy:success', payload: CopyEventPayload): void
  (e: 'copy:error', payload: CopyEventPayload): void
  (e: 'delete:success', consumerGroup: EntityRow): void
  (e: 'add:success', consumers: string[]): void
  (e: 'remove:success', consumer: EntityRow): void
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectConsumerGroupListConfig | KongManagerConsumerGroupListConfig>,
    required: true,
    validator: (config: KonnectConsumerGroupListConfig | KongManagerConsumerGroupListConfig): boolean => {
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

const { i18nT, i18n: { t } } = composables.useI18n()
const router = useRouter()

const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)

/**
 * Table Headers
 */
const disableSorting = computed((): boolean => props.config.app !== 'kongManager' || !!props.config.disableSorting)
const fields: BaseTableHeaders = {
  // the Name column is non-hidable
  name: { label: t('consumer_groups.list.table_headers.name'), searchable: true, sortable: true, hidable: false },
}
// TODO: when koko supports `?count=true` this conditional can be removed
if (props.config.app === 'kongManager') {
  fields.consumers_count = { label: t('consumer_groups.list.table_headers.consumers_count'), searchable: false, sortable: false }
}
fields.tags = { label: t('consumer_groups.list.table_headers.tags'), sortable: false }

const tableHeaders: BaseTableHeaders = fields

const rowAttributes = (row: Record<string, any>) => ({
  'data-testid': row.username ?? row.custom_id ?? row.id,
})

const handleCreateClick = (): void => {
  // if consumer is in consumer group, open add consumer modal
  if (props.config.consumerId) {
    handleAddToGroupClick()
  } else { // else go to create consumer group page
    router.push(props.config.createRoute)
  }
}

/**
 * Fetcher & Filtering
 */
const fetcherBaseUrl = computed<string>(() => {
  let url = `${props.config.apiBaseUrl}${endpoints.list[props.config.app][isConsumerPage.value ? 'forConsumer' : 'all']}`

  if (props.config.app === 'konnect') {
    url = url
      .replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
      .replace(/{consumerId}/gi, props.config?.consumerId || '')
  } else if (props.config.app === 'kongManager') {
    url = url
      .replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
      .replace(/{consumerId}/gi, props.config?.consumerId || '')
  }

  return url
})

const filterQuery = ref<string>('')
const filterConfig = computed<InstanceType<typeof EntityFilter>['$props']['config']>(() => {
  const isExactMatch = (props.config.app === 'konnect' || props.config.isExactMatch)

  if (isExactMatch) {
    return {
      isExactMatch,
      fields: {
        username: fields.name,
        id: { label: t('consumer_groups.list.table_headers.id') },
      },
      placeholder: t('consumer_groups.search.placeholder'),
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

const { hasRecords, handleStateChange } = useTableState(filterQuery)
// Current empty state logic is only for Konnect, KM will pick up at GA.
// If new empty states are enabled, show the learning hub button when the empty state is hidden (for Konnect)
// If new empty states are not enabled, show the learning hub button (for Konnect)
const showHeaderLHButton = computed((): boolean => hasRecords.value && props.config.app === 'konnect')

const isConsumerPage = computed<boolean>(() => !!props.config.consumerId)
const preferencesStorageKey = computed<string>(
  () => isConsumerPage.value ? 'kong-ui-entities-consumer-groups-list-in-consumer-page' : 'kong-ui-entities-consumer-groups-list',
)
const dataKeyName = computed((): string | undefined => {
  if (props.config.app === 'konnect' && filterQuery.value) {
    return 'consumer_group'
  }
  return isConsumerPage.value && !props.config.paginatedEndpoint ? 'consumer_groups' : undefined
})

const {
  fetcher,
  fetcherState,
  fetcherCacheKey,
} = useFetcher(computed(() => ({ ...props.config, cacheIdentifier: props.cacheIdentifier })), fetcherBaseUrl, dataKeyName)

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
      message: t('consumer_groups.errors.copy'),
    })

    return
  }

  // Emit the success event for the host app
  emit('copy:success', {
    entity: row,
    field: 'id',
    message: t('consumer_groups.copy.success', { val: id }),
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
      message: t('consumer_groups.errors.copy'),
    })

    return
  }

  // Emit the success event for the host app
  emit('copy:success', {
    entity: row,
    message: t('consumer_groups.copy.success_brief'),
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
    label: t('consumer_groups.actions.view'),
    to: props.config.getViewRoute(id),
  }
}

/**
 * Edit action
 */
// Render the edit dropdown item as a router-link
const getEditDropdownItem = (id: string) => {
  return {
    label: t('consumer_groups.actions.edit'),
    to: props.config.getEditRoute(id),
  }
}

/**
 * Delete action
 */
const consumerGroupToBeDeleted = ref<EntityRow | undefined>(undefined)
const isDeleteModalVisible = ref<boolean>(false)
const isDeletePending = ref<boolean>(false)
const deleteModalError = ref<string>('')

const buildDeleteUrl = useDeleteUrlBuilder(props.config, fetcherBaseUrl.value)

const deleteRow = (row: EntityRow): void => {
  consumerGroupToBeDeleted.value = row
  isDeleteModalVisible.value = true
}

const hideDeleteModal = (): void => {
  isDeleteModalVisible.value = false
}

const confirmDelete = async (): Promise<void> => {
  if (!consumerGroupToBeDeleted.value?.id) {
    return
  }

  isDeletePending.value = true

  try {
    await axiosInstance.delete(buildDeleteUrl(consumerGroupToBeDeleted.value.id))

    isDeletePending.value = false
    isDeleteModalVisible.value = false
    fetcherCacheKey.value++

    // Emit the success event for the host app
    emit('delete:success', consumerGroupToBeDeleted.value)
  } catch (error: any) {
    deleteModalError.value = error.response?.data?.message ||
      error.message ||
      t('consumer_groups.errors.delete')

    // Emit the error event for the host app
    emit('error', error)
  } finally {
    isDeletePending.value = false
  }
}

/**
 * ------------------------------
 * Consumer Actions
 * ------------------------------
 */
// Add
const isAddModalVisible = ref<boolean>(false)
const handleAddToGroupClick = (): void => {
  isAddModalVisible.value = true
}
const hideAddToGroupModal = (): void => {
  isAddModalVisible.value = false
}
const handleAddSuccess = (data: string[], partialSuccess?: boolean) => {
  // if only partially successful leave the modal open
  if (!partialSuccess) {
    hideAddToGroupModal()
  }
  fetcherCacheKey.value++
  emit('add:success', data)
}

const handleEmptyStateCtaClicked = () => {
  if (isConsumerPage.value) {
    handleAddToGroupClick()
  }
}

// Remove
const groupToExit = ref<EntityRow | undefined>(undefined)
const isExitModalVisible = ref<boolean>(false)
const consumerRemoveError = ref('')
const handleExitGroupClick = (row: EntityRow): void => {
  groupToExit.value = row
  isExitModalVisible.value = true
}
const hideExitGroupModal = (): void => {
  isExitModalVisible.value = false
  groupToExit.value = undefined
}
const removeUrl = computed<string>(() => {
  let url = `${props.config.apiBaseUrl}${endpoints.list[props.config.app].oneForConsumer}`
  if (props.config.app === 'konnect') {
    url = url
      .replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
      .replace(/{consumerId}/gi, props.config?.consumerId || '')
  } else if (props.config.app === 'kongManager') {
    url = url
      .replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
      .replace(/{consumerId}/gi, props.config?.consumerId || '')
  }
  return url
})
const isRemovePending = ref(false)
const exitGroups = async (): Promise<void> => {
  if (!groupToExit.value) {
    return
  }
  isRemovePending.value = true
  try {
    const url = removeUrl.value.replace(/{consumerGroupId}/gi, groupToExit.value.id)
    await axiosInstance.delete(url)
    emit('remove:success', groupToExit.value)
    hideExitGroupModal()
    fetcherCacheKey.value++
  } catch (err: any) {
    consumerRemoveError.value = err.message || t('consumer_groups.errors.delete')
    // Emit the error event for the host app
    emit('error', err)
  } finally {
    isRemovePending.value = false
  }
}

/**
 * Watchers
 */
watch(fetcherState, (state) => {
  if (state.status === FetcherStatus.Error) {
    errorMessage.value = {
      title: t('consumer_groups.errors.general'),
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
  ctaPath: isConsumerPage.value ? undefined : props.config.createRoute,
  ctaText: undefined,
  message: `${t('consumer_groups.list.empty_state.description')}${props.config.additionMessageForEmptyState ? ` ${props.config.additionMessageForEmptyState}` : ''}`,
  title: t('consumer_groups.title'),
})

const userCanCreate = ref<boolean>(false)

onBeforeMount(async () => {
  // Evaluate if the user has create permissions
  userCanCreate.value = await props.canCreate()

  // If a user can create consumer groups, we need to modify the empty state actions/messaging
  if (userCanCreate.value) {
    emptyStateOptions.value.title = isConsumerPage.value ? t('consumer_groups.list.empty_state.title_for_consumer') : t('consumer_groups.list.empty_state.title')
    emptyStateOptions.value.ctaText = isConsumerPage.value ? t('consumer_groups.actions.add_to_group') : t('consumer_groups.actions.create')
  }
})
</script>

<style lang="scss" scoped>
.button-row {
  align-items: center;
  display: flex;
  gap: var(--kui-space-50, $kui-space-50);
}

.kong-ui-entities-consumer-groups-list {
  width: 100%;

  .kong-ui-entity-filter-input {
    margin-right: var(--kui-space-50, $kui-space-50);
  }

  .exit-modal-message {
    margin-top: 0;
  }
}
</style>
