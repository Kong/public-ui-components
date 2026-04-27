import type { PageChangeData } from '@kong/kongponents'
import type { Ref } from 'vue'
import { computed } from 'vue'

export const useDatatablePagination = ({
  activePageSize,
  isFetching,
  fetchPage,
  currentPage,
  totalRows,
  hasNextPageWhenTotalUnknown,
}: {
  activePageSize: Readonly<Ref<number>>
  isFetching: Readonly<Ref<boolean>>
  fetchPage: (page: number) => Promise<void> | void
  currentPage: Readonly<Ref<number>>
  totalRows: Readonly<Ref<number | undefined>>
  hasNextPageWhenTotalUnknown: Readonly<Ref<boolean>>
}) => {
  const hasKnownTotalRows = computed(() => typeof totalRows.value === 'number')
  const canGoPreviousPage = computed(() => currentPage.value > 1)
  const canGoNextPage = computed(() => {
    if (typeof totalRows.value === 'number') {
      return currentPage.value * activePageSize.value < totalRows.value
    }

    return hasNextPageWhenTotalUnknown.value
  })

  const goToPage = (page: number) => {
    if (page < 1 || page === currentPage.value || isFetching.value) {
      return
    }

    if (page > currentPage.value && !canGoNextPage.value) {
      return
    }

    void fetchPage(page)
  }

  const onPageChange = ({ page }: PageChangeData) => {
    goToPage(page)
  }

  return {
    hasKnownTotalRows,
    canGoPreviousPage,
    canGoNextPage,
    goToPage,
    onPageChange,
  }
}
