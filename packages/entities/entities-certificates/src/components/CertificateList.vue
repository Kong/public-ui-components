<template>
  <div class="kong-ui-entities-certificates-list">
    <EntityBaseTable
      :cache-identifier="cacheIdentifier"
      :disable-sorting="disableSorting"
      :empty-state-options="emptyStateOptions"
      enable-entity-actions
      :error-message="errorMessage"
      :fetcher="fetcher"
      :fetcher-cache-key="fetcherCacheKey"
      pagination-type="offset"
      preferences-storage-key="kong-ui-entities-certificates-list"
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
        <PermissionsWrapper :auth-function="canCreate">
          <KButton
            v-if="useToolbarCreationButton"
            appearance="primary"
            data-testid="toolbar-add-certificate"
            size="large"
            :to="config.createRoute"
          >
            <AddIcon />
            {{ t('certificates.list.toolbar_actions.new_certificate') }}
          </KButton>
        </PermissionsWrapper>
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
              data-testid="certificates-learn-more-button"
              icon
              @click="$emit('click:learn-more')"
            >
              <BookIcon decorative />
            </KButton>
            <PermissionsWrapper
              v-if="!useToolbarCreationButton"
              :auth-function="canCreate"
            >
              <KButton
                appearance="primary"
                data-testid="toolbar-add-certificate"
                :size="useActionOutside ? 'medium' : 'large'"
                :to="config.createRoute"
              >
                <AddIcon />
                {{ t('certificates.list.toolbar_actions.new_certificate') }}
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
          data-testid="certificates-entity-empty-state"
          icon-background
          :message="t('certificates.list.empty_state_v2.description')"
          :title="t('certificates.list.empty_state_v2.title')"
        >
          <template #icon>
            <ServiceDocumentIcon decoration />
          </template>

          <template
            v-if="config?.isControlPlaneGroup"
            #default
          >
            {{ t('certificates.list.empty_state_v2.group') }}
          </template>

          <template #action>
            <KButton
              v-if="userCanCreate"
              data-testid="entity-create-button"
              @click="handleCreate"
            >
              <AddIcon decorative />
              {{ t('certificates.list.empty_state_v2.create') }}
            </KButton>

            <KButton
              appearance="secondary"
              data-testid="entity-learn-more-button"
              @click="$emit('click:learn-more')"
            >
              <BookIcon decorative />
              {{ t('certificates.list.empty_state_v2.learn_more') }}
            </KButton>
          </template>
        </KEmptyState>
      </template>


      <!-- Column Formatting -->
      <template #subject="{ row }">
        <b v-if="config.app === 'konnect'">{{ row?.metadata?.subject ? row.metadata.subject : '-' }}</b>
        <b v-else>{{ getCertificateData(row).schemaSubject || '-' }}</b>
      </template>
      <template #expiry="{ row }">
        <span v-if="config.app === 'konnect'">
          {{ row?.metadata?.expiry ? formatUnixTimeStamp(row.metadata.expiry) : '-' }}
        </span>
        <span v-else>
          {{ getCertificateData(row).schemaExpiry ? formatUnixTimeStamp(getCertificateData(row).schemaExpiry) : '-' }}
        </span>
      </template>
      <template #san="{ row }">
        <span v-if="config.app === 'konnect'">{{ row?.metadata?.dns_names ? `dns=${row.metadata.dns_names.join(', ')}` : '-' }}</span>
        <span v-else>
          {{ getCertificateData(row).schemaSanNames || '-' }}
        </span>
      </template>
      <template #cert="{ row }">
        <KCopy
          v-if="row?.cert"
          data-testid="copy-certificate-cert"
          :text="row.cert"
          truncate
        />
        <span v-else>-</span>
      </template>
      <template #tags="{ row }">
        <TableTags :tags="row?.tags" />
      </template>

      <!-- Row actions -->
      <template #actions="{ row }">
        <KClipboardProvider v-slot="{ copyToClipboard }">
          <KDropdownItem
            data-testid="action-entity-copy-id"
            @click="copyId(row, copyToClipboard)"
          >
            {{ t('certificates.actions.copy_id') }}
          </KDropdownItem>
        </KClipboardProvider>
        <KClipboardProvider v-slot="{ copyToClipboard }">
          <KDropdownItem
            data-testid="action-entity-copy-json"
            @click="copyJson(row, copyToClipboard)"
          >
            {{ t('certificates.actions.copy_json') }}
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
        <PermissionsWrapper
          v-if="config.getCreateSniRoute"
          :auth-function="() => canCreateSni()"
        >
          <KDropdownItem
            data-testid="action-entity-add-sni"
            :item="getCreateSniDropdownItem(row.id)"
          />
        </PermissionsWrapper>
        <PermissionsWrapper :auth-function="() => canDelete(row)">
          <KDropdownItem
            danger
            data-testid="action-entity-delete"
            has-divider
            @click="deleteRow(row)"
          >
            {{ t('certificates.actions.delete') }}
          </KDropdownItem>
        </PermissionsWrapper>
      </template>
    </EntityBaseTable>

    <EntityDeleteModal
      :action-pending="isDeletePending"
      :entity-type="EntityTypes.Certificate"
      :error="deleteModalError"
      :title="t('certificates.delete.title')"
      :visible="isDeleteModalVisible"
      @cancel="hideDeleteModal"
      @proceed="confirmDelete"
    >
      <template #description>
        <i18nT
          keypath="certificates.delete.description"
          scope="global"
        >
          <template #bolded-text>
            <b>{{ t('certificates.delete.boldedText') }}</b>
          </template>
        </i18nT>
        <p>{{ t('certificates.delete.description2') }}</p>
      </template>
    </EntityDeleteModal>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref, watch, onBeforeMount } from 'vue'
