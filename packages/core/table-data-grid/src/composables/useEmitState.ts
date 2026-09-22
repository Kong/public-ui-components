import type { TableDataGridStatePayload } from '../types'
import type { Ref } from 'vue'
import { watch } from 'vue'
import { fetchState } from './useFetchState'

type UseEmitStateOptions = {
  emitState: (payload: TableDataGridStatePayload) => void
  /** Include loading when fetching has already started during setup. */
  emitInitialState?: boolean
  fetchLifecycleState: Readonly<Ref<fetchState>>
  hasData: Readonly<Ref<boolean>>
}

export const useEmitState = ({
  emitState,
  emitInitialState = false,
  fetchLifecycleState,
  hasData,
}: UseEmitStateOptions) => {
  watch(
    () => ({
      hasData: hasData.value,
      state: fetchLifecycleState.value,
    }),
    ({ hasData, state }) => {
      if (state === fetchState.PENDING) {
        return
      }

      if (state === fetchState.LOADING) {
        emitState({
          hasData,
          state: 'loading',
        })

        return
      }

      if (state === fetchState.ERROR) {
        emitState({
          hasData,
          state: 'error',
        })

        return
      }

      emitState({
        hasData,
        state: 'success',
      })
    },
    { immediate: emitInitialState },
  )
}
