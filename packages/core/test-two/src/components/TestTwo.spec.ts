// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TestTwo from './TestTwo.vue'

describe('<TestTwo />', () => {
  it('renders', () => {
    const wrapper = mount(TestTwo)

    expect(wrapper.isVisible()).toBe(true)
  })
})
