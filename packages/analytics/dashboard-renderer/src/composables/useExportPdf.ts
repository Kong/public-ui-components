import type { Ref } from 'vue'
import type { jsPDF } from 'jspdf'
import type { SnapdomPlugin } from '@zumer/snapdom'
import type { PdfExportOptions, PdfExportState } from '../types/renderer-types'

import { readonly, ref } from 'vue'
import { prepareForCapture, restoreAfterCapture } from '@kong-ui-public/analytics-utilities'
import useI18n from './useI18n'

interface RowBoundary {
  top: number
  bottom: number
}

interface PageSlice {
  startY: number
  height: number
}

const HEADER_HEIGHT_MM = 6
const FOOTER_HEIGHT_MM = 6
const SUBTITLE_HEIGHT_MM = 4

interface PageMetaContext {
  title?: string
  subtitle?: string
  dashboardUrl?: string
  generatedAt: string
  branding: string
  dashboardNote: string
  pageLabel: string
  pageWidth: number
  pageHeight: number
  headerHeight: number
  margin: number
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildFilename(filename: string | undefined, title: string | undefined, now: Date): string {
  const base = filename || (title && slugify(title)) || 'dashboard-export'
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')

  return `${base}-${yyyy}-${mm}-${dd}.pdf`
}

function drawPageMeta(pdf: jsPDF, ctx: PageMetaContext): void {
  const { pageWidth, pageHeight, margin } = ctx
  const headerBaseline = margin + 1
  const headerRuleY = margin + ctx.headerHeight - 3
  const footerRuleY = pageHeight - margin - FOOTER_HEIGHT_MM + 3
  const footerBaseline = footerRuleY + 4

  // Header title aligned left, timestamp right
  if (ctx.title) {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.setTextColor(60)
    pdf.text(ctx.title, margin, headerBaseline)
  }

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(120)
  pdf.text(ctx.generatedAt, pageWidth - margin, headerBaseline, { align: 'right' })

  // Subtitle below the header
  if (ctx.subtitle) {
    pdf.text(ctx.subtitle, margin, headerBaseline + SUBTITLE_HEIGHT_MM)
  }

  pdf.setDrawColor(220)
  pdf.line(margin, headerRuleY, pageWidth - margin, headerRuleY)

  // Footer branding and dashboard note aligned left, page number right
  pdf.line(margin, footerRuleY, pageWidth - margin, footerRuleY)

  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(60)
  pdf.text(ctx.branding, margin, footerBaseline)
  const brandingWidth = pdf.getTextWidth(ctx.branding)

  pdf.setFont('helvetica', 'normal')
  const note = ` ${ctx.dashboardNote}`

  if (ctx.dashboardUrl) {
    pdf.setTextColor(0, 68, 204)
    pdf.textWithLink(note, margin + brandingWidth, footerBaseline, { url: ctx.dashboardUrl })
  } else {
    pdf.setTextColor(120)
    pdf.text(note, margin + brandingWidth, footerBaseline)
  }

  pdf.setTextColor(120)
  pdf.text(ctx.pageLabel, pageWidth - margin, footerBaseline, { align: 'right' })
}

export function getRowBoundaries(container: HTMLElement): RowBoundary[] {
  const gridLayout = container.querySelector<HTMLElement>('.kong-ui-public-grid-layout, .grid-stack')

  if (!gridLayout) {
    return []
  }

  const cells = gridLayout.querySelectorAll<HTMLElement>(':scope > .grid-cell:not(.empty-cell), :scope > .grid-stack-item')

  if (!cells.length) {
    return []
  }

  // This will measure relative to the grid-stack container
  const containerTop = container.getBoundingClientRect().top

  const rowMap = new Map<number, number>()
  cells.forEach(cell => {
    const rect = cell.getBoundingClientRect()
    const top = Math.round(rect.top - containerTop)
    const bottom = Math.round(rect.bottom - containerTop)
    const existing = rowMap.get(top)

    // Keep the tallest cell's bottom for each row
    rowMap.set(top, existing !== undefined ? Math.max(existing, bottom) : bottom)
  })

  return [...rowMap.entries()]
    .map(([top, bottom]) => ({ top, bottom }))
    .sort((a, b) => a.top - b.top)
}

// Groups rows into pages without splitting any row across a page break
export function calculatePageSlices(
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
  const { i18n } = useI18n()
  const exportState = ref<PdfExportState>({ status: 'idle' })

  async function exportPdf(options: PdfExportOptions = {}): Promise<Blob | undefined> {
    const {
      filename,
      title,
      subtitle,
      dashboardUrl,
      orientation = 'landscape',
      margin = 4,
      scale = 2,
      exclude = ['.tile-actions', '.tooltip', '.popover', '.dropdown-popover'],
      output = 'download',
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

      // In order to take a snapshot of the map canvas (WebGL under the hood), this will
      // temporarily transform the draw buffer into an <img> and restore it after capture.
      // See `captureProtocol` in analytics-utilities
      const webglSnapshotPlugin: SnapdomPlugin = {
        name: 'kong-webgl-snapshot',
        beforeClone: () => prepareForCapture(),
        afterClone: () => restoreAfterCapture(),
      }

      const canvas = await snapdom.toCanvas(element, { scale, exclude, plugins: [webglSnapshotPlugin] })

      exportState.value = { status: 'generating' }

      const now = new Date()
      const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const headerHeight = HEADER_HEIGHT_MM + (subtitle ? SUBTITLE_HEIGHT_MM : 0)
      const contentWidth = pageWidth - margin * 2
      const contentHeight = pageHeight - margin * 2 - headerHeight - FOOTER_HEIGHT_MM

      const pxPerMm = canvas.width / contentWidth
      const pageHeightPx = contentHeight * pxPerMm

      const pages = calculatePageSlices(rowBoundaries, canvas.height, pageHeightPx, scale)

      const pageMeta: Omit<PageMetaContext, 'pageLabel'> = {
        title,
        subtitle,
        dashboardUrl,
        generatedAt: i18n.t('pdfExport.generated', {
          timestamp: now.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
        }),
        branding: i18n.t('pdfExport.branding'),
        dashboardNote: i18n.t('pdfExport.dashboardNote'),
        pageWidth,
        pageHeight,
        headerHeight,
        margin,
      }

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
          margin + headerHeight,
          contentWidth,
          height / pxPerMm,
        )

        drawPageMeta(pdf, {
          ...pageMeta,
          pageLabel: i18n.t('pdfExport.pageOf', { page: String(i + 1), total: String(pages.length) }),
        })
      }

      if (output === 'blob') {
        // This won't do much for now other than return the type and size of the blob.
        const blob = pdf.output('blob')
        exportState.value = { status: 'complete', pageCount: pages.length }

        return blob
      }

      pdf.save(buildFilename(filename, title, now))
      exportState.value = { status: 'complete', pageCount: pages.length }
    } catch (error) {
      exportState.value = { status: 'error', error }
    } finally {
      // restore regardless of error
      restoreAfterCapture()
      await onAfterCapture?.()
    }

    return undefined
  }

  return {
    exportPdf,
    exportState: readonly(exportState),
  }
}

export default useExportPdf
