<template>
  <KCard data-testid="plugin-catalog-list-view-card">
    <KTableView
      :key="tableKey"
      class="plugin-catalog-table"
      client-sort
      :data="paginatedData"
      data-testid="plugin-catalog-list-view-table"
      :headers="headers"
      :pagination-attributes="{ totalCount: tableRows.length, currentPage: currentPage,
                                initialPageSize: paginatedPageSize,
                                pageSizes: [10, 25, 50] }"
      resize-columns
      row-key="id"
      @page-change="onPageChange"
      @page-size-change="onPageSizeChange"
      @sort="onSort"
    >
      <template #name="{ row }">
        <span
          class="plugin-name-cell"
          data-testid="plugin-catalog-list-view-name"
        >
          <PluginIcon
            :data-testid="`plugin-catalog-list-view-${row.plugin!.id}-icon`"
            :name="getPluginIconName(row.plugin!)"
            :size="20"
          />
          <span
            class="plugin-name-text"
            data-testid="plugin-catalog-list-view-name-text"
            :title="row.name"
          >{{ row.name }}</span>
          <KBadge
            v-if="row.badge"
            appearance="info"
            class="plugin-name-badge"
            data-testid="plugin-catalog-list-view-custom-badge"
          >
            {{ row.badge }}
          </KBadge>
        </span>
      </template>
      <template #description="{ row }">
        <span
          class="plugin-description-cell"
          data-testid="plugin-catalog-list-view-description"
          :title="row.description"
        >
          {{ row.description }}
        </span>
      </template>
      <template #action="{ row }">
        <div
          class="plugin-action-cell"
          data-testid="plugin-catalog-list-view-action"
        >
          <KButton
            appearance="tertiary"
            data-testid="plugin-catalog-list-view-configure-btn"
            size="small"
            :to="props.config.getCreateRoute(row.id)"
          >
            {{ t('actions.configure') }}
          </KButton>
        </div>
      </template>
      <template
        #more-actions="{ row }"
      >
        <div
          v-if="hasMoreActions(row.plugin)"
          class="plugin-more-action-cell"
          data-testid="plugin-catalog-list-view-more-actions"
        >
          <KDropdown
            appearance="tertiary"
            class="actions-trigger"
            data-testid="plugin-catalog-list-view-more-actions-button"
            icon
            size="small"
          >
            <template #items>
              <KDropdownItem
                v-if="canEditPlugin(row.plugin)"
                data-testid="edit-plugin-schema"
                :item="{ label: t('actions.edit'), to: (config as KonnectPluginSelectConfig).getCustomEditRoute?.(row.plugin!.name, row.plugin!.customPluginType!) }"
              >
                {{ t('actions.edit') }}
              </KDropdownItem>
              <KDropdownItem
                v-if="canDeletePlugin(row.plugin)"
                danger
                data-testid="delete-plugin-schema"
                :has-divider="canEditPlugin(row.plugin)"
                @click="() => handleCustomPluginDelete(row.plugin!)"
              >
                {{ t('actions.delete') }}
              </KDropdownItem>
            </template>
            <MoreIcon
              :color="KUI_COLOR_TEXT_NEUTRAL"
              :size="KUI_ICON_SIZE_30"
            />
          </KDropdown>
        </div>
      </template>
    </KTableView>
  </KCard>
  <DeleteCustomPluginSchemaModal
    v-if="openDeleteModal && selectedPlugin"
    :config="config"
    :plugin="selectedPlugin"
    @closed="handleClose"
    @delete:failed="emit('delete:failed', $event)"
    @delete:start="emit('delete:start', $event)"
    @proceed="handleClose(true)"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import composables from '../../composables'