import type { AxiosError } from 'axios'
import { useRouter } from 'vue-router'
import { AddIcon, BookIcon, ServiceDocumentIcon } from '@kong/icons'
import composables from '../composables'
import endpoints from '../certificates-endpoints'
import '@kong-ui-public/entities-shared/dist/style.css'

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
  useTableState,
  TableTags,
} from '@kong-ui-public/entities-shared'
import type {
  KongManagerCertificateListConfig,
  KonnectCertificateListConfig,
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

const emit = defineEmits<{
  (e: 'error', error: AxiosError): void
  (e: 'click:learn-more'): void
  (e: 'copy:success', payload: CopyEventPayload): void
  (e: 'copy:error', payload: CopyEventPayload): void
  (e: 'delete:success', certificate: EntityRow): void
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectCertificateListConfig | KongManagerCertificateListConfig>,
    required: true,
    validator: (config: KonnectCertificateListConfig | KongManagerCertificateListConfig): boolean => {
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
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can create a new SNI entity */
  canCreateSni: {
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
  /** default to false, setting to true will place create button on top right of list*/
  useToolbarCreationButton: {
    type: Boolean,
    default: false,
  },
})

const { i18n: { t, formatUnixTimeStamp }, i18nT } = composables.useI18n()
const router = useRouter()

const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)
const { handleStateChange, hasRecords } = useTableState(() => filterQuery.value)
// Current empty state logic is only for Konnect, KM will pick up at GA.
// If new empty states are enabled, show the learning hub button when the empty state is hidden (for Konnect)
// If new empty states are not enabled, show the learning hub button (for Konnect)
const showHeaderLHButton = computed((): boolean => hasRecords.value && props.config.app === 'konnect')

/**
 * Table Headers
 */
const disableSorting = computed((): boolean => props.config.app !== 'kongManager' || !!props.config.disableSorting)
const fields: BaseTableHeaders = {
  // the Subject column is non-hidable
  subject: { label: t('certificates.list.table_headers.subject'), hidable: false },
  expiry: { label: t('certificates.list.table_headers.expiry') },
  san: { label: t('certificates.list.table_headers.san') },
  cert: { label: t('certificates.list.table_headers.cert') },
  tags: { label: t('certificates.list.table_headers.tags'), sortable: true },
}
const tableHeaders: BaseTableHeaders = fields

/**
 * Fetcher & Filtering
 */
const fetcherBaseUrl = computed((): string => {
  let url: string = `${props.config.apiBaseUrl}${endpoints.list[props.config.app]}`

  if (props.config.app === 'konnect') {
    url = url
      .replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url
      .replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  return url
})

const filterQuery = ref<string>('')
const filterConfig = computed<InstanceType<typeof EntityFilter>['$props']['config']>(() => {
  const isExactMatch = (props.config.app === 'konnect' || props.config.isExactMatch)

  if (isExactMatch) {
    return {
      isExactMatch,
      placeholder: t('certificates.search.placeholder'),
    } as ExactMatchFilterConfig
  }

  return {
    isExactMatch,
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
      message: t('certificates.errors.copy'),
    })

    return
  }

  // Emit the success event for the host app
  emit('copy:success', {
    entity: row,
    field: 'id',
    message: t('certificates.copy.success', { val: id }),
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
      message: t('certificates.errors.copy'),
    })

    return
  }

  // Emit the success event for the host app
  emit('copy:success', {
    entity: row,
    message: t('certificates.copy.success_brief'),
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
    label: t('certificates.actions.view'),
    to: props.config.getViewRoute(id),
  }
}

/**
 * Edit action
 */
// Render the edit dropdown item as a router-link
const getEditDropdownItem = (id: string) => {
  return {
    label: t('certificates.actions.edit'),
    to: props.config.getEditRoute(id),
  }
}

/**
 * Create SNI action
 */
// Render the add to SNI dropdown item as a router-link
const getCreateSniDropdownItem = (id: string) => {
  if (!props.config.getCreateSniRoute) {
    return
  }

  return {
    label: t('certificates.actions.addSni'),
    to: props.config.getCreateSniRoute(id),
  }
}

/**
 * Delete action
 */
const certificateToBeDeleted = ref<EntityRow | undefined>(undefined)
const isDeleteModalVisible = ref<boolean>(false)
const isDeletePending = ref<boolean>(false)
const deleteModalError = ref<string>('')

const buildDeleteUrl = useDeleteUrlBuilder(props.config, fetcherBaseUrl.value)

const { certificateDataCache, getCertificateData } = composables.useCertificate()

const deleteRow = (row: EntityRow): void => {
  certificateToBeDeleted.value = row
  isDeleteModalVisible.value = true
}

const hideDeleteModal = (): void => {
  isDeleteModalVisible.value = false
}

const confirmDelete = async (): Promise<void> => {
  if (!certificateToBeDeleted.value?.id) {
    return
  }

  isDeletePending.value = true

  try {
    await axiosInstance.delete(buildDeleteUrl(certificateToBeDeleted.value.id))

    isDeletePending.value = false
    isDeleteModalVisible.value = false
    fetcherCacheKey.value++

    // Emit the success event for the host app
    emit('delete:success', certificateToBeDeleted.value)
  } catch (error: any) {
    deleteModalError.value = error.response?.data?.message ||
      error.message ||
      t('certificates.errors.delete')

    // Emit the error event for the host app
    emit('error', error)
  } finally {
    isDeletePending.value = false
  }
}

/**
 * Create Certificate
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
      title: t('certificates.errors.general'),
    }
    if (state.error?.response?.data?.message) {
      errorMessage.value.message = state.error.response.data.message
    }
    // Emit the error for the host app
    emit('error', state.error)

    return
  }

  certificateDataCache.value = {}
  errorMessage.value = null
})

// Initialize the empty state options assuming a user does not have create permissions
// IMPORTANT: you must initialize this object assuming the user does **NOT** have create permissions so that the onBeforeMount hook can properly evaluate the props.canCreate function.
const emptyStateOptions = ref<EmptyStateOptions>({
  ctaPath: props.config.createRoute,
  ctaText: undefined,
  message: `${t('certificates.list.empty_state.description')}${props.config.additionMessageForEmptyState ? ` ${props.config.additionMessageForEmptyState}` : ''}`,
  title: t('certificates.title'),
})

const userCanCreate = ref<boolean>(false)

onBeforeMount(async () => {
  // Evaluate if the user has create permissions
  userCanCreate.value = await props.canCreate()

  // If a user can create, we need to modify the empty state actions/messaging
  if (userCanCreate.value) {
    emptyStateOptions.value.title = t('certificates.list.empty_state.title')
    emptyStateOptions.value.ctaText = t('certificates.actions.create')
  }
})

</script>

<style lang="scss" scoped>
.button-row {
  align-items: center;
  display: flex;
  gap: var(--kui-space-50, $kui-space-50);
}

.kong-ui-entities-certificates-list {
  width: 100%;

  .kong-ui-entity-filter-input {
    margin-right: var(--kui-space-50, $kui-space-50);
  }
}
</style>
