import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useDatatablePagination } from './useDatatablePagination'

describe('useDatatablePagination', () => {
  const createPagination = ({
    activePageSize = ref(15),
    isFetching = ref(false),
    currentPage = ref(1),
    totalRows = ref<number>(),
    hasNextPageWhenTotalUnknown = ref(false),
    fetchPage = vi.fn(),
  } = {}) => ({
    fetchPage,
    pagination: useDatatablePagination({
      activePageSize,
      isFetching,
      fetchPage,
      currentPage,
      totalRows,
      hasNextPageWhenTotalUnknown,
    }),
  })

  it('guards invalid, current, fetching, and out-of-bounds page requests', () => {
    const fetchPage = vi.fn()
    const { pagination } = createPagination({
      fetchPage,
      isFetching: ref(true),
      currentPage: ref(2),
      totalRows: ref(30),
    })

    pagination.goToPage(0)
    pagination.goToPage(2)
    pagination.goToPage(3)

    expect(fetchPage).not.toHaveBeenCalled()
  })

  it('allows previous pages and known-total next pages in bounds', () => {
    const { fetchPage, pagination } = createPagination({
      currentPage: ref(2),
      totalRows: ref(40),
    })

    expect(pagination.hasKnownTotalRows.value).toBe(true)
    expect(pagination.canGoPreviousPage.value).toBe(true)
    expect(pagination.canGoNextPage.value).toBe(true)

    pagination.goToPage(1)
    pagination.onPageChange({ page: 3, pageCount: 3, firstItem: 31, lastItem: 40, visibleItems: [] })

    expect(fetchPage).toHaveBeenCalledWith(1)
    expect(fetchPage).toHaveBeenCalledWith(3)
  })

  it('uses unknown-total has-next state when total rows are omitted', () => {
    const hasNextPageWhenTotalUnknown = ref(false)
    const { fetchPage, pagination } = createPagination({
      hasNextPageWhenTotalUnknown,
    })

    expect(pagination.hasKnownTotalRows.value).toBe(false)
    expect(pagination.canGoNextPage.value).toBe(false)
    pagination.goToPage(2)
    expect(fetchPage).not.toHaveBeenCalled()

    hasNextPageWhenTotalUnknown.value = true
    expect(pagination.canGoNextPage.value).toBe(true)
    pagination.goToPage(2)
    expect(fetchPage).toHaveBeenCalledWith(2)
  })
})
