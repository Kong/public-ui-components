import type { Ref } from 'vue'
import { computed, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'

/**
 * Owns refresh triggers that come from wrapper-level reactive inputs.
 *
 * Search text, refresh keys, search enablement, and container width changes are
 * observed here. The actual fetch implementation remains behind the `refresh`
 * callback, and sizing owns what a width change means.
 */
export const useTableDataGridRefreshTriggers = ({
  datatableWidth,
  enableSearch,
  handleDatatableWidthChange,
  refresh,
  refreshKey,
  searchQuery,
}: {
  datatableWidth: Readonly<Ref<number>>
  enableSearch: Readonly<Ref<boolean>>
  handleDatatableWidthChange: () => void
  refresh: () => void
  refreshKey: Readonly<Ref<string | number | undefined>>
  searchQuery: Ref<string>
}) => {
  const searchDebounceMs = computed(() => searchQuery.value ? 350 : 0)

  watch(refreshKey, (nextKey, previousKey) => {
    if (nextKey === previousKey) {
      return
    }

    refresh()
  })

  watch(datatableWidth, handleDatatableWidthChange)

  watch(enableSearch, (isEnabled) => {
    if (isEnabled || !searchQuery.value) {
      return
    }

    searchQuery.value = ''
  })

  watchDebounced(searchQuery, () => {
    refresh()
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
