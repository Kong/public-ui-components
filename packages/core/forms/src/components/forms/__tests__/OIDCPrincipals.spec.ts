import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import OIDCPrincipals from '../OIDCPrincipals.vue'
import { FORMS_CONFIG } from '../../../const'

// Stub VueFormGenerator to avoid rendering real form fields in External mode
vi.mock('../../FormGenerator.vue', () => ({
  default: {
    name: 'VueFormGenerator',
    template: '<div class="stub-vfg" />',
    props: ['model', 'options', 'schema'],
  },
}))

// Stub useAxios so network calls don't fire
vi.mock('@kong-ui-public/entities-shared', () => ({
  useAxios: () => ({
    axiosInstance: { get: vi.fn().mockResolvedValue({ data: { data: [] } }) },
  }),
}))

const formsConfig = {
  apiBaseUrl: '/us',
}

function buildFormModel(overrides = {}) {
  return {
    'config-client_id': null,
    'config-client_secret': null,
    'config-issuer': null,
    'config-principals-enabled': true,
    'config-principals-directory': 'default',
    'config-principals-principal_by': null,
    'config-principals-principal_claim': null,
    'config-principals-match_consumer': true,
    'config-principals-match_consumer_groups': true,
    'config-principals-error_on_miss': true,
    ...overrides,
  }
}

const baseProps = {
  formSchema: { fields: [] },
  formOptions: {},
  commonFieldsSchema: { fields: [] },
  onModelUpdated: vi.fn(),
}

function mountComponent(formModelOverrides = {}, propsOverrides = {}) {
  const formModel = buildFormModel(formModelOverrides)
  return mount(OIDCPrincipals, {
    props: {
      ...baseProps,
      formModel,
      ...propsOverrides,
    },
    global: {
      provide: {
        [FORMS_CONFIG]: formsConfig,
      },
    },
  })
}

