// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TestOne from './TestOne.vue'

describe('<TestOne />', () => {
  it('renders', () => {
    const wrapper = mount(TestOne)

    expect(wrapper.isVisible()).toBe(true)
  })
})
