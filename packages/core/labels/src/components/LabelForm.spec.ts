// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LabelForm from './LabelForm.vue'

describe('<LabelForm />', () => {
  it('renders', () => {
    const wrapper = mount(LabelForm)

    expect(wrapper.isVisible()).toBe(true)
  })
})
