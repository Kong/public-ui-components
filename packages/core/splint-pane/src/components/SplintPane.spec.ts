// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SplintPane from './SplintPane.vue'

describe('<SplintPane />', () => {
  it('renders', () => {
    const wrapper = mount(SplintPane)

    expect(wrapper.isVisible()).toBe(true)
  })
})
