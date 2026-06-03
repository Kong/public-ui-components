import type { Ref } from 'vue'
import { computed, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'

export const useTableDataGridRefreshTriggers = ({
  element,
  fetch,
  inputs,
  models,
  sizing,
}: {
  element: {
    datatableWidth: Readonly<Ref<number>>
  }
  fetch: {
    refresh: () => void
  }
  inputs: {
    enableSearch: Readonly<Ref<boolean>>
    refreshKey: Readonly<Ref<string | number | undefined>>
  }
  models: {
    searchQuery: Ref<string>
  }
  sizing: {
    handleDatatableWidthChange: () => void
  }
}) => {
  const searchDebounceMs = computed(() => models.searchQuery.value ? 350 : 0)

  watch(inputs.refreshKey, (nextKey, previousKey) => {
    if (nextKey === previousKey) {
      return
    }

    fetch.refresh()
  })

  watch(element.datatableWidth, sizing.handleDatatableWidthChange)

  watch(inputs.enableSearch, (isEnabled) => {
    if (isEnabled || !models.searchQuery.value) {
      return
    }

    models.searchQuery.value = ''
  })

  watchDebounced(models.searchQuery, () => {
    fetch.refresh()
  }, {
    debounce: searchDebounceMs,
    // Without sync flush, outside-actions slot calls to updateSearch() can miss
    // the immediate debounce window and refetch with the previous search value.
    flush: 'sync',
    maxWait: 1000,
  })

  return {
    searchDebounceMs,
  }
}