import { MoreIcon } from '@kong/icons'
import DeleteCustomPluginSchemaModal from '../custom-plugins/DeleteCustomPluginSchemaModal.vue'
import { KUI_COLOR_TEXT_NEUTRAL, KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { PluginIcon } from '@kong-ui-public/entities-plugins-icon'
import type {
  PluginType,
  KongManagerPluginSelectConfig,
  KonnectPluginSelectConfig,
  PluginCardList,
  CustomPluginDeletePayload,
} from '../../types'

interface TableSortPayload {
  prevKey: string
  sortColumnKey: string
  sortColumnOrder: string
}

const emit = defineEmits<{
  'revalidate': []
  'delete:success': [plugin: CustomPluginDeletePayload]
  'delete:start': [plugin: CustomPluginDeletePayload]
  'delete:failed': [plugin: CustomPluginDeletePayload]
}>()

const props = defineProps<{
  config: KonnectPluginSelectConfig | KongManagerPluginSelectConfig
  pluginList?: PluginCardList
  canDeleteCustomPlugin?: boolean
  canDeleteClonedPlugin?: boolean
  canEditCustomPlugin?: boolean
  canEditClonedPlugin?: boolean
}>()

const { i18n: { t } } = composables.useI18n()

const getCustomPluginBadge = (plugin: PluginType): string => {
  if (plugin.customPluginType === 'cloned' && plugin.clonedFromRef) {
    return t('plugins.select.cloned_from_badge', { link: plugin.clonedFromRef })
  }

  if (plugin.customPluginType === 'streaming') {
    return t('plugins.select.streamed_custom_badge')
  }

  if (plugin.customPluginType) {
    return t('plugins.select.installed_custom_badge')
  }

  return ''
}

const showMoreActions = computed(() => {
  return paginatedData.value.some(row => hasMoreActions(row.plugin))
})

const headers = computed(() => {
  const headers = [
    { key: 'name', label: t('plugins.select.list.table_headers.name'), sortable: true },
    { key: 'description', label: t('plugins.select.list.table_headers.description') },
    { key: 'action', hideLabel: true },
  ]
  if (showMoreActions.value) {
    headers.push({ key: 'more-actions', hideLabel: true })
  }
  return headers
})
const tableRows = computed(() => {
  if (!props.pluginList) return []
  const allPlugins = Object.values(props.pluginList).flat()
  const uniquePlugins = Array.from(
    new Map(allPlugins.map(plugin => [plugin!.id, plugin])).values(),
  )
  return uniquePlugins.map(plugin => ({
    id: plugin!.id,
    name: plugin!.name,
    description: plugin!.description,
    badge: getCustomPluginBadge(plugin!),
    plugin,
  }))
})
const tableKey = ref(0)
const paginatedPageSize = ref<number>(10)
const currentPage = ref<number>(1)
const sortedRows = ref(tableRows.value)
const openDeleteModal = ref(false)
const selectedPlugin = ref<(CustomPluginDeletePayload & { id: string }) | null>(null)

const getPluginIconName = (plugin: PluginType): string => {
  return plugin.customPluginType === 'cloned' && plugin.clonedFromRef
    ? plugin.clonedFromRef
    : plugin.id
}

const isClonedPlugin = (plugin?: PluginType): boolean => plugin?.customPluginType === 'cloned'

const canDeletePlugin = (plugin?: PluginType): boolean => {
  if (!plugin?.customPluginType) {
    return false
  }

  if (props.config.app === 'kongManager' && plugin.customPluginType === 'schema') {
    return false
  }

  return isClonedPlugin(plugin) ? !!props.canDeleteClonedPlugin : !!props.canDeleteCustomPlugin
}

const canEditPlugin = (plugin?: PluginType): boolean => {
  if (!plugin?.customPluginType || typeof props.config.getCustomEditRoute !== 'function') {
    return false
  }

  if (props.config.app === 'kongManager' && plugin.customPluginType === 'schema') {
    return false
  }

  return isClonedPlugin(plugin) ? !!props.canEditClonedPlugin : !!props.canEditCustomPlugin
}

const hasMoreActions = (plugin?: PluginType): boolean => canDeletePlugin(plugin) || canEditPlugin(plugin)

const handleCustomPluginDelete = (plugin: PluginType): void => {
  openDeleteModal.value = true
  selectedPlugin.value = {
    id: plugin.id,
    name: plugin.name,
    group: plugin.group,
    customPluginType: plugin.customPluginType,
  }
}

const handleClose = (revalidate?: boolean): void => {
  if (revalidate) {
    emit('revalidate')
    emit('delete:success', {
      name: selectedPlugin.value?.name || '',
      group: selectedPlugin.value?.group,
      customPluginType: selectedPlugin.value?.customPluginType,
    })
  }

  openDeleteModal.value = false
  selectedPlugin.value = null
}

const paginatedData = computed(() => {
  const total = sortedRows.value.length
  const maxPage = Math.max(1, Math.ceil(total / paginatedPageSize.value))
  const safePage = Math.min(currentPage.value, maxPage)
  const start = (safePage - 1) * paginatedPageSize.value
  return sortedRows.value.slice(start, start + paginatedPageSize.value)
})

watch(tableRows, () => {
  sortedRows.value = [...tableRows.value]
  currentPage.value = 1
  tableKey.value++
})

const onPageChange = ({ page }: { page: number }) => {
  currentPage.value = page
}

const onPageSizeChange = ({ pageSize }: { pageSize: number }) => {
  paginatedPageSize.value = pageSize
}

const onSort = (sortPayload: TableSortPayload) => {
  const { sortColumnKey, sortColumnOrder } = sortPayload
  if (sortColumnKey !== 'name') {
    // only name column is sortable
    return
  }
  sortedRows.value = [...sortedRows.value].sort((a, b) => {
    const aValue = (a[sortColumnKey] || '').toLowerCase()
    const bValue = (b[sortColumnKey] || '').toLowerCase()
    if (aValue < bValue) return sortColumnOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortColumnOrder === 'asc' ? 1 : -1
    return 0
  })
}

</script>

<style lang="scss" scoped>
.plugin-name-cell {
  align-items: center;
  display: flex;
  min-width: 156px;
}

.plugin-name-text {
  margin-left: 8px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plugin-name-badge {
  margin-left: 8px;
}

.plugin-description-cell {
  -webkit-box-orient: vertical;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  width: 100%;
  word-break: word-break;
}

.plugin-action-cell {
  display: flex;
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  justify-content: flex-start;
  max-width: 100px;
  min-width: 80px;
  width: 100px;
}

.plugin-more-action-cell {
  cursor: pointer;
  display: flex;
  justify-content: flex-end;
  width: 40px;
}
</style>
