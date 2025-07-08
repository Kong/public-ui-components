<template>
  <AutoSuggest
    :id="id"
    :disabled="fieldDisabled"
    :dom-id="domId"
    :empty-message="message"
    :loading="loading"
    :placeholder="placeholder"
    :readonly="disabled"
    :suggestions="dedupedSuggestions"
    @change="$emit('change', $event)"
    @query-change="onQueryChange"
  >
    <template
      v-if="!!$slots.before"
      #before
    >
      <slot name="before" />
    </template>
    <template #selected-item="{ item }">
      <slot
        :item="item"
        name="selected-item"
      />
    </template>

    <template #item="{ item }">
      <slot
        :item="item"
        name="item"
      />
    </template>
  </AutoSuggest>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { debounce } from 'lodash-es'
import AutoSuggest from './AutoSuggest.vue'
import { isValidUuid } from '../../utils/isValidUuid'
import { defaultItemTransformer } from '../../utils/autoSuggest'
import english from '../../locales/en.json'
import { createI18n } from '@kong-ui-public/i18n'

import type { SelectItem } from '@kong/kongponents'
import type { EntityData, AutoSuggestInjection, AutoSuggestItemTransformer } from '../../types/form-autosuggest'

const DEBOUNCE_DELAY = 500
const PEEK_SIZE = 50

const {
  getAll,
  getOne,
  getPartial,
  transformItem = defaultItemTransformer,
  fields = [],
  allowUuidSearch = false,
  id,
  initialItem,
  entity,
  initialItemSelected,
  placeholder,
  domId,
  disabled,
  fieldDisabled,
} = defineProps<{
  transformItem?: AutoSuggestItemTransformer
  allowUuidSearch?: boolean
  placeholder?: string
  fields: string[]
  initialItem?: SelectItem<string>
  initialItemSelected?: boolean
  domId: string
  id: string
  entity: string
  disabled?: boolean
  fieldDisabled?: boolean
} & AutoSuggestInjection >()

defineEmits<{
  change: [item: SelectItem<string> | null]
}>()

const message = ref('')

const loading = ref(false)
const dataDrainedFromPeeking = ref(false)
const query = ref('')
const suggestions = ref<Array<SelectItem<string>>>([])
const rawData = ref<EntityData[]>([])
const peekDataCache = ref<Array<SelectItem<string>>>([])
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
    message.value = (e as Error).message
  } finally {
    clearTimeout(timeoutHandle!)
    loading.value = false
  }
}

const onQueryChange = debounce((searchTerm: string = '') => {
  query.value = searchTerm

  if (!searchTerm.trim()) {
    return
  }

  // Abort previous request if any
  if (axiosAbortController.value) {
    axiosAbortController.value.abort()
  }

  const newAbortController = new AbortController()
  axiosAbortController.value = newAbortController

  if (dataDrainedFromPeeking.value) {
    if (isValidUuid(searchTerm) && allowUuidSearch) {
      inlineSearchForUuid(searchTerm)
    } else {
      inlineSearch(searchTerm)
    }
    return
  }

  if (isValidUuid(searchTerm) && allowUuidSearch) {
    fetcher(async () => await fetchExact(searchTerm))
  } else {
    fetcher(async () => await exhaustiveSearch(searchTerm, newAbortController.signal), newAbortController.signal)
  }
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
  peekDataCache.value = data.map((item) => {
    return {
      ...transformItem(item),
      group: t('fields.auto_suggest.recently_created', { entity }),
    }
  })

  return data
}

const fetchExact = async (id: string) => {
  const { data } = await getOne(id)
  return [data]
}

const inlineSearch = (pattern: string) => {
  if (!pattern.trim()) {
    suggestions.value = rawData.value.map(transformItem)
  }

  suggestions.value = rawData.value.filter((entity) => {
    return fields.some((field) => {
      return (entity[field] || '').includes(pattern)
    })
  }).map(transformItem)
}

const inlineSearchForUuid = (uuid: string) => {
  suggestions.value = rawData.value.filter((entity) => entity.id === uuid).map(transformItem)
}

const dedupedSuggestions = computed(() => {
  const searchString = query.value.trim()
  const suggestionsCandidate = searchString ? suggestions.value : peekDataCache.value

  if (initialItemSelected) {
    if (suggestionsCandidate.some((item) => item.value === initialItem?.value)) {
      return suggestionsCandidate
    } else {
      if (initialItem?.value.includes(searchString)) {
        return [initialItem!, ...suggestionsCandidate]
      }

      return suggestionsCandidate
    }
  }

  return suggestionsCandidate
})

onMounted(async () => {
  await fetcher(peek)
})
</script>
