<template>
  <AutoSuggest
    :id="id"
    :disabled="fieldDisabled"
    :dom-id="domId"
    :empty-message="message"
    :error="error"
    :loading="selectedItemLoading || loading"
    :placeholder="placeholder"
    :readonly="disabled"
    :suggestions="suggestions"
    @change="$emit('change', $event)"
    @query-change="onQueryChange"
  >
    <template #before>
      <slot name="before">
        <SearchIcon
          :color="KUI_COLOR_TEXT_NEUTRAL"
          :size="KUI_ICON_SIZE_40"
        />
      </slot>
    </template>
    <template #selected-item="{ item }">
      <slot
        :item="item"
        name="selected-item"
      >
        <span class="selected-entity-item">
          <span class="selected-entity-label">{{ item.label ?? item.id }}</span>
        </span>
      </slot>
    </template>

    <template #item="{ item }">
      <slot
        :item="item"
        name="item"
      >
        <div class="entity-suggestion-item">
          <span class="entity-label">
            {{ item.label ?? EMPTY_VALUE_PLACEHOLDER }}
          </span>
          <span class="entity-id">
            {{ item.id }}
          </span>
        </div>
      </slot>
    </template>
  </AutoSuggest>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, watch } from 'vue'
import { debounce } from 'lodash-es'
import { SearchIcon } from '@kong/icons'
import { KUI_ICON_SIZE_40, KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'
import AutoSuggest from './AutoSuggest.vue'
import { isValidUuid } from '../../utils/isValidUuid'
import { FORMS_API_KEY, EMPTY_VALUE_PLACEHOLDER } from '../../const'
import english from '../../locales/en.json'
import { createI18n } from '@kong-ui-public/i18n'
import { isAxiosError } from 'axios'

import type { AxiosResponse } from 'axios'
import type { SelectItem } from '@kong/kongponents'
import type { EntityData, EntityResponse, AutoSuggestItemTransformer } from '../../types/form-autosuggest'

const DEBOUNCE_DELAY = 500
const PEEK_SIZE = 50
const REQUEST_RESULTS_LIMIT = 1000

/**
 * How this component works
 *   This component utilizes `KSelect` with prefetch suggestions to improve user experience
 *   With `fieldDisabled` as a flag for controlling whether requests should be dispatched this was controlled by the upstream host apps,
 *     most likely permissions to list entities.
 *   By default when mounting the component, it will prefetch 50 records against the entity type `route/consumer/service/consumer_group`
 *     where `consumer_group` cannot be fuzzy queried with keywords which can only perform a client filtering with keywords.
 *   After data was fetched, the suggestions will be constructed using the `transformItem` function. When `selectedItem` is passed, in order to
 *     allow the option to be selected, it must be appended to the suggestions if the current suggestions list does not contain `selectedItem`
 *   When querying, if the data was exhausted when prefetching, the flag `dataDrainedFromPeeking` will be marked as `true` which indicates the
 *     upcoming querying will be delegated to inline search, otherwise, it performs a `fuzzy` search with `1000` items size capacity.
 *
 *  A noticeable fact about the component KSelect, when the component has a selected item, then user opens the select dropdown, the component
 *   will set `query` to `''` where triggers a `query-change` event, thus the handler in our component `onQueryChange` will be triggered, when
 *   this happens, we tend to show the `prefetched` data when this happens, when user types, we introduces `debounce` for
 *   the query input to avoid excessive API calls.
 *
 *  When `getAll`/`getOne`/`getPartial` props are not provided, the component falls back to injecting
 *  `FORMS_API_KEY` and building the API adapters internally.
 */

const {
  transformItem: transformItemProp,
  labelField = 'name',
  fields = [],
  allowUuidSearch = false,
  id,
  selectedItem,
  entity,
  placeholder,
  domId,
  disabled,
  fieldDisabled,
} = defineProps<{
  transformItem?: AutoSuggestItemTransformer
  allowUuidSearch?: boolean
  placeholder?: string
  fields?: string[]
  selectedItem?: SelectItem<string>
  selectedItemLoading?: boolean
  initialItemSelected?: boolean
  domId: string
  id: string
  entity: string
  disabled?: boolean
  fieldDisabled?: boolean
  error?: string | null
  /** Field key to use as the display label in dropdown items. Default: 'name' */
  labelField?: string
}>()

defineEmits<{
  change: [item: SelectItem<string> | null]
}>()

// --- API resolution: use provided callbacks or build from injected API ---
const api = inject<Record<string, any> | undefined>(FORMS_API_KEY, undefined)

const getAll = async (query: string, signal?: AbortSignal): Promise<EntityData[]> => {
  if (!api) {
    console.warn('[@kong-ui-public/forms] No API service provided')
    return []
  }
  const { data } = await api.getAllV2(entity, { name: query, size: REQUEST_RESULTS_LIMIT }, signal)
  return data.data
}

const getPartial = async (size: number): Promise<AxiosResponse<EntityResponse>> => {
  if (!api) {
    console.warn('[@kong-ui-public/forms] No API service provided')
    return Promise.resolve({ data: { data: [] } } as unknown as AxiosResponse<EntityResponse>)
  }
  return api.peek(entity, size)
}

const getOne = async (id: string): Promise<EntityData> => {
  if (!api) {
    console.warn('[@kong-ui-public/forms] No API service provided')
    return { id } as EntityData
  }
  const res = await api.getOne(entity, id, {
    validateStatus: (status: number) => (status >= 200 && status < 300) || status === 404,
  })
  if (res.status === 404) {
    throw new Error(`Entity of type ${entity} with id ${id} not found`)
  }
  return res.data
}

const transformItem = transformItemProp ?? ((item: EntityData): SelectItem<string> => ({
  ...item,
  label: item[labelField],
  value: item.id,
}))

const message = ref('')

const loading = ref(false)
const dataDrainedFromPeeking = ref(false)
const query = ref('')
const suggestions = ref<Array<SelectItem<string>>>([])
const rawData = ref<EntityData[]>([])
const recentCreatedSuggestions = ref<Array<SelectItem<string>>>([])
const { t } = createI18n('en-us', english)

const axiosAbortController = ref<AbortController | null>(null)

let timeoutHandle: ReturnType<typeof setTimeout> | null = null

const fetcher = async (executor: () => Promise<EntityData[]>, signal?: AbortSignal) => {
  if (fieldDisabled) {
    return
  }
  clearTimeout(timeoutHandle!)
  timeoutHandle = setTimeout(() => {
    loading.value = true
  }, 1500)
  try {
    const data = await executor()
    rawData.value = data
    suggestions.value = rawData.value.map(transformItem)
  } catch (e) {
    if (signal?.aborted) {
      return
    }
    suggestions.value = []
    // When user use exact search with missed hit, we should be returning an empty list
    // rather than reporting `status code: 404, not found`
    if (isAxiosError(e) && e.status === 404) {
      console.warn('unable to search with UUID', query.value, 'for entity type', entity)
      return
    }
    message.value = (e as Error).message
  } finally {
    clearTimeout(timeoutHandle!)
    loading.value = false
  }
}

const onQueryChange = debounce((searchTerm: string) => {
  searchTerm = searchTerm || ''
  query.value = searchTerm

  if (!searchTerm.trim() && !dataDrainedFromPeeking.value) {
    suggestions.value = buildSuggestions(recentCreatedSuggestions.value)
    return
  }

  // Abort previous request if any
  if (axiosAbortController.value) {
    axiosAbortController.value.abort()
  }

  const newAbortController = new AbortController()
  axiosAbortController.value = newAbortController

  // Perform inline search
  if (dataDrainedFromPeeking.value) {
    inlineSearch(searchTerm)
    return
  }

  asyncSearch(searchTerm, newAbortController)
}, DEBOUNCE_DELAY, { leading: true })

const exhaustiveSearch = async (query: string, signal?: AbortSignal) => {
  const data = await getAll(query, signal)
  return data
}

const peek = async () => {
  const { data: { data, next, offset } } = await getPartial(PEEK_SIZE)

  if (!next || !offset) {
    dataDrainedFromPeeking.value = true
  }

  rawData.value = data
  recentCreatedSuggestions.value = data.map((item) => {
    return {
      ...transformItem(item),
      group: t('fields.auto_suggest.recently_created', { entity }),
    }
  })

  return data
}

const fetchExact = async (id: string) => {
  const data = await getOne(id)
  return [data]
}

const asyncSearch = (searchTerm: string, newAbortController: AbortController) => {
  if (isValidUuid(searchTerm) && allowUuidSearch) {
    fetcher(async () => await fetchExact(searchTerm))
  } else {
    fetcher(async () => await exhaustiveSearch(searchTerm, newAbortController.signal), newAbortController.signal)
  }
}

const inlineSearchWithPattern = (pattern: string) => {
  let options: Array<SelectItem<string>> = []

  options = buildSuggestions(recentCreatedSuggestions.value)

  if (!pattern?.trim()) {
    suggestions.value = options
  } else {
    suggestions.value = options.filter((option) => {
      return fields.some((field) => (option[field] || '').includes(pattern))
    })
  }
}

const buildSuggestions = (suggestions: Array<SelectItem<string>>) => {
  if (selectedItem) {
    // If cached suggestions include the selected item, dedupe the list
    return suggestions.some((suggestion) => {
      return suggestion.value === selectedItem.value
    })
      ? suggestions
      : [selectedItem, ...suggestions] // prepending the item into the list to maintain selected state
  } else {
    return suggestions
  }
}

const inlineSearchForUuid = (uuid: string) => {
  suggestions.value = recentCreatedSuggestions.value.filter((entity) => entity.id === uuid)
}

const inlineSearch = (searchTerm: string) => {
  if (isValidUuid(searchTerm) && allowUuidSearch) {
    inlineSearchForUuid(searchTerm)
  } else {
    inlineSearchWithPattern(searchTerm)
  }
}

onMounted(async () => {
  await fetcher(peek)
  // Watch for selectedItem change if there were any selected.
  const unwatch = watch(() => selectedItem, (val) => {
    if (val) {
      suggestions.value = buildSuggestions(recentCreatedSuggestions.value)
    }
    unwatch()
  })

  suggestions.value = buildSuggestions(recentCreatedSuggestions.value)
})
</script>

<style lang="scss" scoped>
.entity-suggestion-item {
  display: flex;
  flex-direction: column;

  .entity-label {
    color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
  }

  .entity-id {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
  }
}

.selected-entity-item {
  padding-left: 28px;

  .selected-entity-label {
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
  }
}
</style>
