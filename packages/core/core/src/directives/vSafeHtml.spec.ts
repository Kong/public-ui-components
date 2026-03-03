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

  it('updates when object content html changes', async () => {
    const content = {
      html: '<strong>one</strong>',
      config: { ALLOWED_TAGS: ['strong'] },
    }
    const wrapper = mount(TestComponent, {
      props: {
        content,
      },
    })
    expect(wrapper.html()).toContain('<strong>one</strong>')
    content.html = '<strong>two</strong>'
    await wrapper.setProps({ content })
    expect(wrapper.html()).toContain('<strong>two</strong>')
    expect(wrapper.html()).not.toContain('one')
  })

  // Test cases covering documentation examples
  describe('safe HTML formatting', () => {
    it('preserves safe bold and italic tags', () => {
      const wrapper = mount(TestComponent, {
        props: {
          content: '<strong>Bold</strong> and <em>italic</em> text',
        },
      })

      const html = wrapper.html()
      expect(html).toContain('<strong>Bold</strong>')
      expect(html).toContain('<em>italic</em>')
    })

    it('preserves safe links with https protocol', () => {
      const wrapper = mount(TestComponent, {
        props: {
          content: '<a href="https://example.com">Safe Link</a>',
        },
      })

      const html = wrapper.html()
      expect(html).toContain('<a href="https://example.com">Safe Link</a>')
    })

    it('preserves line breaks and paragraphs', () => {
      const wrapper = mount(TestComponent, {
        props: {
          content: '<p>Paragraph</p><br>Line break',
        },
      })

      const html = wrapper.html()
      expect(html).toContain('<p>Paragraph</p>')
      expect(html).toContain('<br>')
    })
  })

  describe('XSS protection', () => {
    it('removes script tags', () => {
      const wrapper = mount(TestComponent, {
        props: {
          content: '<script>alert("XSS")</script>Hello',
        },
      })

      const html = wrapper.html()
      expect(html).toContain('Hello')
      expect(html).not.toContain('<script')
      expect(html).not.toContain('alert')
    })

    it('removes onerror event handlers from images', () => {
      const wrapper = mount(TestComponent, {
        props: {
          content: '<img src="x" onerror="alert(\'XSS\')">',
        },
      })

      const html = wrapper.html()
      expect(html).toContain('<img')
      expect(html).not.toContain('onerror')
      expect(html).not.toContain('alert')
    })

    it('sanitizes javascript: protocol in links', () => {
      const wrapper = mount(TestComponent, {
        props: {
          content: '<a href="javascript:alert(\'XSS\')">Click me</a>',
        },
      })

      const html = wrapper.html()
      expect(html).toContain('Click me')
      expect(html).not.toContain('javascript:')
      expect(html).not.toContain('alert')
    })

    it('removes onclick event handlers', () => {
      const wrapper = mount(TestComponent, {
        props: {
          content: '<div onclick="alert(\'XSS\')">Click me</div>',
        },
      })

      const html = wrapper.html()
      expect(html).toContain('Click me')
      expect(html).not.toContain('onclick')
      expect(html).not.toContain('alert')
    })

    it('removes onmouseover event handlers', () => {
      const wrapper = mount(TestComponent, {
        props: {
          content: '<button onmouseover="steal()">Hover</button>',
        },
      })

      const html = wrapper.html()
      expect(html).toContain('Hover')
      expect(html).not.toContain('onmouseover')
      expect(html).not.toContain('steal')
    })

    it('removes iframe tags', () => {
      const wrapper = mount(TestComponent, {
        props: {
          content: '<iframe src="https://evil.com"></iframe>Safe content',
        },
      })

      const html = wrapper.html()
      expect(html).toContain('Safe content')
      expect(html).not.toContain('<iframe')
      expect(html).not.toContain('evil.com')
    })

    it('removes scripts from SVG', () => {
      const wrapper = mount(TestComponent, {
        props: {
          content: '<svg><script>alert("XSS")</script></svg>',
        },
      })

      const html = wrapper.html()
      expect(html).not.toContain('<script')
      expect(html).not.toContain('alert')
    })

    it('handles mixed safe and unsafe content', () => {
      const wrapper = mount(TestComponent, {
        props: {
          content: '<p>Safe <script>bad()</script> text</p>',
        },
      })

      const html = wrapper.html()
      expect(html).toContain('<p>')
      expect(html).toContain('Safe')
      expect(html).toContain('text')
      expect(html).not.toContain('<script')
      expect(html).not.toContain('bad()')
    })

    it('removes multiple event handlers', () => {
      const wrapper = mount(TestComponent, {
        props: {
          content: '<div onclick="a()" onmouseover="b()" onfocus="c()">Test</div>',
        },
      })

      const html = wrapper.html()
      expect(html).toContain('Test')
      expect(html).not.toContain('onclick')
      expect(html).not.toContain('onmouseover')
      expect(html).not.toContain('onfocus')
    })
  })
})
