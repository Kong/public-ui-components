import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, enableAutoUnmount, type VueWrapper } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import Kongponents from '@kong/kongponents'
import PageLayoutAnchorNavigation from './PageLayoutAnchorNavigation.vue'
import type { PageLayoutAnchor } from '../types'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/:pathMatch(.*)*', name: 'catch-all', component: { template: '<div />' } }],
})

/* ------------------------------------------------------------------ *
 * The widths the component budgets with. Mirrored from the component so a change to either side
 * shows up as a failing expectation rather than as silently different behaviour.
 * ------------------------------------------------------------------ */
const PILL_WIDTH = 140
const ELLIPSIS_WIDTH = 16
const CARET_WIDTH = 22
const ITEM_GAP = 2
const END_PADDING = 16

/** The width the bar needs before it will show `count` pills, both ellipses and the dropdown */
const widthForPills = (count: number): number =>
  (count * PILL_WIDTH) + (2 * ELLIPSIS_WIDTH) + CARET_WIDTH + ((count + 2) * ITEM_GAP) + END_PADDING

/** The width the bar needs for the active pill and the dropdown alone */
const widthForActiveOnly = (): number => PILL_WIDTH + CARET_WIDTH + ITEM_GAP + END_PADDING

/** The width at which every anchor fits in the bar with no dropdown at all */
const widthForAll = (count: number): number => (count * PILL_WIDTH) + END_PADDING

/** How far apart the stubbed sections sit, so `scrollTo(n)` puts section `n` under the header */
const SECTION_SPACING = 1000

/* ------------------------------------------------------------------ *
 * Harness
 *
 * jsdom has no layout engine, so every element measures 0x0 and reports no scroll position. Both
 * the overflow math and the active-item tracking have to be fed stubbed measurements instead.
 * ------------------------------------------------------------------ */

/** The width `.page-layout-anchor-navigation` reports -- i.e. the room the header row leaves it */
let availableWidth = 0
/** How far the scroll container has been scrolled, in the units `SECTION_SPACING` is expressed in */
let scrollPosition = 0
/** The scrolling ancestor the component finds, and the element the sections live in */
let scroller: HTMLElement
/** Every `scrollTo` the component asked the scroller for */
let scrollToCalls: ScrollToOptions[]

const resizeObserverCallbacks = new Set<ResizeObserverCallback>()

class ResizeObserverStub implements ResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {
    resizeObserverCallbacks.add(callback)
  }

  observe(): void {}
  unobserve(): void {}

  disconnect(): void {
    resizeObserverCallbacks.delete(this.callback)
  }
}

global.ResizeObserver = ResizeObserverStub

/** Adds a section to the scroll container at `index * SECTION_SPACING` down the page */
const addSection = (index: number, attributes: { id?: string, dataSection?: string } = {}): HTMLElement => {
  const section = document.createElement('section')

  if (attributes.id) {
    section.id = attributes.id
  }

  if (attributes.dataSection) {
    section.setAttribute('data-section', attributes.dataSection)
  }

  section.dataset.sectionIndex = String(index)
  scroller.appendChild(section)

  return section
}

/** Builds `count` anchors, each with a section in the page, in page order */
const buildAnchors = (count: number): PageLayoutAnchor[] =>
  Array.from({ length: count }, (_, index) => {
    addSection(index, { id: `section-${index}` })

    return { key: `section-${index}`, label: `Section ${index}`, selector: `#section-${index}` }
  })

const mountBar = (anchors: PageLayoutAnchor[]) => mount(PageLayoutAnchorNavigation, {
  props: { anchors },
  attachTo: scroller,
  global: { plugins: [Kongponents, router] },
})

/** Settles the component's mount-time read, which finishes on the next animation frame */
const settle = async (): Promise<void> => {
  await flushPromises()
  await new Promise((resolve) => requestAnimationFrame(resolve))
  await flushPromises()
}

/** Scrolls the container so that `sectionIndex` sits under the header, as a reader would */
const scrollToSection = async (sectionIndex: number): Promise<void> => {
  scrollPosition = sectionIndex * SECTION_SPACING
  scroller.dispatchEvent(new Event('scroll'))
  await settle()
}

