import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { mount } from '@vue/test-utils'
import { EntityLink } from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'
import type { AnalyticsBridge, ExploreResultV4, TopNTableOptions } from '@kong-ui-public/analytics-utilities'
import TopNTableRenderer from './TopNTableRenderer.vue'
import DashboardTile from './DashboardTile.vue'
import { INJECT_QUERY_PROVIDER } from '../constants'
import { setupPiniaTestStore } from '../stores/tests/setupPiniaTestStore'

const result: ExploreResultV4 = {
  data: Array.from({ length: 40 }, (_, index) => ({
    timestamp: '2026-09-21T00:00:00Z',
    event: { gateway_service: `service-${index + 1}`, request_count: 40 - index },
  })),
  meta: {
    start: '', end: '', granularity_ms: 0, query_id: 'topn-grid',
    display: { gateway_service: Object.fromEntries(Array.from({ length: 40 }, (_, index) => [`service-${index + 1}`, { name: `Service ${index + 1}` }])) },
    metric_names: ['request_count'], metric_units: { request_count: 'count' },
  },
}

let container: HTMLDivElement
// SWRV caches responses by query key across mounts; a unique refresh counter isolates each test.
let refreshCounter = 0

afterEach(async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen()
  }
  vi.restoreAllMocks()
  container?.remove()
})

const mountRenderer = ({
  data = result,
  chartOptions,
}: {
  data?: ExploreResultV4
  chartOptions?: Omit<TopNTableOptions, 'type'>
} = {}) => {
  setupPiniaTestStore()
  container = document.createElement('div')
  document.body.append(container)
  const queryFn = vi.fn().mockResolvedValue(data)
  const chartData = vi.fn()
  const queryComplete = vi.fn()
  const wrapper = mount(TopNTableRenderer, {
    attachTo: container,
    props: {
      context: { filters: [], tz: 'UTC', editable: false, refreshInterval: 0 },
      query: { datasource: 'basic', metrics: ['request_count'], dimensions: ['gateway_service'], limit: 40 },
      queryReady: true, refreshCounter: ++refreshCounter, height: 280,
      chartOptions: { type: 'top_n', ...(chartOptions ?? {
        entity_link: 'https://example.com/services/{entity-id}',
        column_options: { request_count: { label: 'Requests', value: 'relative', bar: 'max' } },
      }) },
      onChartData: chartData,
      onQueryComplete: queryComplete,
    },
    global: {
      provide: {
        [INJECT_QUERY_PROVIDER]: {
          queryFn,
          fetchComponent: async () => EntityLink,
          datasourceConfigFn: async () => [],
        },
      },
    },
  })
  return { wrapper, queryFn, chartData, queryComplete }
}

const element = (selector: string): HTMLElement => {
  const found = document.querySelector<HTMLElement>(selector)
  if (!found) {
    throw new Error(`Missing element: ${selector}`)
  }
  return found
}
const cell = (index: number, key: string) => element(`[row-index="${index}"] [col-id="${key}"]`)
const headers = () => Array.from(document.querySelectorAll('.ag-header-cell-text'), header => header.textContent)

const expectOverflowTooltip = async (label: HTMLElement, name: string) => {
  await expect.poll(() => label.scrollWidth > label.clientWidth).toBe(true)
  expect(getComputedStyle(label).textOverflow).toBe('ellipsis')
  await page.elementLocator(label).hover()
  await expect.poll(() => element('.popover').textContent).toContain(name)
  await expect.element(page.elementLocator(element('.popover'))).toBeVisible()
  expect(element('.popover').closest('.ag-cell')).toBeNull()
}

