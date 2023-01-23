// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VueMiniSpecRenderer from './VueMiniSpecRenderer.vue'

describe('<VueMiniSpecRenderer />', () => {
  it('renders', () => {
    const wrapper = mount(VueMiniSpecRenderer)

    expect(wrapper.isVisible()).toBe(true)
  })
})
