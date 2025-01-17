<template>
  <div class="kong-ui-entities-partials-list">
    <EntityBaseTable
      :cache-identifier="cacheIdentifier"
      :disable-sorting="disableSorting"
      enable-entity-actions
      :fetcher="fetcher"
      :fetcher-cache-key="fetcherCacheKey"
      pagination-type="offset"
      :query="filterQuery"
      :table-headers="tableHeaders"
      @clear-search-input="clearFilter"
      @click:row="(row: any) => rowClick(row as EntityRow)"
      @sort="resetPagination"
    >
      <!-- Filter -->
      <template #toolbar-filter>
        <EntityFilter
          v-model="filterQuery"
        />
      </template>
      <!-- Create action -->
      <template #toolbar-button>
        <Teleport
          :disabled="!useActionOutside"
          to="#kong-ui-app-page-header-action-button"
        >
          <PermissionsWrapper :auth-function="() => canCreate()">
            <KButton
              appearance="primary"
              data-testid="toolbar-add-redis-configuration"
              :size="useActionOutside ? 'medium' : 'large'"
              :to="config.createRoute"
            >
              <AddIcon />
              New Configuration
            </KButton>
          </PermissionsWrapper>
        </Teleport>
      </template>

      <!-- Column Formatting -->
      <template #name="{ rowValue }">
        <b>{{ rowValue ?? '-' }}</b>
      </template>
      <template #type="{ row }">
        {{ renderRedisType(row) }}
      </template>

      <!-- Row actions -->
      <template #actions="{ row }">
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
            @click="deleteRow(row)"
          >
            {{ t('actions.delete') }}
          </KDropdownItem>
        </PermissionsWrapper>
      </template>
    </EntityBaseTable>
  </div>
</template>

<script setup lang="ts">
import {
  EntityBaseTable,
  EntityFilter,
  useFetcher,
  PermissionsWrapper,
  type BaseTableHeaders,
} from '@kong-ui-public/entities-shared'
import { computed, ref } from 'vue'

import endpoints from '../partials-endpoints'
import composables from '../composables'
import { getRedisType } from '../helpers'

import {
  type KonnectRedisConfigurationListConfig,
  type KongManagerRedisConfigurationListConfig,
  type EntityRow,
  type RedisConfigurationFields,
  RedisType,
} from '../types'
import type { PropType } from 'vue'
import { useRouter } from 'vue-router'


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
})

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

const filterQuery = ref<string>('')
// const filterConfig = computed<InstanceType<typeof EntityFilter>['$props']['config']>(() => {
//   const isExactMatch = (props.config.app === 'konnect' || props.config.isExactMatch)

//   if (isExactMatch) {
//     return {
//       isExactMatch: true,
//       placeholder: t('search.placeholder_for_vaults.konnect'),
//     } as ExactMatchFilterConfig
//   }

//   const { prefix, name } = fields
//   const filterFields: FilterFields = { name, prefix }

//   return {
//     isExactMatch: false,
//     fields: filterFields,
//     schema: props.config.filterSchema,
//   } as FuzzyMatchFilterConfig
// })
const fetcherCacheKey = ref<number>(1)
const disableSorting = computed((): boolean => props.config.app !== 'kongManager' || !!props.config.disableSorting)

const { fetcher } = useFetcher(props.config, fetcherBaseUrl.value)
const { i18n: { t } } = composables.useI18n()
const router = useRouter()

const tableHeaders: BaseTableHeaders = {
  name: { label: 'Name', searchable: true, hidable: false, sortable: true },
  type: { label: 'Type' },
  plugins: { label: 'Plugins' },
}

const getViewDropdownItem = (id: string) => {
  return {
    label: t('actions.view'),
    to: props.config.getViewRoute(id),
  }
}

const getEditDropdownItem = (id: string) => {
  return {
    label: t('actions.edit'),
    to: props.config.getEditRoute(id),
  }
}

const deleteRow = (row: EntityRow): void => {
  // vaultToBeDeleted.value = row
  // isDeleteModalVisible.value = true
}

const clearFilter = (): void => {
  filterQuery.value = ''
}

const rowClick = async (row: EntityRow): Promise<void> => {
  const isAllowed = await props.canRetrieve?.(row)

  if (!isAllowed) {
    return
  }

  router.push(props.config.getViewRoute(row.id as string))
}

const resetPagination = (): void => {
  // Increment the cache key on sort
  fetcherCacheKey.value++
}


const renderRedisType = (item: RedisConfigurationFields) => {
  switch (getRedisType(item)) {
    case RedisType.HOST_PORT_CE:
      return `${t('form.options.type.host_port')}${t('form.options.type.suffix_open_source')}`
    case RedisType.HOST_PORT_EE:
      return `${t('form.options.type.host_port')}${t('form.options.type.suffix_enterprise')}`
    case RedisType.SENTINEL:
      return `${t('form.options.type.sentinel')}${t('form.options.type.suffix_enterprise')}`
    case RedisType.CLUSTER:
      return `${t('form.options.type.cluster')}${t('form.options.type.suffix_enterprise')}`
  }
}
</script>

<style lang="scss" scoped>
.kong-ui-entities-partials-list {
  width: 100%;

  .kong-ui-entity-filter-input {
    margin-right: $kui-space-50;
  }

  .route-list-cell-expression {
    font-family: $kui-font-family-code;
  }
}
</style>
