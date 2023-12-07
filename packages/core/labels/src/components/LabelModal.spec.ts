// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LabelModal from './LabelModal.vue'

describe('<LabelModal />', () => {
  it('renders', () => {
    const wrapper = mount(LabelModal)

    expect(wrapper.isVisible()).toBe(true)
  })
})
