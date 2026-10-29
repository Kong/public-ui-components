<template>
  <nav
    ref="page-layout-anchor-navigation"
    :aria-label="t('anchor_navigation.aria_label')"
    class="page-layout-anchor-navigation"
    :data-fit="fit"
    data-testid="page-layout-anchor-navigation"
  >
    <ul
      ref="page-layout-anchor-navigation-list"
      :class="{ 'layout-hidden': fit === 'hidden' }"
    >
      <!-- There are items above the window -->
      <li
        v-if="view.hasLeadingEllipsis"
        aria-hidden="true"
        class="anchor-ellipsis"
        data-testid="anchor-navigation-leading-ellipsis"
      >
        &hellip;
      </li>

      <li
        v-for="anchor in view.anchors"
        :key="`${anchor.id}-anchor`"
      >
        <button
          :aria-current="anchor.id === activeAnchorId ? 'location' : undefined"
          class="anchor-link"
          :class="{ active: anchor.id === activeAnchorId }"
          :data-testid="anchorDataTestId(anchor)"
          :title="anchor.label"
          type="button"
          @click="scrollToAnchor(anchor)"
        >
          {{ anchor.label }}
        </button>
      </li>

      <!-- There are items below the window -->
      <li
        v-if="view.hasTrailingEllipsis"
        aria-hidden="true"
        class="anchor-ellipsis"
        data-testid="anchor-navigation-trailing-ellipsis"
      >
        &hellip;
      </li>

      <!-- Always last, and always holding every item -- whatever the bar shows, the dropdown is
           the one place the whole list can be reached from -->
      <li v-if="view.hasOverflowDropdown">
        <KDropdown
          :kpop-attributes="{
            placement: 'bottom-end',
            popoverElementAttributes: { 'data-testid': 'anchor-navigation-overflow-dropdown-popover' } }"
        >
          <KButton
            appearance="tertiary"
            :aria-label="t('anchor_navigation.more_button.aria_label')"
            class="anchor-overflow-button"
            data-testid="anchor-navigation-overflow-dropdown-button"
            icon
            size="small"
          >
            <ChevronDownIcon
              decorative
              :size="`var(--kui-icon-size-30, ${KUI_ICON_SIZE_30})`"
            />
          </KButton>

          <template #items="{ closeDropdown }">
            <KDropdownItem
              v-for="overflowAnchor in resolvedAnchors"
              :key="`${overflowAnchor.id}-dropdown-item`"
              :aria-current="overflowAnchor.id === activeAnchorId ? 'location' : undefined"
              :data-testid="anchorDataTestId(overflowAnchor)"
              :selected="overflowAnchor.id === activeAnchorId"
              @click="onOverflowAnchorClick(overflowAnchor, closeDropdown)"
            >
              {{ overflowAnchor.label }}
            </KDropdownItem>
          </template>
        </KDropdown>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import type { PageLayoutAnchor, PageLayoutAnchorNavigationProps } from '../types'
import composables from '../composables'
import { KUI_ICON_SIZE_30, KUI_SPACE_10, KUI_SPACE_60 } from '@kong/design-tokens'
import { useResizeObserver } from '@vueuse/core'
import { ChevronDownIcon } from '@kong/icons'

const {
  anchors = [],
} = defineProps<PageLayoutAnchorNavigationProps>()

const { i18n: { t } } = composables.useI18n()

const rootRef = useTemplateRef('page-layout-anchor-navigation')
const listRef = useTemplateRef('page-layout-anchor-navigation-list')

/**
 * How much of the list the bar has room for. Settled by measurement, and -- crucially -- never
 * by which item is active: the window of pills slides as the reader scrolls, but how many pills
 * there are does not, so the bar never gains or loses an item mid-scroll.
 *
 * - `all`: every item, no dropdown.
 * - `window-3` / `window-2`: a sliding window of that many pills, ellipses marking what is
 *   out of view either side, and a dropdown holding the whole list.
 * - `active-only`: the active pill and the dropdown, nothing else.
 * - `hidden`: not even one pill and the dropdown fit, so the bar is dropped.
 */
type AnchorNavigationFit = 'all' | 'window-3' | 'window-2' | 'active-only' | 'hidden'

// Starts on the full set: the walk below settles within a single task, before the browser paints,
// and a measurement that never happens leaves the bar usable instead of blank.
const fit = ref<AnchorNavigationFit>('all')
const activeAnchorId = ref<string>('')

