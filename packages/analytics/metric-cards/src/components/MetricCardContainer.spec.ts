// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MetricCards from './MetricCards.vue'

describe('<MetricCards />', () => {
  it('renders', () => {
    const wrapper = mount(MetricCards)

    expect(wrapper.isVisible()).toBe(true)
  })
})
