// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AnalyticsEcharts from './AnalyticsEcharts.vue'

describe('<AnalyticsEcharts />', () => {
  it('renders', () => {
    const wrapper = mount(AnalyticsEcharts)

    expect(wrapper.isVisible()).toBe(true)
  })
})
