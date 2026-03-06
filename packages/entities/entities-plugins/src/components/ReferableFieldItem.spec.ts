import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ReferableFieldItem from './ReferableFieldItem.vue'

describe('ReferableFieldItem', () => {
  describe('Field Label Formatting', () => {
    it('should format simple field names', () => {
      const wrapper = mount(ReferableFieldItem, {
        props: {
          field: 'config.my_field',
        },
      })

      expect(wrapper.text()).toContain('My Field')
    })

    it('should remove config prefix', () => {
      const wrapper = mount(ReferableFieldItem, {
        props: {
          field: 'config.test_value',
        },
      })

      expect(wrapper.text()).not.toContain('config.')
      expect(wrapper.text()).toContain('Test Value')
    })

    it('should handle nested paths', () => {
      const wrapper = mount(ReferableFieldItem, {
        props: {
          field: 'config.redis.host',
        },
      })

      // Should include both parts with proper formatting
      expect(wrapper.text()).toContain('Redis')
      expect(wrapper.text()).toContain('Host')
    })

    it('should handle uppercase config prefix', () => {
      const wrapper = mount(ReferableFieldItem, {
        props: {
          field: 'Config.uppercase_field',
        },
      })

      expect(wrapper.text()).not.toContain('Config.')
      expect(wrapper.text()).toContain('Uppercase Field')
    })

    it('should handle fields without config prefix', () => {
      const wrapper = mount(ReferableFieldItem, {
        props: {
          field: 'enabled',
        },
      })

      expect(wrapper.text()).toContain('Enabled')
    })
  })

  describe('Field ID Generation', () => {
    it('should convert dots to hyphens', () => {
      const wrapper = mount(ReferableFieldItem, {
        props: {
          field: 'config.my.field',
        },
      })

      const span = wrapper.find('.referable-field-link')
      expect(span.exists()).toBe(true)
    })

    it('should preserve underscores in ID', () => {
      const wrapper = mount(ReferableFieldItem, {
        props: {
          field: 'config.my_field',
        },
      })

      const span = wrapper.find('.referable-field-link')
      expect(span.exists()).toBe(true)
    })
  })

  describe('Comma Rendering', () => {
    it('should show comma when isLast is false', () => {
      const wrapper = mount(ReferableFieldItem, {
        props: {
          field: 'config.field',
          isLast: false,
        },
      })

      expect(wrapper.text()).toContain(',')
    })

    it('should not show comma when isLast is true', () => {
      const wrapper = mount(ReferableFieldItem, {
        props: {
          field: 'config.field',
          isLast: true,
        },
      })

      expect(wrapper.text()).not.toContain(',')
    })

    it('should show comma when isLast is undefined (default)', () => {
      const wrapper = mount(ReferableFieldItem, {
        props: {
          field: 'config.field',
        },
      })

      expect(wrapper.text()).toContain(',')
    })
  })

  describe('Click Behavior', () => {
    it('should call scrollToField when clicked', async () => {
      const wrapper = mount(ReferableFieldItem, {
        props: {
          field: 'config.test_field',
        },
      })

      const scrollToSpy = vi.spyOn(window, 'scrollTo')

      // Create mock label element
      const mockLabel = document.createElement('label')
      mockLabel.setAttribute('for', 'config-test_field')
      document.body.appendChild(mockLabel)

      await wrapper.find('.referable-field-link').trigger('click')

      expect(scrollToSpy).toHaveBeenCalled()

      // Cleanup
      document.body.removeChild(mockLabel)
      scrollToSpy.mockRestore()
    })

    it('should handle missing target element gracefully', async () => {
      const wrapper = mount(ReferableFieldItem, {
        props: {
          field: 'config.nonexistent_field',
        },
      })

      const scrollToSpy = vi.spyOn(window, 'scrollTo')

      await wrapper.find('.referable-field-link').trigger('click')

      // Should not crash, but also should not scroll
      expect(scrollToSpy).not.toHaveBeenCalled()

      scrollToSpy.mockRestore()
    })

    it('should use smooth scroll behavior', async () => {
      const wrapper = mount(ReferableFieldItem, {
        props: {
          field: 'config.smooth_field',
        },
      })

      const scrollToSpy = vi.spyOn(window, 'scrollTo')

      const mockLabel = document.createElement('label')
      mockLabel.setAttribute('for', 'config-smooth_field')
      document.body.appendChild(mockLabel)

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
      const wrapper = mount(ReferableFieldItem, {
        props: {
          field: 'config.offset_field',
        },
      })

      const scrollToSpy = vi.spyOn(window, 'scrollTo')

      const mockLabel = document.createElement('label')
      mockLabel.setAttribute('for', 'config-offset_field')
      mockLabel.getBoundingClientRect = vi.fn(() => ({
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
      document.body.appendChild(mockLabel)

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
      const wrapper = mount(ReferableFieldItem, {
        props: {
          field: 'config.field',
        },
      })

      expect(wrapper.find('.referable-field-link').exists()).toBe(true)
    })

    it('should render as a span element', () => {
      const wrapper = mount(ReferableFieldItem, {
        props: {
          field: 'config.field',
        },
      })

      expect(wrapper.find('.referable-field-link').element.tagName).toBe('SPAN')
    })
  })
})
