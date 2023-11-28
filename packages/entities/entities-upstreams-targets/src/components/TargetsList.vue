<template>
  <div class="kong-ui-entities-targets-list">
    <EntityBaseTable
      :cache-identifier="cacheIdentifier"
      disable-pagination-page-jump
      :disable-sorting="disableSorting"
      :empty-state-options="emptyStateOptions"
      enable-entity-actions
      :error-message="errorMessage"
      :fetcher="fetcher"
      :fetcher-cache-key="fetcherCacheKey"
      pagination-type="offset"
      preferences-storage-key="kong-ui-entities-targets-list"
      :table-headers="tableHeaders"
      :use-action-outside="useActionOutside"
      @empty-state-cta-clicked="() => !props.config.createRoute ? handleCreateTarget() : undefined"
      @sort="resetPagination"
    >
      <!-- Create action -->
      <template #toolbar-button>
        <!-- Hide Create button if table is empty -->
        <Teleport
          :disabled="!useActionOutside"
          to="#kong-ui-app-page-header-action-button"
        >
          <PermissionsWrapper :auth-function="() => canCreate()">
            <KButton
              v-show="hasData"
              appearance="primary"
              data-testid="toolbar-new-target"
              icon="plus"
              :to="props.config.createRoute ? props.config.createRoute : undefined"
              @click="() => !props.config.createRoute ? handleCreateTarget() : undefined"
            >
              {{ t('targets.list.toolbar_actions.new_target') }}
            </KButton>
          </PermissionsWrapper>
        </Teleport>
      </template>

      <!-- Column formatting -->
      <template #target="{ rowValue }">
        <span class="target-address">{{ rowValue }}</span>
      </template>
      <template #tags="{ rowValue }">
        <KTruncate>
          <KBadge
            v-for="tag in rowValue"
            :key="tag"
            max-width="auto"
          >
            {{ tag }}
          </KBadge>
        </KTruncate>
      </template>

      <!-- Row actions -->
      <template #actions="{ row }">
        <KClipboardProvider v-slot="{ copyToClipboard }">
          <KDropdownItem
            data-testid="action-entity-copy-id"
            @click="copyId(row, copyToClipboard)"
          >
            {{ t('targets.actions.copy_id') }}
          </KDropdownItem>
        </KClipboardProvider>
        <KClipboardProvider v-slot="{ copyToClipboard }">
          <KDropdownItem
            data-testid="action-entity-copy-json"
            @click="copyJson(row, copyToClipboard)"
          >
            {{ t('targets.actions.copy_json') }}
          </KDropdownItem>
        </KClipboardProvider>
        <PermissionsWrapper :auth-function="() => canEdit(row)">
          <KDropdownItem
            data-testid="action-entity-edit"
            has-divider
            @click="handleEditTarget(row.id)"
          >
            {{ t('targets.actions.edit') }}
          </KDropdownItem>
        </PermissionsWrapper>
        <PermissionsWrapper :auth-function="() => canMarkHealthy(row)">
          <KDropdownItem
            data-testid="action-target-mark-healthy"
            @click="emit('health-actions:healthy', row)"
          >
            {{ t('targets.actions.mark_healthy') }}
          </KDropdownItem>
        </PermissionsWrapper>
        <PermissionsWrapper :auth-function="() => canMarkUnhealthy(row)">
          <KDropdownItem
            data-testid="action-target-mark-unhealthy"
            @click="emit('health-actions:unhealthy', row)"
          >
            {{ t('targets.actions.mark_unhealthy') }}
          </KDropdownItem>
        </PermissionsWrapper>
        <PermissionsWrapper :auth-function="() => canDelete(row)">
          <KDropdownItem
            danger
            data-testid="action-entity-delete"
            has-divider
            @click="deleteRow(row)"
          >
            {{ t('targets.actions.delete') }}
          </KDropdownItem>
        </PermissionsWrapper>
      </template>
    </EntityBaseTable>

    <EntityDeleteModal
      :action-pending="isDeletePending"
      :description="t('targets.delete.description')"
      :entity-type="EntityTypes.Target"
      :error="deleteModalError"
      :need-confirm="false"
      :title="t('targets.delete.title')"
      :visible="isDeleteModalVisible"
      @cancel="hideDeleteModal"
      @proceed="confirmDelete"
    />

    <TargetForm
      :config="formConfig"
      :is-visible="isFormModalVisible"
      :target-id="editedTargetId"
      @cancel="handleCloseFormModal"
      @update="onFormUpdate"
    >
      <template
        v-if="$slots['form-info']"
        #info
      >
        <slot name="form-info" />
      </template>
    </TargetForm>
  </div>
