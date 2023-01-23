// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppLayout from './AppLayout.vue'

describe('<AppLayout />', () => {
  it('renders', () => {
    const wrapper = mount(AppLayout)

    expect(wrapper.isVisible()).toBe(true)
  })
})
