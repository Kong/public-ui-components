import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PluginFieldRuleAlerts from './PluginFieldRuleAlerts.vue'
import ReferableFieldItem from './ReferableFieldItem.vue'
import type { FieldRules } from '../types'

const mountComponent = (rules: FieldRules) => {
  return mount(PluginFieldRuleAlerts, {
    props: {
      rules,
    },
    global: {
      stubs: {
        KAlert: {
          template: '<div class="k-alert"><slot /></div>',
        },
        i18nT: {
          template: '<span><slot name="parameters" /></span>',
        },
      },
    },
  })
}

describe('PluginFieldRuleAlerts', () => {
  describe('atLeastOneOf Rules', () => {
    it('should render atLeastOneOf rules', () => {
      const rules: FieldRules = {
        atLeastOneOf: [
          ['config.field_one', 'config.field_two'],
        ],
      }

      const wrapper = mountComponent(rules)

      expect(wrapper.find('.plugin-field-rule-alerts').exists()).toBe(true)
      const fields = wrapper.findAllComponents(ReferableFieldItem)
      expect(fields).toHaveLength(2)
    })

    it('should render multiple atLeastOneOf rules', () => {
      const rules: FieldRules = {
        atLeastOneOf: [
          ['config.field_a', 'config.field_b'],
          ['config.field_c', 'config.field_d', 'config.field_e'],
        ],
      }

      const wrapper = mountComponent(rules)

      const fields = wrapper.findAllComponents(ReferableFieldItem)
      expect(fields).toHaveLength(5) // 2 + 3 fields
    })
  })

  describe('onlyOneOf Rules', () => {
    it('should render onlyOneOf rules', () => {
      const rules: FieldRules = {
        onlyOneOf: [
          ['config.allow', 'config.deny'],
        ],
      }

      const wrapper = mountComponent(rules)

      const fields = wrapper.findAllComponents(ReferableFieldItem)
      expect(fields).toHaveLength(2)
    })
  })

  describe('mutuallyRequired Rules', () => {
    it('should render mutuallyRequired rules', () => {
      const rules: FieldRules = {
        mutuallyRequired: [
          ['config.username', 'config.password'],
        ],
      }

      const wrapper = mountComponent(rules)

      const fields = wrapper.findAllComponents(ReferableFieldItem)
      expect(fields).toHaveLength(2)
    })
  })

  describe('onlyOneOfMutuallyRequired Rules', () => {
    it('should render onlyOneOfMutuallyRequired rules', () => {
      const rules: FieldRules = {
        onlyOneOfMutuallyRequired: [
          [
            ['config.http_proxy_host', 'config.http_proxy_port'],
            ['config.https_proxy_host', 'config.https_proxy_port'],
          ],
        ],
      }

      const wrapper = mountComponent(rules)

      const fields = wrapper.findAllComponents(ReferableFieldItem)
      expect(fields).toHaveLength(4) // 2 combinations × 2 fields each
    })
  })

  describe('Mixed Rules', () => {
    it('should render multiple rule types together', () => {
      const rules: FieldRules = {
        atLeastOneOf: [
          ['config.field_one', 'config.field_two'],
        ],
        onlyOneOf: [
          ['config.allow', 'config.deny'],
        ],
        mutuallyRequired: [
          ['config.username', 'config.password'],
        ],
      }

      const wrapper = mountComponent(rules)

      const fields = wrapper.findAllComponents(ReferableFieldItem)
      expect(fields).toHaveLength(6) // 2 + 2 + 2
    })
  })

  describe('Empty Rules', () => {
    it('should render without errors when no rules provided', () => {
      const rules: FieldRules = {}

      const wrapper = mountComponent(rules)

      expect(wrapper.find('.plugin-field-rule-alerts').exists()).toBe(true)
      const fields = wrapper.findAllComponents(ReferableFieldItem)
      expect(fields).toHaveLength(0)
    })
  })

  describe('isLast Prop', () => {
    it('should pass isLast correctly', () => {
      const rules: FieldRules = {
        atLeastOneOf: [
          ['config.field_a', 'config.field_b', 'config.field_c'],
        ],
      }

      const wrapper = mountComponent(rules)

      const fields = wrapper.findAllComponents(ReferableFieldItem)

      expect(fields[0].props('isLast')).toBe(false)
      expect(fields[1].props('isLast')).toBe(false)
      expect(fields[2].props('isLast')).toBe(true)
    })
  })

  describe('Real-World Plugin Rules', () => {
    it('should handle ip-restriction plugin rules', () => {
      const rules: FieldRules = {
        atLeastOneOf: [['config.allow', 'config.deny']],
      }

      const wrapper = mountComponent(rules)

      const fields = wrapper.findAllComponents(ReferableFieldItem)
      expect(fields).toHaveLength(2)
      expect(fields[0].props('field')).toBe('config.allow')
      expect(fields[1].props('field')).toBe('config.deny')
    })
  })
})
