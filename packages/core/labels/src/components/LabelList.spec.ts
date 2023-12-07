// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LabelList from './LabelList.vue'

describe('<LabelList />', () => {
  it('renders', () => {
    const wrapper = mount(LabelList)

    expect(wrapper.isVisible()).toBe(true)
  })
})
