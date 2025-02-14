<template>
  <div class="kong-ui-entities-consumers-list">
    <EntityBaseTable
      :cache-identifier="cacheIdentifier"
      :disable-sorting="disableSorting"
      :empty-state-options="emptyStateOptions"
      enable-entity-actions
      :error-message="errorMessage"
      :fetcher="fetcher"
      :fetcher-cache-key="fetcherCacheKey"
      :hide-pagination="isConsumerGroupPage && !config.paginatedEndpoint"
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
          v-if="!isConsumerGroupPage"
          v-model="filterQuery"
          :config="filterConfig"
        />
      </template>
      <!-- Create action -->
      <template
        v-if="!useExternalCreate"
        #toolbar-button
      >
        <Teleport
          :disabled="!useActionOutside"
          to="#kong-ui-app-page-header-action-button"
        >
          <div class="button-row">
            <KButton
              v-if="!isConsumerGroupPage && showHeaderLHButton"
              appearance="secondary"
              class="open-learning-hub"
              data-testid="consumers-learn-more-button"
              icon
              @click="$emit('click:learn-more')"
            >
              <BookIcon decorative />
            </KButton>
            <PermissionsWrapper :auth-function="() => canCreate()">
              <!-- Hide Create button if table is empty -->
              <KButton
                appearance="primary"
                data-testid="toolbar-add-consumer"
                :size="useActionOutside ? 'medium' : 'large'"
                @click="handleCreateClick"
              >
                <AddIcon />
                {{ config.consumerGroupId ? t('consumers.actions.add_consumer') : t('consumers.list.toolbar_actions.new_consumer') }}
              </KButton>
            </PermissionsWrapper>
          </div>
        </Teleport>
      </template>

      <!-- TODO: remove this slot when empty states M2 is cleaned up -->
      <template
        v-if="!hasRecords && isLegacyLHButton"
        #outside-actions
      >
        <Teleport
          :disabled="!useActionOutside"
          to="#kong-ui-app-page-header-action-button"
        >
          <KButton
            appearance="secondary"
            class="open-learning-hub"
            data-testid="consumers-learn-more-button"
            icon
            @click="$emit('click:learn-more')"
          >
            <BookIcon decorative />
          </KButton>
        </Teleport>
      </template>

      <template
        v-if="enableV2EmptyStates && config.app === 'konnect'"
        #empty-state
      >
        <EntityEmptyState
          :action-button-text="t('consumers.list.toolbar_actions.new_consumer')"
          appearance="secondary"
          :can-create="() => canCreate()"
          :description="t('consumers.list.empty_state_v2.description')"
          :learn-more="config.app === 'konnect'"
          :title="t('consumers.list.empty_state_v2.title')"
          @click:create="handleCreateClick"
          @click:learn-more="$emit('click:learn-more')"
        >
          <template #image>
            <div class="empty-state-icon-gateway">
              <TeamIcon
                :color="KUI_COLOR_TEXT_DECORATIVE_AQUA"
                :size="KUI_ICON_SIZE_50"
              />
            </div>
          </template>
        </EntityEmptyState>
      </template>

      <!-- Column Formatting -->
      <template #username="{ rowValue }">
        <b>{{ getRowValue(rowValue) }}</b>
      </template>
      <template #custom_id="{ rowValue }">
        {{ getRowValue(rowValue) }}
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
            {{ t('consumers.actions.copy_id') }}
          </KDropdownItem>
        </KClipboardProvider>
        <KClipboardProvider v-slot="{ copyToClipboard }">
          <KDropdownItem
            data-testid="action-entity-copy-json"
            @click="copyJson(row, copyToClipboard)"
          >
            {{ t('consumers.actions.copy_json') }}
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
            @click="() => config.consumerGroupId ? handleRemoveConsumerClick(row) : deleteRow(row)"
          >
            {{ config.consumerGroupId ? t('consumers.actions.remove') : t('consumers.actions.delete') }}
          </KDropdownItem>
        </PermissionsWrapper>
      </template>
    </EntityBaseTable>

    <EntityDeleteModal
      :action-button-disabled="isDeletePending"
      data-testid="delete-consumer-modal"
      :description="t('consumers.delete.description')"
      :entity-name="consumerToBeDeleted && (consumerToBeDeleted.username || consumerToBeDeleted.custom_id || consumerToBeDeleted.id)"
      :entity-type="EntityTypes.Consumer"
      :error="deleteModalError"
      :title="t('consumers.delete.title')"
      :visible="isDeleteModalVisible"
      @cancel="hideDeleteModal"
      @proceed="confirmDelete"
    />

    <AddConsumerModal
      v-if="config.consumerGroupId"
      :config="config"
      data-testid="add-consumer-modal"
      :visible="isAddModalVisible"
      @add:partial-success="(data: any) => handleAddSuccess(data, true)"
      @add:success="(data: any) => handleAddSuccess(data)"
      @cancel="hideAddConsumerModal"
    />

    <KPrompt
      v-if="config.consumerGroupId && consumerToBeRemoved"
      action-button-appearance="danger"
      data-testid="remove-consumer-modal"
      :title="t('consumers.consumer_groups.remove.title')"
      :visible="isRemoveModalVisible"
      @cancel="hideRemoveConsumerModal"
      @proceed="removeConsumers"
    >
      <template #default>
        <i18n-t
          class="message"
          :keypath="config.consumerGroupName ? 'consumers.consumer_groups.remove.confirmation' : 'consumers.consumer_groups.remove.confirmationNoCG'"
          tag="p"
        >
          <template #consumer>
            <strong>
              {{ consumerToBeRemoved.username || consumerToBeRemoved.custom_id || consumerToBeRemoved.id }}
            </strong>
          </template>
          <template
            v-if="config.consumerGroupName"
            #consumerGroup
          >
            <strong>
              {{ config.consumerGroupName }}
            </strong>
          </template>
        </i18n-t>
        <p>
          {{ t('consumers.consumer_groups.remove.description') }}
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
import { KUI_ICON_SIZE_50, KUI_COLOR_TEXT_DECORATIVE_AQUA } from '@kong/design-tokens'
import composables from '../composables'
import endpoints from '../consumers-endpoints'
import {
  EntityBaseTable,
  EntityDeleteModal,
  EntityEmptyState,
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
  KongManagerConsumerListConfig,
  KonnectConsumerListConfig,
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
import AddConsumerModal from './AddConsumerModal.vue'

const emit = defineEmits<{
  (e: 'error', error: AxiosError): void,
  (e: 'click:learn-more'): void,
  (e: 'copy:success', payload: CopyEventPayload): void,
  (e: 'copy:error', payload: CopyEventPayload): void,
  (e: 'delete:success', consumer: EntityRow): void,
  (e: 'add:success', consumers: string[]): void,
  (e: 'remove:success', consumer: EntityRow): void,
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectConsumerListConfig | KongManagerConsumerListConfig>,
    required: true,
    validator: (config: KonnectConsumerListConfig | KongManagerConsumerListConfig): boolean => {
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
  /**
   * Enables the new empty state design, this prop can be removed when
   * the khcp-14756-empty-states-m2 FF is removed.
   */
  enableV2EmptyStates: {
    type: Boolean,
    default: false,
  },
  /**
   * POC: externalize create/LH actions for list view
   */
  useExternalCreate: {
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
  // the Username column is non-hidable
  username: { label: t('consumers.list.table_headers.username'), searchable: true, sortable: true, hidable: false },
  custom_id: { label: t('consumers.list.table_headers.custom_id'), searchable: true, sortable: true },
  tags: { label: t('consumers.list.table_headers.tags'), sortable: false },
}
const tableHeaders: BaseTableHeaders = fields

const rowAttributes = (row: Record<string, any>) => ({
  'data-testid': row.username ?? row.custom_id ?? row.id,
})

const handleCreateClick = (): void => {
  // if consumer is in consumer group, open add consumer modal
  if (props.config.consumerGroupId) {
    handleAddConsumerClick()
  } else { // else go to create consumer page
    router.push(props.config.createRoute)
  }
}

/**
 * Fetcher & Filtering
 */
const fetcherBaseUrl = computed<string>(() => {
  let url = `${props.config.apiBaseUrl}${endpoints.list[props.config.app][isConsumerGroupPage.value ? 'forConsumerGroup' : 'all']}`

  if (props.config.app === 'konnect') {
    url = url
      .replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
      .replace(/{consumerGroupId}/gi, props.config?.consumerGroupId || '')
  } else if (props.config.app === 'kongManager') {
    url = url
      .replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
      .replace(/{consumerGroupId}/gi, props.config?.consumerGroupId || '')
  }

  return url
})

const filterQuery = ref<string>('')
const filterConfig = computed<InstanceType<typeof EntityFilter>['$props']['config']>(() => {
  const isExactMatch = (props.config.app === 'konnect' || props.config.isExactMatch)

  if (isExactMatch) {
    return {
      isExactMatch,
      placeholder: t(`consumers.search.placeholder.${props.config.app}`),
    } as ExactMatchFilterConfig
  }

  return {
    isExactMatch,
    fields: {
      username: fields.username,
      custom_id: fields.custom_id,
    },
    schema: props.config.filterSchema,
  } as FuzzyMatchFilterConfig
})

const { hasRecords, handleStateChange } = useTableState(filterQuery)
// Current empty state logic is only for Konnect, KM will pick up at GA.
// If new empty states are enabled, show the learning hub button when the empty state is hidden (for Konnect)
// If new empty states are not enabled, show the learning hub button (for Konnect)
const showHeaderLHButton = computed((): boolean => hasRecords.value && props.config.app === 'konnect')
const isLegacyLHButton = computed((): boolean => !props.enableV2EmptyStates && props.config.app === 'konnect')

// Let the host app know if the table has records in order to show/hide action buttons in the header
defineExpose({
  hasRecords,
  handleCreateClick,
})

const isConsumerGroupPage = computed<boolean>(() => !!props.config.consumerGroupId)
const preferencesStorageKey = computed<string>(
  () => isConsumerGroupPage.value ? 'kong-ui-entities-consumers-list-in-group-page' : 'kong-ui-entities-consumers-list',
)
const dataKeyName = computed((): string | undefined => isConsumerGroupPage.value && !props.config.paginatedEndpoint ? 'consumers' : undefined)
const {
  fetcher,
  fetcherState,
  fetcherCacheKey,
} = useFetcher({ ...props.config, cacheIdentifier: props.cacheIdentifier }, fetcherBaseUrl.value, dataKeyName.value)

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
      message: t('consumers.errors.copy'),
    })

    return
  }

  // Emit the success event for the host app
  emit('copy:success', {
    entity: row,
    field: 'id',
    message: t('consumers.copy.success', { val: id }),
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
      message: t('consumers.errors.copy'),
    })

    return
  }

  // Emit the success event for the host app
  emit('copy:success', {
    entity: row,
    message: t('consumers.copy.success_brief'),
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
    label: t('consumers.actions.view'),
    to: props.config.getViewRoute(id),
  }
}

