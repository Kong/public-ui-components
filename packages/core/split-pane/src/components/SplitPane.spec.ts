// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SplitPane from './SplitPane.vue'

describe('<SplitPane />', () => {
  it('renders', () => {
    const wrapper = mount(SplitPane)

    expect(wrapper.isVisible()).toBe(true)
  })
})
