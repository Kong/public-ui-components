<template>
  <KDropdown class="analytics-column-visibility-menu">
    <KButton
      appearance="tertiary"
      :aria-label="i18n.t('datatable.selectVisibleColumns')"
      data-testid="column-visibility-trigger"
      icon
    >
      <TableColumnsIcon />
    </KButton>

    <template #items>
      <div
        v-if="menuColumns.length"
        class="column-search-wrapper"
      >
        <KInput
          v-model.trim="searchTerm"
          autocomplete="off"
          class="column-search"
          data-testid="column-visibility-search"
          :placeholder="i18n.t('datatable.searchColumns')"
          type="search"
          @click.stop
        >
          <template #before>
            <SearchIcon decorative />
          </template>
          <template
            v-if="searchTerm"
            #after
          >
            <KButton
              appearance="tertiary"
              :aria-label="i18n.t('datatable.clearColumnSearch')"
              class="clear-search"
              data-testid="column-visibility-clear-search"
              icon
              size="small"
              @click.stop="searchTerm = ''"
            >
              <CloseIcon decorative />
            </KButton>
          </template>
        </KInput>
      </div>

      <div class="column-items">
        <KDropdownItem
          v-for="column in filteredColumns"
          :key="column.key"
          class="column-visibility-item"
          :data-testid="`column-visibility-${column.key}`"
          @click.stop="toggleColumn(column.key)"
        >
          <KCheckbox
            :model-value="column.visible"
            @click.stop
            @update:model-value="setColumnVisibility(column.key, $event)"
          />
          <span class="column-label">{{ column.label }}</span>
        </KDropdownItem>
      </div>

      <div
        v-if="menuColumns.length"
        class="column-actions"
      >
        <KButton
          appearance="tertiary"
          data-testid="column-visibility-toggle-all"
          size="small"
          @click.stop="toggleAll"
        >
          {{ i18n.t('datatable.toggleAllColumns') }}
        </KButton>
      </div>
    </template>
  </KDropdown>
</template>

<script setup lang="ts" generic="Row extends Record<string, any>">
import type { AnalyticsDatatableHeader } from '../types'
import { CloseIcon, SearchIcon, TableColumnsIcon } from '@kong/icons'
import { computed, ref } from 'vue'
import composables from '../composables'
import { isColumnHideable } from '../utils/headers'

const {
  headers,
} = defineProps<{
  headers: Array<AnalyticsDatatableHeader<Row>>
}>()
const { i18n } = composables.useI18n()

const columnVisibility = defineModel<Record<string, boolean>>('columnVisibility', {
  default: () => ({}),
})

const searchTerm = ref('')

const sortedMenuHeaders = computed(() => headers
  .filter(isColumnHideable)
  .map(header => ({
    key: header.key,
    label: header.label,
  }))
  .sort((a, b) => a.label.localeCompare(b.label)))

const menuColumns = computed(() => sortedMenuHeaders.value
  .map(header => ({
    key: header.key,
    label: header.label,
    visible: columnVisibility.value[header.key] ?? true,
  })))

const filteredColumns = computed(() => {
  if (!searchTerm.value) {
    return menuColumns.value
  }

  const normalizedSearch = searchTerm.value.toLowerCase()
  return menuColumns.value.filter(column => column.label.toLowerCase().includes(normalizedSearch))
})

const setColumnVisibility = (key: string, visible: boolean) => {
  columnVisibility.value = {
    ...columnVisibility.value,
    [key]: visible,
  }
}

const toggleColumn = (key: string) => {
  setColumnVisibility(key, !(columnVisibility.value[key] ?? true))
}

const toggleAll = () => {
  const allVisible = menuColumns.value.every(column => column.visible)
  columnVisibility.value = menuColumns.value.reduce<Record<string, boolean>>((acc, column) => {
    acc[column.key] = !allVisible
    return acc
  }, { ...columnVisibility.value })
}
</script>

<style lang="scss" scoped>
$analytics-column-menu-max-height: 250px;
$analytics-column-label-max-width: 220px;

.analytics-column-visibility-menu {
  line-height: var(--kui-line-height-10, $kui-line-height-10);

  .column-search-wrapper {
    padding: var(--kui-space-30, $kui-space-30);
  }

  :deep(.k-input).column-search {
    max-width: 100%;
    width: 100%;

    ::-webkit-search-cancel-button {
      /* hide the default "X" button */
      -webkit-appearance: none;
    }
  }

  .column-items {
    max-height: $analytics-column-menu-max-height;
    overflow-y: auto;
  }

  .column-visibility-item {
    align-items: center;
    display: flex;
  }

  .column-label {
    cursor: pointer;
    display: block;
    max-width: $analytics-column-label-max-width;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .column-actions {
    display: flex;
    justify-content: flex-end;
    padding: var(--kui-space-20, $kui-space-20);
  }

  .clear-search {
    flex-shrink: 0;
  }
}
</style>
