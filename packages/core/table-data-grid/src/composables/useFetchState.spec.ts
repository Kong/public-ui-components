import type { Ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { isReadonly, ref } from 'vue'
import useFetchState, { fetchState } from './useFetchState'

type TestRow = {
  id: string
  visible?: boolean
}

type TestCase = {
  data?: TestRow[]
  error?: unknown
  expectedHasData: boolean
  expected: fetchState
  isFetching: boolean
  name: string
}

const createRows = (length: number): TestRow[] => (
  Array.from({ length }, (_, index) => ({ id: `${index + 1}` }))
)

const stateCases: TestCase[] = [
  {
    name: 'no data, no error, not fetching',
    expectedHasData: false,
    expected: fetchState.PENDING,
    isFetching: false,
  },
  {
    name: 'no data, no error, fetching',
    expectedHasData: false,
    expected: fetchState.LOADING,
    isFetching: true,
  },
  {
    name: 'no data, error, not fetching',
    error: new Error('failed'),
    expectedHasData: false,
    expected: fetchState.ERROR,
    isFetching: false,
  },
  {
    name: 'empty data, no error, not fetching',
    data: [],
    expectedHasData: false,
    expected: fetchState.SUCCESS,
    isFetching: false,
  },
  {
    name: 'empty data, no error, fetching',
    data: [],
    expectedHasData: false,
    expected: fetchState.LOADING,
    isFetching: true,
  },
  {
    name: 'data, no error, not fetching',
    data: createRows(1),
    expectedHasData: true,
    expected: fetchState.SUCCESS,
    isFetching: false,
  },
  {
    name: 'data, no error, fetching',
    data: createRows(1),
    expectedHasData: true,
    expected: fetchState.SUCCESS,
    isFetching: true,
  },
  {
    name: 'data, error, not fetching',
    data: createRows(1),
    error: new Error('failed'),
    expectedHasData: true,
    expected: fetchState.SUCCESS,
    isFetching: false,
  },
]

describe('useFetchState', () => {
  it.each(stateCases)('returns $expected for $name', ({
    data: initialData,
    error: initialError,
    expectedHasData,
    expected,
    isFetching: initialIsFetching,
  }) => {
    const data = ref<TestRow[] | undefined>(initialData)
    const error = ref<unknown>(initialError)
    const isFetching = ref(initialIsFetching)

    const { hasData, state } = useFetchState(data, error, isFetching)

    expect(hasData.value).toBe(expectedHasData)
    expect(state.value).toBe(expected)
  })

  it('derives state reactively from data, error, and isFetching refs', () => {
    const data = ref<TestRow[] | undefined>(undefined)
    const error = ref<unknown>(undefined)
    const isFetching = ref(false)

    const { state } = useFetchState(data, error, isFetching)

    expect(state.value).toBe(fetchState.PENDING)

    isFetching.value = true
    expect(state.value).toBe(fetchState.LOADING)

    data.value = [{ id: 'one' }]
    expect(state.value).toBe(fetchState.SUCCESS)

    isFetching.value = false
    expect(state.value).toBe(fetchState.SUCCESS)

    error.value = new Error('failed')
    expect(state.value).toBe(fetchState.SUCCESS)
  })

  it('supports a custom data detector without owning fetch lifecycle state', () => {
    const data = ref<TestRow[] | undefined>([{ id: 'one', visible: false }])
    const error = ref<unknown>(undefined)
    const isFetching = ref(false)
    const hasVisibleData = (rows: TestRow[] | undefined): boolean => (
      rows?.some(row => row.visible === true) ?? false
    )

    const { hasData, state } = useFetchState(data, error, isFetching, hasVisibleData)

    expect(hasData.value).toBe(false)
    expect(state.value).toBe(fetchState.SUCCESS)

    data.value = [{ id: 'one', visible: true }]
    expect(hasData.value).toBe(true)
    expect(state.value).toBe(fetchState.SUCCESS)
  })

  it('returns readonly state and hasData refs to callers', () => {
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
