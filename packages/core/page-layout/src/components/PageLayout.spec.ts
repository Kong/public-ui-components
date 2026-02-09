// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageLayout from './PageLayout.vue'

describe('<PageLayout />', () => {
  it('renders', () => {
    const wrapper = mount(PageLayout)

    expect(wrapper.isVisible()).toBe(true)
  })
})
