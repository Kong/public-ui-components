// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EntitiesPluginsIcon from './EntitiesPluginsIcon.vue'

describe('<EntitiesPluginsIcon />', () => {
  it('renders', () => {
    const wrapper = mount(EntitiesPluginsIcon)

    expect(wrapper.isVisible()).toBe(true)
  })
})
