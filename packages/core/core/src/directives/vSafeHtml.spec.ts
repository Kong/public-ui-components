import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { vSafeHtml } from './vSafeHtml'

const TestComponent = defineComponent({
  name: 'TestComponent',
  directives: { safeHtml: vSafeHtml },
  props: {
    content: {
      type: [String, Object],
      required: true,
    },
  },
  template: '<div v-safe-html="content"></div>',
})

describe('vSafeHtml', () => {
  it('sanitizes unsafe html', () => {
    const wrapper = mount(TestComponent, {
      props: {
        content: '<strong>ok</strong><script>alert(1)</script>',
      },
    })

    const html = wrapper.html()
    expect(html).toContain('<strong>ok</strong>')
    expect(html).not.toContain('<script')
  })

  it('respects DOMPurify config', () => {
    const wrapper = mount(TestComponent, {
      props: {
        content: {
          html: '<strong>no</strong><em>yes</em>',
          config: { ALLOWED_TAGS: ['em'] },
        },
      },
    })

    const html = wrapper.html()
    expect(html).toContain('<em>yes</em>')
    expect(html).not.toContain('<strong>')
  })

  it('updates when value changes', async () => {
    const wrapper = mount(TestComponent, {
      props: {
        content: '<strong>one</strong>',
      },
    })

    expect(wrapper.html()).toContain('<strong>one</strong>')

    await wrapper.setProps({ content: '<strong>two</strong>' })

    expect(wrapper.html()).toContain('<strong>two</strong>')
    expect(wrapper.html()).not.toContain('one')
  })
})
