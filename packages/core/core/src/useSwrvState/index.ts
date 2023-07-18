/* eslint-disable no-unused-vars */
import { ref, Ref, watchEffect } from 'vue'

enum swrvState {
  VALIDATING = 'VALIDATING',
  VALIDATING_HAS_DATA = 'VALIDATING_HAS_DATA',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  SUCCESS_HAS_DATA = 'SUCCESS_HAS_DATA',
  ERROR = 'ERROR',
  STALE_IF_ERROR = 'STALE_IF_ERROR',
}

const defaultHasData = (response: any): boolean => {
  if (!response) {
    return false
  }

  return !!(
    // TODO: revisit: currently only the first check ever matters?
    Object.keys(response)?.length ||
    response.data?.length ||
    response.data?.data?.length ||
    (!response.data?.data &&
      typeof response.data === 'object' &&
      Object.keys(response?.data).length)
  )
}

export default function useSwrvState(
  response = ref<any>({}),
  error: Ref<any>,
  isValidating: Ref<boolean>,
  hasDataCallback: (response: any) => boolean = defaultHasData,
) {
  const state = ref(swrvState.PENDING)

  watchEffect(() => {
    const hasData = hasDataCallback(response.value)

    if (response.value && hasData && isValidating.value) {
      state.value = swrvState.VALIDATING_HAS_DATA

      return
    }

    if (response.value && isValidating.value) {
      state.value = swrvState.VALIDATING

      return
    }

    if (response.value && error.value) {
      state.value = swrvState.STALE_IF_ERROR

      return
    }

    if (response.value === undefined && !error.value) {
      state.value = swrvState.PENDING

      return
    }

    if (response.value && !error.value && hasData) {
      state.value = swrvState.SUCCESS_HAS_DATA

      return
    }

    if (response.value && !error.value) {
      state.value = swrvState.SUCCESS

      return
    }

    if (response.value === undefined && error) {
      state.value = swrvState.ERROR
    }
  })

  return {
    state,
    swrvState,
  }
}
