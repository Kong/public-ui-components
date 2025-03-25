// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TestPublishKhcp15589 from './TestPublishKhcp15589.vue'

describe('<TestPublishKhcp15589 />', () => {
  it('renders', () => {
    const wrapper = mount(TestPublishKhcp15589)

    expect(wrapper.isVisible()).toBe(true)
  })
})
