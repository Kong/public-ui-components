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
        :key="`${anchor.key}-anchor`"
      >
        <button
          :aria-current="anchor.key === activeAnchorKey ? 'location' : undefined"
          class="anchor-link"
          :class="{ active: anchor.key === activeAnchorKey }"
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
              v-for="overflowAnchor in anchors"
              :key="`${overflowAnchor.key}-dropdown-item`"
              :aria-current="overflowAnchor.key === activeAnchorKey ? 'location' : undefined"
              :data-testid="anchorDataTestId(overflowAnchor)"
              :selected="overflowAnchor.key === activeAnchorKey"
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
const activeAnchorKey = ref<string>(anchors[0]?.key ?? '')

const activeAnchorIndex = computed((): number => {
  const index = anchors.findIndex((anchor) => anchor.key === activeAnchorKey.value)
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
  const total = anchors.length
  const active = activeAnchorIndex.value

  if (fit.value === 'all') {
    return { anchors, hasLeadingEllipsis: false, hasTrailingEllipsis: false, hasOverflowDropdown: false }
  }

  if (fit.value === 'hidden') {
    return { anchors: [], hasLeadingEllipsis: false, hasTrailingEllipsis: false, hasOverflowDropdown: false }
  }

  if (fit.value === 'active-only') {
    return { anchors: anchors.slice(active, active + 1), hasLeadingEllipsis: false, hasTrailingEllipsis: false, hasOverflowDropdown: true }
  }

  const count = fit.value === 'window-3' ? 3 : 2

  if (total <= count) {
    return { anchors, hasLeadingEllipsis: false, hasTrailingEllipsis: false, hasOverflowDropdown: true }
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
    anchors: anchors.slice(start, start + count),
    hasLeadingEllipsis: start > 0,
    hasTrailingEllipsis: start + count < total,
    hasOverflowDropdown: true,
  }
})

const anchorDataTestId = (anchor: PageLayoutAnchor): string =>
  anchor.dataTestId ?? `page-layout-anchor-${anchor.key}`

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
    return anchor.element
  }

  if (!anchor.selector) {
    return null
  }

  const root: HTMLElement | Document = scroller.value ?? document

  try {
    return root.querySelector<HTMLElement>(anchor.selector)
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
  if (!anchors.length) {
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
let pinnedAnchorKey: string | null = null
let pinTimeout: ReturnType<typeof setTimeout> | null = null

// Typed as `EventTarget` so `scrollend` -- which the DOM lib does not know about on `Window` yet --
// can be listened for on either the scrolling element or the document
const scrollEventTarget = (): EventTarget => scroller.value ?? window

const unpinAnchor = () => {
  pinnedAnchorKey = null

  if (pinTimeout) {
    clearTimeout(pinTimeout)
    pinTimeout = null
  }

  const target = scrollEventTarget()
  target.removeEventListener('scrollend', unpinAnchor)
  target.removeEventListener('wheel', unpinAnchor)
  target.removeEventListener('touchstart', unpinAnchor)
}

const pinAnchor = (id: string) => {
  unpinAnchor()
  pinnedAnchorKey = id

  const target = scrollEventTarget()
  target.addEventListener('scrollend', unpinAnchor, { once: true })
  target.addEventListener('wheel', unpinAnchor, { passive: true })
  target.addEventListener('touchstart', unpinAnchor, { passive: true })
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

/** The active item follows the page: the last section whose top has passed under the header. */
const readActiveAnchor = () => {
  if (pinnedAnchorKey || !anchors.length) {
    return
  }

  const { top, scrollTop, clientHeight, scrollHeight } = scrollMetrics()
  const offset = defaultAnchorOffset()
  let current = anchors[0].key

  for (const anchor of anchors) {
    const element = resolveAnchorElement(anchor)
    if (!element) {
      continue
    }

    if (element.getBoundingClientRect().top - top <= (anchor.offset ?? offset) + 8) {
      current = anchor.key
    }
  }

  // The sections at the end of a page can never be brought up to the header, so the last one takes
  // the bar once the page has run out of scroll -- otherwise it could not be reached by scrolling.
  if (scrollTop > 0 && scrollTop + clientHeight >= scrollHeight - 2) {
    current = anchors[anchors.length - 1].key
  }

  activeAnchorKey.value = current
}

let readScheduled = false
const onScroll = () => {
  if (readScheduled) {
    return
  }

  readScheduled = true
  requestAnimationFrame(() => {
    readScheduled = false
    readActiveAnchor()
  })
}

const scrollToAnchor = (anchor: PageLayoutAnchor) => {
  const element = resolveAnchorElement(anchor)
  if (!element) {
    return
  }

  activeAnchorKey.value = anchor.key
  pinAnchor(anchor.key)

  const offset = anchor.offset ?? defaultAnchorOffset()
  const el = scroller.value

  if (el) {
    el.scrollTo({ behavior: 'smooth', top: element.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - offset })
    return
  }

  window.scrollTo({ behavior: 'smooth', top: element.getBoundingClientRect().top + window.scrollY - offset })
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
  readActiveAnchor()
  computeAnchorNavigationFit()

  // Measure again once the first frame has been laid out. The measurement above usually stands,
  // but a header that is still settling (web fonts arriving, a sticky row being positioned) can
  // report a width the final layout does not agree with.
  requestAnimationFrame(() => {
    computeAnchorNavigationFit()
  })
})

onBeforeUnmount(() => {
  scrollEventTarget().removeEventListener('scroll', onScroll)
  unpinAnchor()

  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
})

watch(() => anchors, () => {
  if (!anchors.some((anchor) => anchor.key === activeAnchorKey.value)) {
    activeAnchorKey.value = anchors[0]?.key ?? ''
  }

  readActiveAnchor()
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
    display: flex;
    // Keep the list at its natural width while it overflows, so it can be measured
    flex-shrink: 0;
    gap: var(--kui-space-10, $kui-space-10);
    list-style: none;
    margin: var(--kui-space-0, $kui-space-0);
    padding: var(--kui-space-0, $kui-space-0);

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
    border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
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
    padding: var(--kui-space-20, $kui-space-20) var(--kui-space-40, $kui-space-40);
    text-overflow: ellipsis;
    transition: background-color var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in, color var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in;
    white-space: nowrap;

    &:hover {
      background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
      color: var(--kui-color-text, $kui-color-text);
    }

    &:focus-visible {
      box-shadow: var(--kui-shadow-focus, $kui-shadow-focus);
    }

    // The active section reads as the brand-coloured pill the sidebar's current item wears
    &.active {
      background-color: var(--kui-color-brand, $kui-color-brand);
      color: var(--kui-color-text, $kui-color-text);
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
