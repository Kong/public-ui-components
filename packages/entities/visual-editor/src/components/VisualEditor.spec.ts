// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VisualEditor from './VisualEditor.vue'

describe('<VisualEditor />', () => {
  it('renders', () => {
    const wrapper = mount(VisualEditor)

    expect(wrapper.isVisible()).toBe(true)
  })
})