/**
 * Ids of the anchors that currently point at a section on the page, refreshed by
 * `readAnchorState` below. An anchor whose id matches nothing, or whose `element` has been
 * unmounted, is dropped from the bar entirely rather than rendered as a pill that does nothing
 * when clicked.
 */
const resolvableAnchorIds = ref<string[]>([])

const resolvedAnchors = computed((): PageLayoutAnchor[] =>
  anchors.filter((anchor) => resolvableAnchorIds.value.includes(anchor.id)))

const activeAnchorIndex = computed((): number => {
  const index = resolvedAnchors.value.findIndex((anchor) => anchor.id === activeAnchorId.value)
  return index === -1 ? 0 : index
})

interface AnchorNavigationView {
  /** The pills to render, in page order */
  anchors: PageLayoutAnchor[]
  hasLeadingEllipsis: boolean
  hasTrailingEllipsis: boolean
  hasOverflowDropdown: boolean
}

/**
 * What to render, derived from the settled fit and the active item alone -- no measuring, so a
 * scroll can slide the window but can never change its size.
 */
const view = computed((): AnchorNavigationView => {
  const resolved = resolvedAnchors.value
  const total = resolved.length
  const active = activeAnchorIndex.value

  if (fit.value === 'all') {
    return { anchors: resolved, hasLeadingEllipsis: false, hasTrailingEllipsis: false, hasOverflowDropdown: false }
  }

  if (fit.value === 'hidden') {
    return { anchors: [], hasLeadingEllipsis: false, hasTrailingEllipsis: false, hasOverflowDropdown: false }
  }

  if (fit.value === 'active-only') {
    return { anchors: resolved.slice(active, active + 1), hasLeadingEllipsis: false, hasTrailingEllipsis: false, hasOverflowDropdown: true }
  }

  const count = fit.value === 'window-3' ? 3 : 2

  if (total <= count) {
    return { anchors: resolved, hasLeadingEllipsis: false, hasTrailingEllipsis: false, hasOverflowDropdown: true }
  }

  // Pinned to the start while the reader is still in the first `count` sections and to the end
  // once they reach the last `count`, so the two ends of the page read as ends. In between the
  // window slides with them: the active pill sits in the middle of a three-pill window, and last
  // in a two-pill one.
  const start = active < count
    ? 0
    : active >= total - count
      ? total - count
      : active - 1

  return {
    anchors: resolved.slice(start, start + count),
    hasLeadingEllipsis: start > 0,
    hasTrailingEllipsis: start + count < total,
    hasOverflowDropdown: true,
  }
})

// `id` is a selector, so strip the punctuation out of it rather than minting testids like
// `page-layout-anchor-[data-anchor="usage"]`
const anchorDataTestId = (anchor: PageLayoutAnchor): string =>
  anchor.dataTestId ?? `page-layout-anchor-${anchor.id.replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '')}`

/* ------------------------------------------------------------------ *
 * Resolving the sections on the page
 * ------------------------------------------------------------------ */

/** The element the bar and the page scroll within, or `null` when that is the document itself. */
const scroller = ref<HTMLElement | null>(null)

const findScroller = (): HTMLElement | null => {
  let node = rootRef.value?.parentElement ?? null

  while (node) {
    const { overflowY } = getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return node
    }
    node = node.parentElement
  }

  return null
}

const resolveAnchorElement = (anchor: PageLayoutAnchor): HTMLElement | null => {
  if (anchor.element) {
    // A ref still holds its node after the section has unmounted, and a detached node reports an
    // all-zero rect -- which would scroll the page to the top and let the anchor win the active
    // item on every read. Off the page is off the page.
    return anchor.element.isConnected ? anchor.element : null
  }

  const root: HTMLElement | Document = scroller.value ?? document

  try {
    // `id` is documented as a selector, but a bare identifier is the shape most hosts reach for
    // first, so fall back to reading it as an `id` attribute rather than silently matching nothing.
    return root.querySelector<HTMLElement>(anchor.id) ?? root.querySelector<HTMLElement>(`#${CSS.escape(anchor.id)}`)
  } catch {
    // An invalid selector is the host's mistake, but it should not take the whole bar down with it
    return null
  }
}

/**
 * Where a section lands once it has been scrolled to: below the sticky header, with a gap so it
 * does not sit flush against it. Read live, since the header's height depends on what it holds.
 */
const defaultAnchorOffset = (): number => {
  const header = rootRef.value?.closest<HTMLElement>('.page-layout-header')
  return (header?.getBoundingClientRect().height ?? 0) + parseInt(KUI_SPACE_60, 10)
}

