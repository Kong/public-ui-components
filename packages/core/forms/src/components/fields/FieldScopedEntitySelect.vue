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

import type { SelectItem } from '@kong/kongponents'
import type { EntityData, AutoSuggestInjection, AutoSuggestItemTransformer } from '../../types/form-autosuggest'

const DEBOUNCE_DELAY = 500
const PEEK_SIZE = 50

const { getAll, getOne, getPartial, transformItem = defaultItemTransformer, fields = [], allowUuidSearch = false, id, initialItem } = defineProps<{
  transformItem?: AutoSuggestItemTransformer
  allowUuidSearch?: boolean
  placeholder?: string
  fields: string[]
  initialItem?: SelectItem<string>
  domId: string
  id: string
  disabled?: boolean
  fieldDisabled?: boolean
} & AutoSuggestInjection>()

defineEmits<{
  change: [item: SelectItem<string> | null]
}>()

const message = ref('')

const loading = ref(false)
const dataDrainedFromPeeking = ref(false)
const suggestions = ref<Array<SelectItem<string>>>([])
const rawData = ref<EntityData[]>([])
const lastValidDataCache = ref<EntityData[]>([])

const fetcher = async (executor: () => Promise<EntityData[]>) => {
  try {
    loading.value = true
    const data = await executor()
    if (data.length) {
      lastValidDataCache.value = data
    }
    rawData.value = data
    suggestions.value = rawData.value.map(transformItem)
  } catch (e) {
    suggestions.value = []
    message.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

const onQueryChange = debounce((query: string = '') => {
  if (dataDrainedFromPeeking.value) {
    if (isValidUuid(query) && allowUuidSearch) {
      inlineSearchForUuid(query)
    } else {
      inlineSearch(query)
    }
    return
  }

  if (!query.trim()) {
    if (lastValidDataCache.value.length && !rawData.value.length) {
      suggestions.value = lastValidDataCache.value.map(transformItem)
    }
    return
  }

  if (isValidUuid(query) && allowUuidSearch) {
    fetcher(async () => await fetchExact(query))
  } else {
    fetcher(async () => await exhaustiveSearch(query))
  }
}, DEBOUNCE_DELAY)

const exhaustiveSearch = async (query: string) => {
  const data = await getAll(query)
  return data
}

const peek = async () => {
  const { data: { data, next, offset } } = await getPartial(PEEK_SIZE)

  if (!next || !offset) {
    dataDrainedFromPeeking.value = true
  }

  rawData.value = data

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
      return (entity[field] || '').contains(pattern)
    })
  }).map(transformItem)
}

const inlineSearchForUuid = (uuid: string) => {
  suggestions.value = rawData.value.filter((entity) => entity.id === uuid).map(transformItem)
}

const dedupedSuggestions = computed(() => {
  if (!initialItem) return suggestions.value

  if (suggestions.value.some((item) => item.id === initialItem.id)) {
    return suggestions.value
  }
  return [initialItem, ...suggestions.value]
})

onMounted(async () => {
  await fetcher(peek)
})
</script>
