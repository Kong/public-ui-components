<template>
  <div class="kong-ui-entities-consumer-credentials-list">
    <EntityBaseTable
      :cache-identifier="cacheIdentifier"
      disable-pagination-page-jump
      disable-sorting
      :empty-state-options="emptyStateOptions"
      enable-entity-actions
      :error-message="errorMessage"
      :fetcher="fetcher"
      :fetcher-cache-key="fetcherCacheKey"
      pagination-type="offset"
      preferences-storage-key="kong-ui-entities-consumer-credentials-list"
      :table-headers="tableHeaders"
      @sort="resetPagination"
    >
      <!-- Create action -->
      <template #toolbar-button>
        <PermissionsWrapper :auth-function="() => canCreate()">
          <KButton
            appearance="primary"
            data-testid="toolbar-add-credential"
            icon="plus"
            :to="config.createRoute"
          >
            {{ t(`credentials.list.toolbar_actions.${config.plugin}.new`) }}
          </KButton>
        </PermissionsWrapper>
      </template>

      <!-- Column Formatting -->
      <template #group="{ rowValue }">
        <b>{{ rowValue ?? '-' }}</b>
      </template>
      <template #name="{ rowValue }">
        <b>{{ rowValue ?? '-' }}</b>
      </template>
      <template #username="{ rowValue }">
        <span>{{ rowValue ?? '-' }}</span>
      </template>
      <template #password="{ row, rowValue }">
        <CopyUuid
          format="redacted"
          :notify="(param: CopyUuidNotifyParam) => notifyCopyAction(param, row, 'password')"
          :uuid="rowValue"
        />
      </template>
      <template #key="{ row, rowValue }">
        <CopyUuid
          format="redacted"
          :notify="(param: CopyUuidNotifyParam) => notifyCopyAction(param, row, 'key')"
          :uuid="rowValue"
        />
      </template>
      <template #client_secret="{ row, rowValue }">
        <CopyUuid
          format="redacted"
          :notify="(param: CopyUuidNotifyParam) => notifyCopyAction(param, row, 'client_secret')"
          :uuid="rowValue"
        />
      </template>
      <template #secret="{ row, rowValue }">
        <CopyUuid
          format="redacted"
          :notify="(param: CopyUuidNotifyParam) => notifyCopyAction(param, row, 'secret')"
          :uuid="rowValue"
        />
      </template>
      <template #created_at="{ rowValue }">
        {{ formatUnixTimeStamp(rowValue) }}
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
            @click="copy(row, 'id', copyToClipboard)"
          >
            {{ t('credentials.actions.copy_id') }}
          </KDropdownItem>
        </KClipboardProvider>
        <KClipboardProvider
          v-if="config.plugin === 'basic-auth'"
          v-slot="{ copyToClipboard }"
        >
          <KDropdownItem
            data-testid="action-entity-copy-credential"
            @click="copy(row, 'password', copyToClipboard)"
          >
            {{ t('credentials.actions.copy_credential') }}
          </KDropdownItem>
        </KClipboardProvider>
        <KClipboardProvider
          v-if="['key-auth', 'key-auth-enc', 'jwt'].includes(config.plugin)"
          v-slot="{ copyToClipboard }"
        >
          <KDropdownItem
            data-testid="action-entity-copy-key"
            @click="copy(row, 'key', copyToClipboard)"
          >
            {{ t('credentials.actions.copy_key') }}
          </KDropdownItem>
        </KClipboardProvider>
        <KClipboardProvider
          v-if="config.plugin === 'oauth2'"
          v-slot="{ copyToClipboard }"
        >
          <KDropdownItem
            data-testid="action-entity-copy-secret"
            @click="copy(row, 'client_secret', copyToClipboard)"
          >
            {{ t('credentials.actions.copy_secret') }}
          </KDropdownItem>
        </KClipboardProvider>
        <KClipboardProvider
          v-if="config.plugin === 'hmac-auth'"
          v-slot="{ copyToClipboard }"
        >
          <KDropdownItem
            data-testid="action-entity-copy-secret"
            @click="copy(row, 'secret', copyToClipboard)"
          >
            {{ t('credentials.actions.copy_secret') }}
          </KDropdownItem>
        </KClipboardProvider>
        <KClipboardProvider v-slot="{ copyToClipboard }">
          <KDropdownItem
            data-testid="action-entity-copy-json"
            @click="copy(row, undefined, copyToClipboard)"
          >
            {{ t('credentials.actions.copy_json') }}
          </KDropdownItem>
        </KClipboardProvider>
        <PermissionsWrapper :auth-function="() => canEdit(row)">
          <KDropdownItem
            data-testid="action-entity-edit"
            has-divider
            :item="getEditDropdownItem(row.id)"
          />
        </PermissionsWrapper>
        <PermissionsWrapper :auth-function="() => canDelete(row)">
          <KDropdownItem
            data-testid="action-entity-delete"
            has-divider
            is-dangerous
            @click="deleteRow(row)"
          >
            {{ t('credentials.actions.delete') }}
          </KDropdownItem>
        </PermissionsWrapper>
      </template>
    </EntityBaseTable>

    <EntityDeleteModal
      :action-pending="isDeletePending"
      :description="t('credentials.delete.description')"
      :entity-type="deleteModelEntityType"
      :error="deleteModalError"
      :title="t(`credentials.delete.${config.plugin}.title`)"
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
import composables from '../composables'
import endpoints from '../consumer-credentials-endpoints'
import {
  EntityBaseTable,
  EntityDeleteModal,
  EntityTypes,
  FetcherStatus,
  PermissionsWrapper,
  useAxios,
  useFetcher,
  useDeleteUrlBuilder,
} from '@kong-ui-public/entities-shared'
import type { CopyUuidNotifyParam } from '@kong-ui-public/copy-uuid'
import type {
  CredentialPlugins,
  KongManagerConsumerCredentialListConfig,
  KonnectConsumerCredentialListConfig,
  EntityRow,
  CopyEventPayload,
} from '../types'
import type {
  BaseTableHeaders,
  EmptyStateOptions,
} from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'