/* ------------------------------------------------------------------ *
 * Overflow
 * ------------------------------------------------------------------ */

/**
 * The widths the overflow budget is built from. Deliberately fixed rather than measured: a pill's
 * rendered width depends on its label, so budgeting from real widths would let the bar fit three
 * short pills and then overflow the moment a longer one slid into the window. Pills are truncated
 * at a known cap, so that cap is what every slot reserves, whatever is in it.
 */
// Must match `$anchor-link-max-width` in the style block below
const ANCHOR_PILL_MAX_WIDTH = 140
const ANCHOR_ELLIPSIS_WIDTH = parseInt(KUI_ICON_SIZE_30, 10)
// KButton `icon size="small"`: a 16px icon, 2px of padding and a 1px border either side
const ANCHOR_CARET_WIDTH = 22
const ANCHOR_ITEM_GAP = parseInt(KUI_SPACE_10, 10)
// Breathing room so the bar never sits flush against the page actions beside it
const ANCHOR_NAVIGATION_END_PADDING = 16

/**
 * Both ellipses are always paid for, even in the configurations that only render one of them. A
 * budget that counted just the ellipsis currently on screen would let three pills fit at the top
 * of the page and then overflow the moment the reader scrolled far enough for the second ellipsis
 * to appear -- dropping a pill mid-scroll, which is exactly the jumping this avoids.
 */
const windowBudget = (count: number): number =>
  count * ANCHOR_PILL_MAX_WIDTH +
  2 * ANCHOR_ELLIPSIS_WIDTH +
  ANCHOR_CARET_WIDTH +
  (count + 2) * ANCHOR_ITEM_GAP +
  ANCHOR_NAVIGATION_END_PADDING

/** The smallest the bar can be and still say something: one pill and the dropdown. */
const activeOnlyBudget = (): number =>
  ANCHOR_PILL_MAX_WIDTH + ANCHOR_CARET_WIDTH + ANCHOR_ITEM_GAP + ANCHOR_NAVIGATION_END_PADDING

/**
 * Settles how much of the list fits.
 *
 * Only the `all` configuration is measured, because it is the only one whose width depends on the
 * labels; everything below it is decided against the fixed budgets above. The measurement is a DOM
 * write followed by a read in the same task, so the browser never paints the intermediate state.
 *
 * Runs are serialised through a token: the resize observer fires its first callback as soon as it
 * starts observing, which would otherwise interleave with the run `onMounted` began.
 */
let fitRun = 0
const computeAnchorNavigationFit = async (): Promise<void> => {
  if (!resolvedAnchors.value.length) {
    // Settle rather than leaving a window fit in place: `view` reads a stale window as "too few
    // items to need ellipses, but still worth a dropdown" and renders a lone chevron over an
    // empty list. Every trigger re-runs this, so the bar returns as soon as a section does.
    fit.value = 'hidden'
    return
  }

  const run = ++fitRun

  fit.value = 'all'

  await nextTick()

  if (run !== fitRun || !rootRef.value || !listRef.value) {
    return
  }

  const available = rootRef.value.getBoundingClientRect().width
  // The list is `flex-shrink: 0`, so its rect is its natural width even while it overflows the nav
  const required = listRef.value.getBoundingClientRect().width

  // Nothing to go on -- the row has not been laid out yet, or the bar is in a subtree that is not
  // being displayed. "Do not know" is not the same answer as "does not fit", so leave every item
  // on show and wait for the resize observer to call back with a row that can be measured.
  if (available <= 0 || required <= 0) {
    return
  }

  if (required + ANCHOR_NAVIGATION_END_PADDING <= available) {
    return
  }

  if (windowBudget(3) <= available) {
    fit.value = 'window-3'
  } else if (windowBudget(2) <= available) {
    fit.value = 'window-2'
  } else if (activeOnlyBudget() <= available) {
    fit.value = 'active-only'
  } else {
    fit.value = 'hidden'
  }
}

let resizeTimeout: ReturnType<typeof setTimeout> | null = null
const handleResize = () => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }

  resizeTimeout = setTimeout(() => {
    // A resize often comes with the page reflowing around it, so re-read what is on the page
    // before measuring what has to fit
    readAnchorState()
    computeAnchorNavigationFit()
  }, 150)
}

useResizeObserver(rootRef, handleResize)

