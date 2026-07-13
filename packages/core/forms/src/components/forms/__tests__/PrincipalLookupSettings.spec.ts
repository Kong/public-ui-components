import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PrincipalLookupSettings from '../PrincipalLookupSettings.vue'

function buildFormModel(overrides = {}) {
  return {
    'config-principals-enabled': true,
    'config-principals-principal_by': null,
    'config-principals-principal_claim': null,
    'config-principals-match_consumer': true,
    'config-principals-match_consumer_groups': true,
    'config-principals-error_on_miss': true,
    ...overrides,
  }
}

function mountComponent(formModelOverrides = {}, propsOverrides: Record<string, any> = {}) {
  const formModel = buildFormModel(formModelOverrides)
  return mount(PrincipalLookupSettings, {
    props: {
      formModel,
      onModelUpdated: vi.fn(),
      ...propsOverrides,
    },
  })
}

describe('PrincipalLookupSettings', () => {
  describe('initial lookup method', () => {
    it('defaults to kong-identity when principal fields are empty', () => {
      const wrapper = mountComponent({
        'config-principals-principal_claim': null,
        'config-principals-principal_by': undefined,
      })

      expect((wrapper.vm as any).selectedLookupMethod).toBe('kong-identity')
    })

    it('infers custom-identity when principal_by is set', () => {
      const wrapper = mountComponent({
        'config-principals-principal_by': 'Customer_ID',
      })

      expect((wrapper.vm as any).selectedLookupMethod).toBe('custom-identity')
    })

    it('infers kong-identity when only principal_claim is set (OIDC lookup against a non-sub claim)', () => {
      const wrapper = mountComponent({
        'config-principals-principal_by': null,
        'config-principals-principal_claim': ['user', 'employee_id'],
      })

      expect((wrapper.vm as any).selectedLookupMethod).toBe('kong-identity')
    })
  })

  describe('lookup method switching', () => {
    it('selecting kong-identity clears principal_by and principal_claim', () => {
      const onModelUpdated = vi.fn()
      const wrapper = mountComponent({
        'config-principals-principal_by': 'Customer_ID',
        'config-principals-principal_claim': ['user', 'employee_id'],
      }, { onModelUpdated })
      const formModel = wrapper.props('formModel')

      ;(wrapper.vm as any).handleLookupMethodChange('kong-identity')

      expect(formModel['config-principals-principal_by']).toBeNull()
      expect(formModel['config-principals-principal_claim']).toBeNull()
      expect((wrapper.vm as any).selectedLookupMethod).toBe('kong-identity')
      expect(onModelUpdated).toHaveBeenCalled()
    })

    it('selecting custom-identity does not clear principal fields', () => {
      const wrapper = mountComponent({
        'config-principals-principal_by': null,
        'config-principals-principal_claim': null,
      })
      const formModel = wrapper.props('formModel')

      ;(wrapper.vm as any).handleLookupMethodChange('custom-identity')

      expect((wrapper.vm as any).selectedLookupMethod).toBe('custom-identity')
      expect(formModel['config-principals-principal_by']).toBeNull()
      expect(formModel['config-principals-principal_claim']).toBeNull()
    })
  })

  describe('checkbox cascade', () => {
    it('unchecking match_consumer unchecks match_consumer_groups', () => {
      const onModelUpdated = vi.fn()
      const wrapper = mountComponent({
        'config-principals-match_consumer': true,
        'config-principals-match_consumer_groups': true,
      }, { onModelUpdated })
      const formModel = wrapper.props('formModel')

      ;(wrapper.vm as any).handleMatchConsumerChange(false)

      expect(formModel['config-principals-match_consumer']).toBe(false)
      expect(formModel['config-principals-match_consumer_groups']).toBe(false)
      expect(onModelUpdated).toHaveBeenCalled()
    })

    it('checking match_consumer does not automatically re-check match_consumer_groups', () => {
      const wrapper = mountComponent({
        'config-principals-match_consumer': false,
        'config-principals-match_consumer_groups': false,
      })
      const formModel = wrapper.props('formModel')

      ;(wrapper.vm as any).handleMatchConsumerChange(true)

      expect(formModel['config-principals-match_consumer']).toBe(true)
      // consumer groups remains unchecked — user must re-enable explicitly
      expect(formModel['config-principals-match_consumer_groups']).toBe(false)
    })
  })

  describe('token claim escaping', () => {
    it('parses simple dot notation into array parts', () => {
      const onModelUpdated = vi.fn()
      const wrapper = mountComponent({ 'config-principals-principal_claim': null }, { onModelUpdated })

      ;(wrapper.vm as any).handleTokenClaimChange('user.employee_id')

      expect(wrapper.props('formModel')['config-principals-principal_claim']).toEqual(['user', 'employee_id'])
      expect(onModelUpdated).toHaveBeenCalled()
    })

    it('parses escaped dots as literal dots within a part', () => {
      const wrapper = mountComponent()

      ;(wrapper.vm as any).handleTokenClaimChange('user.name\\.first')

      expect(wrapper.props('formModel')['config-principals-principal_claim']).toEqual(['user', 'name.first'])
    })

    it('handles empty input', () => {
      const wrapper = mountComponent()

      ;(wrapper.vm as any).handleTokenClaimChange('')

      expect(wrapper.props('formModel')['config-principals-principal_claim']).toEqual([])
    })

    it('pre-fills the default `sub` claim when none is set', () => {
      expect((mountComponent({ 'config-principals-principal_claim': null }).vm as any).getTokenClaimInputValue()).toBe('sub')
      expect((mountComponent({ 'config-principals-principal_claim': [] }).vm as any).getTokenClaimInputValue()).toBe('sub')
    })

    it('displays array with literal dots using escape notation', () => {
      const wrapper = mountComponent({
        'config-principals-principal_claim': ['user', 'name.first'],
      })

      expect((wrapper.vm as any).getTokenClaimInputValue()).toBe('user.name\\.first')
    })

    it('round-trips complex claim correctly', () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.handleTokenClaimChange('org\\.name.user.id\\.v2')

      const formModel = wrapper.props('formModel')
      expect(formModel['config-principals-principal_claim']).toEqual(['org.name', 'user', 'id.v2'])
      expect(vm.getTokenClaimInputValue()).toBe('org\\.name.user.id\\.v2')
    })
  })

  describe('opt-in toggle (showEnableToggle)', () => {
    it('does not render the toggle by default (Kong Identity mode)', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('[data-testid="use-principal-lookup"]').exists()).toBe(false)
    })

    it('renders the toggle and calls onEnabledChange when flipped', () => {
      const onEnabledChange = vi.fn()
      const wrapper = mountComponent({}, { showEnableToggle: true, onEnabledChange })

      expect(wrapper.find('[data-testid="use-principal-lookup"]').exists()).toBe(true)

      ;(wrapper.vm as any).handleEnableToggle(false)
      expect(onEnabledChange).toHaveBeenCalledWith(false)
    })

    it('disables the lookup fields when principals are not enabled', () => {
      const wrapper = mountComponent({ 'config-principals-enabled': false }, { showEnableToggle: true })
      expect((wrapper.vm as any).fieldsDisabled).toBe(true)
    })

    it('enables the lookup fields when principals are enabled and not gated', () => {
      const wrapper = mountComponent({ 'config-principals-enabled': true }, { disabled: false })
      expect((wrapper.vm as any).fieldsDisabled).toBe(false)
    })
  })

  describe('data plane version compatibility alert', () => {
    it('does not show the alert when dataPlaneIncompatible is false', () => {
      const wrapper = mountComponent({ 'config-principals-enabled': true }, { dataPlaneIncompatible: false })

      expect(wrapper.find('[data-testid="oidc-principals-dp-version-alert"]').exists()).toBe(false)
    })

    it('shows the alert above the toggle when lookup is enabled and data plane is incompatible', () => {
      const wrapper = mountComponent(
        { 'config-principals-enabled': true },
        { showEnableToggle: true, dataPlaneIncompatible: true },
      )

      const html = wrapper.html()
      expect(html.indexOf('oidc-principals-dp-version-alert')).toBeGreaterThan(-1)
      expect(html.indexOf('oidc-principals-dp-version-alert')).toBeLessThan(html.indexOf('use-principal-lookup'))
    })
  })
})
