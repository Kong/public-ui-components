// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PublhingPkg2 from './PublhingPkg2.vue'

describe('<PublhingPkg2 />', () => {
  it('renders', () => {
    const wrapper = mount(PublhingPkg2)

    expect(wrapper.isVisible()).toBe(true)
  })
})
