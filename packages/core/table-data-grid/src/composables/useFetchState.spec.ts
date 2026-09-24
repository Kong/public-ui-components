import type { Ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { isReadonly, ref, shallowRef } from 'vue'
import useFetchState, { fetchState } from './useFetchState'

type TestRow = {
  id: string
  visible?: boolean
}

type TestCase = {
  data?: TestRow[]
  error?: unknown
  expectedHasData: boolean
  expectedState: fetchState
  isFetching: boolean
  name: string
}

const createRows = (length: number): TestRow[] => (
  Array.from({ length }, (_, index) => ({ id: `${index + 1}` }))
)

// Documents state precedence for a derived fetch-state helper:
// active fetches report loading even when rows already exist, meaningful data
// still wins over later errors, and resolved empty data still means the fetch
// completed successfully.
const stateCases: TestCase[] = [
  {
    name: 'nothing has resolved and no request is pending',
    expectedHasData: false,
    expectedState: fetchState.PENDING,
    isFetching: false,
  },
  {
    name: 'nothing has resolved and a request is pending',
    expectedHasData: false,
    expectedState: fetchState.LOADING,
    isFetching: true,
  },
  {
    name: 'nothing has resolved and the latest request failed',
    error: new Error('failed'),
    expectedHasData: false,
    expectedState: fetchState.ERROR,
    isFetching: false,
  },
  {
    name: 'an empty result has resolved',
    data: [],
    expectedHasData: false,
    expectedState: fetchState.SUCCESS,
    isFetching: false,
  },
  {
    name: 'an empty result exists but a request is pending',
    data: [],
    expectedHasData: false,
    expectedState: fetchState.LOADING,
    isFetching: true,
  },
  {
    name: 'rows have resolved',
    data: createRows(1),
    expectedHasData: true,
    expectedState: fetchState.SUCCESS,
    isFetching: false,
  },
  {
    name: 'rows exist and another request is pending',
    data: createRows(1),
    expectedHasData: true,
    expectedState: fetchState.LOADING,
    isFetching: true,
  },
  {
    name: 'rows exist and a later request failed',
    data: createRows(1),
    error: new Error('failed'),
    expectedHasData: true,
    expectedState: fetchState.SUCCESS,
    isFetching: false,
  },
]

describe('useFetchState', () => {
  it.each(stateCases)('classifies fetch state as $expectedState when $name', ({
    data: initialData,
    error: initialError,
    expectedHasData,
    expectedState,
    isFetching: initialIsFetching,
  }) => {
    const data = ref<TestRow[] | undefined>(initialData)
    const error = ref<unknown>(initialError)
    const isFetching = ref(initialIsFetching)

    const { hasData, state } = useFetchState(data, error, isFetching)

    expect(hasData.value).toBe(expectedHasData)
    expect(state.value).toBe(expectedState)
  })

  it('updates the derived state when source refs change', () => {
    const data = ref<TestRow[] | undefined>(undefined)
    const error = ref<unknown>(undefined)
    const isFetching = ref(false)

    const { state } = useFetchState(data, error, isFetching)

    expect(state.value).toBe(fetchState.PENDING)

    isFetching.value = true
    expect(state.value).toBe(fetchState.LOADING)

    data.value = [{ id: 'one' }]
    expect(state.value).toBe(fetchState.LOADING)

    isFetching.value = false
    expect(state.value).toBe(fetchState.SUCCESS)

    error.value = new Error('failed')
    expect(state.value).toBe(fetchState.SUCCESS)
  })

  it('uses a custom hasData detector without owning fetch lifecycle state', () => {
    const data = ref<TestRow[] | undefined>([{ id: 'one', visible: false }])
    const error = ref<unknown>(undefined)
    const isFetching = ref(false)
    const hasVisibleData = (rows: TestRow[] | undefined): boolean => (
      rows?.some(row => row.visible === true) ?? false
    )

    const { hasData, state } = useFetchState(data, error, isFetching, hasVisibleData)

    // The custom detector only controls hasData. The fetch state is still
    // SUCCESS because a result has resolved and there is no pending request.
    expect(hasData.value).toBe(false)
    expect(state.value).toBe(fetchState.SUCCESS)

    data.value = [{ id: 'one', visible: true }]
    expect(hasData.value).toBe(true)
    expect(state.value).toBe(fetchState.SUCCESS)
  })

  it('accepts readonly row data refs returned by fetch composables', () => {
    // Fetch orchestration composables return readonly row refs so callers can
    // observe rows without mutating fetch-owned data.
    const data = shallowRef<readonly TestRow[] | undefined>([{ id: 'one' }])
    const error = ref<unknown>(undefined)
    const isFetching = ref(false)
    const hasOneRow = (rows: readonly TestRow[] | undefined): boolean => rows?.length === 1

    const { hasData, state } = useFetchState(data, error, isFetching, hasOneRow)

    expect(hasData.value).toBe(true)
    expect(state.value).toBe(fetchState.SUCCESS)
  })

  it('exposes readonly derived refs to callers', () => {
    const data = ref<TestRow[] | undefined>(undefined)
    const error = ref<unknown>(undefined)
    const isFetching = ref(false)

    const { hasData, state } = useFetchState(data, error, isFetching)
    const assertReadonlyState = (stateRef: Readonly<Ref<fetchState>>) => {
      expect(stateRef.value).toBe(fetchState.PENDING)
    }
    const assertReadonlyHasData = (hasDataRef: Readonly<Ref<boolean>>) => {
      expect(hasDataRef.value).toBe(false)
    }
    const assertReadonlyAssignment = () => {
      // @ts-expect-error state is derived and readonly to callers.
      state.value = fetchState.ERROR
      // @ts-expect-error hasData is derived and readonly to callers.
      hasData.value = true
    }

    assertReadonlyState(state)
    assertReadonlyHasData(hasData)
    expect(assertReadonlyAssignment).toBeTypeOf('function')
    expect(isReadonly(state)).toBe(true)
    expect(isReadonly(hasData)).toBe(true)
  })
})
