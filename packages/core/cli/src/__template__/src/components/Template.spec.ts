// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import {%%COMPONENT_NAME%%} from './{%%COMPONENT_NAME%%}.vue'

describe('<{%%COMPONENT_NAME%%} />', () => {
  it('renders', () => {
    const wrapper = mount({%%COMPONENT_NAME%%})

    expect(wrapper.isVisible()).toBe(true)
  })
})
