// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FreeformContainer from './FreeformContainer.vue'

describe('<FreeformContainer />', () => {
  it('renders', () => {
    const wrapper = mount(FreeformContainer)

    expect(wrapper.isVisible()).toBe(true)
  })
})
