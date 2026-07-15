<template>
  <div class="plugin-filter">
    <KInput
      ref="search-input"
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
          @click="clearSearchText"
          @keydown.enter.prevent="clearSearchText"
          @keydown.space.prevent="clearSearchText"
        />
      </template>
    </KInput>
    <KFilterGroup
      v-model="filterGroupSelection"
      :filters="pluginFilterGroupFilters"
      @apply="onFilterApply"
      @clear="onFilterClear"
      @open="onFilterOpen"
    >
      <template #filter-tags>
        <div class="plugin-tags-filter">
          <KInput
            ref="tags-input"
            v-model="tagInputText"
            autocomplete="off"
            data-testid="tags-filter-input"
            :error="!!tagInputError"
            :error-message="tagInputError"
            :placeholder="t('search.placeholder.tags_filter')"
            @keydown.enter.prevent="addPendingTag"
          >
            <template #after>
              <ArrowTopLeftIcon
                class="plugin-tags-filter-add"
                data-testid="tags-filter-add"
                role="button"
                tabindex="0"
                @click="addPendingTag"
                @keydown.enter.prevent="addPendingTag"
                @keydown.space.prevent="addPendingTag"
              />
            </template>
          </KInput>
          <div
            v-if="pendingTags.length"
            class="plugin-tags-filter-badges"
          >
            <KBadge
              v-for="tag in pendingTags"
              :key="tag"
              :icon-before="false"
            >
              {{ tag }}
              <template #icon>
                <CloseIcon
                  data-testid="tags-filter-remove-tag"
                  role="button"
                  tabindex="0"
                  @click="removePendingTag(tag)"
                  @keydown.enter.prevent="removePendingTag(tag)"
                  @keydown.space.prevent="removePendingTag(tag)"
                />
              </template>
            </KBadge>
          </div>
        </div>
      </template>
      <template #filter-scope>
        <KSelect
          v-model="pendingScope"
          data-testid="scope-filter-select"
          :items="scopeOptions"
          :placeholder="t('search.placeholder.scope_filter')"
        />
      </template>
      <template #filter-status>
        <div class="plugin-status-filter">
          <KRadio
            v-for="option in statusOptions"
            :key="option.value"
            v-model="pendingStatus"
            data-testid="status-filter-radio"
            :label="option.label"
            :selected-value="option.value"
          />
        </div>
      </template>
    </KFilterGroup>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'
import type { FilterGroupFilters, FilterGroupSelection, FilterOption } from '@kong/kongponents'
import { ArrowTopLeftIcon, CloseIcon, SearchIcon } from '@kong/icons'
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
const searchInput = useTemplateRef('search-input')
const tagsInput = useTemplateRef('tags-input')

// Working state for the custom `scope`/`status` filter popovers (see `#filter-scope` and
// `#filter-status` slots below) - KFilterGroup's default select/radio rendering can't be
// restyled (e.g. dropping the "Value" label, custom placeholder, radios instead of a select),
// so both filters are fully slot-overridden and their selection is synced manually on apply,
// the same way the `tags` filter already works.
const pendingScope = ref<string | null>(null)
const pendingStatus = ref<string | null>(null)

const scopeOptions = computed<FilterOption[]>(() => [
  { label: t('plugins.list.table_headers.applied_to_badges.route'), value: PluginScope.ROUTE },
  { label: t('plugins.list.table_headers.applied_to_badges.service'), value: PluginScope.SERVICE },
  { label: t('plugins.list.table_headers.applied_to_badges.consumer'), value: PluginScope.CONSUMER },
  { label: t('plugins.list.table_headers.applied_to_badges.consumer_group'), value: PluginScope.CONSUMER_GROUP },
  { label: t('plugins.list.table_headers.applied_to_badges.global'), value: PluginScope.GLOBAL },
])

const statusOptions = computed<FilterOption[]>(() => [
  { label: t('actions.enabled'), value: 'true' },
  { label: t('actions.disabled'), value: 'false' },
])

// Working state for the custom `tags` filter popover (see `#filter-tags` slot below) - the tag
// badges the user has built up before hitting Apply. KFilterGroup can't derive a selection for
// a slot-overridden filter itself, so this is synced into `filterGroupSelection.tags` on apply.
const tagInputText = ref('')
const pendingTags = ref<string[]>([])

// Tag validation: unicode letters/numbers and most ASCII symbols are allowed,
// but no commas (used as the tag-list delimiter), slashes, control characters,
// or leading/trailing spaces. Interior spaces between characters are fine.
const TAG_PATTERN = /^(?:[\x21-\x2B\x2D\x2E\x30-\x7E\p{N}\p{L}]+(?: *[\x21-\x2B\x2D\x2E\x30-\x7E\p{N}\p{L}])*)?$/u

