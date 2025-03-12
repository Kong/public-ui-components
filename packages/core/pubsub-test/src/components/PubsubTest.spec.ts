// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PubsubTest from './PubsubTest.vue'

describe('<PubsubTest />', () => {
  it('renders', () => {
    const wrapper = mount(PubsubTest)

    expect(wrapper.isVisible()).toBe(true)
  })
})
