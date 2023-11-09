// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EntityLink from './EntityLink.vue'

describe('<EntityLink />', () => {
  it('renders', () => {
    const wrapper = mount(EntityLink)

    expect(wrapper.isVisible()).toBe(true)
  })
})
