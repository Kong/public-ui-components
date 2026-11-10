<template>
  <EntityAutoSuggest
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
          :color="`var(--kui-color-text-neutral, ${KUI_COLOR_TEXT_NEUTRAL})`"
          :size="`var(--kui-icon-size-40, ${KUI_ICON_SIZE_40})`"
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
  </EntityAutoSuggest>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, watch } from 'vue'
import { debounce } from 'lodash-es'
import { SearchIcon } from '@kong/icons'
import { KUI_ICON_SIZE_40, KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'
import EntityAutoSuggest from './EntityAutoSuggest.vue'
import { FORMS_API_KEY } from '../const'
import useI18n from '../../../composables/useI18n'
import { isAxiosError } from 'axios'

import type { AxiosResponse } from 'axios'
import type { SelectItem } from '@kong/kongponents'
import type { EntityData, EntityResponse, EntityItemTransformer } from '../types'

const EMPTY_VALUE_PLACEHOLDER = '—' // em dash
// The whole search term must be a UUID, a name that contains a UUID is searched as a name
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const isValidUuid = (str: string): boolean => UUID_PATTERN.test(str)
const DEBOUNCE_DELAY = 500
const PEEK_SIZE = 50
const REQUEST_RESULTS_LIMIT = 1000

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
  transformItem?: EntityItemTransformer
  allowUuidSearch?: boolean
  placeholder?: string
  fields?: string[]
  selectedItem?: SelectItem<string>
  selectedItemLoading?: boolean
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

const api = inject<Record<string, any> | undefined>(FORMS_API_KEY, undefined)

const getAll = async (query: string, signal?: AbortSignal): Promise<EntityData[]> => {
  if (!api) {
    console.warn('[@kong-ui-public/entities-plugins] No API service provided')
    return []
  }
  const { data } = await api.getAllV2(entity, { name: query, size: REQUEST_RESULTS_LIMIT }, signal)
  return data.data
}

const getPartial = async (size: number): Promise<AxiosResponse<EntityResponse>> => {
  if (!api) {
    console.warn('[@kong-ui-public/entities-plugins] No API service provided')
    return Promise.resolve({ data: { data: [] } } as unknown as AxiosResponse<EntityResponse>)
  }
  return api.peek(entity, size)
}

const getOne = async (id: string): Promise<EntityData> => {
  if (!api) {
    console.warn('[@kong-ui-public/entities-plugins] No API service provided')
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
const { i18n: { t } } = useI18n()

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

// KSelect keeps its own query state and clears it on open (`enableFiltering`), which emits
// `query-change` with an empty string. That empty query is what restores the prefetched suggestions.
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
      group: t('plugins.free-form.scope_entity.recently_created', { entity }),
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