const emit = defineEmits<{
  (e: 'error', error: AxiosError): void,
  (e: 'copy:success', payload: CopyEventPayload): void,
  (e: 'copy:error', payload: CopyEventPayload): void,
  (e: 'delete:success', credential: EntityRow): void,
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectConsumerCredentialListConfig | KongManagerConsumerCredentialListConfig>,
    required: true,
    validator: (config: KonnectConsumerCredentialListConfig | KongManagerConsumerCredentialListConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (!config.createRoute || !config.getEditRoute) return false
      return true
    },
  },
  // used to override the default identifier for the cache entry
  cacheIdentifier: {
    type: String,
    default: '',
  },
  /** An asynchronous function, that returns a boolean, that evaluates if the user can create a new entity */
  canCreate: {
    type: Function as PropType<() => Promise<boolean>>,
    required: false,
    default: async () => true,
  },
  /** An asynchronous function, that returns a boolean, that evaluates if the user can delete a given entity */
  canDelete: {
    type: Function as PropType<(row: EntityRow) => Promise<boolean>>,
    required: false,
    default: async () => true,
  },
  /** An asynchronous function, that returns a boolean, that evaluates if the user can edit a given entity */
  canEdit: {
    type: Function as PropType<(row: EntityRow) => Promise<boolean>>,
    required: false,
    default: async () => true,
  },
})

const { i18n: { t, formatUnixTimeStamp } } = composables.useI18n()

const { axiosInstance } = useAxios({
  headers: props.config.requestHeaders,
})
const fetcherCacheKey = ref<number>(1)

/**
 * Table Headers
 */
const fields: Record<CredentialPlugins, BaseTableHeaders> = {
  acls: {
    group: { label: t('credentials.list.table_headers.acls.group') },
    created_at: { label: t('credentials.list.table_headers.acls.created_at') },
    tags: { label: t('credentials.list.table_headers.acls.tags') },
  },
  'basic-auth': {
    password: { label: t('credentials.list.table_headers.basic-auth.password') },
    username: { label: t('credentials.list.table_headers.basic-auth.username') },
    created_at: { label: t('credentials.list.table_headers.basic-auth.created_at') },
    tags: { label: t('credentials.list.table_headers.basic-auth.tags') },
  },
  'key-auth': {
    key: { label: t('credentials.list.table_headers.key-auth.key') },
    created_at: { label: t('credentials.list.table_headers.key-auth.created_at') },
    tags: { label: t('credentials.list.table_headers.key-auth.tags') },
  },
  'key-auth-enc': {
    key: { label: t('credentials.list.table_headers.key-auth-enc.key') },
    created_at: { label: t('credentials.list.table_headers.key-auth-enc.created_at') },
    tags: { label: t('credentials.list.table_headers.key-auth-enc.tags') },
  },
  oauth2: {
    name: { label: t('credentials.list.table_headers.oauth2.name') },
    client_id: { label: t('credentials.list.table_headers.oauth2.client_id') },
    client_secret: { label: t('credentials.list.table_headers.oauth2.client_secret') },
    created_at: { label: t('credentials.list.table_headers.oauth2.created_at') },
    tags: { label: t('credentials.list.table_headers.oauth2.tags') },
  },
  'hmac-auth': {
    username: { label: t('credentials.list.table_headers.hmac-auth.username') },
    secret: { label: t('credentials.list.table_headers.hmac-auth.secret') },
    created_at: { label: t('credentials.list.table_headers.hmac-auth.created_at') },
    tags: { label: t('credentials.list.table_headers.hmac-auth.tags') },
  },
  jwt: {
    key: { label: t('credentials.list.table_headers.jwt.key') },
    algorithm: { label: t('credentials.list.table_headers.jwt.algorithm') },
    created_at: { label: t('credentials.list.table_headers.jwt.created_at') },
    tags: { label: t('credentials.list.table_headers.jwt.tags') },
  },
}
const tableHeaders = computed<BaseTableHeaders>(() => fields[props.config.plugin])

