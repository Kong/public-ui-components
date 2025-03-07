// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TestPublishing1 from './TestPublishing1.vue'

describe('<TestPublishing1 />', () => {
  it('renders', () => {
    const wrapper = mount(TestPublishing1)

    expect(wrapper.isVisible()).toBe(true)
  })
})
