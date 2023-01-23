// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VueSpecRenderer from './VueSpecRenderer.vue'

describe('<VueSpecRenderer />', () => {
  it('renders', () => {
    const wrapper = mount(VueSpecRenderer)

    expect(wrapper.isVisible()).toBe(true)
  })
})
