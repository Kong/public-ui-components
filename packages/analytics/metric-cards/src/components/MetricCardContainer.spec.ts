// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MetricCardContainer from './MetricCardContainer.vue'

describe('<MetricCardContainer />', () => {
  it('renders', () => {
    const wrapper = mount(MetricCardContainer)

    expect(wrapper.isVisible()).toBe(true)
  })
})
