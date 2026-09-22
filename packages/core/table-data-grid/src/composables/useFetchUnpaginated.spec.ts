import type { TableDataGridUnpaginatedFetcher } from '../types'
import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useFetchUnpaginated } from './useFetchUnpaginated'

type TestRow = {
  id: string
}

const createDeferred = <Value>() => {
  let deferredResolve!: (value: Value) => void
  let deferredReject!: (reason?: unknown) => void
  const promise = new Promise<Value>((resolve, reject) => {
    deferredResolve = resolve
    deferredReject = reject
  })

  return { promise, reject: deferredReject, resolve: deferredResolve }
}

const flushFetch = async () => {
  await nextTick()
  await Promise.resolve()
}

const createFetch = (
  fetcher: TableDataGridUnpaginatedFetcher<TestRow>,
) => {
  const resetKey = ref(0)
  const result = useFetchUnpaginated({
    fetcher: ref(fetcher),
    resetKey,
  })

  return { ...result, resetKey }
}

describe('useFetchUnpaginated', () => {
  it('invokes the fetcher with only the mode', async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: [{ id: 'one' }] })
    const { data, error, isFetching } = createFetch(fetcher)

    expect(isFetching.value).toBe(true)

    await flushFetch()

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledWith({ mode: 'unpaginated' })
    expect(data.value).toEqual([{ id: 'one' }])
    expect(isFetching.value).toBe(false)
    expect(error.value).toBeUndefined()
  })

  it('invalidates synchronously before a settled stale promise can update rows', async () => {
    const staleFetch = createDeferred<{ data: TestRow[] }>()
    const latestFetch = createDeferred<{ data: TestRow[] }>()
    const fetcher = vi.fn()
      .mockReturnValueOnce(staleFetch.promise)
      .mockReturnValueOnce(latestFetch.promise)
    const { data, resetKey } = createFetch(fetcher)

    // Resolve the old request and invalidate its query in the same turn. The
    // stale continuation must be inert even before Vue's normal async watcher
    // queue has run.
    staleFetch.resolve({ data: [{ id: 'stale' }] })
    resetKey.value += 1

    await flushFetch()

    expect(data.value).toBeUndefined()
    latestFetch.resolve({ data: [{ id: 'latest' }] })
    await flushFetch()

    expect(data.value).toEqual([{ id: 'latest' }])
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('ignores stale results and errors after a later invalidation', async () => {
    const staleFetch = createDeferred<{ data: TestRow[] }>()
    const latestFetch = createDeferred<{ data: TestRow[] }>()
    const fetcher = vi.fn()
      .mockReturnValueOnce(staleFetch.promise)
      .mockReturnValueOnce(latestFetch.promise)
    const { data, error, resetKey } = createFetch(fetcher)

    resetKey.value += 1
    await nextTick()
    latestFetch.resolve({ data: [{ id: 'latest' }] })
    await flushFetch()

    staleFetch.reject(new Error('stale'))
    await flushFetch()

    expect(data.value).toEqual([{ id: 'latest' }])
    expect(error.value).toBeUndefined()
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('ignores a pending result after its owning scope is unmounted', async () => {
    const pendingFetch = createDeferred<{ data: TestRow[] }>()
    const fetcher = vi.fn().mockReturnValue(pendingFetch.promise)
    const scope = effectScope()
    let result!: ReturnType<typeof useFetchUnpaginated<TestRow>>

    scope.run(() => {
      result = useFetchUnpaginated({
        fetcher: ref(fetcher),
      })
    })
    scope.stop()
    pendingFetch.resolve({ data: [{ id: 'unmounted' }] })
    await flushFetch()

    expect(result.data.value).toBeUndefined()
    expect(result.error.value).toBeUndefined()
  })

  it('exposes the latest rejection while retaining previous rows for recovery', async () => {
    const secondFetch = createDeferred<{ data: TestRow[] }>()
    const thrownError = new Error('failed')
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ data: [{ id: 'old' }] })
      .mockReturnValueOnce(secondFetch.promise)
    const { data, error, isFetching, resetKey } = createFetch(fetcher)

    await flushFetch()
    resetKey.value += 1
    await nextTick()
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(data.value).toEqual([{ id: 'old' }])
    expect(isFetching.value).toBe(true)

    secondFetch.reject(thrownError)
    await flushFetch()

    expect(data.value).toEqual([{ id: 'old' }])
    expect(error.value).toBe(thrownError)
    expect(isFetching.value).toBe(false)

    fetcher.mockResolvedValueOnce({ data: [{ id: 'recovered' }] })
    resetKey.value += 1
    await flushFetch()

    expect(data.value).toEqual([{ id: 'recovered' }])
    expect(fetcher).toHaveBeenCalledTimes(3)
    expect(isFetching.value).toBe(false)
    expect(error.value).toBeUndefined()
  })

  it('uses a replacement fetcher on the next load', async () => {
    const firstFetcher = vi.fn().mockResolvedValue({ data: [{ id: 'first' }] })
    const replacementFetcher = vi.fn().mockResolvedValue({ data: [{ id: 'replacement' }] })
    const fetcher = ref<TableDataGridUnpaginatedFetcher<TestRow>>(firstFetcher)
    const resetKey = ref(0)
    const { data } = useFetchUnpaginated({ fetcher, resetKey })

    await flushFetch()
    fetcher.value = replacementFetcher
    await flushFetch()

    expect(replacementFetcher).toHaveBeenCalledTimes(1)
    expect(replacementFetcher).toHaveBeenCalledWith({ mode: 'unpaginated' })
    expect(data.value).toEqual([{ id: 'replacement' }])
  })
})
