import type {
  TableDataGridCellSlotProps,
  TableDataGridFetcher,
  TableDataGridHeader,
  TableDataGridProps,
  TableDataGridSort,
  TableDataGridStatePayload,
  TableDataGridConfig,
} from '../types'
import type { GridApi } from 'ag-grid-community'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { mount } from '@vue/test-utils'
import type { Component } from 'vue'
import { Comment, h, nextTick } from 'vue'
import TableDataGrid from './TableDataGrid.vue'

type TestRow = {
  id: string
  name: string
  status: string
  value?: number | boolean | null
}

type TestTableDataGridSlots = Record<string, (props: TableDataGridCellSlotProps<TestRow>) => unknown>

type MountTableOptions = TableDataGridProps<TestRow> & {
  onGridReady?: (api: GridApi<TestRow>) => void
  onSort?: (sort: TableDataGridSort) => void
  onState?: (payload: TableDataGridStatePayload) => void
  onUpdateTableConfig?: (config: TableDataGridConfig) => void
  slots?: TestTableDataGridSlots
}

const headers: Array<TableDataGridHeader<TestRow>> = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
]

const rows: TestRow[] = [
  { id: 'row-1', name: 'Gateway service', status: 'Active' },
  { id: 'row-2', name: 'Portal app', status: 'Inactive' },
]

const createRows = (startIndex: number, count: number): TestRow[] => (
  Array.from({ length: count }, (_, index) => {
    const rowIndex = startIndex + index

    return {
      id: `row-${rowIndex}`,
      name: `Service ${rowIndex}`,
      status: rowIndex % 2 === 0 ? 'Inactive' : 'Active',
    }
  })
)

const TestProviderIcon: Component = { name: 'TestProviderIcon', render: () => h('svg') }

const mountedContainers: HTMLElement[] = []

afterEach(() => {
  for (const container of mountedContainers.splice(0)) {
    container.remove()
  }
})

const mountTestTableDataGrid = ({
  onGridReady,
  onSort,
  onState,
  onUpdateTableConfig,
  slots,
  ...gridProps
}: MountTableOptions) => {
  const container = document.createElement('div')
  container.dataset.testid = 'table-data-grid-test-parent'
  Object.assign(container.style, {
    height: '520px',
    width: '640px',
  })
  document.body.appendChild(container)
  mountedContainers.push(container)

  const commonProps = {
    'onGrid:ready': onGridReady,
    'onUpdate:tableConfig': onUpdateTableConfig,
    onSort,
    onState,
  }

  const wrapper = gridProps.mode === 'unpaginated'
    ? mount(TableDataGrid<TestRow>, {
      attachTo: container,
      props: { ...commonProps, ...gridProps },
      slots,
    })
    : mount(TableDataGrid<TestRow>, {
      attachTo: container,
      props: { ...commonProps, ...gridProps },
      slots,
    })

  const appRoot = container.firstElementChild
  if (appRoot instanceof HTMLElement) {
    appRoot.style.height = '100%'
  }

  return wrapper
}

const waitForCallCount = async (getCallCount: () => number, count: number) => {
  await expect.poll(getCallCount).toBe(count)
}

const element = <ElementType extends HTMLElement = HTMLElement>(selector: string): ElementType => {
  const found = document.querySelector<ElementType>(selector)
  if (!found) {
    throw new Error(`Missing element: ${selector}`)
  }
  return found
}

const cell = (index: number, key: string) => element(`[row-index="${index}"] [col-id="${key}"]`)

const expectOverflowTooltip = async (value: string) => {
  const contentSelector = '.table-data-grid-cell-content'
  const findContent = () => Array.from(document.querySelectorAll<HTMLElement>(contentSelector))
    .find(element => element.textContent?.includes(value))

  await expect.poll(() => {
    const content = findContent()

    return content ? content.scrollWidth > content.clientWidth : false
  }).toBe(true)

  const content = findContent()
  if (!content) {
    throw new Error(`Could not find overflowing cell content: ${value}`)
  }

  await page.elementLocator(content).hover()
  await expect.poll(() => document.querySelector('.popover')?.textContent ?? '').toContain(value)
  await expect.element(page.elementLocator(element('.popover'))).toBeVisible()
}

