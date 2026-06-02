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

  describe('edit after creation (principals fields populated)', () => {
    it('infers Kong Identity mode when config-principals-enabled is true', () => {
      const wrapper = mountComponent({
        'config-principals-enabled': true,
        'config-issuer': 'https://my-issuer.example.com',
      })

      // Should show Kong Identity UI (selects, issuer input)
      expect(wrapper.find('[data-testid="principals-directory-select"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="principals-issuer"]').exists()).toBe(true)
    })

    it('issuer field is rendered with disabled attribute', () => {
      const wrapper = mountComponent({
        'config-principals-enabled': true,
        'config-issuer': 'https://my-issuer.example.com',
      })

      const issuerWrapper = wrapper.find('[data-testid="principals-issuer"]')
      expect(issuerWrapper.exists()).toBe(true)
      // KInput receives the disabled prop — verify via component attributes
      expect(issuerWrapper.attributes('disabled')).toBeDefined()
    })

    it('pre-selects the first client_id in edit mode', () => {
      const wrapper = mountComponent({
        'config-principals-enabled': true,
        'config-client_id': ['client-abc'],
      })

      expect((wrapper.vm as any).selectedClientId).toBe('client-abc')
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
  })
})
