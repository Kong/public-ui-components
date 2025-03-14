// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TestLernaPublish from './TestLernaPublish.vue'

describe('<TestLernaPublish />', () => {
  it('renders', () => {
    const wrapper = mount(TestLernaPublish)

    expect(wrapper.isVisible()).toBe(true)
  })
})
