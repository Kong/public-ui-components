// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Test from './Test.vue'

describe('<Test />', () => {
  it('renders', () => {
    const wrapper = mount(Test)

    expect(wrapper.isVisible()).toBe(true)
  })
})
