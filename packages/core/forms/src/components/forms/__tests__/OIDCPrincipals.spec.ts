import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
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

// Configurable mock for useAxios
const mockGet = vi.fn().mockResolvedValue({ data: { data: [] } })
vi.mock('@kong-ui-public/entities-shared', () => ({
  useAxios: () => ({
    axiosInstance: { get: (...args: any[]) => mockGet(...args) },
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
    // Default fallback so unmatched calls don't consume mockResolvedValueOnce
    mockGet.mockResolvedValue({ data: { data: [] } })
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

  describe('external mode client rows', () => {
    // isEditing + principals-enabled=false forces External mode (see inferInitialMode)
    const externalProps = { isEditing: true }
    const externalModel = { 'config-principals-enabled': false }

    it('renders one client row with id + secret inputs and a single add control', () => {
      const wrapper = mountComponent(externalModel, externalProps)

      expect(wrapper.find('[data-testid="external-client-id"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="external-client-secret"]').exists()).toBe(true)
      // A single "+ Add client" control governs the paired row, not one per field
      expect(wrapper.findAll('[data-testid="add-external-client-action"]')).toHaveLength(1)
    })

    it('+ Add client appends an entry to both client_id and client_secret arrays', async () => {
      const onModelUpdated = vi.fn()
      const wrapper = mountComponent(externalModel, { ...externalProps, onModelUpdated })
      const formModel = wrapper.props('formModel')

      await wrapper.find('[data-testid="add-external-client-action"]').trigger('click')

      expect(formModel['config-client_id']).toHaveLength(2)
      expect(formModel['config-client_secret']).toHaveLength(2)
      expect(onModelUpdated).toHaveBeenCalled()
    })

    it('remove control is disabled with a single row and removes a row when multiple exist', async () => {
      const wrapper = mountComponent({
        ...externalModel,
        'config-client_id': ['a', 'b'],
        'config-client_secret': ['sa', 'sb'],
      }, externalProps)
      const formModel = wrapper.props('formModel')

      const removeButtons = wrapper.findAll('[data-testid="remove-external-client-action"]')
      expect(removeButtons).toHaveLength(2)

      await removeButtons[1].trigger('click')

      expect(formModel['config-client_id']).toEqual(['a'])
      expect(formModel['config-client_secret']).toEqual(['sa'])

      // With one row left, the remaining remove control is disabled
      const remaining = wrapper.find('[data-testid="remove-external-client-action"]')
      expect(remaining.attributes('disabled')).toBeDefined()
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
        'config-principals-directory': 'default',
        'config-principals-principal_claim': null,
      }, { onModelUpdated })
      const formModel = wrapper.props('formModel')

      ;(wrapper.vm as any).handleIdentifierClaimChange('user.employee_id')

      expect(formModel['config-principals-principal_claim']).toEqual(['user', 'employee_id'])
      expect(onModelUpdated).toHaveBeenCalled()
    })
  })

  describe('client selection array behavior', () => {
    it('disables remove client action when client row is disabled or last remaining row', async () => {
      const wrapper = mountComponent()

      expect(wrapper.find('[data-testid="remove-client-action"]').attributes('disabled')).toBeDefined()

      ;(wrapper.vm as any).selectedServer = { id: 'server-1', name: 'Server 1' }
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="remove-client-action"]').attributes('disabled')).toBeDefined()

      const wrapperWithMultipleRows = mountComponent({
        'config-client_id': ['client-a', 'client-b'],
      })
      ;(wrapperWithMultipleRows.vm as any).selectedServer = { id: 'server-1', name: 'Server 1' }
      await wrapperWithMultipleRows.vm.$nextTick()

      expect(wrapperWithMultipleRows.find('[data-testid="remove-client-action"]').attributes('disabled')).toBeUndefined()
    })

    it('does not remove the last remaining client row', () => {
      const onModelUpdated = vi.fn()
      const wrapper = mountComponent({
        'config-client_id': ['client-a'],
      }, { onModelUpdated })
      const formModel = wrapper.props('formModel')

      ;(wrapper.vm as any).removeClientRow(0)

      expect(formModel['config-client_id']).toEqual(['client-a'])
      expect(onModelUpdated).not.toHaveBeenCalled()
    })

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

    it('infers External mode on edit when principals-enabled is absent and no common fields are set', () => {
      // Legacy plugin predating the principals feature: no principals-* fields,
      // and no client/issuer either. On edit this must NOT default to Kong
      // Identity (a legacy plugin cannot be KI).
      const wrapper = mount(OIDCPrincipals, {
        props: {
          ...baseProps,
          isEditing: true,
          formModel: {
            'config-client_id': null,
            'config-client_secret': null,
            'config-issuer': null,
          },
        },
        global: {
          provide: {
            [FORMS_CONFIG]: formsConfig,
          },
        },
      })

      expect((wrapper.vm as any).selectedMode).toBe('external')
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
        'config-principals-directory': 'default',
        'config-principals-principal_by': 'Customer_ID',
        'config-principals-principal_claim': ['user', 'employee_id'],
      }, { onModelUpdated })
      const formModel = wrapper.props('formModel')

      ;(wrapper.vm as any).handleLookupMethodChange('kong-identity')

      expect(formModel['config-principals-principal_by']).toBeNull()
      expect(formModel['config-principals-principal_claim']).toBeNull()
      expect(formModel['config-principals-directory']).toBe('default')
      expect((wrapper.vm as any).selectedLookupMethod).toBe('kong-identity')
      expect(onModelUpdated).toHaveBeenCalled()
    })

    it('selecting custom-identity does not clear principal fields', () => {
      const onModelUpdated = vi.fn()
      const wrapper = mountComponent({
        'config-principals-directory': 'default',
        'config-principals-principal_by': null,
        'config-principals-principal_claim': null,
      }, { onModelUpdated })
      const formModel = wrapper.props('formModel')

      ;(wrapper.vm as any).handleLookupMethodChange('custom-identity')

      expect((wrapper.vm as any).selectedLookupMethod).toBe('custom-identity')
      expect(formModel['config-principals-directory']).toBe('default')
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

  describe('auth server and client selection', () => {
    const mockServers = [
      { id: 'server-1', name: 'Auth Server 1', issuer: 'https://auth1.example.com' },
      { id: 'server-2', name: 'Auth Server 2', issuer: 'https://auth2.example.com' },
    ]
    const mockClients = [
      { id: 'client-1', name: 'Client A', client_id: 'client-id-a' },
      { id: 'client-2', name: 'Client B', client_id: 'client-id-b' },
    ]

    it('fetches auth servers on mount and populates the list', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: mockServers } })

      const wrapper = mountComponent()
      await flushPromises()

      const vm = wrapper.vm as any
      expect(vm.kongIdentityServers).toEqual(mockServers)
      expect(vm.kongIdentityServerItems).toEqual([
        { label: 'Auth Server 1', value: 'server-1' },
        { label: 'Auth Server 2', value: 'server-2' },
      ])
    })

    it('selecting a server sets issuer and fetches clients', async () => {
      mockGet
        .mockResolvedValueOnce({ data: { data: mockServers } }) // fetchKongIdentityServers
        .mockResolvedValueOnce({ data: { data: mockClients } }) // fetchClients

      const wrapper = mountComponent()
      await flushPromises()

      const vm = wrapper.vm as any
      vm.handleServerChange('server-1')
      await flushPromises()

      const formModel = wrapper.props('formModel')
      expect(formModel['config-issuer']).toBe('https://auth1.example.com')
      expect(vm.selectedServer).toEqual(mockServers[0])
      expect(vm.clients).toEqual(mockClients)
      expect(vm.clientItems).toEqual([
        { label: 'Client A', value: 'client-id-a' },
        { label: 'Client B', value: 'client-id-b' },
      ])
    })

    it('selecting a client updates config-client_id', async () => {
      mockGet
        .mockResolvedValueOnce({ data: { data: mockServers } })
        .mockResolvedValueOnce({ data: { data: mockClients } })

      const wrapper = mountComponent()
      await flushPromises()

      const vm = wrapper.vm as any
      vm.handleServerChange('server-1')
      await flushPromises()

      vm.handleClientChange(0, 'client-id-a')

      const formModel = wrapper.props('formModel')
      expect(formModel['config-client_id']).toEqual(['client-id-a'])
    })

    it('changing server resets client selection', async () => {
      mockGet
        .mockResolvedValueOnce({ data: { data: mockServers } })
        .mockResolvedValueOnce({ data: { data: mockClients } })
        .mockResolvedValueOnce({ data: { data: [] } }) // new server has no clients

      const wrapper = mountComponent({
        'config-client_id': ['client-id-a'],
        'config-client_secret': ['secret-a'],
      })
      await flushPromises()

      const vm = wrapper.vm as any
      vm.handleServerChange('server-2')
      await flushPromises()

      const formModel = wrapper.props('formModel')
      expect(formModel['config-client_id']).toEqual([null])
      expect(formModel['config-client_secret']).toEqual([null])
      expect(formModel['config-issuer']).toBe('https://auth2.example.com')

      wrapper.unmount()
    })
  })
})