/** Notifies the component's `useResizeObserver` callback, as the browser would on a resize */
const triggerResize = async (): Promise<void> => {
  for (const callback of resizeObserverCallbacks) {
    callback([], {} as ResizeObserver)
  }

  // The component debounces the resize handler by 150ms
  await new Promise((resolve) => setTimeout(resolve, 200))
  await settle()
}

const pillLabels = (wrapper: VueWrapper<any>): string[] =>
  wrapper.findAll('.anchor-link').map((pill) => pill.text())

const activePillLabel = (wrapper: VueWrapper<any>): string | undefined =>
  wrapper.findAll('.anchor-link').find((pill) => pill.classes('active'))?.text()

const dropdownLabels = async (wrapper: VueWrapper<any>): Promise<string[]> => {
  await wrapper.getTestId('anchor-navigation-overflow-dropdown-button').trigger('click')
  await flushPromises()

  return wrapper.findAll('.k-dropdown-item').map((item) => item.text())
}

enableAutoUnmount(afterEach)

describe('<PageLayoutAnchorNavigation />', () => {
  beforeEach(async () => {
    await router.push('/')

    scrollPosition = 0
    scrollToCalls = []

    scroller = document.createElement('div')
    // What `findScroller` looks for when it walks up from the bar
    scroller.style.overflowY = 'auto'
    scroller.scrollTo = ((options: ScrollToOptions) => {
      scrollToCalls.push(options)
    }) as typeof scroller.scrollTo
    document.body.appendChild(scroller)

    // Wide enough that nothing overflows unless a test narrows it
    availableWidth = widthForAll(50)

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function(this: Element): DOMRect {
      let width = 0
      let top = 0

      if (this.classList.contains('page-layout-anchor-navigation')) {
        width = availableWidth
      } else if (this.tagName === 'UL') {
        // Measured only while every anchor is on show, so the list is pills and nothing else
        width = this.querySelectorAll('.anchor-link').length * PILL_WIDTH
      } else if (this instanceof HTMLElement && this.dataset.sectionIndex !== undefined) {
        // Where this section sits relative to the top of the scroll container right now
        top = (Number(this.dataset.sectionIndex) * SECTION_SPACING) - scrollPosition
      }

      return { width, height: 0, top, right: width, bottom: 0, left: 0, x: 0, y: top, toJSON: () => ({}) } as DOMRect
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resizeObserverCallbacks.clear()
    document.body.innerHTML = ''
  })

  describe('rendering', () => {
    it('renders a pill for every anchor when they all fit', async () => {
      const wrapper = mountBar(buildAnchors(4))

      await settle()

      expect(wrapper.getTestId('page-layout-anchor-navigation').exists()).toBe(true)
      expect(pillLabels(wrapper)).toEqual(['Section 0', 'Section 1', 'Section 2', 'Section 3'])
    })

    it('renders no overflow dropdown or ellipsis when everything fits', async () => {
      const wrapper = mountBar(buildAnchors(4))

      await settle()

      expect(wrapper.findTestId('anchor-navigation-overflow-dropdown-button').exists()).toBe(false)
      expect(wrapper.findTestId('anchor-navigation-leading-ellipsis').exists()).toBe(false)
      expect(wrapper.findTestId('anchor-navigation-trailing-ellipsis').exists()).toBe(false)
    })

    it('marks the anchor the reader is in as the current one', async () => {
      const wrapper = mountBar(buildAnchors(4))

      await settle()

      const active = wrapper.getTestId('page-layout-anchor-section-0')

      expect(active.classes()).toContain('active')
      expect(active.attributes('aria-current')).toBe('location')
      expect(wrapper.getTestId('page-layout-anchor-section-1').attributes('aria-current')).toBeUndefined()
    })

    it('generates a data-testid from the key, and honours an explicit one', async () => {
      addSection(0, { id: 'generated' })
      addSection(1, { id: 'explicit' })

      const wrapper = mountBar([
        { key: 'generated', label: 'Generated', selector: '#generated' },
        { key: 'explicit', label: 'Explicit', selector: '#explicit', dataTestId: 'my-own-testid' },
      ])

      await settle()

      expect(wrapper.findTestId('page-layout-anchor-generated').exists()).toBe(true)
      expect(wrapper.findTestId('my-own-testid').exists()).toBe(true)
      expect(wrapper.findTestId('page-layout-anchor-explicit').exists()).toBe(false)
    })

    it('hides the ellipsis from assistive technology', async () => {
      availableWidth = widthForPills(3)

      const wrapper = mountBar(buildAnchors(8))

      await settle()

      expect(wrapper.getTestId('anchor-navigation-trailing-ellipsis').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('resolving sections', () => {
    it('renders an anchor targeted by a selector other than an id', async () => {
      addSection(0, { dataSection: 'by-attribute' })

      const wrapper = mountBar([
        { key: 'by-attribute', label: 'By attribute', selector: '[data-section="by-attribute"]' },
      ])

      await settle()

      expect(pillLabels(wrapper)).toEqual(['By attribute'])
    })

    it('renders an anchor targeted by its element', async () => {
      const section = addSection(0)

      const wrapper = mountBar([{ key: 'by-element', label: 'By element', element: section }])

      await settle()

      expect(pillLabels(wrapper)).toEqual(['By element'])
    })

    it('drops anchors whose selector matches nothing', async () => {
      const anchors = buildAnchors(2)
      anchors.push({ key: 'missing', label: 'Missing', selector: '#not-on-the-page' })

      const wrapper = mountBar(anchors)

      await settle()

      expect(pillLabels(wrapper)).toEqual(['Section 0', 'Section 1'])
    })

    it('drops anchors with an invalid selector rather than throwing', async () => {
      const anchors = buildAnchors(2)
      anchors.push({ key: 'invalid', label: 'Invalid', selector: ':::not a selector' })

      const wrapper = mountBar(anchors)

      await settle()

      expect(pillLabels(wrapper)).toEqual(['Section 0', 'Section 1'])
    })

    it('drops anchors that name neither a selector nor an element', async () => {
      const anchors = buildAnchors(2)
      anchors.push({ key: 'no-target', label: 'No target' })

      const wrapper = mountBar(anchors)

      await settle()

      expect(pillLabels(wrapper)).toEqual(['Section 0', 'Section 1'])
    })

    it('drops an anchor whose element is no longer on the page', async () => {
      const anchors = buildAnchors(2)
      const detached = document.createElement('section')
      anchors.push({ key: 'detached', label: 'Detached', element: detached })

      const wrapper = mountBar(anchors)

      await settle()

      expect(pillLabels(wrapper)).toEqual(['Section 0', 'Section 1'])
    })

    it('picks up a section that only appears after mount', async () => {
      const anchors = buildAnchors(2)
      anchors.push({ key: 'late', label: 'Arrives later', selector: '#late' })

      const wrapper = mountBar(anchors)

      await settle()

      expect(pillLabels(wrapper)).not.toContain('Arrives later')

      addSection(2, { id: 'late' })
      await scrollToSection(0)

      expect(pillLabels(wrapper)).toContain('Arrives later')
    })

    it('drops a section that is removed from the page', async () => {
      const anchors = buildAnchors(3)

      const wrapper = mountBar(anchors)

      await settle()

      expect(pillLabels(wrapper)).toHaveLength(3)

      document.querySelector('#section-2')?.remove()
      await scrollToSection(0)

      expect(pillLabels(wrapper)).toEqual(['Section 0', 'Section 1'])
    })

    it('renders anchors added to the prop after mount', async () => {
      const anchors = buildAnchors(2)
      const wrapper = mountBar(anchors)

      await settle()

      addSection(2, { id: 'section-2' })
      await wrapper.setProps({
        anchors: [...anchors, { key: 'section-2', label: 'Section 2', selector: '#section-2' }],
      })
      await settle()

      expect(pillLabels(wrapper)).toEqual(['Section 0', 'Section 1', 'Section 2'])
    })
  })

  describe('overflow', () => {
    it('pins the window to the start while the reader is in the first sections', async () => {
      availableWidth = widthForPills(3)

      const wrapper = mountBar(buildAnchors(8))

      await settle()

      expect(pillLabels(wrapper)).toEqual(['Section 0', 'Section 1', 'Section 2'])
      expect(wrapper.findTestId('anchor-navigation-leading-ellipsis').exists()).toBe(false)
      expect(wrapper.findTestId('anchor-navigation-trailing-ellipsis').exists()).toBe(true)
    })

    it('centres the active pill in a three-pill window in the middle of the page', async () => {
      availableWidth = widthForPills(3)

      const wrapper = mountBar(buildAnchors(8))

      await settle()
      await scrollToSection(3)

      expect(pillLabels(wrapper)).toEqual(['Section 2', 'Section 3', 'Section 4'])
      expect(activePillLabel(wrapper)).toBe('Section 3')
      expect(wrapper.findTestId('anchor-navigation-leading-ellipsis').exists()).toBe(true)
      expect(wrapper.findTestId('anchor-navigation-trailing-ellipsis').exists()).toBe(true)
    })

    it('pins the window to the end once the reader reaches the last sections', async () => {
      availableWidth = widthForPills(3)

      const wrapper = mountBar(buildAnchors(8))

      await settle()
      await scrollToSection(7)

      expect(pillLabels(wrapper)).toEqual(['Section 5', 'Section 6', 'Section 7'])
      expect(wrapper.findTestId('anchor-navigation-leading-ellipsis').exists()).toBe(true)
      expect(wrapper.findTestId('anchor-navigation-trailing-ellipsis').exists()).toBe(false)
    })

    it('puts the active pill last in a two-pill window', async () => {
      availableWidth = widthForPills(2)

      const wrapper = mountBar(buildAnchors(8))

      await settle()
      await scrollToSection(3)

      expect(pillLabels(wrapper)).toEqual(['Section 2', 'Section 3'])
      expect(activePillLabel(wrapper)).toBe('Section 3')
    })

    it('keeps the number of pills steady as the reader scrolls', async () => {
      availableWidth = widthForPills(3)

      const wrapper = mountBar(buildAnchors(8))

      await settle()

      for (const sectionIndex of [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 0]) {
        await scrollToSection(sectionIndex)

        expect(pillLabels(wrapper)).toHaveLength(3)
        expect(activePillLabel(wrapper)).toBe(`Section ${sectionIndex}`)
      }
    })

    it('falls back to the active pill alone when a window no longer fits', async () => {
      availableWidth = widthForActiveOnly()

      const wrapper = mountBar(buildAnchors(8))

      await settle()
      await scrollToSection(4)

      expect(pillLabels(wrapper)).toEqual(['Section 4'])
      expect(wrapper.findTestId('anchor-navigation-overflow-dropdown-button').exists()).toBe(true)
      expect(wrapper.findTestId('anchor-navigation-leading-ellipsis').exists()).toBe(false)
      expect(wrapper.findTestId('anchor-navigation-trailing-ellipsis').exists()).toBe(false)
    })

    it('renders nothing at all when not even one pill and the dropdown fit', async () => {
      availableWidth = widthForActiveOnly() - 1

      const wrapper = mountBar(buildAnchors(8))

      await settle()

      expect(pillLabels(wrapper)).toEqual([])
      expect(wrapper.findTestId('anchor-navigation-overflow-dropdown-button').exists()).toBe(false)
    })

    it('recomputes when the bar is resized', async () => {
      const anchors = buildAnchors(8)
      const wrapper = mountBar(anchors)

      await settle()

      expect(pillLabels(wrapper)).toHaveLength(8)

      availableWidth = widthForPills(2)
      await triggerResize()

      expect(pillLabels(wrapper)).toHaveLength(2)
    })

    it('lists every resolved anchor in the dropdown, the active one included', async () => {
      availableWidth = widthForPills(3)

      const wrapper = mountBar(buildAnchors(8))

      await settle()
      await scrollToSection(3)

      expect(await dropdownLabels(wrapper)).toEqual([
        'Section 0', 'Section 1', 'Section 2', 'Section 3',
        'Section 4', 'Section 5', 'Section 6', 'Section 7',
      ])
    })

    it('leaves an unresolved anchor out of the dropdown too', async () => {
      availableWidth = widthForPills(3)

      const anchors = buildAnchors(8)
      anchors.push({ key: 'missing', label: 'Missing', selector: '#not-on-the-page' })

      const wrapper = mountBar(anchors)

      await settle()

      expect(await dropdownLabels(wrapper)).not.toContain('Missing')
    })

    it('renders the dropdown as the last item in the bar', async () => {
      availableWidth = widthForPills(3)

      const wrapper = mountBar(buildAnchors(8))

      await settle()
      await scrollToSection(3)

      const barItems = wrapper.getTestId('page-layout-anchor-navigation').element.querySelector('ul')!.children
      const lastItem = barItems[barItems.length - 1]

      expect(lastItem.querySelector('[data-testid="anchor-navigation-overflow-dropdown-button"]')).not.toBeNull()
    })
  })

  describe('scrolling to a section', () => {
    it('scrolls the scroll container so the section lands below the header', async () => {
      const wrapper = mountBar(buildAnchors(4))

      await settle()
      await wrapper.getTestId('page-layout-anchor-section-2').trigger('click')

      // Section 2 sits 2000px down; the default offset is the header height (none here) plus
      // `--kui-space-60`
      expect(scrollToCalls).toHaveLength(1)
      expect(scrollToCalls[0].top).toBe((2 * SECTION_SPACING) - 16)
      expect(scrollToCalls[0].behavior).toBe('smooth')
    })

    it('honours a per-anchor offset', async () => {
      const anchors = buildAnchors(4)
      anchors[2].offset = 160

      const wrapper = mountBar(anchors)

      await settle()
      await wrapper.getTestId('page-layout-anchor-section-2').trigger('click')

      expect(scrollToCalls[0].top).toBe((2 * SECTION_SPACING) - 160)
    })

    it('scrolls to the section of an anchor targeted by its element', async () => {
      const section = addSection(3)

      const wrapper = mountBar([{ key: 'by-element', label: 'By element', element: section }])

      await settle()
      await wrapper.getTestId('page-layout-anchor-by-element').trigger('click')

      expect(scrollToCalls[0].top).toBe((3 * SECTION_SPACING) - 16)
    })

    it('scrolls the same way from the overflow dropdown', async () => {
      availableWidth = widthForPills(3)

      const wrapper = mountBar(buildAnchors(8))

      await settle()
      await wrapper.getTestId('anchor-navigation-overflow-dropdown-button').trigger('click')
      await flushPromises()

      await wrapper.findAll('.k-dropdown-item')[6].find('.dropdown-item-trigger').trigger('click')
      await flushPromises()

      expect(scrollToCalls).toHaveLength(1)
      expect(scrollToCalls[0].top).toBe((6 * SECTION_SPACING) - 16)
    })

    it('follows the reader as the page scrolls', async () => {
      const wrapper = mountBar(buildAnchors(4))

      await settle()

      expect(activePillLabel(wrapper)).toBe('Section 0')

      await scrollToSection(2)

      expect(activePillLabel(wrapper)).toBe('Section 2')
    })

    it('hands the bar to the last section once the page has run out of scroll', async () => {
      const wrapper = mountBar(buildAnchors(4))

      await settle()

      // Part-way down the page, but with no further to scroll: the sections below the header can
      // never be brought up to it, so the last one takes the bar
      scrollPosition = SECTION_SPACING
      Object.defineProperty(scroller, 'scrollTop', { value: 1, configurable: true })
      Object.defineProperty(scroller, 'clientHeight', { value: 500, configurable: true })
      Object.defineProperty(scroller, 'scrollHeight', { value: 501, configurable: true })

      scroller.dispatchEvent(new Event('scroll'))
      await settle()

      expect(activePillLabel(wrapper)).toBe('Section 3')
    })
  })
})
