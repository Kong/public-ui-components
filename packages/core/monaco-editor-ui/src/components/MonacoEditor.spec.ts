// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MonacoEditor from './MonacoEditor.vue'

describe('<MonacoEditor />', () => {
  it('renders', () => {
    const wrapper = mount(MonacoEditor)

    expect(wrapper.isVisible()).toBe(true)
  })
})