/* ------------------------------------------------------------------ *
 * Scroll handling
 * ------------------------------------------------------------------ */

/**
 * A clicked item stays active until the smooth scroll it started has come to rest, so the bar does
 * not light up every section the scroll passes on its way there. The person taking the scroll back
 * over ends the pin early.
 */
let pinnedAnchorId: string | null = null
let pinTimeout: ReturnType<typeof setTimeout> | null = null

/* ------------------------------------------------------------------ *
 * Section attention
 *
 * A section that has just been scrolled to draws the eye once. The animation itself is PageLayout's
 * -- the section is the host's own markup, which this component's scoped styles cannot reach -- so
 * all that happens here is the attribute going on and coming off again.
 * ------------------------------------------------------------------ */

/** Marks the section PageLayout draws the attention ring around. Also hardcoded in its styles. */
const ANCHOR_ATTENTION_ATTRIBUTE = 'data-anchor-attention'

/** How long the section keeps the attribute: a little longer than the animation it drives. */
const ANCHOR_ATTENTION_MS = 1200
/** How long a smooth scroll may take before the section it heads for draws attention anyway. */
const ANCHOR_SCROLL_END_FALLBACK_MS = 1600

let attentionRun = 0
let attentionFrame = 0
let attentionTimeout: ReturnType<typeof setTimeout> | null = null
let attentionElement: HTMLElement | null = null

/**
 * Marks a section for one run of the attention animation. The mark is dropped for a frame first, so
 * picking the same item twice restarts the animation instead of doing nothing.
 */
const drawAttention = (element: HTMLElement): void => {
  const run = String(++attentionRun)

  clearAttention()
  attentionElement = element
  element.removeAttribute(ANCHOR_ATTENTION_ATTRIBUTE)

  attentionFrame = requestAnimationFrame(() => {
    element.setAttribute(ANCHOR_ATTENTION_ATTRIBUTE, run)

    attentionTimeout = setTimeout(() => {
      // A newer mark owns the element now, and will clear up after itself
      if (element.getAttribute(ANCHOR_ATTENTION_ATTRIBUTE) === run) {
        element.removeAttribute(ANCHOR_ATTENTION_ATTRIBUTE)
      }
    }, ANCHOR_ATTENTION_MS)
  })
}

/** Takes the mark off whatever carries it, so nothing is left behind on the host's markup. */
const clearAttention = (): void => {
  cancelAnimationFrame(attentionFrame)

  if (attentionTimeout) {
    clearTimeout(attentionTimeout)
    attentionTimeout = null
  }

  attentionElement?.removeAttribute(ANCHOR_ATTENTION_ATTRIBUTE)
  attentionElement = null
}

// Typed as `EventTarget` so `scrollend` -- which the DOM lib does not know about on `Window` yet --
// can be listened for on either the scrolling element or the document
const scrollEventTarget = (): EventTarget => scroller.value ?? window

/** The keys that scroll a page. Any other keystroke is someone typing, not taking the scroll over. */
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '])

const unpinAnchor = (event?: Event) => {
  if (event instanceof KeyboardEvent && !SCROLL_KEYS.has(event.key)) {
    return
  }

  // The reader taking the scroll back over also calls off the attention the click was heading for:
  // they are no longer going where it was taking them. A scroll that simply ended does not.
  if (event && event.type !== 'scrollend') {
    attentionRun++
  }

  pinnedAnchorId = null

  if (pinTimeout) {
    clearTimeout(pinTimeout)
    pinTimeout = null
  }

  const target = scrollEventTarget()
  target.removeEventListener('scrollend', unpinAnchor)
  target.removeEventListener('wheel', unpinAnchor)
  target.removeEventListener('touchstart', unpinAnchor)
  target.removeEventListener('keydown', unpinAnchor)
}

const pinAnchor = (anchorId: string) => {
  unpinAnchor()
  pinnedAnchorId = anchorId

  const target = scrollEventTarget()
  target.addEventListener('scrollend', unpinAnchor, { once: true })
  target.addEventListener('wheel', unpinAnchor, { passive: true })
  target.addEventListener('touchstart', unpinAnchor, { passive: true })
  target.addEventListener('keydown', unpinAnchor, { passive: true })
  // `scrollend` is not everywhere yet (Safari), and a long smooth scroll outlasts a short wait
  pinTimeout = setTimeout(unpinAnchor, 1000)
}