/**
 * Edit action
 */
// Render the edit dropdown item as a router-link
const getEditDropdownItem = (id: string) => {
  return {
    label: t('consumers.actions.edit'),
    to: props.config.getEditRoute(id),
  }
}

/**
 * Delete action
 */
const consumerToBeDeleted = ref<EntityRow | undefined>(undefined)
const isDeleteModalVisible = ref<boolean>(false)
const isDeletePending = ref<boolean>(false)
const deleteModalError = ref<string>('')

const buildDeleteUrl = useDeleteUrlBuilder(props.config, fetcherBaseUrl.value)

const deleteRow = (row: EntityRow): void => {
  consumerToBeDeleted.value = row
  isDeleteModalVisible.value = true
}

const hideDeleteModal = (): void => {
  isDeleteModalVisible.value = false
}

const confirmDelete = async (): Promise<void> => {
  if (!consumerToBeDeleted.value?.id) {
    return
  }

  isDeletePending.value = true

  try {
    await axiosInstance.delete(buildDeleteUrl(consumerToBeDeleted.value.id))

    isDeletePending.value = false
    isDeleteModalVisible.value = false
    fetcherCacheKey.value++

    // Emit the success event for the host app
    emit('delete:success', consumerToBeDeleted.value)
  } catch (error: any) {
    deleteModalError.value = error.response?.data?.message ||
      error.message ||
      t('consumers.errors.delete')

    // Emit the error event for the host app
    emit('error', error)
  } finally {
    isDeletePending.value = false
  }
}

