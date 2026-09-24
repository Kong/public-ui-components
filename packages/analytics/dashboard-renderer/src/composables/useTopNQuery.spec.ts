import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, reactive, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import type { AllFilters, ExploreResultV4, TopNTableOptions } from '@kong-ui-public/analytics-utilities'
import type { ChartRendererProps } from '../types'
import { INJECT_QUERY_PROVIDER } from '../constants'
import useTopNQuery from './useTopNQuery'

vi.mock('@kong-ui-public/analytics-config-store', () => ({
  useDatasourceConfigStore: () => ({
    datasourceConfigMap: ref({}), isReady: vi.fn().mockResolvedValue(undefined),
    stripUnknownFilters: ref(({ filters }: { filters: AllFilters[] }) => filters),
  }),
}))

const response = (name: string): ExploreResultV4 => ({
  data: [{ timestamp: '2026-09-21T00:00:00Z', event: { gateway_service: name, request_count: 30 } }],
  meta: { start: '', end: '', display: { gateway_service: { [name]: { name } } }, metric_names: ['request_count'], granularity_ms: 0, query_id: name },
})
const deferred = () => {
  let resolve!: (value: ExploreResultV4) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<ExploreResultV4>((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })
  return { promise, resolve, reject }
}
const setup = (queryFn = vi.fn().mockResolvedValue(response('current'))) => {
  const props = reactive<ChartRendererProps<TopNTableOptions>>({
    query: { metrics: ['request_count'], dimensions: ['gateway_service'], limit: 100 },
    context: { filters: [], timeSpec: { type: 'relative', time_range: '15m' }, editable: false, tz: 'UTC', refreshInterval: 0 },
    queryReady: true, refreshCounter: 0, height: 300, chartOptions: {},
  })
  const chartData = vi.fn()
  const queryComplete = vi.fn()
  const wrapper = mount(defineComponent({
    setup: () => useTopNQuery({ props, chartData, queryComplete }),
    template: '<div />',
  }), { global: { provide: { [INJECT_QUERY_PROVIDER]: { queryFn } } } })
  const fetch = () => wrapper.vm.fetcher({ mode: 'unpaginated' })
  return { wrapper, props, queryFn, chartData, queryComplete, fetch }
}