</template>

<script setup lang="ts">
import {
  EntityBaseTable,
  useFetcher,
  FetcherStatus,
  PermissionsWrapper,
  useDeleteUrlBuilder,
  EntityDeleteModal,
  useAxios,
  EntityTypes,
} from '@kong-ui-public/entities-shared'
import type { PropType } from 'vue'
import { computed, onBeforeMount, ref, watch } from 'vue'
import type { AxiosError } from 'axios'
import type {
  KongManagerTargetsListConfig,
  KonnectTargetsListConfig,
  EntityRow,
  CopyEventPayload,
  KonnectTargetFormConfig,
  KongManagerTargetFormConfig,
} from '../types'
import composables from '../composables'
import type {
  BaseTableHeaders,
  EmptyStateOptions,
  TableErrorMessage,
} from '@kong-ui-public/entities-shared'
import endpoints from '../targets-endpoints'
import '@kong-ui-public/entities-shared/dist/style.css'
import TargetForm from './TargetForm.vue'

const emit = defineEmits<{
  (e: 'error', error: AxiosError): void,
  (e: 'copy:success', payload: CopyEventPayload): void,
  (e: 'copy:error', payload: CopyEventPayload): void,
  (e: 'delete:success', target: EntityRow): void,
  (e: 'health-actions:healthy', target: EntityRow): void,
  (e: 'health-actions:unhealthy', target: EntityRow): void,
  (e: 'create:target', data: EntityRow): void,
  (e: 'update:target', data: EntityRow): void,
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectTargetsListConfig | KongManagerTargetsListConfig>,
    required: true,
    validator: (config: KonnectTargetsListConfig | KongManagerTargetsListConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (!config.upstreamId) return false
      if (config.app === 'kongManager' && (typeof config.canMarkHealthy === 'undefined' || typeof config.canMarkUnhealthy === 'undefined')) return false
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
  /** default to false, setting to true will teleport the toolbar button to the destination in the consuming app */
  useActionOutside: {
    type: Boolean,
    default: false,
  },
})

const { i18n: { t } } = composables.useI18n()

const { axiosInstance } = useAxios({
  headers: props.config?.requestHeaders,
})
const fetcherCacheKey = ref<number>(1)

/**
 * Table Headers
 */
const disableSorting = computed((): boolean => props.config.app !== 'kongManager' || !!props.config.disableSorting)
const fields: BaseTableHeaders = {
  target: { label: t('targets.list.table_headers.target_address'), sortable: true },
  weight: { label: t('targets.list.table_headers.weight'), sortable: true },
  tags: { label: t('targets.list.table_headers.tags'), sortable: false },
}
const tableHeaders: BaseTableHeaders = fields

/**
 * Fetcher
 */
const fetcherBaseUrl = computed((): string => {
  let url: string = `${props.config.apiBaseUrl}${endpoints.list[props.config.app]}`

  if (props.config.app === 'konnect') {
    url = url
      .replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
      .replace(/{upstreamId}/gi, props.config?.upstreamId || '')
  } else if (props.config.app === 'kongManager') {
    url = url
      .replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
      .replace(/{upstreamId}/gi, props.config?.upstreamId || '')
  }

  return url
})

const { fetcher, fetcherState } = useFetcher(props.config, fetcherBaseUrl.value)

const resetPagination = (): void => {
  // Increment the cache key on sort
  fetcherCacheKey.value++
}

/**
 * loading, Error, Empty state
 */
const errorMessage = ref<TableErrorMessage>(null)

/**
 * Create target
 */
const handleCreateTarget = () => {
  isFormModalVisible.value = true
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
      message: t('targets.errors.copy'),
    })

    return
  }

  // Emit the success event for the host app
  emit('copy:success', {
    entity: row,
    field: 'id',
    message: t('targets.copy.success', { val: id }),
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
      message: t('targets.errors.copy'),
    })

    return
  }

  // Emit the success event for the host app
  emit('copy:success', {
    entity: row,
    message: t('targets.copy.success_brief'),
  })
}

