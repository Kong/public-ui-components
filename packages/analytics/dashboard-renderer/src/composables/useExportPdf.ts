import type { Ref } from 'vue'
import type { PdfExportOptions, PdfExportState } from '../types/renderer-types'

import { readonly, ref } from 'vue'

interface RowBoundary {
  top: number
  bottom: number
}

interface PageSlice {
  startY: number
  height: number
}

function getRowBoundaries(container: HTMLElement): RowBoundary[] {
  const gridLayout = container.querySelector('.kong-ui-public-grid-layout') as HTMLElement | null

  if (!gridLayout) {
    return []
  }

  const cells = gridLayout.querySelectorAll<HTMLElement>(':scope > .grid-cell:not(.empty-cell)')

  if (!cells.length) {
    return []
  }

  const gridOffsetTop = gridLayout.offsetTop

  const rowMap = new Map<number, number>()
  cells.forEach(cell => {
    const top = cell.offsetTop + gridOffsetTop
    const bottom = top + cell.offsetHeight
    const existing = rowMap.get(top)

    // Keep the tallest cell's bottom for each row
    rowMap.set(top, existing !== undefined ? Math.max(existing, bottom) : bottom)
  })

  return [...rowMap.entries()]
    .map(([top, bottom]) => ({ top, bottom }))
    .sort((a, b) => a.top - b.top)
}

// Groups rows into pages without splitting any row across a page break
function calculatePageSlices(
  rows: RowBoundary[],
  canvasHeight: number,
  pageHeightPx: number,
  scale: number,
): PageSlice[] {
  if (!rows.length) {
    const pages: PageSlice[] = []
    let y = 0

    while (y < canvasHeight) {
      const height = Math.min(pageHeightPx, canvasHeight - y)
      pages.push({ startY: y, height })
      y += height
    }

    return pages
  }

  const pages: PageSlice[] = []
  let pageStartY = 0

  for (let i = 0; i < rows.length; i++) {
    const rowTopPx = rows[i].top * scale
    const rowBottomPx = rows[i].bottom * scale

    // Would this row exceed the current page?
    if (rowBottomPx - pageStartY > pageHeightPx && pageStartY < rowTopPx) {
      // Close the current page at the top of this row
      pages.push({ startY: pageStartY, height: rowTopPx - pageStartY })
      pageStartY = rowTopPx
    }
  }

  if (pageStartY < canvasHeight) {
    pages.push({ startY: pageStartY, height: canvasHeight - pageStartY })
  }

  return pages
}

function useExportPdf(layoutContainerRef: Ref<HTMLElement | undefined>) {
  const exportState = ref<PdfExportState>({ status: 'idle' })

  async function exportPdf(options: PdfExportOptions = {}) {
    const {
      filename = 'dashboard-export',
      orientation = 'landscape',
      margin = 10,
      scale = 2,
      exclude = ['.tooltip', '.popover', '.dropdown-popover'],
      onBeforeCapture,
      onAfterCapture,
    } = options

    const element = layoutContainerRef.value

    if (!element) {
      exportState.value = { status: 'error', error: new Error('Dashboard layout container not found.') }

      return
    }

    try {
      exportState.value = { status: 'preparing' }
      await onBeforeCapture?.()

      const rowBoundaries = getRowBoundaries(element)

      const [{ snapdom }, { jsPDF }] = await Promise.all([
        import('@zumer/snapdom'),
        import('jspdf'),
      ])

      exportState.value = { status: 'capturing' }
      const canvas = await snapdom.toCanvas(element, { scale, exclude })

      exportState.value = { status: 'generating' }

      const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const contentWidth = pageWidth - margin * 2
      const contentHeight = pageHeight - margin * 2

      const pxPerMm = canvas.width / contentWidth
      const pageHeightPx = contentHeight * pxPerMm

      const pages = calculatePageSlices(rowBoundaries, canvas.height, pageHeightPx, scale)

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) {
          pdf.addPage()
        }

        const { startY, height } = pages[i]

        const sliceCanvas = document.createElement('canvas')

        sliceCanvas.width = canvas.width
        sliceCanvas.height = height

        const ctx = sliceCanvas.getContext('2d')!

        ctx.drawImage(
          canvas,
          0, startY,
          canvas.width, height,
          0, 0,
          canvas.width, height,
        )

        pdf.addImage(
          sliceCanvas.toDataURL('image/png'),
          'PNG',
          margin,
          margin,
          contentWidth,
          height / pxPerMm,
        )
      }

      pdf.save(`${filename}.pdf`)
      exportState.value = { status: 'complete' }
    } catch (error) {
      exportState.value = { status: 'error', error }
    } finally {
      await onAfterCapture?.()
    }
  }

  return {
    exportPdf,
    exportState: readonly(exportState),
  }
}

export default useExportPdf
