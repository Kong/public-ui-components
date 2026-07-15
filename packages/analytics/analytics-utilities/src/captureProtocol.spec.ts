import type { CapturePrepareDetail } from './captureProtocol'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CAPTURE_PREPARE_EVENT,
  CAPTURE_RESTORE_EVENT,
  prepareForCapture,
  registerCapture,
  registerWebglCapture,
  restoreAfterCapture,
} from './captureProtocol'

describe('captureProtocol', () => {
  const listeners: Array<[string, EventListener]> = []

  const listen = (eventName: string, handler: EventListener) => {
    window.addEventListener(eventName, handler)
    listeners.push([eventName, handler])
  }

  afterEach(() => {
    listeners.splice(0).forEach(([eventName, handler]) => window.removeEventListener(eventName, handler))
  })

  describe('prepareForCapture', () => {
    it('resolves immediately when nothing is listening', async () => {
      await expect(prepareForCapture()).resolves.toBeUndefined()
    })

    it('waits for promises registered via waitUntil', async () => {
      let releasePreparation: () => void
      let prepared = false

      listen(CAPTURE_PREPARE_EVENT, (event) => {
        const { waitUntil } = (event as CustomEvent<CapturePrepareDetail>).detail
        waitUntil(new Promise<void>((resolve) => {
          releasePreparation = () => {
            prepared = true
            resolve()
          }
        }))
      })

      const pending = prepareForCapture()
      expect(prepared).toBe(false)

      releasePreparation!()
      await pending
      expect(prepared).toBe(true)
    })

    it('registers events from multiple listeners', async () => {
      const done: string[] = []
      const register = (name: string) => (event: Event) => {
        const { waitUntil } = (event as CustomEvent<CapturePrepareDetail>).detail
        waitUntil((async () => {
          done.push(name)
        })())
      }

      listen(CAPTURE_PREPARE_EVENT, register('first'))
      listen(CAPTURE_PREPARE_EVENT, register('second'))

      await prepareForCapture()
      expect(done.sort()).toEqual(['first', 'second'])
    })

    it('resolves even when a registered promise rejects', async () => {
      listen(CAPTURE_PREPARE_EVENT, (event) => {
        const { waitUntil } = (event as CustomEvent<CapturePrepareDetail>).detail
        waitUntil(Promise.reject(new Error('snapshot failed')))
      })

      await expect(prepareForCapture()).resolves.toBeUndefined()
    })
  })

  describe('restoreAfterCapture', () => {
    it('dispatches the restore event', () => {
      let restored = 0
      listen(CAPTURE_RESTORE_EVENT, () => {
        restored++
      })

      restoreAfterCapture()
      expect(restored).toBe(1)
    })
  })

  describe('registerCapture', () => {
    it('runs prepare on capture and the returned restore afterwards', async () => {
      const order: string[] = []
      const unregister = registerCapture(() => {
        order.push('prepare')
        return () => order.push('restore')
      })

      await prepareForCapture()
      expect(order).toEqual(['prepare'])

      restoreAfterCapture()
      expect(order).toEqual(['prepare', 'restore'])

      unregister()
    })

    it('blocks capture until an async prepare settles', async () => {
      let releasePreparation: () => void
      let prepared = false

      const unregister = registerCapture(() => new Promise<void>((resolve) => {
        releasePreparation = () => {
          prepared = true
          resolve()
        }
      }))

      const pending = prepareForCapture()
      expect(prepared).toBe(false)

      releasePreparation!()
      await pending
      expect(prepared).toBe(true)

      unregister()
    })

    it('stops listening and undoes itself when finished', async () => {
      const prepare = vi.fn(() => () => {})
      const unregister = registerCapture(prepare)

      await prepareForCapture()
      unregister()

      await prepareForCapture()
      expect(prepare).toHaveBeenCalledTimes(1)
    })
  })

  describe('registerWebglCapture', () => {
    let parent: HTMLElement
    let canvas: { style: { visibility: string }, clientWidth: number, clientHeight: number, parentElement: HTMLElement, toDataURL: () => string }

    beforeEach(() => {
      window.HTMLImageElement.prototype.decode = vi.fn().mockResolvedValue(undefined)

      parent = document.createElement('div')
      canvas = {
        style: { visibility: '' },
        clientWidth: 100,
        clientHeight: 80,
        parentElement: parent,
        toDataURL: vi.fn(() => 'data:image/png;base64,stub'),
      }
    })

    it('redraws and swaps the canvas for an <img> then restores it', async () => {
      const redraw = vi.fn()
      const unregister = registerWebglCapture(() => canvas as unknown as HTMLCanvasElement, { redraw })

      await prepareForCapture()

      expect(redraw).toHaveBeenCalledOnce()
      expect(canvas.style.visibility).toBe('hidden')
      expect(parent.querySelector('img')).not.toBeNull()

      restoreAfterCapture()

      expect(canvas.style.visibility).toBe('')
      expect(parent.querySelector('img')).toBeNull()

      unregister()
    })

    it('no-op when no canvas is available', async () => {
      const unregister = registerWebglCapture(() => undefined)

      await expect(prepareForCapture()).resolves.toBeUndefined()
      expect(parent.querySelector('img')).toBeNull()

      unregister()
    })
  })
})
