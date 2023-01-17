// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Portaltestone from './Portaltestone.vue'

describe('<Portaltestone />', () => {
  it('renders', () => {
    const wrapper = mount(Portaltestone)

    expect(wrapper.isVisible()).toBe(true)
  })
})