/**
 * Fetcher & Filtering
 */
const fetcherBaseUrl = computed((): string => {
  let url: string = `${props.config.apiBaseUrl}${endpoints.list[props.config.app]}`

  if (props.config.app === 'konnect') {
    url = url
      .replace(/{controlPlaneId}/gi, props.config.controlPlaneId || '')
      .replace(/{consumerId}/gi, props.config.consumerId || '')
      .replace(/{plugin}/gi, props.config.plugin || '')
  } else if (props.config.app === 'kongManager') {
    url = url
      .replace(/\/{workspace}/gi, props.config.workspace ? `/${props.config.workspace}` : '')
      .replace(/{consumerId}/gi, props.config.consumerId || '')
      .replace(/{plugin}/gi, props.config.plugin || '')
  }

  return url
})

const { fetcher, fetcherState } = useFetcher(props.config, fetcherBaseUrl)

const resetPagination = (): void => {
  // Increment the cache key on sort
  fetcherCacheKey.value++
}

/**
 * loading, Error, Empty state
 */
const errorMessage = ref<string>('')

/**
 * Copy action
 */
const copy = (entity: EntityRow, field: string | undefined, copyToClipboard: (val: string) => boolean): void => {
  const val = field ? entity[field] : JSON.stringify(entity)
  if (!copyToClipboard(val)) {
    onCopyError(entity, field)
    return
  }

  onCopySuccess(entity, field)
}

const notifyCopyAction = (param: CopyUuidNotifyParam, entity: EntityRow, field: string) => {
  const { type } = param
  if (type === 'success') {
    onCopySuccess(entity, field)
  } else {
    onCopyError(entity, field)
  }
}

const onCopySuccess = (entity: EntityRow, field: string | undefined) => {
  // Emit the success event for the host app
  emit('copy:success', {
    entity,
    field,
    message: field ? t('credentials.copy.success', { val: entity[field] }) : t('credentials.copy.success_brief'),
  })
}

const onCopyError = (entity: EntityRow, field: string | undefined) => {
  // Emit the error event for the host app
  emit('copy:error', {
    entity,
    field,
    message: t('credentials.error.copy'),
  })
}

/**
 * Edit action
 */
// Render the edit dropdown item as a router-link
const getEditDropdownItem = (id: string) => {
  return {
    label: t('credentials.actions.edit'),
    to: props.config.getEditRoute(id),
  }
}

/**
 * Delete action
 */
const itemToBeDeleted = ref<EntityRow | undefined>(undefined)
const isDeleteModalVisible = ref<boolean>(false)
const isDeletePending = ref<boolean>(false)
const deleteModalError = ref<string>('')

const buildDeleteUrl = useDeleteUrlBuilder(props.config, fetcherBaseUrl.value)

const deleteModelEntityType = computed<EntityTypes>(() => {
  // @ts-ignore
  return EntityTypes[props.config.plugin]
})

const deleteRow = (row: EntityRow): void => {
  itemToBeDeleted.value = row
  isDeleteModalVisible.value = true
}

const hideDeleteModal = (): void => {
  isDeleteModalVisible.value = false
}

const confirmDelete = async (): Promise<void> => {
  if (!itemToBeDeleted.value?.id) {
    return
  }

  isDeletePending.value = true

  try {
    await axiosInstance.delete(buildDeleteUrl(itemToBeDeleted.value.id))

    isDeletePending.value = false
    isDeleteModalVisible.value = false
    fetcherCacheKey.value++

    // Emit the success event for the host app
    emit('delete:success', itemToBeDeleted.value)
  } catch (error: any) {
    deleteModalError.value = error.response?.data?.message ||
      error.message ||
      t('credentials.error.delete')

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
    errorMessage.value = t('credentials.error.general')
    // Emit the error for the host app
    emit('error', state.error)

    return
  }

  errorMessage.value = ''
})

// Initialize the empty state options assuming a user does not have create permissions
// IMPORTANT: you must initialize this object assuming the user does **NOT** have create permissions so that the onBeforeMount hook can properly evaluate the props.canCreate function.
const emptyStateOptions = ref<EmptyStateOptions>({
  ctaPath: props.config.createRoute,
  ctaText: undefined,
  message: '',
  title: t('credentials.title'),
})

onBeforeMount(async () => {
  // Evaluate if the user has create permissions
  const userCanCreate = await props.canCreate()

  // If a user can create, we need to modify the empty state actions/messaging
  if (userCanCreate) {
    emptyStateOptions.value.title = t(`credentials.list.empty_state.${props.config.plugin}.title`)
    emptyStateOptions.value.ctaText = t(`credentials.list.empty_state.${props.config.plugin}.cta`)
  }
})
</script>

<style lang="scss" scoped>
.kong-ui-entities-consumer-credentials-list {
  width: 100%;
}
</style>