const scrollMetrics = () => {
  const el = scroller.value

  return {
    top: el ? el.getBoundingClientRect().top : 0,
    scrollTop: el ? el.scrollTop : window.scrollY,
    clientHeight: el ? el.clientHeight : window.innerHeight,
    scrollHeight: el ? el.scrollHeight : document.documentElement.scrollHeight,
  }
}

/**
 * Re-reads the page: which anchors still point at a section, and which of those the reader is in.
 *
 * Both answers come out of the same walk, since both need every anchor resolved. The DOM has no
 * event to say a section has appeared or gone, so this runs on every scroll frame (rAF-throttled),
 * on mount, on resize, and whenever `anchors` changes.
 *
 * Returns whether the set of resolvable anchors changed -- that changes what the bar has to fit,
 * so the caller needs to measure again.
 */
const readAnchorState = (): boolean => {
  const { top, scrollTop, clientHeight, scrollHeight } = scrollMetrics()
  const offset = defaultAnchorOffset()
  const resolvable: string[] = []
  // Falls back to the first section on the page until one has actually passed under the header
  let current: string | null = null
  let lastResolvable: string | null = null

  for (const anchor of anchors) {
    const element = resolveAnchorElement(anchor)
    if (!element) {
      continue
    }

    resolvable.push(anchor.id)
    lastResolvable = anchor.id
    current ??= anchor.id

    if (element.getBoundingClientRect().top - top <= (anchor.offset ?? offset) + 8) {
      current = anchor.id
    }
  }

  const resolvableChanged = resolvable.length !== resolvableAnchorIds.value.length ||
    resolvable.some((id, index) => id !== resolvableAnchorIds.value[index])

  if (resolvableChanged) {
    resolvableAnchorIds.value = resolvable
  }

  // A clicked item holds the bar until its scroll has settled, but the set of sections on the page
  // is read either way -- it is not the reader's doing
  if (!pinnedAnchorId) {
    // The sections at the end of a page can never be brought up to the header, so the last one
    // takes the bar once the page has run out of scroll -- otherwise it could not be reached by
    // scrolling. Only ever a section that is actually there.
    if (lastResolvable && scrollTop > 0 && scrollTop + clientHeight >= scrollHeight - 2) {
      current = lastResolvable
    }

    activeAnchorId.value = current ?? ''
  }

  return resolvableChanged
}

let readScheduled = false
const onScroll = () => {
  if (readScheduled) {
    return
  }

  readScheduled = true
  requestAnimationFrame(() => {
    readScheduled = false

    if (readAnchorState()) {
      computeAnchorNavigationFit()
    }
  })
}

/** Runs `fn` once the scroll has come to rest, on `scrollend` where the browser has it. */
const afterScrollEnds = (fn: () => void): void => {
  const target = scrollEventTarget()
  let done = false

  const finish = (): void => {
    if (done) {
      return
    }

    done = true
    target.removeEventListener('scrollend', finish)
    fn()
  }

  target.addEventListener('scrollend', finish, { once: true })
  window.setTimeout(finish, ANCHOR_SCROLL_END_FALLBACK_MS)
}

const scrollToAnchor = (anchor: PageLayoutAnchor) => {
  const element = resolveAnchorElement(anchor)
  if (!element) {
    return
  }

  activeAnchorId.value = anchor.id
  pinAnchor(anchor.id)

  const offset = anchor.offset ?? defaultAnchorOffset()
  const { scrollTop, clientHeight, scrollHeight } = scrollMetrics()
  const el = scroller.value
  const top = el
    ? element.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - offset
    : element.getBoundingClientRect().top + window.scrollY - offset

  // Where the scroll can actually come to rest: the last sections of a page can never be brought
  // all the way up to the header, so a target past the end is not where the page will stop.
  const settled = Math.min(Math.max(top, 0), Math.max(scrollHeight - clientHeight, 0))
  const moves = Math.abs(settled - scrollTop) >= 2

  // Claim the run here, not in `drawAttention`: a second pick while the first scroll is still
  // running must leave the first click's pending mark behind, or the older one lands on arrival
  // and takes the ring to the section the reader walked away from.
  const run = ++attentionRun;

  (el ?? window).scrollTo({ behavior: 'smooth', top })

  // The section draws attention where the scroll leaves it -- at once when the page cannot move,
  // since no scroll is coming to wait for.
  if (!moves) {
    drawAttention(element)
    return
  }

  afterScrollEnds(() => {
    // A newer click, or the reader taking the scroll over, called this one off on the way
    if (run === attentionRun) {
      drawAttention(element)
    }
  })
}

