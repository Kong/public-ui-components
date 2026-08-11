// Protocol for preparing WebGL content for PDF export.

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

// Callback from prepare to undo whatever it did once capture is done.
export type CaptureRestore = (() => void) | void

/**
 * Use this for anything that isn't a plain WebGL canvas. For WebGL
 * canvases use {@link registerWebglCapture} instead.
 *
 * @param prepare Runs when a capture starts; Return a {@link CaptureRestore} to undo itself
 * @returns An unregister function, **call it on unmount!**
 */
export function registerCapture(
  prepare: () => Promise<CaptureRestore> | CaptureRestore,
): () => void {
  let restore: CaptureRestore

  const runRestore = () => {
    restore?.()
    restore = undefined
  }

  const onPrepare = (event: Event) => {
    (event as CustomEvent<CapturePrepareDetail>).detail?.waitUntil(
      (async () => {
        restore = await prepare()
      })(),
    )
  }

  window.addEventListener(CAPTURE_PREPARE_EVENT, onPrepare)
  window.addEventListener(CAPTURE_RESTORE_EVENT, runRestore)

  return () => {
    window.removeEventListener(CAPTURE_PREPARE_EVENT, onPrepare)
    window.removeEventListener(CAPTURE_RESTORE_EVENT, runRestore)

    runRestore()
  }
}

export interface WebglCaptureOptions {
  // Called right before the drawing buffer is read. Needed for renderers
  // running with `preserveDrawingBuffer: false` like MapLibre, you can omit this if the
  // renderer preserves its buffer.
  redraw?: () => void
}

/**
 * This will temporarily swap the canvas for a static <img> while capturing.
 *
 * @param getCanvas Returns the canvas to capture
 * @param options See {@link WebglCaptureOptions}
 * @returns An unregister function, **call it on unmount!**
 */
export function registerWebglCapture(
  getCanvas: () => HTMLCanvasElement | null | undefined,
  options: WebglCaptureOptions = {},
): () => void {
  return registerCapture(async () => {
    const canvas = getCanvas()

    if (!canvas) {
      return
    }

    // Recreates the drawing buffer for `toDataURL`
    options.redraw?.()

    const snapshot = new Image()
    snapshot.src = canvas.toDataURL('image/png')

    await snapshot.decode()

    snapshot.style.cssText = `position:absolute;top:0;left:0;width:${canvas.clientWidth}px;height:${canvas.clientHeight}px;`
    canvas.parentElement?.appendChild(snapshot)
    canvas.style.visibility = 'hidden'

    // Get rid of the <img> element and return the canvas to normal
    return () => {
      snapshot.remove()
      canvas.style.visibility = ''
    }
  })
}
