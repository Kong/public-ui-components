import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import Kongponents from '@kong/kongponents'
import AboutCard from './AboutCard.vue'
import type { AboutCardRow } from '../types'

const rows: AboutCardRow[] = [
  { key: 'name', label: 'Name', value: 'gpt-4o-multi-purpose', tooltip: 'The display name of this model.' },
  { key: 'id', label: 'ID', value: 'default-model-1' },
  { key: 'enabled', label: 'Enabled' },
]

describe('<AboutCard />', () => {
  const createWrapper = (props = {}, slots = {}) => mount(AboutCard, {
    props: { rows, ...props },
    slots,
    global: {
      plugins: [Kongponents],
    },
  })

  describe('rendering', () => {
    it('should render the component', () => {
      expect(createWrapper().find('.kong-ui-public-about-card').exists()).toBe(true)
    })

    it('should render the title', () => {
      expect(createWrapper({ title: 'About this model' }).text()).toContain('About this model')
    })

    it('should render the title as the tag given by `titleTag`', () => {
      const wrapper = createWrapper({ title: 'About this model', titleTag: 'h3' })

      expect(wrapper.find('h3.card-title').exists()).toBe(true)
    })

    it('should render the description only when one is given', () => {
      expect(createWrapper().findTestId('about-card-description').exists()).toBe(false)

      const wrapper = createWrapper({ description: 'A model served by the gateway.' })

      expect(wrapper.getTestId('about-card-description').text()).toBe('A model served by the gateway.')
    })

    it('should render a row per entry, with its label and value', () => {
      const wrapper = createWrapper()

      expect(wrapper.findAll('.about-card-row')).toHaveLength(rows.length)

      const nameRow = wrapper.getTestId('about-card-row-name')

      expect(nameRow.get('dt').text()).toContain('Name')
      expect(nameRow.get('dd').text()).toBe('gpt-4o-multi-purpose')
    })

    it('should not render the rows list when there are no rows', () => {
      const wrapper = createWrapper({ rows: [] })

      expect(wrapper.findTestId('about-card-rows').exists()).toBe(false)
    })

    it('should render the default slot content', () => {
      const wrapper = createWrapper({}, { default: '<span data-testid="extra">Extra</span>' })

      expect(wrapper.getTestId('about-card-content').text()).toBe('Extra')
    })

    it('should not render the content wrapper without default slot content', () => {
      expect(createWrapper().findTestId('about-card-content').exists()).toBe(false)
    })
  })

  describe('semantics', () => {
    // The label-to-value association is the reason these are not `KLabel`s, so it is
    // worth pinning down: a `<label>` outside a form control carries no semantics.
    it('should render the rows as a description list', () => {
      const wrapper = createWrapper()
      const list = wrapper.getTestId('about-card-rows')

      expect(list.element.tagName).toBe('DL')

      const row = wrapper.getTestId('about-card-row-name')

      expect(row.findAll('dt')).toHaveLength(1)
      expect(row.findAll('dd')).toHaveLength(1)
      expect(wrapper.find('label').exists()).toBe(false)
    })
  })

  describe('tooltips', () => {
    it('should render a tooltip trigger only for rows that define a tooltip', () => {
      const wrapper = createWrapper()

      expect(wrapper.findTestId('about-card-row-name-tooltip').exists()).toBe(true)
      expect(wrapper.findTestId('about-card-row-id-tooltip').exists()).toBe(false)
    })

    it('should expose the tooltip text to assistive technology', () => {
      const trigger = createWrapper().getTestId('about-card-row-name-tooltip')

      expect(trigger.element.tagName).toBe('BUTTON')
      expect(trigger.attributes('aria-label')).toBe('The display name of this model.')
    })
  })

  describe('loading state', () => {
    it('should render skeletons instead of the rows while loading', () => {
      const wrapper = createWrapper({ isLoading: true })

      expect(wrapper.getTestId('about-card-skeleton').exists()).toBe(true)
      expect(wrapper.findTestId('about-card-rows').exists()).toBe(false)
    })

    it('should render one skeleton per row, so the card keeps its height', () => {
      const wrapper = createWrapper({ isLoading: true })

      expect(wrapper.getTestId('about-card-skeleton').findAllComponents({ name: 'KSkeletonBox' })).toHaveLength(rows.length)
    })

    it('should still render the title and description while loading', () => {
      const wrapper = createWrapper({ isLoading: true, title: 'About this model', description: 'Loading…' })

      expect(wrapper.text()).toContain('About this model')
      expect(wrapper.getTestId('about-card-description').exists()).toBe(true)
    })
  })

  describe('slots', () => {
    it('should override a row label through the `label-${key}` slot', () => {
      const wrapper = createWrapper({}, { 'label-name': '<span data-testid="custom-label">Custom</span>' })

      expect(wrapper.getTestId('custom-label').text()).toBe('Custom')
      expect(wrapper.getTestId('about-card-row-name').get('dt').text()).not.toContain('Name')
    })

    it('should keep the tooltip when the label is overridden', () => {
      const wrapper = createWrapper({}, { 'label-name': '<span>Custom</span>' })

      expect(wrapper.findTestId('about-card-row-name-tooltip').exists()).toBe(true)
    })

    it('should override a row value through the `row-${key}` slot', () => {
      const wrapper = createWrapper({}, { 'row-enabled': '<span data-testid="custom-value">Yes</span>' })

      expect(wrapper.getTestId('about-card-row-enabled').get('dd').text()).toBe('Yes')
      expect(wrapper.getTestId('custom-value').exists()).toBe(true)
    })

    it('should pass the row to the per-row slots', () => {
      const wrapper = createWrapper({}, {
        'row-name': ({ row }: { row: AboutCardRow }) => h('span', { 'data-testid': 'slot-prop' }, `${row.key}:${row.value}`),
      })

      expect(wrapper.getTestId('slot-prop').text()).toBe('name:gpt-4o-multi-purpose')
    })

    it('should render the title and actions slots', () => {
      const wrapper = createWrapper({ title: 'Ignored' }, {
        title: '<span data-testid="custom-title">Custom title</span>',
        actions: '<button data-testid="custom-action">Edit</button>',
      })

      expect(wrapper.getTestId('custom-title').text()).toBe('Custom title')
      expect(wrapper.getTestId('custom-action').exists()).toBe(true)
    })
  })
})