describe('useTopNQuery', () => {
  afterEach(() => vi.useRealTimers())

  it('only fetches on grid invocation, keeps the Explore limit, and forwards the original response', async () => {
    const test = setup()
    expect(test.queryFn).not.toHaveBeenCalled()
    await test.fetch()
    expect(test.queryFn).toHaveBeenCalledOnce()
    const sent = test.queryFn.mock.calls[0][0].query
    expect(sent).toMatchObject({ limit: 100, time_range: { type: 'relative', time_range: '15m', tz: 'UTC' } })
    expect(sent).not.toHaveProperty('page_size')
    expect(sent).not.toHaveProperty('cursor')
    expect(sent).not.toHaveProperty('offset')
    expect(test.chartData).toHaveBeenCalledExactlyOnceWith(response('current'))
    expect(test.queryComplete).toHaveBeenCalledOnce()
    test.wrapper.unmount()
  })

  it.each(['resolve', 'reject'] as const)('ignores a stale %s including metadata and events', async (settle) => {
    const first = deferred()
    const test = setup(vi.fn().mockReturnValueOnce(first.promise).mockResolvedValue(response('new')))
    const old = test.fetch().catch(() => undefined)
    await flushPromises()
    test.props.refreshCounter++
    await test.fetch()
    if (settle === 'resolve') {
      first.resolve(response('old'))
    } else {
      first.reject({ status: 403 })
    }
    await old
    expect(test.wrapper.vm.response).toEqual(response('new'))
    expect(test.wrapper.vm.queryError).toBeNull()
    expect(test.chartData).toHaveBeenCalledExactlyOnceWith(response('new'))
    expect(test.queryComplete).toHaveBeenCalledOnce()
    expect(test.queryFn.mock.calls[0][1].signal.aborted).toBe(true)
    test.wrapper.unmount()
  })

  it('cancels and suppresses completion when readiness is lost', async () => {
    const pending = deferred()
    const test = setup(vi.fn().mockReturnValue(pending.promise))
    const request = test.fetch().catch(() => undefined)
    await flushPromises()
    test.props.queryReady = false
    await flushPromises()
    expect(test.queryFn.mock.calls[0][1].signal.aborted).toBe(true)
    pending.resolve(response('old'))
    await request
    expect(test.chartData).not.toHaveBeenCalled()
    expect(test.queryComplete).not.toHaveBeenCalled()
    test.wrapper.unmount()
  })

  it('preserves previous metadata during refresh and translates errors, then recovers', async () => {
    const pending = deferred()
    const test = setup(vi.fn().mockResolvedValueOnce(response('first')).mockReturnValueOnce(pending.promise).mockResolvedValue(response('recovered')))
    await test.fetch()
    test.props.refreshCounter++
    const refresh = test.fetch()
    expect(test.wrapper.vm.response).toEqual(response('first'))
    pending.reject({ status: 403 })
    await expect(refresh).rejects.toEqual({ status: 403 })
    expect(test.wrapper.vm.queryError?.message).toBe('Data request forbidden')
    test.props.refreshCounter++
    await test.fetch()
    expect(test.wrapper.vm.queryError).toBeNull()
    expect(test.wrapper.vm.response).toEqual(response('recovered'))
    test.wrapper.unmount()
  })

  it('invalidates once per interval and stops after unmount', async () => {
    vi.useFakeTimers()
    const test = setup()
    test.props.context.refreshInterval = 1000
    await test.fetch()
    const initial = test.wrapper.vm.fetcher
    await vi.advanceTimersByTimeAsync(1000)
    expect(test.wrapper.vm.fetcher).not.toBe(initial)
    await test.fetch()
    expect(test.queryFn).toHaveBeenCalledTimes(2)
    test.wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('lets an interval refresh replace a slow query', async () => {
    vi.useFakeTimers()
    const pending = deferred()
    const test = setup(vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(response('new')))
    test.props.context.refreshInterval = 1000
    const request = test.fetch().catch(() => undefined)
    const firstFetcher = test.wrapper.vm.fetcher
    await vi.advanceTimersByTimeAsync(1000)
    expect(test.wrapper.vm.fetcher).not.toBe(firstFetcher)
    await test.fetch()
    expect(test.queryFn.mock.calls[0][1].signal.aborted).toBe(true)
    expect(test.chartData).toHaveBeenCalledExactlyOnceWith(response('new'))
    pending.resolve(response('slow'))
    await request
    expect(test.chartData).toHaveBeenCalledExactlyOnceWith(response('new'))
    test.wrapper.unmount()
  })

  it('pauses interval refresh while not ready and resumes when ready', async () => {
    vi.useFakeTimers()
    const test = setup()
    test.props.context.refreshInterval = 1000
    await test.fetch()
    test.props.queryReady = false
    const notReadyFetcher = test.wrapper.vm.fetcher
    await vi.advanceTimersByTimeAsync(2000)
    expect(test.wrapper.vm.fetcher).toBe(notReadyFetcher)
    test.props.queryReady = true
    await flushPromises()
    const resumedFetcher = test.wrapper.vm.fetcher
    await vi.advanceTimersByTimeAsync(999)
    expect(test.wrapper.vm.fetcher).toBe(resumedFetcher)
    await vi.advanceTimersByTimeAsync(1)
    expect(test.wrapper.vm.fetcher).not.toBe(resumedFetcher)
    test.wrapper.unmount()
  })

  it('uses interval changes without waiting for another query and stops when disabled', async () => {
    vi.useFakeTimers()
    const test = setup()
    test.props.context.refreshInterval = 1000
    await test.fetch()
    await vi.advanceTimersByTimeAsync(500)
    test.props.context.refreshInterval = 2000
    await flushPromises()
    const replacementFetcher = test.wrapper.vm.fetcher
    await vi.advanceTimersByTimeAsync(1999)
    expect(test.wrapper.vm.fetcher).toBe(replacementFetcher)
    await vi.advanceTimersByTimeAsync(1)
    expect(test.wrapper.vm.fetcher).not.toBe(replacementFetcher)
    test.props.context.refreshInterval = 0
    await flushPromises()
    const disabledFetcher = test.wrapper.vm.fetcher
    await vi.advanceTimersByTimeAsync(3000)
    expect(test.wrapper.vm.fetcher).toBe(disabledFetcher)
    expect(vi.getTimerCount()).toBe(0)
    test.wrapper.unmount()
  })

  it('does not postpone the current refresh timer when a stale request settles', async () => {
    vi.useFakeTimers()
    const pending = deferred()
    const test = setup(vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(response('new')))
    test.props.context.refreshInterval = 1000
    const stale = test.fetch().catch(() => undefined)
    test.props.refreshCounter++
    await test.fetch()
    const currentFetcher = test.wrapper.vm.fetcher
    await vi.advanceTimersByTimeAsync(500)
    pending.resolve(response('old'))
    await stale
    await vi.advanceTimersByTimeAsync(500)
    expect(test.wrapper.vm.fetcher).not.toBe(currentFetcher)
    expect(test.chartData).toHaveBeenCalledExactlyOnceWith(response('new'))
    expect(test.queryComplete).toHaveBeenCalledOnce()
    test.wrapper.unmount()
  })

  it('replaces the fetcher for query context changes but not presentation changes', () => {
    const test = setup()
    const initial = test.wrapper.vm.fetcher
    test.props.context.tz = 'America/Vancouver'
    const changed = test.wrapper.vm.fetcher
    expect(changed).not.toBe(initial)
    test.props.chartOptions = { column_options: { request_count: { label: 'Requests' } } }
    test.props.height = 500
    expect(test.wrapper.vm.fetcher).toBe(changed)
    test.wrapper.unmount()
  })
})
