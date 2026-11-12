import { nextTick, shallowRef } from 'vue'
import { get } from 'lodash-es'
import * as utils from '../utils'
import { isKid } from './key-id-map'

import type { KeyId } from '../types'
import type { UnionFieldSchema } from '../form-schema'

export interface RevealResult {
  /**
   * The data path that was revealed, in the `formatDataPath` format: the
   * target itself, or its nearest visible ancestor when the target can't be
   * shown (e.g. it sits in a record that is switched off).
   */
  path: string
  /** Whether the target itself was revealed */
  exact: boolean
}

export interface FieldElementEntry {
  /** The field path, with key IDs for map entries */
  path: () => string
  element: () => Element | null
}

/**
 * Lets a form reveal a field by its data path: containers on the way open
 * themselves (see `useField`'s `revealTarget`), then the field is scrolled
 * into view and focused.
 */
export function createFieldReveal(options: {
  formData: Record<string, any>
  getSchema: (path: string) => UnionFieldSchema | undefined
  getKey: (id: KeyId) => string | undefined
}) {
  const { formData, getSchema, getKey } = options

  /**
   * The field path being revealed. Containers whose path it is within open
   * themselves while it is set.
   */
  const revealTarget = shallowRef<string | null>(null)

  const fieldElements = new Set<FieldElementEntry>()

  function registerFieldElement(entry: FieldElementEntry) {
    fieldElements.add(entry)
    return () => {
      fieldElements.delete(entry)
    }
  }

  /**
   * Turns data path segments into a field path: map keys become the key IDs
   * the form data is keyed by. A key that isn't in the data is kept as is, so
   * it simply matches no field.
   */
  function toFieldPath(segments: string[]): string {
    const result: string[] = []

    for (const segment of segments) {
      const parentSchema = result.length ? getSchema(utils.resolve(...result)) : undefined

      if (parentSchema?.type === 'map') {
        const entries = get(formData, result) as Record<string, unknown> | undefined
        const keyId = entries && Object.keys(entries).find(id => isKid(id) && getKey(id) === segment)
        result.push(keyId ?? segment)
      } else {
        result.push(segment)
      }
    }

    return utils.resolve(...result)
  }

  function toDataPath(fieldPath: string): string {
    return utils.formatDataPath(
      utils.toArray(fieldPath).map(segment => isKid(segment) ? getKey(segment) ?? segment : segment),
    )
  }

  /**
   * The visible element of a mounted field. Hidden fields (e.g. by a render
   * rule) have no client rects.
   */
  function findFieldElement(fieldPath: string): Element | null {
    for (const entry of fieldElements) {
      if (entry.path() !== fieldPath) {
        continue
      }
      const element = entry.element()
      if (element?.isConnected && element.getClientRects().length > 0) {
        return element
      }
    }
    return null
  }

  /**
   * The target, or its nearest ancestor that has a visible element.
   */
  function findLanding(fieldPath: string) {
    const segments = utils.toArray(fieldPath)
    for (let length = segments.length; length > 0; length--) {
      const path = utils.resolve(...segments.slice(0, length))
      const element = findFieldElement(path)
      if (element) {
        return { path, element }
      }
    }
    return null
  }

  let lastRevealId = 0

  /**
   * Reveals the field at a data path, e.g. `config.redis.host` or
   * `config.headers["x.y"]` (see `parseDataPath`).
   *
   * Only view state changes: records expand and array tabs switch. A record
   * that is switched off is not switched on, so the reveal stops at it.
   *
   * @returns Where it landed, or `null` when nothing on the path is visible,
   *          the path is malformed, or a later `reveal` call took over.
   */
  async function reveal(path: string): Promise<RevealResult | null> {
    let segments: string[]
    try {
      segments = utils.parseDataPath(path)
    } catch {
      return null
    }
    if (!segments.length) {
      return null
    }

    const id = ++lastRevealId
    const target = toFieldPath(segments)
    revealTarget.value = target

    try {
      // A container that opens mounts its children, which may open in turn,
      // so give each level of the path a render.
      for (let i = 0; i <= segments.length && !findFieldElement(target); i++) {
        await nextTick()
        if (id !== lastRevealId) {
          return null
        }
      }

      // Expanding records animate their height with `overflow: hidden`;
      // scrolling before that ends would scroll the clipped box instead.
      await waitForTransitions()
      if (id !== lastRevealId) {
        return null
      }

      const landing = findLanding(target)
      if (!landing) {
        return null
      }

      const exact = landing.path === target
      landing.element.scrollIntoView({ block: 'center' })
      if (exact) {
        focusWithin(landing.element)
      }

      return { path: toDataPath(landing.path), exact }
    } finally {
      // Left set, it would keep opening containers the user expands later
      if (id === lastRevealId) {
        revealTarget.value = null
      }
    }
  }

  return {
    revealTarget,
    registerFieldElement,
    reveal,
  }
}

function nextFrame() {
  return new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
}

/**
 * Waits for the running CSS transitions to end, at most `timeout` ms.
 */
async function waitForTransitions(timeout = 1000) {
  if (typeof document.getAnimations !== 'function' || typeof CSSTransition === 'undefined') {
    return
  }

  // `SlideTransition` starts its transition in the next frame
  await nextFrame()
  await nextFrame()

  const running = document.getAnimations().filter(animation => animation instanceof CSSTransition)
  if (!running.length) {
    return
  }

  await Promise.race([
    Promise.allSettled(running.map(animation => animation.finished)),
    new Promise(resolve => setTimeout(resolve, timeout)),
  ])
}

function focusWithin(element: Element) {
  const focusable = element.matches(utils.FOCUSABLE_SELECTOR)
    ? element
    : element.querySelector(utils.FOCUSABLE_SELECTOR)

  if (focusable instanceof HTMLElement) {
    focusable.focus({ preventScroll: true })
  }
}
