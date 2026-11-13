import { nextTick, shallowRef, type VNode } from 'vue'
import { get } from 'lodash-es'
import * as utils from '../utils'
import { FOCUSABLE_SELECTOR } from '../constants'
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

export interface RevealOptions {
  /**
   * How long the scroll to the field takes, in ms. `0` jumps there at once.
   * Users who prefer reduced motion always get `0`.
   * @default 300
   */
  duration?: number
  /**
   * Whether to flash the field once it is reached, so the eye finds it. The
   * flash lasts twice the scroll, or `DEFAULT_REVEAL_HIGHLIGHT_DURATION` when
   * there is no scroll animation. Users who prefer reduced motion get none.
   * @default true
   */
  highlight?: boolean
}

export const DEFAULT_REVEAL_DURATION = 300

/** How long the highlight lasts when the scroll is not animated, in ms */
export const DEFAULT_REVEAL_HIGHLIGHT_DURATION = 600

export interface FieldElementEntry {
  /** The field path, with key IDs for map entries */
  path: () => string
  element: () => Element | null
}

type PathMapOptions = {
  formData: Record<string, any>
  getSchema: (path: string) => UnionFieldSchema | undefined
  getKey: (id: KeyId) => string | undefined
}

/**
 * Turns data path segments into a field path: map keys become the key IDs
 * the form data is keyed by. A key that isn't in the data is kept as is, so
 * it simply matches no field.
 */
export function toFieldPath(segments: string[], { formData, getSchema, getKey }: PathMapOptions): string {
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

/**
 * Turns a field path back into a data path in the `formatDataPath` format:
 * key IDs become the map keys they stand for.
 */
export function toDataPath(fieldPath: string, getKey: PathMapOptions['getKey']): string {
  return utils.formatDataPath(
    utils.toArray(fieldPath).map(segment => isKid(segment) ? getKey(segment) ?? segment : segment),
  )
}

/**
 * Lets a form reveal a field by its data path: containers on the way open
 * themselves (see `useField`'s `revealTarget`), then the field is scrolled
 * into view and focused.
 */
export function createFieldReveal(options: PathMapOptions) {

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
  async function reveal(
    path: string,
    { duration = DEFAULT_REVEAL_DURATION, highlight: withHighlight = true }: RevealOptions = {},
  ): Promise<RevealResult | null> {
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
    const target = toFieldPath(segments, options)
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
      await waitForSlideTransitions()
      if (id !== lastRevealId) {
        return null
      }

      const landing = findLanding(target)
      if (!landing) {
        return null
      }

      const exact = landing.path === target
      const reducedMotion = prefersReducedMotion()
      const realDuration = reducedMotion ? 0 : Math.max(0, duration)
      await scrollToCenter(landing.element, realDuration, () => id !== lastRevealId)
      if (id !== lastRevealId) {
        return null
      }
      if (exact) {
        focusWithin(landing.element)
      }
      if (withHighlight && !reducedMotion) {
        highlight(landing.element, realDuration > 0 ? realDuration * 2 : DEFAULT_REVEAL_HIGHLIGHT_DURATION)
      }

      return { path: toDataPath(landing.path, options.getKey), exact }
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
 * Waits until no `SlideTransition` is running, at most `timeout` ms. Vue adds
 * `ff-slide-active` as the element is inserted and removes it when the
 * transition ends, the same marker the record filler waits on. Transitions
 * elsewhere on the page don't hold the reveal up.
 */
async function waitForSlideTransitions(timeout = 1000) {
  const deadline = performance.now() + timeout
  while (document.querySelector('.ff-slide-active') && performance.now() < deadline) {
    await nextFrame()
  }
}

/**
 * The first element a vnode renders, or `null` when it renders none. A
 * fragment is searched up to its end anchor only, so a component that
 * renders nothing doesn't hand out the element of the field after it.
 */
export function getVNodeElement(vnode: VNode): Element | null {
  if (vnode.component) {
    return getVNodeElement(vnode.component.subTree)
  }

  const end = vnode.anchor as Node | null
  let node = vnode.el as Node | null
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      return node as Element
    }
    if (!end || node === end) {
      return null
    }
    node = node.nextSibling
  }
  return null
}

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * The nearest ancestor that scrolls, or `null` for the page
 */
function findScrollContainer(element: Element): HTMLElement | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node)
    if (/auto|scroll|overlay/.test(overflowY) && node.scrollHeight > node.clientHeight) {
      return node
    }
  }
  return null
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

/**
 * Scrolls the element to the middle of its scroll container in `duration`
 * ms. `scrollIntoView`'s smooth behavior can't be timed, hence the frames.
 * Stops when `cancelled` turns true, e.g. a later reveal took over.
 */
async function scrollToCenter(element: Element, duration: number, cancelled: () => boolean) {
  if (duration === 0) {
    element.scrollIntoView({ block: 'center' })
    return
  }

  const container = findScrollContainer(element)
  const scroller = container ?? document.scrollingElement ?? document.documentElement
  const viewTop = container ? container.getBoundingClientRect().top : 0
  const viewHeight = container ? container.clientHeight : window.innerHeight
  const rect = element.getBoundingClientRect()

  const from = scroller.scrollTop
  const max = scroller.scrollHeight - scroller.clientHeight
  const to = Math.min(max, Math.max(0, from + rect.top - viewTop - (viewHeight - rect.height) / 2))
  if (Math.abs(to - from) < 1) {
    return
  }

  const start = performance.now()
  await new Promise<void>((resolve) => {
    const step = (now: number) => {
      if (cancelled()) {
        resolve()
        return
      }
      const progress = Math.min(1, (now - start) / duration)
      scroller.scrollTop = from + (to - from) * easeInOutCubic(progress)
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        resolve()
      }
    }
    requestAnimationFrame(step)
  })
}

/**
 * Flashes the landing so the eye finds it; the style is in `Form.vue`
 */
function highlight(element: Element, duration: number) {
  if (!(element instanceof HTMLElement)) {
    return
  }
  element.classList.remove('ff-reveal-highlight')
  // Restart the animation when the same field is revealed again
  void element.offsetWidth
  element.style.setProperty('--kong-ui-freeform-reveal-highlight-duration', `${duration}ms`)
  element.classList.add('ff-reveal-highlight')
  element.addEventListener('animationend', () => {
    element.classList.remove('ff-reveal-highlight')
    element.style.removeProperty('--kong-ui-freeform-reveal-highlight-duration')
  }, { once: true })
}

function focusWithin(element: Element) {
  const focusable = element.matches(FOCUSABLE_SELECTOR)
    ? element
    : element.querySelector(FOCUSABLE_SELECTOR)

  if (focusable instanceof HTMLElement) {
    focusable.focus({ preventScroll: true })
  }
}