/**
 * Edit action
 */
const handleEditTarget = (id: string): void => {
  editedTargetId.value = id
  isFormModalVisible.value = true
}

/**
 * Health actions - Kong Manager only
 */
const canMarkHealthy = (target: EntityRow) => {
  if (props.config.app === 'konnect') {
    return false
  }

  return props.config.canMarkHealthy(target)
}
const canMarkUnhealthy = (target: EntityRow) => {
  if (props.config.app === 'konnect') {
    return false
  }

  return props.config.canMarkUnhealthy(target)
}

/**
 * Delete action
 */
const targetToBeDeleted = ref<EntityRow | undefined>(undefined)
const isDeleteModalVisible = ref<boolean>(false)
const isDeletePending = ref<boolean>(false)
const deleteModalError = ref<string>('')

const buildDeleteUrl = useDeleteUrlBuilder(props.config, fetcherBaseUrl.value)

const deleteRow = (row: EntityRow): void => {
  targetToBeDeleted.value = row
  isDeleteModalVisible.value = true
}

const hideDeleteModal = (): void => {
  isDeleteModalVisible.value = false
}

const confirmDelete = async (): Promise<void> => {
  if (!targetToBeDeleted.value?.id) {
    return
  }

  isDeletePending.value = true

  try {
    await axiosInstance.delete(buildDeleteUrl(targetToBeDeleted.value.id))

    isDeletePending.value = false
    isDeleteModalVisible.value = false
    fetcherCacheKey.value++

    // Emit the success event for the host app
    emit('delete:success', targetToBeDeleted.value)
  } catch (error: any) {
    deleteModalError.value = error.response?.data?.message ||
      error.message ||
      t('targets.errors.delete')

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
  // if table is empty, hide the teleported Create button
  if (state.status === FetcherStatus.NoResults) {
    hasData.value = false
  }

  if (state.status === FetcherStatus.Error) {
    errorMessage.value = {
      title: t('targets.errors.general'),
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
  ctaText: undefined,
  message: t('targets.list.empty_state.description'),
  title: t('targets.title'),
  ...(props.config.createRoute && {
    // If `createRoute` provided in config, add a `ctaPath` to empty state CTA button so it becomes a link
    ctaPath: props.config.createRoute,
  }),
})

onBeforeMount(async () => {
  // Evaluate if the user has create permissions
  const userCanCreate = await props.canCreate()

  // If a user can create targets, we need to modify the empty state actions/messaging
  if (userCanCreate) {
    emptyStateOptions.value.title = t('targets.list.empty_state.title')
    emptyStateOptions.value.ctaText = t('targets.actions.create')
  }
})

/**
 * TargetForm Logic
 */
const formConfig = computed((): KonnectTargetFormConfig | KongManagerTargetFormConfig => {
  return {
    app: props.config.app,
    apiBaseUrl: props.config.apiBaseUrl,
    upstreamId: props.config.upstreamId,
    ...{
      // Depending on the app, we need to pass in the control plane ID or workspace
      // see KonnectTargetFormConfig and KongManagerTargetFormConfig types
      ...(props.config.app === 'konnect' && {
        controlPlaneId: props.config.controlPlaneId,
      }),
      ...(props.config.app === 'kongManager' && {
        workspace: props.config.workspace,
        requestHeaders: props.config.requestHeaders,
      }),
    },
  } as KonnectTargetFormConfig | KongManagerTargetFormConfig
})
const editedTargetId = ref<string>('')

const isFormModalVisible = ref<boolean>(false)

const onFormUpdate = (target: EntityRow): void => {
  if (editedTargetId.value) {
    emit('update:target', target)
  } else {
    emit('create:target', target)
  }
  handleTargetUpdate()
}

const handleTargetUpdate = (): void => {
  handleCloseFormModal()

  // Reset the cache key to trigger a re-fetch
  fetcherCacheKey.value++
}

const handleCloseFormModal = (): void => {
  isFormModalVisible.value = false
  editedTargetId.value = ''
}
</script>

<style lang="scss" scoped>
.kong-ui-entities-targets-list {
  .target-address {
    font-weight: 600;
  }
}
</style>
