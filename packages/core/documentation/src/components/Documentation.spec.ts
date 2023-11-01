// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Documentation from './Documentation.vue'

describe('<Documentation />', () => {
  it('renders', () => {
    const wrapper = mount(Documentation)

    expect(wrapper.isVisible()).toBe(true)
  })
})
