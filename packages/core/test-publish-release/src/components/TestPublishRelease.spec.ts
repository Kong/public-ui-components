// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TestPublishRelease from './TestPublishRelease.vue'

describe('<TestPublishRelease />', () => {
  it('renders', () => {
    const wrapper = mount(TestPublishRelease)

    expect(wrapper.isVisible()).toBe(true)
  })
})
