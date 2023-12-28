<template>
  <div class="kong-ui-entities-consumers-list">
    <EntityBaseTable
      :cache-identifier="cacheIdentifier"
      :disable-pagination="isConsumerGroupPage"
      disable-pagination-page-jump
      :disable-sorting="disableSorting"
      :empty-state-options="emptyStateOptions"
      enable-entity-actions
      :error-message="errorMessage"
      :fetcher="fetcher"
      :fetcher-cache-key="fetcherCacheKey"
      pagination-type="offset"
      preferences-storage-key="kong-ui-entities-consumers-list"
      :query="filterQuery"
      :row-attributes="rowAttributes"
      :table-headers="tableHeaders"
      :use-action-outside="useActionOutside"
      @clear-search-input="clearFilter"
      @click:row="(row: any) => rowClick(row as EntityRow)"
      @empty-state-cta-clicked="handleEmptyStateCtaClicked"
      @sort="resetPagination"
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
              data-testid="toolbar-add-consumer"
              icon="plus"
              :to="config.consumerGroupId ? undefined : config.createRoute"
              @click="() => config.consumerGroupId ? handleAddConsumerClick() : undefined"
            >
              {{ config.consumerGroupId ? t('consumers.actions.add_consumer') : t('consumers.list.toolbar_actions.new_consumer') }}
            </KButton>
          </PermissionsWrapper>
        </component>
      </template>

      <!-- Column Formatting -->
      <template #username="{ rowValue }">
        <b>{{ getRowValue(rowValue) }}</b>
      </template>
      <template #custom_id="{ rowValue }">
        {{ getRowValue(rowValue) }}
      </template>
      <template #tags="{ rowValue }">
        <KTruncate v-if="rowValue && rowValue.length > 0">
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
      :action-pending="isDeletePending"
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
      data-testid="remove-consumer-modal"
      :is-visible="isRemoveModalVisible"
      :title="t('consumers.consumer_groups.remove.title')"
      type="danger"
      @canceled="hideRemoveConsumerModal"
      @proceed="removeConsumers"
    >
      <template #body-content>
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
import composables from '../composables'
import endpoints from '../consumers-endpoints'
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
})

const { i18nT, i18n: { t } } = composables.useI18n()
const router = useRouter()

const { axiosInstance } = useAxios({
  headers: props.config?.requestHeaders,
})
const fetcherCacheKey = ref<number>(1)
const isConsumerGroupPage = computed<boolean>(() => !!props.config.consumerGroupId)

/**
 * Table Headers
 */
const disableSorting = computed((): boolean => props.config.app !== 'kongManager' || !!props.config.disableSorting)
const fields: BaseTableHeaders = {
  username: { label: t('consumers.list.table_headers.username'), searchable: true, sortable: true },
  custom_id: { label: t('consumers.list.table_headers.custom_id'), searchable: true, sortable: true },
  tags: { label: t('consumers.list.table_headers.tags'), sortable: false },
}
const tableHeaders: BaseTableHeaders = fields

const rowAttributes = (row: Record<string, any>) => ({
  'data-testid': row.username ?? row.custom_id ?? row.id,
})

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
const dataKeyName = computed((): string | undefined => isConsumerGroupPage.value ? 'consumers' : undefined)
const { fetcher, fetcherState } = useFetcher(props.config, fetcherBaseUrl.value, dataKeyName.value)

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
  message: t('consumers.list.empty_state.description'),
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
.kong-ui-entities-consumers-list {
  width: 100%;

  .message {
    margin-top: 0;
  }

  .kong-ui-entity-filter-input {
    width: 300px;
  }
}
</style>
