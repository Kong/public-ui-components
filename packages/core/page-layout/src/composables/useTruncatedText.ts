import { onBeforeUnmount, onUpdated, ref, watch } from 'vue'

/**
 * One-line truncation detection for an element clamped with `overflow: hidden` and
 * `text-overflow: ellipsis`: when the content does not fit, the element shows its whole
 * text in a native tooltip. The tooltip appears only while the text is actually truncated.
 *
 * The element mounts and unmounts with its content, so the observer follows the current
 * element instead of the one that happened to exist at mount time. `flush: 'post'` runs
 * the watch after the DOM update, when the element is in the document and measurable.
 *
 * @param getEl reads the element's template ref
 */
export function useTruncatedText(getEl: () => HTMLElement | null) {
  const truncated = ref(false)
  const text = ref('')
  let observer: ResizeObserver | null = null

  const measure = () => {
    const el = getEl()
    if (!el) {
      return
    }

    text.value = (el.textContent ?? '').trim()
    // jsdom never lays text out, so the specs override these element metrics.
    truncated.value = el.scrollWidth > el.clientWidth + 1
  }

  watch(getEl, (el, prev) => {
    if (prev) {
      observer?.unobserve(prev)
    }
    if (el) {
      observer = observer ?? new ResizeObserver(measure)
      observer.observe(el)
      measure()
    }
  }, { flush: 'post' })

  // The text can change without a box resize (async data, a language switch).
  onUpdated(measure)

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return { truncated, text }
}
