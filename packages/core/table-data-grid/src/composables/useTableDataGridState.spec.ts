import { defineComponent, h, nextTick, ref, shallowRef } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { useTableDataGridState } from './useTableDataGridState'

type TestRow = {
  id: string
}

describe('useTableDataGridState', () => {
  const mountState = () => {
    const emitState = vi.fn()
    const error = ref(false)
    const fetchError = ref<unknown>()
    const hasFetched = ref(false)
    const isFetching = ref(false)
    const loading = ref(false)
    const rowData = shallowRef<TestRow[]>([])
    let state!: ReturnType<typeof useTableDataGridState<TestRow>>

    const wrapper = mount(defineComponent({
      setup() {
        state = useTableDataGridState<TestRow>({
          emit: {
            state: emitState,
          },
          fetch: {
            fetchError,
            hasFetched,
            isFetching,
            rowData,
          },
          inputs: {
            error,
            loading,
          },
        })

        return () => h('div')
      },
    }))

    return {
      emitState,
      error,
      fetchError,
      hasFetched,
      isFetching,
      loading,
      rowData,
      state,
      wrapper,
    }
  }

  it('emits loading, empty, success, and error state payloads', async () => {
    const {
      emitState,
      error,
      fetchError,
      hasFetched,
      isFetching,
      loading,
      rowData,
      state,
      wrapper,
    } = mountState()

    expect(emitState).toHaveBeenLastCalledWith({
      state: 'loading',
      hasData: false,
    })

    hasFetched.value = true
    await nextTick()
    expect(state.isEmpty.value).toBe(true)
    expect(emitState).toHaveBeenLastCalledWith({
      state: 'empty',
      hasData: false,
    })

    rowData.value = [{ id: '1' }]
    await nextTick()
    expect(emitState).toHaveBeenLastCalledWith({
      state: 'success',
      hasData: true,
    })

    loading.value = true
    await nextTick()
    expect(emitState).toHaveBeenLastCalledWith({
      state: 'loading',
      hasData: true,
    })

    loading.value = false
    await nextTick()
    expect(emitState).toHaveBeenLastCalledWith({
      state: 'success',
      hasData: true,
    })

    isFetching.value = true
    await nextTick()
    expect(emitState).toHaveBeenLastCalledWith({
      state: 'success',
      hasData: true,
    })

    isFetching.value = false
    rowData.value = []
    fetchError.value = new Error('failed')
    await nextTick()
    expect(state.shouldShowErrorState.value).toBe(true)
    expect(emitState).toHaveBeenLastCalledWith({
      state: 'error',
      hasData: false,
    })

    fetchError.value = undefined
    error.value = true
    await nextTick()
    expect(emitState).toHaveBeenLastCalledWith({
      state: 'error',
      hasData: false,
    })

    wrapper.unmount()
  })
})