const onOverflowAnchorClick = (anchor: PageLayoutAnchor, closeDropdown: () => void) => {
  closeDropdown()
  scrollToAnchor(anchor)
}

/* ------------------------------------------------------------------ *
 * Lifecycle
 * ------------------------------------------------------------------ */

onMounted(() => {
  scroller.value = findScroller()
  scrollEventTarget().addEventListener('scroll', onScroll, { passive: true })
  readAnchorState()
  computeAnchorNavigationFit()

  // Read again once the first frame has been laid out. The measurement above usually stands, but
  // a header that is still settling (web fonts arriving, a sticky row being positioned) can report
  // a width the final layout does not agree with -- and sections mounted after this one are only
  // on the page by now.
  requestAnimationFrame(() => {
    readAnchorState()
    computeAnchorNavigationFit()
  })
})

onBeforeUnmount(() => {
  scrollEventTarget().removeEventListener('scroll', onScroll)
  unpinAnchor()
  // The section belongs to the host and outlives this component, so take the mark back off it
  attentionRun++
  clearAttention()

  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
})

watch(() => anchors, () => {
  // `readAnchorState` settles the active item against whatever is on the page now; this just makes
  // sure a key that has gone entirely does not hold the bar in the meantime
  if (!anchors.some((anchor) => anchor.id === activeAnchorId.value)) {
    activeAnchorId.value = ''
  }

  readAnchorState()
  computeAnchorNavigationFit()
}, { deep: true })
</script>

<style lang="scss" scoped>
// A long section name truncates rather than eating the row its neighbours need. Also the width
// every pill slot reserves in the overflow budget -- keep in step with `ANCHOR_PILL_MAX_WIDTH`.
$anchor-link-max-width: 140px;

.page-layout-anchor-navigation {
  display: flex;
  // Take the row's free space and centre the bar within it, so the items sit between the
  // breadcrumbs and the page actions rather than hard against either of them
  flex: 1 1 0;
  justify-content: center;
  // A flex item will not shrink below its content without this, so an overflowing bar would push
  // the header wider instead of being measured and cut down
  min-width: 0;
  // Clip sideways only -- `clip` leaves the other axis visible, so the overflow dropdown is free
  // to open below the header
  overflow-x: clip;

  ul {
    align-items: center;
    background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
    border-radius: var(--kui-border-radius-40, $kui-border-radius-40);
    display: flex;
    // Keep the list at its natural width while it overflows, so it can be measured
    flex-shrink: 0;
    gap: var(--kui-space-10, $kui-space-10);
    list-style: none;
    margin: var(--kui-space-0, $kui-space-0);
    padding: var(--kui-space-20, $kui-space-20);

    // Not even one pill and the dropdown fit
    &.layout-hidden {
      display: none;
    }

    li {
      display: flex;
    }
  }

  .anchor-link {
    background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
    border: none;
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    // So the cap above is the pill's whole width, padding included, and matches what the overflow
    // budget reserves for it
    box-sizing: border-box;
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    cursor: pointer;
    font-family: inherit;
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
    line-height: var(--kui-line-height-20, $kui-line-height-20);
    max-width: $anchor-link-max-width;
    outline: none;
    overflow: hidden;
    padding: var(--kui-space-20, $kui-space-20) var(--kui-space-30, $kui-space-30);
    text-overflow: ellipsis;
    transition: background-color var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in, color var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in;
    white-space: nowrap;

    &:hover {
      color: var(--kui-color-text, $kui-color-text);
    }

    &:focus-visible {
      box-shadow: var(--kui-shadow-focus, $kui-shadow-focus);
    }

    // The active section reads as the brand-coloured pill the sidebar's current item wears
    &.active {
      background-color: var(--kui-color-brand, $kui-color-brand);
      color: var(--kui-color-text-neutral-weak, $kui-color-text-neutral-weak);
    }
  }

  // A quiet marker that the list carries on in that direction; the dropdown is what actually
  // reaches the items, so this is decorative only. Its width is fixed because the overflow budget
  // reserves one either side whether or not both are on screen.
  .anchor-ellipsis {
    align-items: center;
    color: var(--kui-color-text-neutral-weak, $kui-color-text-neutral-weak);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    justify-content: center;
    line-height: var(--kui-line-height-20, $kui-line-height-20);
    user-select: none;
    width: var(--kui-icon-size-30, $kui-icon-size-30);
  }

  .anchor-overflow-button {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  }
}
</style>
