import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import MonacoEditorEmptyState from './MonacoEditorEmptyState.vue'
import { KEmptyState } from '@kong/kongponents'

const stubs = {
  KEmptyState,
}

const props = {
  title: 'My Title',
  message: 'My Message',
}

describe('MonacoEditorEmptyState', () => {
  it('should render title and message', () => {
    const wrapper = mount(MonacoEditorEmptyState, {
      props,
      global: {
        stubs,
      },
    })

    expect(wrapper.text()).toContain(props.title)
    expect(wrapper.text()).toContain(props.message)
  })

  it('should render icon component', () => {
    const TestIcon = {
      template: '<svg class="test-icon"></svg>',
    }

    const wrapper = mount(MonacoEditorEmptyState, {
      props: {
        ...props,
        icon: TestIcon,
      },
      global: {
        stubs,
      },
    })

    expect(wrapper.find('.test-icon').exists()).toBe(true)
  })

  it('should not render icon when icon prop is missing', () => {
    const wrapper = mount(MonacoEditorEmptyState, {
      props: {
        title: 'Empty',
        message: 'Nothing here',
      },
    })

    expect(wrapper.find('.test-icon').exists()).toBe(false)
  })
})
