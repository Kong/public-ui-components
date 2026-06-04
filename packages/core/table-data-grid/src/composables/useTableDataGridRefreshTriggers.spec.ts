import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useTableDataGridRefreshTriggers } from './useTableDataGridRefreshTriggers'

describe('useTableDataGridRefreshTriggers', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  const mountRefreshTriggers = () => {
    const datatableWidth = ref(100)
    const enableSearch = ref(true)
    const handleDatatableWidthChange = vi.fn()
    const refresh = vi.fn()
    const refreshKey = ref<string | number | undefined>('initial')
    const searchQuery = ref('')
    let triggers!: ReturnType<typeof useTableDataGridRefreshTriggers>

    const wrapper = mount(defineComponent({
      setup() {
        triggers = useTableDataGridRefreshTriggers({
          datatableWidth,
          enableSearch,
          handleDatatableWidthChange,
          refresh,
          refreshKey,
          searchQuery,
        })

        return () => h('div')
      },
    }))

    return {
      datatableWidth,
      enableSearch,
      handleDatatableWidthChange,
      refresh,
      refreshKey,
      searchQuery,
      triggers,
      wrapper,
    }
  }

  it('refreshes for changed refresh keys and width changes only', async () => {
    const {
      datatableWidth,
      handleDatatableWidthChange,
      refresh,
      refreshKey,
      wrapper,
    } = mountRefreshTriggers()

    refreshKey.value = 'next'
    await nextTick()
    expect(refresh).toHaveBeenCalledOnce()

    refreshKey.value = 'next'
    await nextTick()
    expect(refresh).toHaveBeenCalledOnce()

    datatableWidth.value = 200
    await nextTick()
    expect(handleDatatableWidthChange).toHaveBeenCalledOnce()

    wrapper.unmount()
  })

  it('clears search when search is disabled and refreshes with the immediate empty debounce', async () => {
    vi.useFakeTimers()
    const {
      enableSearch,
      refresh,
      searchQuery,
      triggers,
      wrapper,
    } = mountRefreshTriggers()
    searchQuery.value = 'gateway'
    await nextTick()

    expect(triggers.searchDebounceMs.value).toBe(350)

    enableSearch.value = false
    await nextTick()
    await vi.runOnlyPendingTimersAsync()

    expect(searchQuery.value).toBe('')
    expect(triggers.searchDebounceMs.value).toBe(0)
    expect(refresh).toHaveBeenCalledOnce()

    wrapper.unmount()
  })

  it('debounces non-empty search refreshes', async () => {
    vi.useFakeTimers()
    const {
      refresh,
      searchQuery,
      wrapper,
    } = mountRefreshTriggers()

    searchQuery.value = 'gateway'
    await nextTick()
    await vi.advanceTimersByTimeAsync(349)
    expect(refresh).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(refresh).toHaveBeenCalledOnce()

    wrapper.unmount()
  })
})
