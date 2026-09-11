// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ECharts from './ECharts.vue'

describe('<ECharts />', () => {
  it('renders', () => {
    const wrapper = mount(ECharts)

    expect(wrapper.isVisible()).toBe(true)
  })
})