describe('TopNTableRenderer grid integration', () => {
  it.each([
    { name: 'fetches the expanded export result', increaseCsvExportLimit: undefined },
    { name: 'reuses the loaded result when limit increases are disabled', increaseCsvExportLimit: false },
  ])('downloads TopN CSV and $name', async ({ increaseCsvExportLimit }) => {
    setupPiniaTestStore()
    container = document.createElement('div')
    document.body.append(container)
    const expandedResult: ExploreResultV4 = {
      data: [...result.data, { timestamp: result.data[0].timestamp, event: { gateway_service: 'export-only', request_count: 0 } }],
      meta: {
        ...result.meta,
        display: { gateway_service: { ...result.meta.display.gateway_service, 'export-only': { name: 'Export-only, "service"' } } },
      },
    }
    const queryFn = vi.fn<AnalyticsBridge['queryFn']>()
      .mockResolvedValueOnce(result)
      .mockResolvedValueOnce(expandedResult)
    mount(DashboardTile, {
      attachTo: container,
      props: {
        context: { filters: [], tz: 'UTC', editable: false, showTileActions: true, refreshInterval: 0 },
        definition: {
          chart: { type: 'top_n' },
          query: { datasource: 'basic', metrics: ['request_count'], dimensions: ['gateway_service'], limit: 40 },
        },
        queryReady: true, refreshCounter: ++refreshCounter, tileId: 'csv', height: 320,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: {
            queryFn, datasourceConfigFn: async () => [],
            configFn: async () => ({ analytics: { percentiles: true }, requests: null }),
            staticConfig: { increaseCsvExportLimit },
          },
        },
      },
    })
    await expect.poll(() => cell(0, 'gateway_service').textContent).toContain('Service 1')
    expect(queryFn).toHaveBeenCalledOnce()
    expect(queryFn.mock.calls[0][0].query).toMatchObject({ limit: 40 })
    await page.getByTestId('kebab-action-menu-csv').click()
    await page.getByTestId('chart-csv-export-csv').click()
    await expect.element(page.getByTestId('csv-download-button')).toBeEnabled()

    // Observe the real browser download boundary without replacing CSV serialization or FileSaver.
    const createObjectURL = vi.spyOn(URL, 'createObjectURL')
    const dispatchEvent = vi.spyOn(HTMLAnchorElement.prototype, 'dispatchEvent')
    const filename = `chart-export-${new Date().toISOString().slice(0, 10)}.csv`
    await page.getByTestId('csv-download-button').click()
    expect(createObjectURL).toHaveBeenCalledOnce()
    await expect.poll(() => dispatchEvent.mock.contexts.some((anchor, index) => (
      anchor instanceof HTMLAnchorElement
      && anchor.download === filename
      && anchor.href === createObjectURL.mock.results[0].value
      && dispatchEvent.mock.calls[index][0].type === 'click'
    ))).toBe(true)
    const blob = createObjectURL.mock.calls[0][0]
    expect(blob).toBeInstanceOf(Blob)
    if (!(blob instanceof Blob)) {
      throw new Error('CSV download did not create a Blob')
    }
    expect(blob.type).toBe('text/csv;charset=utf-8')
    const expectedRows = Array.from({ length: 40 }, (_, index) => `Service ${index + 1},${40 - index}`)
    if (increaseCsvExportLimit !== false) {
      expectedRows.push('"Export-only, ""service""",0')
      const initialRequest = queryFn.mock.calls[0][0]
      expect(queryFn.mock.calls[1][0]).toEqual({
        ...initialRequest,
        query: { ...initialRequest.query, limit: 1000 },
      })
    }
    expect(await blob.text()).toBe(['Gateway service,Request count', ...expectedRows].join('\r\n'))
    expect(queryFn).toHaveBeenCalledTimes(increaseCsvExportLimit === false ? 1 : 2)
  })

  it('renders and scrolls the complete result without requesting another block', async () => {
    const { queryFn, chartData, queryComplete } = mountRenderer()
    await expect.poll(() => cell(0, 'gateway_service').textContent).toContain('Service 1')
    await expect.element(page.getByTestId('table-data-grid')).toBeVisible()
    expect(headers()).toEqual(['Name', 'Requests'])
    expect(document.querySelector('a[href="https://example.com/services/service-1"]')).not.toBeNull()
    const label = element('.entity-link-label')
    expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth)
    const viewport = element('.ag-grid-viewport')
    viewport.scrollTo({ top: viewport.scrollHeight })
    await expect.element(page.getByText('Service 40', { exact: true })).toBeVisible()
    expect(queryFn).toHaveBeenCalledOnce()
    expect(chartData).toHaveBeenCalledExactlyOnceWith(result)
    expect(queryComplete).toHaveBeenCalledOnce()
    for (const indicator of document.querySelectorAll<HTMLElement>('.ag-sort-indicator-container')) {
      await expect.element(page.elementLocator(indicator)).not.toBeVisible()
    }
  })

  it('truncates long entity links with an ellipsis and shows the full label on hover', async () => {
    const name = `app_${'c0bec4c0-76bd-4908-92c8-ea5f488fd0a1'.repeat(4)}`
    mountRenderer({ data: {
      ...result,
      data: result.data.slice(0, 2),
      meta: { ...result.meta, display: { gateway_service: { 'service-1': { name: 'Short name' }, 'service-2': { name } } } },
    } })
    await expect.poll(() => cell(1, 'gateway_service').textContent).toContain(name)
    await expectOverflowTooltip(element('[row-index="1"] .entity-link-label'), name)
    const tooltip = element('.popover')
    const bounds = tooltip.getBoundingClientRect()
    const visibleElement = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2)
    expect(visibleElement !== null && tooltip.contains(visibleElement)).toBe(true)
    expect(document.querySelector('a[href="https://example.com/services/service-2"]')).not.toBeNull()
  })

  it('keeps long entity tooltips visible and interactive inside native fullscreen', async () => {
    const name = `app_${'c0bec4c0-76bd-4908-92c8-ea5f488fd0a1'.repeat(4)}`
    const { wrapper } = mountRenderer({ data: {
      ...result,
      data: result.data.slice(0, 2),
      meta: { ...result.meta, display: { gateway_service: { 'service-1': { name: 'Short name' }, 'service-2': { name } } } },
    } })
    await expect.poll(() => cell(1, 'gateway_service').textContent).toContain(name)
    const label = element('[row-index="1"] .entity-link-label')
    const fullscreenButton = document.createElement('button')
    fullscreenButton.textContent = 'Enter fullscreen'
    fullscreenButton.addEventListener('click', () => {
      void container.requestFullscreen()
    })
    container.append(fullscreenButton)

    try {
      await expect.poll(() => label.scrollWidth > label.clientWidth).toBe(true)
      // Playwright's click supplies the user activation required by the native fullscreen API.
      await page.elementLocator(fullscreenButton).click()
      await expect.poll(() => document.fullscreenElement).toBe(container)
      await page.elementLocator(label).hover()
      await expect.poll(() => element('.popover').textContent).toContain(name)
      await expect.element(page.elementLocator(element('.popover'))).toBeVisible()

      const fullscreenTooltip = element('.popover')
      expect(container.contains(fullscreenTooltip)).toBe(true)
      const fullscreenBounds = fullscreenTooltip.getBoundingClientRect()
      const fullscreenHit = document.elementFromPoint(
        fullscreenBounds.left + fullscreenBounds.width / 2,
        fullscreenBounds.top + fullscreenBounds.height / 2,
      )
      expect(fullscreenHit !== null && container.contains(fullscreenHit) && fullscreenTooltip.contains(fullscreenHit)).toBe(true)

      // The tooltip returns to body once fullscreen ends.
      await document.exitFullscreen()
      await expect.poll(() => document.fullscreenElement).toBeNull()
      await page.elementLocator(label).hover()
      await expect.poll(() => element('.popover').textContent).toContain(name)
      expect(container.contains(element('.popover'))).toBe(false)
    } finally {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      wrapper.unmount()
    }
  })

  it('uses default truncation and tooltips for plain dimensions', async () => {
    const name = 'Long gateway service name '.repeat(10)
    mountRenderer({
      data: {
        ...result,
        data: [{ timestamp: '', event: { gateway_service: 'service-1', request_count: 1 } }],
        meta: { ...result.meta, display: { gateway_service: { 'service-1': { name } } } },
      },
      chartOptions: {},
    })
    await expect.poll(() => cell(0, 'gateway_service').textContent).toContain(name)
    await expectOverflowTooltip(element('[row-index="0"] [col-id="gateway_service"] .table-data-grid-cell-content'), name)
  })

  it('renders zero-dimension aggregate metrics without an extra name column', async () => {
    mountRenderer({
      data: {
        data: [{ timestamp: '', event: { request_count: 1200, error_rate: 0.001 } }],
        meta: { ...result.meta, display: {}, metric_names: ['request_count', 'error_rate'], metric_units: { request_count: 'count', error_rate: '%' } },
      },
      chartOptions: { column_options: { request_count: { label: 'Requests' }, error_rate: { label: 'Errors' } } },
    })
    await expect.poll(headers).toEqual(['Requests', 'Errors'])
    await expect.poll(() => cell(0, 'request_count').textContent).toContain('1.2K')
    expect(cell(0, 'error_rate').textContent).toContain('< 0.01 %')
  })

  it('keeps three dimensions and multiple metrics aligned with labels, opt-in provider icons, and thresholds', async () => {
    mountRenderer({
      data: {
        data: [
          { timestamp: '', event: { ai_provider: 'OpenAI', ai_model: 'azure', status_code: '200', request_count: 10, error_rate: 20 } },
          { timestamp: '', event: { ai_provider: 'provider-2', ai_model: 'azure', status_code: '200', request_count: 10, error_rate: 10 } },
        ],
        meta: {
          ...result.meta,
          display: {
            ai_provider: { OpenAI: { name: 'OpenAI' }, 'provider-2': { name: 'Anthropic' } },
            ai_model: { azure: { name: 'GPT' } },
            status_code: { 200: { name: '200' } },
          },
          metric_names: ['request_count', 'error_rate'],
          metric_units: { request_count: 'count', error_rate: '%' },
        },
      },
      chartOptions: { column_options: {
        ai_provider: { label: 'Provider', icon_set: 'ai_provider' }, ai_model: { label: 'Model' }, status_code: { label: 'Status' },
        request_count: { label: 'Requests', value: 'relative', bar: 'relative' },
        error_rate: { label: 'Errors', bar: 'max', thresholds: [{ type: 'error', value: 15 }] },
      } },
    })
    await expect.poll(headers).toEqual(['Provider', 'Model', 'Status', 'Requests', 'Errors'])
    await expect.poll(() => cell(0, 'ai_provider').textContent).toContain('OpenAI')
    expect(cell(1, 'ai_provider').textContent).toContain('Anthropic')
    // Icons match the raw provider id only, and only for columns with icon_set.
    await expect.element(page.elementLocator(element('[row-index="0"] [col-id="ai_provider"] [data-testid="table-data-grid-cell-icon"]'))).toBeVisible()
    expect(cell(1, 'ai_provider').querySelector('[data-testid="table-data-grid-cell-icon"]')).toBeNull()
    expect(document.querySelector('[col-id="ai_model"] [data-testid="table-data-grid-cell-icon"]')).toBeNull()
    expect(cell(0, 'ai_model').textContent).toContain('GPT')
    expect(cell(0, 'status_code').textContent).toContain('200')
    expect(cell(0, 'request_count').textContent).toContain('10')
    expect(cell(0, 'request_count').textContent).toContain('(50 %)')
    expect(cell(0, 'error_rate').textContent).toContain('20 %')
    expect(element('[row-index="0"] [col-id="error_rate"] [data-testid="table-data-grid-cell-bar"]').dataset.threshold).toBe('error')
    expect(element('[row-index="0"] [col-id="error_rate"] [data-testid="table-data-grid-cell-bar-fill"]').style.width).toBe('100%')
  })

  it('updates labels and metric presentation without issuing another query', async () => {
    const { wrapper, queryFn } = mountRenderer()
    await expect.poll(() => cell(0, 'gateway_service').textContent).toContain('Service 1')
    await wrapper.setProps({ chartOptions: { type: 'top_n', column_options: { request_count: { label: 'New label', bar: 'relative' } } } })
    await expect.poll(headers).toContain('New label')
    await expect.poll(() => cell(0, 'request_count').textContent).not.toContain('%')
    expect(cell(0, 'request_count').textContent).toContain('40')
    expect(queryFn).toHaveBeenCalledOnce()
  })

  it('preserves empty and deleted entity presentation without navigable links', async () => {
    mountRenderer({ data: {
      data: [
        { timestamp: '', event: { gateway_service: 'empty', request_count: null } },
        { timestamp: '', event: { gateway_service: 'deleted-service', request_count: 2 } },
      ],
      meta: { ...result.meta, display: { gateway_service: { empty: { name: 'empty' }, 'deleted-service': { name: 'Old service', deleted: true } } } },
    } })
    await expect.poll(() => cell(0, 'gateway_service').querySelector('i')?.textContent).toBe('empty')
    expect(cell(0, 'gateway_service').querySelector('a')).toBeNull()
    expect(cell(0, 'request_count').textContent).toContain('–')
    await expect.poll(() => cell(1, 'gateway_service').textContent).toContain('delet (deleted)')
    expect(cell(1, 'gateway_service').querySelector('a')).toBeNull()
  })
})
