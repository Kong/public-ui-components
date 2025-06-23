// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EntitiesConfigEditor from './EntitiesConfigEditor.vue'

describe('<EntitiesConfigEditor />', () => {
  it('renders', () => {
    const wrapper = mount(EntitiesConfigEditor)

    expect(wrapper.isVisible()).toBe(true)
  })
})
