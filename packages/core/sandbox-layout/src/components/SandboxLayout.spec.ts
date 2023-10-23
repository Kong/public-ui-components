// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SandboxLayout from './SandboxLayout.vue'

describe('<SandboxLayout />', () => {
  it('renders', () => {
    const wrapper = mount(SandboxLayout)

    expect(wrapper.isVisible()).toBe(true)
  })
})
