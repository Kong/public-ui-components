// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TestPublishTag from './TestPublishTag.vue'

describe('<TestPublishTag />', () => {
  it('renders', () => {
    const wrapper = mount(TestPublishTag)

    expect(wrapper.isVisible()).toBe(true)
  })
})
