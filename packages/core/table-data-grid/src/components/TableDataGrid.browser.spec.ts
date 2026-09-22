import type {
  TableDataGridCellSlotProps,
  TableDataGridFetcher,
  TableDataGridHeader,
  TableDataGridProps,
  TableDataGridStatePayload,
  TableDataGridUnpaginatedFetcher,
} from '../types'
import type { GridApi } from 'ag-grid-community'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { mount } from '@vue/test-utils'
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
  onState?: (payload: TableDataGridStatePayload) => void
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

const mountedContainers: HTMLElement[] = []

afterEach(() => {
  for (const container of mountedContainers.splice(0)) {
    container.remove()
  }
})

const mountTestTableDataGrid = ({
  onGridReady,
  onState,
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

  it('renders complete unpaginated results and state transitions without refetching', async () => {
    const completeResultRows = createRows(1, 30).map((row, index) => ({
      ...row,
      value: index + 1,
    }))
    const fetcher = vi.fn<TableDataGridUnpaginatedFetcher<TestRow>>().mockResolvedValue({ data: completeResultRows })
    let gridApi: GridApi<TestRow> | undefined
    const onState = vi.fn<(payload: TableDataGridStatePayload) => void>()

    mountTestTableDataGrid({
      fetcher,
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
    })

    await waitForCallCount(() => fetcher.mock.calls.length, 1)
    expect(fetcher).toHaveBeenCalledWith({ mode: 'unpaginated' })
    await expect.element(page.getByText('Service 1', { exact: true })).toBeVisible()
    await expect.poll(() => cell(0, 'value').textContent).toContain('(0.22 %)')
    await expect.poll(() => onState.mock.calls.some(([payload]) => payload.state === 'loading' && !payload.hasData)).toBe(true)
    gridApi?.ensureIndexVisible(29, 'bottom')
    await expect.element(page.getByText('Service 30', { exact: true })).toBeVisible()
    await expect.poll(() => cell(29, 'value').textContent).toContain('(6.45 %)')
    await expect.poll(() => onState.mock.calls.some(([payload]) => payload.state === 'success' && payload.hasData)).toBe(true)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('renders unpaginated percentages, preserved bar scales, thresholds, and provider icons', async () => {
    const presentationRows = [
      { ...rows[0], name: 'OpenAI', value: 25 },
      { ...rows[1], name: 'Anthropic', value: 75 },
    ]
    const fetcher = vi.fn<TableDataGridUnpaginatedFetcher<TestRow>>().mockResolvedValue({
      data: presentationRows,
    })

    mountTestTableDataGrid({
      fetcher,
      headers: [
        { key: 'name', label: 'Provider' },
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
  })

  it('keeps generic adornments around custom cell slot content', async () => {
    const fetcher = vi.fn<TableDataGridUnpaginatedFetcher<TestRow>>().mockResolvedValue({
      data: [{ ...rows[0], value: 50 }, { ...rows[1], value: 50 }],
    })

    mountTestTableDataGrid({
      fetcher,
      headers: [{
        bar: 'relative',
        dataType: 'number',
        key: 'value',
        label: 'Requests',
        showPercentage: true,
      }],
      mode: 'unpaginated',
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
    const fetcher = vi.fn<TableDataGridUnpaginatedFetcher<TestRow>>().mockResolvedValue({
      data: [
        { ...rows[0], value: true },
        { ...rows[1], value: null },
        { id: 'valid', name: 'Valid', status: 'Active', value: 50 },
      ],
    })

    mountTestTableDataGrid({
      mode: 'unpaginated',
      fetcher,
      headers: [{ key: 'value', label: 'Value', dataType: 'number', showPercentage: true, bar: 'relative' }],
    })

    await expect.poll(() => cell(0, 'value').textContent).toContain('true')
    expect(document.querySelector('[row-index="0"] [col-id="value"] [data-testid="table-data-grid-cell-bar"]')).toBeNull()
    await expect.poll(() => document.querySelector<HTMLElement>(
      '[row-index="1"] [col-id="value"] [data-testid="table-data-grid-cell-bar-fill"]',
    )?.style.width ?? '').toBe('0%')
    await expect.poll(() => cell(2, 'value').textContent).toContain('(100 %)')
  })

  it('coalesces fetcher/context changes and recalculates percentages with unchanged headers', async () => {
    const initialFetcher = vi.fn<TableDataGridUnpaginatedFetcher<TestRow>>().mockResolvedValue({
      data: [{ ...rows[0], value: 50 }, { ...rows[1], value: 50 }],
    })
    const replacementFetcher = vi.fn<TableDataGridUnpaginatedFetcher<TestRow>>().mockResolvedValue({
      data: [
        { ...rows[0], value: 50 },
        { ...rows[1], name: 'Replacement service', value: 150 },
      ],
    })
    const tableDataGrid = mountTestTableDataGrid({
      fetcher: initialFetcher,
      headers: [...headers, { key: 'value', label: 'Value', dataType: 'number', showPercentage: true }],
      mode: 'unpaginated',
      refreshKey: 0,
    })

    await expect.poll(() => cell(0, 'value').textContent).toContain('(50 %)')
    await tableDataGrid.setProps({
      fetcher: replacementFetcher,
      refreshKey: 1,
    })
    await expect.poll(() => cell(1, 'name').textContent).toContain('Replacement service')
    await expect.poll(() => cell(0, 'value').textContent).toContain('(25 %)')
    await expect.poll(() => cell(1, 'value').textContent).toContain('(75 %)')
    await waitForCallCount(() => replacementFetcher.mock.calls.length, 1)
  })

  it('uses default cell presentation when a host slot renders no content', async () => {
    const longName = 'A gateway service name that is much wider than its flexible table column'
    const fetcher = vi.fn<TableDataGridFetcher<TestRow>>().mockResolvedValue({
      data: [{ ...rows[0], name: longName }],
      total: 1,
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
  it('fits complete results to their content and updates sizing without refetching', async () => {
    const fetcher = vi.fn<TableDataGridUnpaginatedFetcher<TestRow>>().mockResolvedValue({ data: rows })
    const table = mountTestTableDataGrid({
      fetcher,
      headers: [{ key: 'name', label: 'Name', minWidth: 800 }],
      mode: 'unpaginated',
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
    expect(fetcher).toHaveBeenCalledTimes(1)

    const replacementFetcher = vi.fn<TableDataGridUnpaginatedFetcher<TestRow>>().mockResolvedValue({
      data: createRows(1, 8),
    })
    await table.setProps({ fetcher: replacementFetcher })
    await expect.element(page.getByText('Service 8', { exact: true })).toBeVisible()
    await expect.poll(() => root.getBoundingClientRect().height).toBeGreaterThan(initialHeight)
    expect(replacementFetcher).toHaveBeenCalledTimes(1)
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
