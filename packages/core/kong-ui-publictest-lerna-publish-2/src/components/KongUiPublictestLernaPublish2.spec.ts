// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import KongUiPublictestLernaPublish2 from './KongUiPublictestLernaPublish2.vue'

describe('<KongUiPublictestLernaPublish2 />', () => {
  it('renders', () => {
    const wrapper = mount(KongUiPublictestLernaPublish2)

    expect(wrapper.isVisible()).toBe(true)
  })
})