const tagInputError = computed(() => (
  tagInputText.value && !TAG_PATTERN.test(tagInputText.value)
    ? t('search.filter.tags_invalid')
    : ''
))

const focusSearchInput = () => {
  searchInput.value?.input?.focus()
}

const focusTagsInput = () => {
  tagsInput.value?.input?.focus()
}

const clearSearchText = () => {
  searchText.value = ''
  focusSearchInput()
}

const addPendingTag = () => {
  const tag = tagInputText.value
  if (!tag || !TAG_PATTERN.test(tag)) {
    focusTagsInput()
    return
  }
  if (!pendingTags.value.includes(tag)) {
    pendingTags.value.push(tag)
  }
  tagInputText.value = ''
  focusTagsInput()
}

const removePendingTag = (tag: string) => {
  pendingTags.value = pendingTags.value.filter((pendingTag) => pendingTag !== tag)
}

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
        options: scopeOptions.value,
      },
    }

  const filters: FilterGroupFilters = {
    ...scopeFilter,
    status: {
      label: t('plugins.list.table_headers.status'),
      operators: ['eq'],
      pinned: true,
      options: statusOptions.value,
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

  if (!nestedScopeFilterKey.value) {
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
    // Multiple tags can be concatenated using ',' to mean AND or using '/' to mean OR.
    params.set('tags', tagsValues.join('/'))
  }

  // On a nested entity page, only scope to that one entity once the user has actually triggered a
  // search/filter - an otherwise-unfiltered load should keep hitting the plain, already
  // entity-scoped (by URL path) list endpoint instead of switching to /plugins/search.
  if (nestedScopeFilterKey.value && entityId && params.toString()) {
    params.set(`filter[${nestedScopeFilterKey.value}][eq]`, entityId)
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
    tagInputText.value = ''
    pendingTags.value = []
    pendingScope.value = null
    pendingStatus.value = null
  }
})

const onFilterOpen = (openedFilterKey: string) => {
  if (openedFilterKey === 'tags') {
    const currentValue = filterGroupSelection.value.tags?.value
    pendingTags.value = Array.isArray(currentValue) ? [...currentValue] : []
    tagInputText.value = ''
  } else if (openedFilterKey === 'scope') {
    const currentValue = filterGroupSelection.value.scope?.value
    pendingScope.value = typeof currentValue === 'string' ? currentValue : null
  } else if (openedFilterKey === 'status') {
    const currentValue = filterGroupSelection.value.status?.value
    pendingStatus.value = typeof currentValue === 'string' ? currentValue : null
  }
}

const onFilterApply = (appliedFilterKey: string, selection: FilterGroupSelection) => {
  if (appliedFilterKey === 'tags') {
    if (pendingTags.value.length) {
      selection.tags = {
        operator: 'eq',
        operatorDelimiter: ': ',
        value: [...pendingTags.value],
        text: pendingTags.value.join(', '),
      }
    } else {
      delete selection.tags
    }
    return
  }

  if (appliedFilterKey === 'scope') {
    const selectedOption = scopeOptions.value.find((option) => option.value === pendingScope.value)
    if (selectedOption) {
      selection.scope = {
        operator: 'eq',
        operatorDelimiter: ': ',
        value: selectedOption.value,
        text: selectedOption.label,
      }
    } else {
      delete selection.scope
    }
    return
  }

  if (appliedFilterKey === 'status') {
    const selectedOption = statusOptions.value.find((option) => option.value === pendingStatus.value)
    if (selectedOption) {
      selection.status = {
        operator: 'eq',
        operatorDelimiter: ': ',
        value: selectedOption.value,
        text: selectedOption.label,
      }
    } else {
      delete selection.status
    }
  }
}

const onFilterClear = (clearedFilterKey: string) => {
  if (clearedFilterKey === 'tags') {
    pendingTags.value = []
    tagInputText.value = ''
  } else if (clearedFilterKey === 'scope') {
    pendingScope.value = null
  } else if (clearedFilterKey === 'status') {
    pendingStatus.value = null
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

.plugin-tags-filter {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-60, $kui-space-60);

  .plugin-tags-filter-add {
    cursor: pointer;
    transform: scaleY(-1);
  }

  .plugin-tags-filter-badges {
    display: flex;
    flex-wrap: wrap;
    gap: var(--kui-space-40, $kui-space-40);
  }
}

.plugin-status-filter {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);
}
</style>