describe('OIDCPrincipals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('mode toggle data changes', () => {
    it('switching to External sets principals-enabled to false and resets local state', async () => {
      const onModelUpdated = vi.fn()
      const wrapper = mountComponent({}, { onModelUpdated })
      const formModel = wrapper.props('formModel')

      // Initially in Kong Identity mode
      expect(wrapper.find('[data-testid="principals-directory-select"]').exists()).toBe(true)

      // Switch to External
      const externalRadio = wrapper.find('[data-testid="oidc-auth-mode-external"]')
      await externalRadio.trigger('change')

      // The component calls handleModeChange which sets these values
      expect(formModel['config-principals-enabled']).toBe(false)
      expect(formModel['config-principals-directory']).toBe('default')
      expect(onModelUpdated).toHaveBeenCalled()
    })

    it('switching back to Kong Identity restores principals defaults and clears external fields', async () => {
      const onModelUpdated = vi.fn()
      const wrapper = mountComponent({
        'config-principals-enabled': false,
        'config-client_id': ['my-client'],
        'config-client_secret': 'secret',
        'config-issuer': 'https://issuer.example.com',
      }, { onModelUpdated })
      const formModel = wrapper.props('formModel')

      // Starts in External mode
      expect(wrapper.find('.stub-vfg').exists()).toBe(true)

      // Call handleModeChange directly (KRadio event plumbing is a Kongponents concern)
      ;(wrapper.vm as any).handleModeChange('kong-identity')
      await wrapper.vm.$nextTick()

      expect(formModel['config-principals-enabled']).toBe(true)
      expect(formModel['config-principals-match_consumer']).toBe(true)
      expect(formModel['config-principals-match_consumer_groups']).toBe(true)
      expect(formModel['config-principals-error_on_miss']).toBe(true)
      expect(formModel['config-client_id']).toBeNull()
      expect(formModel['config-client_secret']).toBeNull()
      expect(formModel['config-issuer']).toBeNull()
      expect(onModelUpdated).toHaveBeenCalled()
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

      // Call the handler directly (avoids KCollapse visibility / KCheckbox DOM issues)
      ;(wrapper.vm as any).handleMatchConsumerChange(false)

      expect(formModel['config-principals-match_consumer']).toBe(false)
      expect(formModel['config-principals-match_consumer_groups']).toBe(false)
      expect(onModelUpdated).toHaveBeenCalled()
    })

    it('checking match_consumer does not automatically re-check match_consumer_groups', () => {
      const onModelUpdated = vi.fn()
      const wrapper = mountComponent({
        'config-principals-match_consumer': false,
        'config-principals-match_consumer_groups': false,
      }, { onModelUpdated })
      const formModel = wrapper.props('formModel')

      ;(wrapper.vm as any).handleMatchConsumerChange(true)

      expect(formModel['config-principals-match_consumer']).toBe(true)
      // consumer groups remains unchecked — user must re-enable explicitly
      expect(formModel['config-principals-match_consumer_groups']).toBe(false)
    })
  })

  describe('identifier claim transformation', () => {
    it('splits identifier claim by dot into a list', () => {
      const onModelUpdated = vi.fn()
      const wrapper = mountComponent({
        'config-principals-directory': 'custom-plugin',
        'config-principals-principal_claim': null,
      }, { onModelUpdated })
      const formModel = wrapper.props('formModel')

      ;(wrapper.vm as any).handleIdentifierClaimChange('user.employee_id')

      expect(formModel['config-principals-principal_claim']).toEqual(['user', 'employee_id'])
      expect(onModelUpdated).toHaveBeenCalled()
    })
  })

  describe('client selection array behavior', () => {
    it('handleClientChange updates the correct index in config-client_id', () => {
      const onModelUpdated = vi.fn()
      const wrapper = mountComponent({
        'config-client_id': ['client-a'],
      }, { onModelUpdated })
      const formModel = wrapper.props('formModel')

      ;(wrapper.vm as any).handleClientChange(0, 'client-b')

      expect(formModel['config-client_id']).toEqual(['client-b'])
      expect(onModelUpdated).toHaveBeenCalled()
    })

    it('addClientRow pushes a null entry to config-client_id', () => {
      const onModelUpdated = vi.fn()
      const wrapper = mountComponent({
        'config-client_id': ['client-a'],
      }, { onModelUpdated })
      const formModel = wrapper.props('formModel')

      ;(wrapper.vm as any).addClientRow()

      expect(formModel['config-client_id']).toEqual(['client-a', null])
      expect(onModelUpdated).toHaveBeenCalled()
    })

    it('removeClientRow splices the entry at the given index', () => {
      const onModelUpdated = vi.fn()
      const wrapper = mountComponent({
        'config-client_id': ['client-a', 'client-b', 'client-c'],
      }, { onModelUpdated })
      const formModel = wrapper.props('formModel')

      ;(wrapper.vm as any).removeClientRow(1)

      expect(formModel['config-client_id']).toEqual(['client-a', 'client-c'])
      expect(onModelUpdated).toHaveBeenCalled()
    })
  })

  describe('edit after creation (principals fields populated)', () => {
    it('infers Kong Identity mode when config-principals-enabled is true', () => {
      const wrapper = mountComponent({
        'config-principals-enabled': true,
        'config-issuer': 'https://my-issuer.example.com',
      })

      // Should show Kong Identity UI (selects)
      expect(wrapper.find('[data-testid="principals-directory-select"]').exists()).toBe(true)
    })

    it('clientIdArray computed returns existing client_id array for edit mode', () => {
      const wrapper = mountComponent({
        'config-principals-enabled': true,
        'config-client_id': ['client-abc'],
      })

      expect((wrapper.vm as any).clientIdArray).toEqual(['client-abc'])
    })
  })

  describe('edit existing plugin before schema change (no principals fields)', () => {
    it('infers External mode when principals fields are absent but common fields have values', () => {
      // Simulate a plugin created before principals was added to the schema:
      // No config-principals-* fields exist, but config-client_id and config-issuer are set
      const formModel = {
        'config-client_id': null,
        'config-client_secret': null,
        'config-issuer': 'https://legacy-issuer.example.com',
        // principals fields are completely absent (undefined)
      }

      const wrapper = mount(OIDCPrincipals, {
        props: {
          ...baseProps,
          formModel,
        },
        global: {
          provide: {
            [FORMS_CONFIG]: formsConfig,
          },
        },
      })

      // Should show VueFormGenerator (External mode) since principals-enabled is undefined
      // and common fields have values
      expect(wrapper.find('.stub-vfg').exists()).toBe(true)
      expect(wrapper.find('[data-testid="principals-directory-select"]').exists()).toBe(false)
    })

    it('defaults lookup method to the first option when principal fields are empty', () => {
      const wrapper = mountComponent({
        'config-principals-directory': 'default',
        'config-principals-principal_claim': null,
        'config-principals-principal_by': undefined,
      })

      expect((wrapper.vm as any).selectedLookupMethod).toBe('kong-identity')
    })
  })

  describe('lookup method switching', () => {
    it('selecting kong-identity clears principal_by and principal_claim', () => {
      const onModelUpdated = vi.fn()
      const wrapper = mountComponent({
        'config-principals-directory': 'custom-plugin',
        'config-principals-principal_by': 'Customer_ID',
        'config-principals-principal_claim': ['user', 'employee_id'],
      }, { onModelUpdated })
      const formModel = wrapper.props('formModel')

      ;(wrapper.vm as any).updateField('config-principals-directory', 'kong-identity')

      expect(formModel['config-principals-principal_by']).toBeNull()
      expect(formModel['config-principals-principal_claim']).toBeNull()
      expect((wrapper.vm as any).selectedLookupMethod).toBe('kong-identity')
      expect(onModelUpdated).toHaveBeenCalled()
    })

    it('selecting custom-plugin does not clear principal fields', () => {
      const onModelUpdated = vi.fn()
      const wrapper = mountComponent({
        'config-principals-directory': 'kong-identity',
        'config-principals-principal_by': null,
        'config-principals-principal_claim': null,
      }, { onModelUpdated })
      const formModel = wrapper.props('formModel')

      ;(wrapper.vm as any).updateField('config-principals-directory', 'custom-plugin')

      expect((wrapper.vm as any).selectedLookupMethod).toBe('custom-plugin')
      expect(formModel['config-principals-principal_by']).toBeNull()
      expect(formModel['config-principals-principal_claim']).toBeNull()
    })
  })

  describe('identifier claim escaping', () => {
    it('parses simple dot notation into array parts', () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.handleIdentifierClaimChange('user.name')

      const formModel = wrapper.props('formModel')
      expect(formModel['config-principals-principal_claim']).toEqual(['user', 'name'])
    })

    it('parses escaped dots as literal dots within a part', () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.handleIdentifierClaimChange('user.name\\.first')

      const formModel = wrapper.props('formModel')
      expect(formModel['config-principals-principal_claim']).toEqual(['user', 'name.first'])
    })

    it('handles empty input', () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.handleIdentifierClaimChange('')

      const formModel = wrapper.props('formModel')
      expect(formModel['config-principals-principal_claim']).toEqual([])
    })

    it('displays array with literal dots using escape notation', () => {
      const wrapper = mountComponent({
        'config-principals-principal_claim': ['user', 'name.first'],
      })
      const vm = wrapper.vm as any

      expect(vm.getIdentifierClaimInputValue()).toBe('user.name\\.first')
    })

    it('round-trips complex claim correctly', () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.handleIdentifierClaimChange('org\\.name.user.id\\.v2')

      const formModel = wrapper.props('formModel')
      expect(formModel['config-principals-principal_claim']).toEqual(['org.name', 'user', 'id.v2'])
      expect(vm.getIdentifierClaimInputValue()).toBe('org\\.name.user.id\\.v2')
    })
  })
})
