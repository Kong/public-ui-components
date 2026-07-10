// Protocol for preparing WebGL content for PDF export.
//
// MapLibre renders into a WebGL canvas with `preserveDrawingBuffer: false`,
// so capture libraries that read canvases using `toDataURL()` get a blank image.
// This will temporarily swap the canvas for a static <img> while capturing.

export const CAPTURE_PREPARE_EVENT = 'kapture:prepare'
export const CAPTURE_RESTORE_EVENT = 'kapture:restore'

export interface CapturePrepareDetail {
  // Forces sanpdom to wait before starting the capture.
  waitUntil: (promise: Promise<void>) => void
}

export async function prepareForCapture(): Promise<void> {
  const pending: Array<Promise<void>> = []

  window.dispatchEvent(new CustomEvent<CapturePrepareDetail>(CAPTURE_PREPARE_EVENT, {
    detail: { waitUntil: (promise) => pending.push(promise) },
  }))

  await Promise.allSettled(pending)
}

export function restoreAfterCapture(): void {
  window.dispatchEvent(new CustomEvent(CAPTURE_RESTORE_EVENT))
}
