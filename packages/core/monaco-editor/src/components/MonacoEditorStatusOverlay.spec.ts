import { mount } from '@vue/test-utils'
import { markRaw } from 'vue'
import { describe, it, expect } from 'vitest'
import MonacoEditorStatusOverlay from './MonacoEditorStatusOverlay.vue'
import Kongponents from '@kong/kongponents'

const props = {
  title: 'My Title',
  message: 'My Message',
}

describe('MonacoEditorStatusOverlay', () => {
  it('should render title and message', () => {
    const wrapper = mount(MonacoEditorStatusOverlay, {
      props,
      global: {
        plugins: [Kongponents],
      },
    })

    expect(wrapper.text()).toContain(props.title)
    expect(wrapper.text()).toContain(props.message)
  })

  it('should render icon component', () => {
    const TestIcon = markRaw({
      template: '<svg class="test-icon"></svg>',
    })

    const wrapper = mount(MonacoEditorStatusOverlay, {
      props: {
        ...props,
        icon: TestIcon,
      },
      global: {
        plugins: [Kongponents],
      },
    })

    expect(wrapper.find('.test-icon').exists()).toBe(true)
  })

  it('should not render icon when icon prop is missing', () => {
    const wrapper = mount(MonacoEditorStatusOverlay, {
      props: {
        title: 'Empty',
        message: 'Nothing here',
      },
      global: {
        plugins: [Kongponents],
      },
    })

    expect(wrapper.find('.test-icon').exists()).toBe(false)
  })
})
