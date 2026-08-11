import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useEmitState } from './useEmitState'
import { fetchState } from './useFetchState'

describe('useEmitState', () => {
  it('skips pending state and emits public fetch states', async () => {
    const emitState = vi.fn()
    const hasData = ref(false)
    const fetchLifecycleState = ref(fetchState.PENDING)

    useEmitState({
      emitState,
      fetchLifecycleState,
      hasData,
    })

    expect(emitState).not.toHaveBeenCalled()

    fetchLifecycleState.value = fetchState.LOADING
    await nextTick()
    expect(emitState).toHaveBeenLastCalledWith({
      hasData: false,
      state: 'loading',
    })

    hasData.value = true
    fetchLifecycleState.value = fetchState.SUCCESS
    await nextTick()
    expect(emitState).toHaveBeenLastCalledWith({
      hasData: true,
      state: 'success',
    })

    fetchLifecycleState.value = fetchState.ERROR
    await nextTick()
    expect(emitState).toHaveBeenLastCalledWith({
      hasData: true,
      state: 'error',
    })
  })

  it('does not emit the current state during setup', () => {
    const emitState = vi.fn()
    const hasData = ref(true)
    const fetchLifecycleState = ref(fetchState.SUCCESS)

    useEmitState({
      emitState,
      fetchLifecycleState,
      hasData,
    })

    expect(emitState).not.toHaveBeenCalled()
  })
})
