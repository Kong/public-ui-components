// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ErrorBoundary from './ErrorBoundary.vue'

describe('<ErrorBoundary />', () => {
  it('renders', () => {
    const wrapper = mount(ErrorBoundary)

    expect(wrapper.isVisible()).toBe(true)
  })
})
