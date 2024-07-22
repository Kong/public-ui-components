// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VueFormGenerator from '../FormGenerator.vue'

describe('<VueFormGenerator />', () => {
  it('renders', () => {
    const wrapper = mount(VueFormGenerator, {
      props: {
        schema: {},
      },
    })

    expect(wrapper.isVisible()).toBe(true)
  })
})
