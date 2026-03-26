import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EntityChecksAlert from './EntityChecksAlert.vue'
import type { EntityCheck } from '../../../types/plugins/form-schema'

const mountComponent = (props: {
  entityChecks?: EntityCheck[]
  visibleFields?: string[]
}) => {
  return mount(EntityChecksAlert, {
    props,
    global: {
      stubs: {
        KAlert: {
          template: '<div class="k-alert"><slot /></div>',
        },
      },
    },
  })
}

describe('EntityChecksAlert', () => {
  const alertSelector = '[data-testid="ff-entity-checks-alert"]'
  const checkItemSelector = '[data-testid="ff-entity-check-item"]'

  describe('normal cases', () => {
    it('should render at_least_one_of alert when all fields are visible', () => {
      const wrapper = mountComponent({
        entityChecks: [{ at_least_one_of: ['allow', 'deny'] }],
        visibleFields: ['allow', 'deny'],
      })

      expect(wrapper.find(alertSelector).exists()).toBe(true)
      const items = wrapper.findAll(checkItemSelector)
      expect(items).toHaveLength(1)
      expect(items[0].text()).toContain('Allow')
      expect(items[0].text()).toContain('Deny')
    })

    it('should render mutually_required alert', () => {
      const wrapper = mountComponent({
        entityChecks: [{ mutually_required: ['username', 'password'] }],
        visibleFields: ['username', 'password'],
      })

      expect(wrapper.find(alertSelector).exists()).toBe(true)
      const items = wrapper.findAll(checkItemSelector)
      expect(items).toHaveLength(1)
      expect(items[0].text()).toContain('Username')
      expect(items[0].text()).toContain('Password')
    })

    it('should render mutually_exclusive alert', () => {
      const wrapper = mountComponent({
        entityChecks: [{ mutually_exclusive: ['allow', 'deny'] }],
        visibleFields: ['allow', 'deny'],
      })

      expect(wrapper.find(alertSelector).exists()).toBe(true)
      const items = wrapper.findAll(checkItemSelector)
      expect(items).toHaveLength(1)
      expect(items[0].text()).toContain('Allow')
      expect(items[0].text()).toContain('Deny')
    })

    it('should render multiple checks', () => {
      const wrapper = mountComponent({
        entityChecks: [
          { at_least_one_of: ['allow', 'deny'] },
          { mutually_required: ['username', 'password'] },
        ],
        visibleFields: ['allow', 'deny', 'username', 'password'],
      })

      const items = wrapper.findAll(checkItemSelector)
      expect(items).toHaveLength(2)
    })

    it('should not render alert when entityChecks is empty', () => {
      const wrapper = mountComponent({
        entityChecks: [],
        visibleFields: ['allow'],
      })

      expect(wrapper.find(alertSelector).exists()).toBe(false)
    })

    it('should not render alert when entityChecks is undefined', () => {
      const wrapper = mountComponent({
        visibleFields: ['allow'],
      })

      expect(wrapper.find(alertSelector).exists()).toBe(false)
    })

    it('should only show fields that are in visibleFields', () => {
      const wrapper = mountComponent({
        entityChecks: [{ at_least_one_of: ['allow', 'deny'] }],
        visibleFields: ['allow'],
      })

      expect(wrapper.find(alertSelector).exists()).toBe(true)
      const items = wrapper.findAll(checkItemSelector)
      expect(items).toHaveLength(1)
      expect(items[0].text()).toContain('Allow')
      expect(items[0].text()).not.toContain('Deny')
    })
  })

  describe('edge case: non-existent field in entity checks', () => {
    it('should not show non-existent fields in the alert message', () => {
      const wrapper = mountComponent({
        entityChecks: [{ at_least_one_of: ['none', 'allow'] }],
        visibleFields: ['allow', 'deny'],
      })

      expect(wrapper.find(alertSelector).exists()).toBe(true)
      const items = wrapper.findAll(checkItemSelector)
      expect(items).toHaveLength(1)
      expect(items[0].text()).toContain('Allow')
      expect(items[0].text()).not.toContain('None')
    })

    it('should not render alert when all fields in a check are non-existent', () => {
      const wrapper = mountComponent({
        entityChecks: [{ at_least_one_of: ['ghost_field_a', 'ghost_field_b'] }],
        visibleFields: ['allow', 'deny'],
      })

      expect(wrapper.find(alertSelector).exists()).toBe(false)
    })
  })

  describe('edge case: nested field path (e.g., "a.b") in entity checks', () => {
    it('should show alert when the top-level parent of a nested path is visible', () => {
      const wrapper = mountComponent({
        entityChecks: [{ at_least_one_of: ['auth.username', 'token'] }],
        visibleFields: ['auth', 'token'],
      })

      expect(wrapper.find(alertSelector).exists()).toBe(true)
      const items = wrapper.findAll(checkItemSelector)
      expect(items).toHaveLength(1)
      // defaultLabelFormatter formats 'auth.username' as 'Auth › Username'
      expect(items[0].text()).toContain('Auth')
      expect(items[0].text()).toContain('Token')
    })

    it('should not show alert when the top-level parent of a nested path is not visible', () => {
      const wrapper = mountComponent({
        entityChecks: [{ at_least_one_of: ['auth.username', 'auth.password'] }],
        visibleFields: ['token', 'other_field'],
      })

      expect(wrapper.find(alertSelector).exists()).toBe(false)
    })

    it('should filter out nested paths whose parent is not visible', () => {
      const wrapper = mountComponent({
        entityChecks: [{ at_least_one_of: ['auth.username', 'token'] }],
        visibleFields: ['token'],
      })

      expect(wrapper.find(alertSelector).exists()).toBe(true)
      const items = wrapper.findAll(checkItemSelector)
      expect(items).toHaveLength(1)
      expect(items[0].text()).toContain('Token')
      expect(items[0].text()).not.toContain('Auth')
    })
  })

  describe('edge case: visibleFields not provided', () => {
    it('should fallback to showing all fields when visibleFields is not passed', () => {
      const wrapper = mountComponent({
        entityChecks: [{ at_least_one_of: ['allow', 'deny'] }],
      })

      expect(wrapper.find(alertSelector).exists()).toBe(true)
      const items = wrapper.findAll(checkItemSelector)
      expect(items).toHaveLength(1)
      expect(items[0].text()).toContain('Allow')
      expect(items[0].text()).toContain('Deny')
    })
  })
})
