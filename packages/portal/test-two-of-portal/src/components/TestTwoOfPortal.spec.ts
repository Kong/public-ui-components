// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TestTwoOfPortal from './TestTwoOfPortal.vue'

describe('<TestTwoOfPortal />', () => {
  it('renders', () => {
    const wrapper = mount(TestTwoOfPortal)

    expect(wrapper.isVisible()).toBe(true)
  })
})
