import { ref } from 'vue'
import { flushPromises } from '@vue/test-utils'
import useSwrvState from './index'
import { describe, it, expect } from 'vitest'

type TestRecord = ['none' | 'noData' | 'hasData', boolean, boolean, string]

const testTable: TestRecord[] = [
  // response (hasData), error, validating
  ['none', false, false, 'PENDING'],
  ['noData', false, false, 'SUCCESS'],
  ['hasData', false, false, 'SUCCESS_HAS_DATA'],
  ['none', true, false, 'ERROR'],
  ['none', true, true, 'ERROR'],
  ['none', false, true, 'PENDING'],
  ['noData', true, false, 'STALE_IF_ERROR'],
  ['hasData', true, false, 'STALE_IF_ERROR'],
  ['noData', false, true, 'VALIDATING'],
  ['hasData', false, true, 'VALIDATING_HAS_DATA'],
  ['noData', true, true, 'VALIDATING'],
  ['hasData', true, true, 'VALIDATING_HAS_DATA'],
]

const makeDescription = (r: TestRecord) => {
  let dataDesc: string

  if (r[0] === 'none') {
    dataDesc = 'no response'
  } else if (r[0] === 'noData') {
    dataDesc = 'no data'
  } else {
    dataDesc = 'data'
  }

  const errorDesc = r[1] ? 'error' : 'no error'
  const validatingDesc = r[2] ? 'is validating' : 'is not validating'

  return `handles ${dataDesc}, with ${errorDesc}, and ${validatingDesc}`
}

describe('useSwrvState', () => {
  testTable.forEach(r => {
    it(makeDescription(r), async () => {
      const response = ref<any>(undefined)
      const error = ref<any>(undefined)
      const isValidating = ref<boolean>(false)

      if (r[0] === 'noData') {
        response.value = {}
      } else if (r[0] === 'hasData') {
        response.value = { data: ['meh'] }
      }

      if (r[1]) {
        error.value = { error: 'meh' }
      }

      if (r[2]) {
        isValidating.value = true
      }

      const { state } = useSwrvState(response, error, isValidating)

      expect(state.value).toBe(r[3])
    })
  })

  it('is reactive', async () => {
    const response = ref<any>(undefined)
    const error = ref<any>(undefined)
    const isValidating = ref<boolean>(false)

    const { state, swrvState: STATES } = useSwrvState(response, error, isValidating)

    expect(state.value).toBe(STATES.PENDING)

    response.value = { data: ['meh'] }

    await flushPromises()

    expect(state.value).toBe(STATES.SUCCESS_HAS_DATA)

    error.value = { error: 'blah' }

    await flushPromises()

    expect(state.value).toBe(STATES.STALE_IF_ERROR)

    error.value = undefined
    isValidating.value = true

    await flushPromises()

    expect(state.value).toBe(STATES.VALIDATING_HAS_DATA)
  })
})
