// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfigEditor from './ConfigEditor.vue'

describe('<ConfigEditor />', () => {
  it('renders', () => {
    const wrapper = mount(ConfigEditor)

    expect(wrapper.isVisible()).toBe(true)
  })
})
