import { describe, it, expect } from 'vitest'
import { buildFilename, calculatePageSlices, getRowBoundaries, slugify } from './useExportPdf'

const stubRect = (el: HTMLElement, top: number, height: number) => {
  el.getBoundingClientRect = () => ({
    top,
    bottom: top + height,
    height,
    left: 0,
    right: 0,
    width: 0,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect)
}

describe('slugify', () => {
  it('lowercases and replaces non-alphanumerics with hyphens', () => {
    expect(slugify('API Usage Dashboard')).toBe('api-usage-dashboard')
    expect(slugify('  My  (test) dashboard!  ')).toBe('my-test-dashboard')
  })

  it('collapses consecutive separators and trims leading/trailing hyphens', () => {
    expect(slugify('--a__b--')).toBe('a-b')
  })
})

describe('buildFilename', () => {
  const now = new Date(2026, 6, 8)

  it('appends the date to an explicit filename', () => {
    expect(buildFilename('my-report', 'Ignored Title', now)).toBe('my-report-2026-07-08.pdf')
  })

  it('slugifies the title when no filename is given', () => {
    expect(buildFilename(undefined, 'API Usage Dashboard', now)).toBe('api-usage-dashboard-2026-07-08.pdf')
  })

  it('falls back to dashboard-export when neither is given', () => {
    expect(buildFilename(undefined, undefined, now)).toBe('dashboard-export-2026-07-08.pdf')
  })

  it('prepends zeros to single-digit months and days', () => {
    expect(buildFilename('x', undefined, new Date(2026, 0, 5))).toBe('x-2026-01-05.pdf')
  })
})

describe('calculatePageSlices', () => {
  it('slices at fixed page height intervals when there are no row boundaries', () => {
    expect(calculatePageSlices([], 2500, 1000, 2)).toEqual([
      { startY: 0, height: 1000 },
      { startY: 1000, height: 1000 },
      { startY: 2000, height: 500 },
    ])
  })

  it('returns a single page when all rows fit', () => {
    const rows = [
      { top: 0, bottom: 200 },
      { top: 220, bottom: 420 },
    ]

    expect(calculatePageSlices(rows, 840, 1000, 2)).toEqual([
      { startY: 0, height: 840 },
    ])
  })

  it('breaks pages at row tops so no row is split', () => {
    const rows = [
      { top: 0, bottom: 200 },
      { top: 220, bottom: 420 },
      { top: 440, bottom: 640 },
    ]

    // scale 1x, page height 400, rows 2 and 3 each overflow the running page
    expect(calculatePageSlices(rows, 640, 400, 1)).toEqual([
      { startY: 0, height: 220 },
      { startY: 220, height: 220 },
      { startY: 440, height: 200 },
    ])
  })

  it('applies the capture scale to row boundaries', () => {
    const rows = [
      { top: 0, bottom: 200 },
      { top: 220, bottom: 420 },
    ]

    // scales 2x, row bottoms are 400 and 840 canvas px
    expect(calculatePageSlices(rows, 840, 800, 2)).toEqual([
      { startY: 0, height: 440 },
      { startY: 440, height: 400 },
    ])
  })

  it('does not split or emit an empty page for a single row taller than a page', () => {
    const rows = [{ top: 0, bottom: 1500 }]

    expect(calculatePageSlices(rows, 1500, 1000, 1)).toEqual([
      { startY: 0, height: 1500 },
    ])
  })

  it('includes trailing canvas content below the last row on the final page', () => {
    const rows = [{ top: 0, bottom: 200 }]

    expect(calculatePageSlices(rows, 300, 1000, 1)).toEqual([
      { startY: 0, height: 300 },
    ])
  })
})

describe('getRowBoundaries', () => {
  const buildGrid = (
    gridClass: string,
    cellClass: string,
    cells: Array<{ top: number, height: number, extraClass?: string }>,
    containerTop = 0,
  ): HTMLElement => {
    const container = document.createElement('div')
    stubRect(container, containerTop, 1000)

    const grid = document.createElement('div')
    grid.className = gridClass
    container.appendChild(grid)

    cells.forEach(({ top, height, extraClass }) => {
      const cell = document.createElement('div')
      cell.className = extraClass ? `${cellClass} ${extraClass}` : cellClass
      stubRect(cell, top, height)
      grid.appendChild(cell)
    })

    return container
  }

  it('returns empty when there is no grid layout', () => {
    expect(getRowBoundaries(document.createElement('div'))).toEqual([])
  })

  it('returns empty when the grid has no cells', () => {
    expect(getRowBoundaries(buildGrid('kong-ui-public-grid-layout', 'grid-cell', []))).toEqual([])
  })

  it('groups view mode grid cells into sorted rows, keeping the tallest bottom per row', () => {
    const container = buildGrid('kong-ui-public-grid-layout', 'grid-cell', [
      { top: 220, height: 200 },
      { top: 0, height: 200 },
      { top: 0, height: 150 }, // shorter cell in the first row
    ])

    expect(getRowBoundaries(container)).toEqual([
      { top: 0, bottom: 200 },
      { top: 220, bottom: 420 },
    ])
  })

  it('ignores empty cells', () => {
    const container = buildGrid('kong-ui-public-grid-layout', 'grid-cell', [
      { top: 0, height: 200 },
      { top: 220, height: 200, extraClass: 'empty-cell' },
    ])

    expect(getRowBoundaries(container)).toEqual([
      { top: 0, bottom: 200 },
    ])
  })

  it('supports edit mode gridstack markup', () => {
    const container = buildGrid('grid-stack', 'grid-stack-item', [
      { top: 0, height: 200 },
      { top: 220, height: 200 },
    ])

    expect(getRowBoundaries(container)).toEqual([
      { top: 0, bottom: 200 },
      { top: 220, bottom: 420 },
    ])
  })

  it('measures relative to the container, not the viewport', () => {
    const container = buildGrid('kong-ui-public-grid-layout', 'grid-cell', [
      { top: 350, height: 200 },
    ], 300) // container offset to viewport top 300

    expect(getRowBoundaries(container)).toEqual([
      { top: 50, bottom: 250 },
    ])
  })

  it('groups cells whose tops differ only by subpixel amounts into one row', () => {
    const container = buildGrid('kong-ui-public-grid-layout', 'grid-cell', [
      { top: 100, height: 200 },
      { top: 100.4, height: 200 },
    ])

    expect(getRowBoundaries(container)).toEqual([
      { top: 100, bottom: 300 },
    ])
  })
})
