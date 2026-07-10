import type { CapturePrepareDetail } from './captureProtocol'

import { afterEach, describe, expect, it } from 'vitest'
import {
  CAPTURE_PREPARE_EVENT,
  CAPTURE_RESTORE_EVENT,
  prepareForCapture,
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
})
