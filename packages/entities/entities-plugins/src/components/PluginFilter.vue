<template>
  <div class="plugin-filter">
    <KInput
      v-model="searchText"
      autocomplete="off"
      class="plugin-search-input"
      data-testid="search-input"
      :placeholder="t('search.placeholder.search')"
    >
      <template #before>
        <SearchIcon decorative />
      </template>
      <template #after>
        <CloseIcon
          v-show="searchText !== ''"
          class="plugin-search-clear"
          role="button"
          tabindex="0"
          @click="searchText = ''"
        />
      </template>
    </KInput>
    <KFilterGroup
      v-model="filterGroupSelection"
      :filters="pluginFilterGroupFilters"
      @apply="overrideDelimiter"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FilterGroupFilters, FilterGroupSelection } from '@kong/kongponents'
import { CloseIcon, SearchIcon } from '@kong/icons'
import composables from '../composables'
import { PluginScope } from '../types'
import type { EntityType } from '../types'

const { i18n: { t } } = composables.useI18n()

// Maps a nested entity page's `entityType` to the search API's singular scope filter key
const ENTITY_TYPE_TO_SCOPE_FILTER_KEY: Partial<Record<EntityType, PluginScope>> = {
  routes: PluginScope.ROUTE,
  services: PluginScope.SERVICE,
  consumers: PluginScope.CONSUMER,
  consumer_groups: PluginScope.CONSUMER_GROUP,
}

const { entityType, entityId } = defineProps<{
  /**
   * Set when this list is nested under a Route/Service/Consumer/Consumer-Group detail page - the
   * scope is then implied by the page, so the Scope pill is hidden and every request is forced
   * server-side to that one entity instead of being user-selectable.
   */
  entityType?: EntityType
  entityId?: string
}>()

const nestedScopeFilterKey = computed(() => (
  entityType && entityId ? ENTITY_TYPE_TO_SCOPE_FILTER_KEY[entityType] : undefined
))

/**
 * The `/plugins/search` request's raw, wire-ready query string (bracket-notation `filter[field][operator]`
 * params + top-level `tags`) - same idea as EntityFilter's fuzzy-match mode, which serializes straight
 * into the params Kong Manager's API accepts natively, with no decode step needed downstream.
 */
const modelValue = defineModel<string>({ required: true })

const searchText = ref('')
const filterGroupSelection = ref<FilterGroupSelection>({})

const pluginFilterGroupFilters = computed<FilterGroupFilters>(() => {
  const scopeFilter: FilterGroupFilters = nestedScopeFilterKey.value
    ? {}
    : {
      scope: {
        label: t('plugins.list.table_headers.scope'),
        operators: ['eq'],
        pinned: true,
        // TODO: the search API's filter.scope.eq only accepts a single value (no OR/"one-of"
        // operator for scope as of the current SDK) - single-select until the backend supports
        // filtering by more than one scope at once.
        multiple: false,
        options: [
          { label: t('plugins.list.table_headers.applied_to_badges.route'), value: PluginScope.ROUTE },
          { label: t('plugins.list.table_headers.applied_to_badges.service'), value: PluginScope.SERVICE },
          { label: t('plugins.list.table_headers.applied_to_badges.consumer'), value: PluginScope.CONSUMER },
          { label: t('plugins.list.table_headers.applied_to_badges.consumer_group'), value: PluginScope.CONSUMER_GROUP },
          { label: t('plugins.list.table_headers.applied_to_badges.global'), value: PluginScope.GLOBAL },
        ],
      },
    }

  const filters: FilterGroupFilters = {
    ...scopeFilter,
    status: {
      label: t('plugins.list.table_headers.status'),
      operators: ['eq'],
      pinned: true,
      options: [
        { label: t('actions.enabled'), value: 'true' },
        { label: t('actions.disabled'), value: 'false' },
      ],
    },
    tags: {
      label: t('plugins.list.table_headers.tags'),
      operators: ['eq'],
      pinned: true,
      multiple: true,
    },
  }

  return filters
})

// Build the actual wire-format query string directly - no intermediate encoding for a consumer
// to decode later. PluginList.vue's fetcher (via useFetcher/useFetchUrlBuilder with
// isExactMatch: false) appends this straight onto the /plugins/search request.
const serializedQuery = computed<string>(() => {
  const params = new URLSearchParams()

  if (searchText.value) {
    params.set('filter[name][contains]', searchText.value)
  }

  if (nestedScopeFilterKey.value && entityId) {
    // Nested entity page: always scope to that one entity, and the scope pill is hidden
    params.set(`filter[${nestedScopeFilterKey.value}][eq]`, entityId)
  } else {
    const scopeSelection = filterGroupSelection.value.scope
    if (typeof scopeSelection?.value === 'string' && scopeSelection.value) {
      params.set('filter[scope][eq]', scopeSelection.value)
    }
  }

  const statusSelection = filterGroupSelection.value.status
  if (statusSelection?.value) {
    params.set('filter[enabled]', statusSelection.value === 'true' ? 'true' : 'false')
  }

  const tagsSelection = filterGroupSelection.value.tags
  const tagsValues = Array.isArray(tagsSelection?.value) ? tagsSelection.value : []
  if (tagsValues.length) {
    params.set('tags', tagsValues.join(','))
  }

  return params.toString()
})

watch(serializedQuery, (value) => {
  modelValue.value = value
})

// Empty internal state when the external modelValue is cleared
watch(modelValue, (value) => {
  if (!value) {
    searchText.value = ''
    filterGroupSelection.value = {}
  }
})

const overrideDelimiter = (appliedFilterKey: string, selection: FilterGroupSelection) => {
  const appliedFilter = selection[appliedFilterKey]
  if (appliedFilter) {
    // Override the default `=` delimiter
    appliedFilter.operatorDelimiter = ': '
  }
}
</script>

<style lang="scss" scoped>
.plugin-filter {
  align-items: center;
  display: flex;
  gap: var(--kui-space-70, $kui-space-70);

  .plugin-search-input {
    width: 320px;
  }

  .plugin-search-clear {
    cursor: pointer;
  }
}
</style>
