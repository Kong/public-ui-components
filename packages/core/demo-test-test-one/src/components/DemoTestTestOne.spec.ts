// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DemoTestTestOne from './DemoTestTestOne.vue'

describe('<DemoTestTestOne />', () => {
  it('renders', () => {
    const wrapper = mount(DemoTestTestOne)

    expect(wrapper.isVisible()).toBe(true)
  })
})
