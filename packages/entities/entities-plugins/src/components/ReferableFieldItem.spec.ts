import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ReferableFieldItem from './ReferableFieldItem.vue'

describe('ReferableFieldItem', () => {
  const mountComponent = (field: string, isLast?: boolean) => {
    return mount(ReferableFieldItem, {
      props: {
        field,
        ...(isLast !== undefined ? { isLast } : {}),
      },
    })
  }

  const appendLabel = (forId: string, withRect = false) => {
    const label = document.createElement('label')
    label.setAttribute('for', forId)
    if (withRect) {
      label.getBoundingClientRect = vi.fn(() => ({
        top: 500,
        bottom: 520,
        left: 0,
        right: 100,
        width: 100,
        height: 20,
        x: 0,
        y: 500,
        toJSON: () => {},
      }))
    }
    document.body.appendChild(label)
    return label
  }

  describe('Field Label Formatting', () => {
    ;[
      {
        title: 'format simple field names',
        field: 'config.my_field',
        expected: ['My Field'],
      },
      {
        title: 'remove config prefix',
        field: 'config.test_value',
        expected: ['Test Value'],
        notExpected: ['config.'],
      },
      {
        title: 'handle nested paths',
        field: 'config.redis.host',
        expected: ['Redis', 'Host'],
      },
      {
        title: 'handle uppercase config prefix',
        field: 'Config.uppercase_field',
        expected: ['Uppercase Field'],
        notExpected: ['Config.'],
      },
      {
        title: 'handle fields without config prefix',
        field: 'enabled',
        expected: ['Enabled'],
      },
    ].forEach(({ title, field, expected, notExpected }) => {
      it(`should ${title}`, () => {
        const wrapper = mountComponent(field)

        expected.forEach((value) => {
          expect(wrapper.text()).toContain(value)
        })

        notExpected?.forEach((value) => {
          expect(wrapper.text()).not.toContain(value)
        })
      })
    })
  })

  describe('Field ID Generation', () => {
    ;[
      {
        title: 'convert dots to hyphens',
        field: 'config.my.field',
      },
      {
        title: 'preserve underscores in ID',
        field: 'config.my_field',
      },
    ].forEach(({ title, field }) => {
      it(`should ${title}`, () => {
        const wrapper = mountComponent(field)

        const span = wrapper.find('.referable-field-link')
        expect(span.exists()).toBe(true)
      })
    })
  })

  describe('Comma Rendering', () => {
    ;[
      {
        title: 'show comma when isLast is false',
        isLast: false,
        hasComma: true,
      },
      {
        title: 'not show comma when isLast is true',
        isLast: true,
        hasComma: false,
      },
      {
        title: 'show comma when isLast is undefined (default)',
        isLast: undefined,
        hasComma: true,
      },
    ].forEach(({ title, isLast, hasComma }) => {
      it(`should ${title}`, () => {
        const wrapper = mountComponent('config.field', isLast)
        expect(wrapper.text().includes(',')).toBe(hasComma)
      })
    })
  })

  describe('Click Behavior', () => {
    it('should call scrollToField when clicked', async () => {
      const wrapper = mountComponent('config.test_field')

      const scrollToSpy = vi.spyOn(window, 'scrollTo')
      const mockLabel = appendLabel('config-test_field')

      await wrapper.find('.referable-field-link').trigger('click')

      expect(scrollToSpy).toHaveBeenCalled()

      // Cleanup
      document.body.removeChild(mockLabel)
      scrollToSpy.mockRestore()
    })

    it('should handle missing target element gracefully', async () => {
      const wrapper = mountComponent('config.nonexistent_field')

      const scrollToSpy = vi.spyOn(window, 'scrollTo')

      await wrapper.find('.referable-field-link').trigger('click')

      // Should not crash, but also should not scroll
      expect(scrollToSpy).not.toHaveBeenCalled()

      scrollToSpy.mockRestore()
    })

    it('should use smooth scroll behavior', async () => {
      const wrapper = mountComponent('config.smooth_field')

      const scrollToSpy = vi.spyOn(window, 'scrollTo')
      const mockLabel = appendLabel('config-smooth_field')

      await wrapper.find('.referable-field-link').trigger('click')

      expect(scrollToSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          behavior: 'smooth',
        }),
      )

      document.body.removeChild(mockLabel)
      scrollToSpy.mockRestore()
    })

    it('should apply scroll offset', async () => {
      const wrapper = mountComponent('config.offset_field')

      const scrollToSpy = vi.spyOn(window, 'scrollTo')
      const mockLabel = appendLabel('config-offset_field', true)

      await wrapper.find('.referable-field-link').trigger('click')

      // Should apply 24px offset (500 - 24 = 476)
      expect(scrollToSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          top: 476,
        }),
      )

      document.body.removeChild(mockLabel)
      scrollToSpy.mockRestore()
    })
  })

  describe('Styling', () => {
    it('should have referable-field-link class', () => {
      const wrapper = mountComponent('config.field')

      expect(wrapper.find('.referable-field-link').exists()).toBe(true)
    })

    it('should render as a span element', () => {
      const wrapper = mountComponent('config.field')

      expect(wrapper.find('.referable-field-link').element.tagName).toBe('SPAN')
    })
  })
})
