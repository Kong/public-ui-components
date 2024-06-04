// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AnalyticsGeoMap from './AnalyticsGeoMap.vue'

describe('<AnalyticsGeoMap />', () => {
  it('renders', () => {
    const wrapper = mount(AnalyticsGeoMap)

    expect(wrapper.isVisible()).toBe(true)
  })
})
