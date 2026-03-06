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
  const assertFieldCount = (rules: FieldRules, expectedCount: number) => {
    const wrapper = mountComponent(rules)
    expect(wrapper.find('.plugin-field-rule-alerts').exists()).toBe(true)
    const fields = wrapper.findAllComponents(ReferableFieldItem)
    expect(fields).toHaveLength(expectedCount)
    return { wrapper, fields }
  }

  ;[
    {
      title: 'render atLeastOneOf rules',
      rules: {
        atLeastOneOf: [
          ['config.field_one', 'config.field_two'],
        ],
      } satisfies FieldRules,
      count: 2,
    },
    {
      title: 'render multiple atLeastOneOf rules',
      rules: {
        atLeastOneOf: [
          ['config.field_a', 'config.field_b'],
          ['config.field_c', 'config.field_d', 'config.field_e'],
        ],
      } satisfies FieldRules,
      count: 5,
    },
    {
      title: 'render onlyOneOf rules',
      rules: {
        onlyOneOf: [
          ['config.allow', 'config.deny'],
        ],
      } satisfies FieldRules,
      count: 2,
    },
    {
      title: 'render mutuallyRequired rules',
      rules: {
        mutuallyRequired: [
          ['config.username', 'config.password'],
        ],
      } satisfies FieldRules,
      count: 2,
    },
    {
      title: 'render onlyOneOfMutuallyRequired rules',
      rules: {
        onlyOneOfMutuallyRequired: [
          [
            ['config.http_proxy_host', 'config.http_proxy_port'],
            ['config.https_proxy_host', 'config.https_proxy_port'],
          ],
        ],
      } satisfies FieldRules,
      count: 4,
    },
    {
      title: 'render multiple rule types together',
      rules: {
        atLeastOneOf: [
          ['config.field_one', 'config.field_two'],
        ],
        onlyOneOf: [
          ['config.allow', 'config.deny'],
        ],
        mutuallyRequired: [
          ['config.username', 'config.password'],
        ],
      } satisfies FieldRules,
      count: 6,
    },
    {
      title: 'render without errors when no rules provided',
      rules: {} satisfies FieldRules,
      count: 0,
    },
  ].forEach(({ title, rules, count }) => {
    it(`should ${title}`, () => {
      assertFieldCount(rules, count)
    })
  })

  describe('isLast Prop', () => {
    it('should pass isLast correctly', () => {
      const rules: FieldRules = {
        atLeastOneOf: [
          ['config.field_a', 'config.field_b', 'config.field_c'],
        ],
      }

      const { fields } = assertFieldCount(rules, 3)

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

      const { fields } = assertFieldCount(rules, 2)
      expect(fields[0].props('field')).toBe('config.allow')
      expect(fields[1].props('field')).toBe('config.deny')
    })
  })
})