/**
 * ------------------------------
 * Consumer Group Actions
 * ------------------------------
 */
// Add
const isAddModalVisible = ref<boolean>(false)
const handleAddConsumerClick = (): void => {
  isAddModalVisible.value = true
}

const hideAddConsumerModal = (): void => {
  isAddModalVisible.value = false
}

const handleAddSuccess = (data: Array<string>, partialSuccess?: boolean) => {
  // if only partially successful leave the modal open
  if (!partialSuccess) {
    hideAddConsumerModal()
  }

  fetcherCacheKey.value++
  emit('add:success', data)
}

const handleEmptyStateCtaClicked = () => {
  if (isConsumerGroupPage.value) {
    handleAddConsumerClick()
  }
}

// Remove
const consumerToBeRemoved = ref<EntityRow | undefined>(undefined)
const isRemoveModalVisible = ref<boolean>(false)
const consumerRemoveError = ref('')
const handleRemoveConsumerClick = (row: EntityRow): void => {
  consumerToBeRemoved.value = row
  isRemoveModalVisible.value = true
}

const hideRemoveConsumerModal = (): void => {
  isRemoveModalVisible.value = false
  consumerToBeRemoved.value = undefined
}

const removeUrl = computed<string>(() => {
  let url = `${props.config.apiBaseUrl}${endpoints.list[props.config.app].oneForConsumerGroup}`

  if (props.config.app === 'konnect') {
    url = url
      .replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
      .replace(/{consumerGroupId}/gi, props.config?.consumerGroupId || '')
  } else if (props.config.app === 'kongManager') {
    url = url
      .replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
      .replace(/{consumerGroupId}/gi, props.config?.consumerGroupId || '')
  }

  return url
})

