// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Labels from './Labels.vue'

describe('<Labels />', () => {
  it('renders', () => {
    const wrapper = mount(Labels)

    expect(wrapper.isVisible()).toBe(true)
  })
})