describe('<TableDataGrid /> in Browser Mode', () => {
  it('replaces the infinite fetcher without a refresh key and ignores its pending result', async () => {
    let resolvePending!: (result: Awaited<ReturnType<TableDataGridFetcher<TestRow>>>) => void
    const fetcher = vi.fn<TableDataGridFetcher<TestRow>>().mockImplementation(() => new Promise((resolve) => {
      resolvePending = resolve
    }))
    const replacementFetcher = vi.fn<TableDataGridFetcher<TestRow>>().mockResolvedValue({
      data: [rows[1]],
      hasMore: false,
    })
    const table = mountTestTableDataGrid({ fetcher, headers })

    await waitForCallCount(() => fetcher.mock.calls.length, 1)
    await table.setProps({ fetcher: replacementFetcher })
    await expect.element(page.getByText('Portal app', { exact: true })).toBeVisible()
    expect(replacementFetcher).toHaveBeenCalledTimes(1)
    expect(replacementFetcher).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'infinite',
      pageSize: 25,
      cursor: undefined,
    }))

    resolvePending({ data: [rows[0]], hasMore: false })
    await nextTick()
    await expect.element(page.getByText('Portal app', { exact: true })).toBeVisible()
    expect(cell(0, 'name').textContent).not.toContain('Gateway service')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('renders complete unpaginated rows without state events', async () => {
    const completeResultRows = createRows(1, 30).map((row, index) => ({
      ...row,
      value: index + 1,
    }))
    let gridApi: GridApi<TestRow> | undefined
    const onState = vi.fn<(payload: TableDataGridStatePayload) => void>()

    mountTestTableDataGrid({
      headers: [
        ...headers,
        {
          dataType: 'number',
          key: 'value',
          label: 'Value',
          showPercentage: true,
        },
      ],
      mode: 'unpaginated',
      onGridReady: (api) => {
        gridApi = api
      },
      onState,
      rows: completeResultRows,
    })

    await expect.element(page.getByText('Service 1', { exact: true })).toBeVisible()
    await expect.poll(() => cell(0, 'value').textContent).toContain('(0.22 %)')
    gridApi?.ensureIndexVisible(29, 'bottom')
    await expect.element(page.getByText('Service 30', { exact: true })).toBeVisible()
    await expect.poll(() => cell(29, 'value').textContent).toContain('(6.45 %)')
    expect(onState).not.toHaveBeenCalled()
  })

  it('sorts complete rows client-side', async () => {
    const onSort = vi.fn<(sort: TableDataGridSort) => void>()
    const onUpdateTableConfig = vi.fn<(config: TableDataGridConfig) => void>()

    const table = mountTestTableDataGrid({
      headers: [{ key: 'name', label: 'Name', sortable: true }],
      mode: 'unpaginated',
      onSort,
      onUpdateTableConfig,
      rows: [rows[1], rows[0]],
    })

    await expect.poll(() => cell(0, 'name').textContent).toContain('Portal app')
    const gridRoot = element('.ag-root-wrapper')

    await page.elementLocator(element('.ag-header-cell[col-id="name"]')).click()

    await expect.poll(() => cell(0, 'name').textContent).toContain('Gateway service')
    expect(element('.ag-root-wrapper')).toBe(gridRoot)
    expect(onSort).toHaveBeenCalledWith({ sortColumnKey: 'name', sortColumnOrder: 'asc' })
    expect(onUpdateTableConfig).toHaveBeenCalledWith(expect.objectContaining({
      sortColumnKey: 'name',
      sortColumnOrder: 'asc',
    }))

    await page.elementLocator(element('.ag-header-cell[col-id="name"]')).click()
    await expect.poll(() => cell(0, 'name').textContent).toContain('Portal app')

    await table.setProps({ tableConfig: { sortColumnKey: 'name', sortColumnOrder: 'asc' } })
    await expect.poll(() => cell(0, 'name').textContent).toContain('Gateway service')
    expect(element('.ag-root-wrapper')).toBe(gridRoot)
  })

  it('renders unpaginated percentages, preserved bar scales, thresholds, and configured icons', async () => {
    const presentationRows = [
      { ...rows[0], name: 'OpenAI', value: 25 },
      { ...rows[1], name: 'Anthropic', value: 75 },
    ]
    mountTestTableDataGrid({
      headers: [
        { key: 'name', label: 'Provider', icons: [{ pattern: /^openai$/i, icon: TestProviderIcon }] },
        { key: 'status', label: 'Status' },
        {
          bar: 'absolute',
          dataType: 'number',
          key: 'value',
          label: 'Requests',
          showPercentage: true,
          thresholds: [{ type: 'warning', value: 50 }],
        },
      ],
      mode: 'unpaginated',
      rows: presentationRows,
    })

    await expect.poll(() => cell(0, 'value').textContent).toContain('25')
    await expect.poll(() => cell(0, 'value').textContent).toContain('(25 %)')
    await expect.poll(() => Number.parseFloat(document.querySelector<HTMLElement>(
      '[row-index="0"] [col-id="value"] [data-testid="table-data-grid-cell-bar-fill"]',
    )?.style.width ?? '')).toBeCloseTo(33.333, 3)
    await expect.poll(() => cell(1, 'value').textContent).toContain('75')
    await expect.poll(() => cell(1, 'value').textContent).toContain('(75 %)')
    await expect.poll(() => Number.parseFloat(document.querySelector<HTMLElement>(
      '[row-index="1"] [col-id="value"] [data-testid="table-data-grid-cell-bar-fill"]',
    )?.style.width ?? '')).toBe(100)
    expect(element('[row-index="1"] [col-id="value"] [data-testid="table-data-grid-cell-bar"]').dataset.threshold).toBe('warning')
    await expect.element(page.elementLocator(element('[row-index="0"] [col-id="name"] [data-testid="table-data-grid-cell-icon"]'))).toBeVisible()
    expect(cell(1, 'name').querySelector('[data-testid="table-data-grid-cell-icon"]')).toBeNull()
    expect(document.querySelector('[col-id="status"] [data-testid="table-data-grid-cell-icon"]')).toBeNull()
  })

  it('shows cell overflow tooltips inside a native fullscreen ancestor', async () => {
    const longName = 'Long gateway service name '.repeat(10)
    mountTestTableDataGrid({ headers, mode: 'unpaginated', rows: [{ ...rows[0], name: longName }] })
    const container = element('[data-testid="table-data-grid-test-parent"]')
    const fullscreenButton = document.createElement('button')
    fullscreenButton.textContent = 'Enter fullscreen'
    fullscreenButton.addEventListener('click', () => {
      void container.requestFullscreen()
    })
    container.append(fullscreenButton)

    try {
      await expect.poll(() => cell(0, 'name').textContent).toContain('Long gateway')
      // Playwright's click supplies the user activation required by the native fullscreen API.
      await page.elementLocator(fullscreenButton).click()
      await expect.poll(() => document.fullscreenElement).toBe(container)
      await expectOverflowTooltip(longName)
      expect(container.contains(element('.popover'))).toBe(true)
    } finally {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    }
  })

  it('keeps generic adornments around custom cell slot content', async () => {
    mountTestTableDataGrid({
      headers: [{
        bar: 'relative',
        dataType: 'number',
        key: 'value',
        label: 'Requests',
        showPercentage: true,
      }],
      mode: 'unpaginated',
      rows: [{ ...rows[0], value: 50 }, { ...rows[1], value: 50 }],
      slots: {
        value: ({ rowValue }) => h('span', { 'data-testid': 'custom-value' }, `value:${rowValue}`),
      },
    })

    await expect.poll(() => document.querySelector('[data-testid="custom-value"]')?.textContent ?? '').toContain('value:50')
    await expect.poll(() => document.querySelector('[data-testid="table-data-grid-cell-relative"]')?.textContent ?? '').toContain('(50 %)')
    await expect.element(page.elementLocator(element('[data-testid="table-data-grid-cell-bar"]'))).toBeVisible()
  })

  it('ignores numeric presentation for infinite data', async () => {
    const fetcher = vi.fn<TableDataGridFetcher<TestRow>>().mockResolvedValue({
      data: [{ ...rows[0], value: 50 }],
      hasMore: false,
    })

    mountTestTableDataGrid({
      fetcher,
      headers: [{ key: 'value', label: 'Value', dataType: 'number', showPercentage: true, bar: 'relative' }],
    })

    await expect.poll(() => cell(0, 'value').textContent).toContain('50')
    expect(document.querySelector('[data-testid="table-data-grid-cell-relative"]')).toBeNull()
    expect(document.querySelector('[data-testid="table-data-grid-cell-bar"]')).toBeNull()
  })

  it('skips invalid numeric values while preserving missing-value bar tracks', async () => {
    mountTestTableDataGrid({
      mode: 'unpaginated',
      rows: [
        { ...rows[0], value: true },
        { ...rows[1], value: null },
        { id: 'valid', name: 'Valid', status: 'Active', value: 50 },
      ],
      headers: [{ key: 'value', label: 'Value', dataType: 'number', showPercentage: true, bar: 'relative' }],
    })

    await expect.poll(() => cell(0, 'value').textContent).toContain('true')
    expect(document.querySelector('[row-index="0"] [col-id="value"] [data-testid="table-data-grid-cell-bar"]')).toBeNull()
    await expect.poll(() => document.querySelector<HTMLElement>(
      '[row-index="1"] [col-id="value"] [data-testid="table-data-grid-cell-bar-fill"]',
    )?.style.width ?? '').toBe('0%')
    await expect.poll(() => cell(2, 'value').textContent).toContain('(100 %)')
  })

  it('recalculates percentages when rows change with unchanged headers', async () => {
    const tableDataGrid = mountTestTableDataGrid({
      headers: [...headers, { key: 'value', label: 'Value', dataType: 'number', showPercentage: true }],
      mode: 'unpaginated',
      rows: [{ ...rows[0], value: 50 }, { ...rows[1], value: 50 }],
    })

    await expect.poll(() => cell(0, 'value').textContent).toContain('(50 %)')
    await tableDataGrid.setProps({
      rows: [
        { ...rows[0], value: 50 },
        { ...rows[1], name: 'Replacement service', value: 150 },
      ],
    })
    await expect.poll(() => cell(1, 'name').textContent).toContain('Replacement service')
    await expect.poll(() => cell(0, 'value').textContent).toContain('(25 %)')
    await expect.poll(() => cell(1, 'value').textContent).toContain('(75 %)')
  })

  it('uses default cell presentation when a host slot renders no content', async () => {
    const longName = 'A gateway service name that is much wider than its flexible table column'
    const fetcher = vi.fn<TableDataGridFetcher<TestRow>>().mockResolvedValue({
      data: [{ ...rows[0], name: longName }],
    })

    mountTestTableDataGrid({
      fetcher,
      headers,
      slots: {
        name: () => h(Comment),
      },
    })

    await nextTick()
    await expectOverflowTooltip(longName)
  })

  it('fits complete results to their content and resizes when rows change', async () => {
    const table = mountTestTableDataGrid({
      headers: [{ key: 'name', label: 'Name', minWidth: 800 }],
      mode: 'unpaginated',
      rows,
    })
    const root = element('[data-testid="table-data-grid"]')
    root.style.height = ''
    await expect.element(page.getByText('Gateway service', { exact: true })).toBeVisible()
    expect(root.getBoundingClientRect().height).toBe(520)

    await table.setProps({ tableConfig: { fitToContent: true } })
    await expect.poll(() => root.getBoundingClientRect().height).toBeLessThan(200)
    const initialHeight = root.getBoundingClientRect().height
    expect(initialHeight).toBeGreaterThan(0)
    const horizontalViewport = element('.ag-body-horizontal-scroll-viewport')
    await expect.poll(() => horizontalViewport.scrollWidth).toBeGreaterThan(horizontalViewport.clientWidth)

    await table.setProps({ rows: createRows(1, 8) })
    await expect.element(page.getByText('Service 8', { exact: true })).toBeVisible()
    await expect.poll(() => root.getBoundingClientRect().height).toBeGreaterThan(initialHeight)
  })

  it('keeps infinite grids at the host height when fitToContent is requested', async () => {
    const fetcher = vi.fn<TableDataGridFetcher<TestRow>>().mockResolvedValue({ data: rows, hasMore: false })
    mountTestTableDataGrid({ fetcher, headers, tableConfig: { fitToContent: true } })
    const root = element('[data-testid="table-data-grid"]')
    root.style.height = ''
    await expect.element(page.getByText('Gateway service', { exact: true })).toBeVisible()
    expect(root.getBoundingClientRect().height).toBe(520)
    expect(root.classList.contains('fit-to-content')).toBe(false)
  })

})