const isRemovePending = ref(false)
const removeConsumers = async (): Promise<void> => {
  if (!consumerToBeRemoved.value) {
    return
  }

  isRemovePending.value = true

  try {
    const url = removeUrl.value.replace(/{consumerId}/gi, consumerToBeRemoved.value.id)

    await axiosInstance.delete(url)

    emit('remove:success', consumerToBeRemoved.value)

    hideRemoveConsumerModal()
    fetcherCacheKey.value++
  } catch (err: any) {
    consumerRemoveError.value = err.message || t('consumers.errors.delete')

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
      title: t('consumers.errors.general'),
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
  ctaPath: isConsumerGroupPage.value ? undefined : props.config.createRoute,
  ctaText: undefined,
  message: `${t('consumers.list.empty_state.description')}${props.config.additionMessageForEmptyState ? ` ${props.config.additionMessageForEmptyState}` : ''}`,
  title: t('consumers.title'),
})

onBeforeMount(async () => {
  // Evaluate if the user has create permissions
  const userCanCreate = await props.canCreate()

  // If a user can create consumers, we need to modify the empty state actions/messaging
  if (userCanCreate) {
    emptyStateOptions.value.title = isConsumerGroupPage.value ? t('consumers.list.empty_state.title_for_consumer_group') : t('consumers.list.empty_state.title')
    emptyStateOptions.value.ctaText = isConsumerGroupPage.value ? t('consumers.actions.add_consumer') : t('consumers.actions.create')
  }
})
</script>

<style lang="scss" scoped>
.button-row {
  align-items: center;
  display: flex;
  gap: $kui-space-50;
}

.kong-ui-entities-consumers-list {
  width: 100%;

  .message {
    margin-top: 0;
  }

  .kong-ui-entity-filter-input {
    margin-right: $kui-space-50;
  }
}
</style>
