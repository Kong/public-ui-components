import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import OIDCPrincipals from '../OIDCPrincipals.vue'
import PrincipalLookupSettings from '../PrincipalLookupSettings.vue'
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
    it('switching to External turns principal lookup off (opt-in)', async () => {
      const onModelUpdated = vi.fn()
      const wrapper = mountComponent({}, { onModelUpdated })
      const formModel = wrapper.props('formModel')

      // Initially in Kong Identity mode
      expect(wrapper.find('[data-testid="principals-directory-select"]').exists()).toBe(true)

      // Switch to External
      const externalRadio = wrapper.find('[data-testid="oidc-auth-mode-external"]')
      await externalRadio.trigger('change')

      // External auth is opt-in: principal lookup starts off until the user enables it.
      expect(formModel['config-principals-enabled']).toBe(false)
      expect(formModel['config-principals-directory']).toBe('default')
      expect(onModelUpdated).toHaveBeenCalled()
    })

    it('switching back to Kong Identity restores principals defaults (lookup off) and clears external fields', async () => {
      const onModelUpdated = vi.fn()
      const wrapper = mountComponent({
        'config-principals-enabled': false,
        'config-client_id': ['my-client'],
        'config-client_secret': 'secret',
        'config-issuer': 'https://issuer.example.com',
      }, { isEditing: true, onModelUpdated })
      const formModel = wrapper.props('formModel')

      // Starts in External mode (edit-load with a non-Kong-Identity issuer)
      expect(wrapper.find('.stub-vfg').exists()).toBe(true)

      // Call handleModeChange directly (KRadio event plumbing is a Kongponents concern)
      ;(wrapper.vm as any).handleModeChange('kong-identity')
      await wrapper.vm.$nextTick()

      // Principal lookup is opt-in (off by default) in Kong Identity mode too.
      expect(formModel['config-principals-enabled']).toBe(false)
      expect(formModel['config-principals-match_consumer']).toBe(true)
      expect(formModel['config-principals-match_consumer_groups']).toBe(true)
      expect(formModel['config-principals-error_on_miss']).toBe(true)
      expect(formModel['config-client_id']).toBeNull()
      expect(formModel['config-client_secret']).toBeNull()
      expect(formModel['config-issuer']).toBeNull()
      expect(onModelUpdated).toHaveBeenCalled()
    })
  })

  describe('principal lookup availability', () => {
    it('renders the principal lookup settings in Kong Identity mode', () => {
      const wrapper = mountComponent()

      expect(wrapper.findComponent(PrincipalLookupSettings).exists()).toBe(true)
    })

    it('shows a "Use principal lookup" toggle in Kong Identity mode too', () => {
      const wrapper = mountComponent({ 'config-principals-enabled': false })

      expect((wrapper.vm as any).selectedMode).toBe('kong-identity')
      expect(wrapper.find('[data-testid="use-principal-lookup"]').exists()).toBe(true)
    })

    it('does not force principal lookup on when creating in Kong Identity mode (opt-in default)', () => {
      const wrapper = mountComponent({ 'config-principals-enabled': false })
      const formModel = wrapper.props('formModel')

      expect((wrapper.vm as any).selectedMode).toBe('kong-identity')
      expect(formModel['config-principals-enabled']).toBe(false)
    })

    it('shows a "Use principal lookup" toggle in External mode', () => {
      // Edit-load with a non-Kong-Identity issuer starts the form in External mode
      const wrapper = mountComponent(
        { 'config-issuer': 'https://idp.example.com' },
        { isEditing: true },
      )

      expect(wrapper.find('.stub-vfg').exists()).toBe(true)
      expect(wrapper.find('[data-testid="use-principal-lookup"]').exists()).toBe(true)
    })

    it('opting in via the toggle enables principal lookup', async () => {
      const wrapper = mountComponent(
        { 'config-issuer': 'https://idp.example.com', 'config-principals-enabled': false },
        { isEditing: true },
      )

      // Settings are always rendered in External (disabled, not hidden) — the toggle opts in.
      expect(wrapper.findComponent(PrincipalLookupSettings).exists()).toBe(true)
      expect((wrapper.props('formModel') as any)['config-principals-enabled']).toBe(false)

      ;(wrapper.vm as any).handleUsePrincipalLookupChange(true)
      await wrapper.vm.$nextTick()

      expect((wrapper.props('formModel') as any)['config-principals-enabled']).toBe(true)
    })

    it('switching to External turns principal lookup off by default (opt-in)', () => {
      const wrapper = mountComponent()
      const formModel = wrapper.props('formModel')

      ;(wrapper.vm as any).handleModeChange('external')

      expect(formModel['config-principals-enabled']).toBe(false)
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
    it('infers Kong Identity mode on edit when the issuer is a Kong Identity domain', () => {
      const wrapper = mountComponent({
        'config-principals-enabled': true,
        'config-issuer': 'https://acme.identity.konghq.com',
      }, { isEditing: true })

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
    it('infers External mode on edit when the issuer is not a Kong Identity domain', () => {
      // A plugin whose issuer points at a customer IdP (not identity.konghq) is External.
      const formModel = {
        'config-client_id': null,
        'config-client_secret': null,
        'config-issuer': 'https://legacy-issuer.example.com',
      }

      const wrapper = mount(OIDCPrincipals, {
        props: {
          ...baseProps,
          isEditing: true,
          formModel,
        },
        global: {
          provide: {
            [FORMS_CONFIG]: formsConfig,
          },
        },
      })

      // Should show VueFormGenerator (External mode)
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

  describe('principals creation guide (Konnect)', () => {
    const konnectConfig = { apiBaseUrl: '/us', app: 'konnect' }
    const KONG_IDENTITY_ISSUER = 'https://identity.konghq.com/oidc'

    const mountKonnect = (formModelOverrides = {}, propsOverrides = {}, configOverrides = {}) =>
      mount(OIDCPrincipals, {
        props: { ...baseProps, formModel: buildFormModel(formModelOverrides), ...propsOverrides },
        global: { provide: { [FORMS_CONFIG]: { ...konnectConfig, ...configOverrides } } },
      })

    it('shows the guide when the host says principalsCreationGuideVisible is true', () => {
      const wrapper = mountKonnect({}, {}, { principalsCreationGuideVisible: true })

      expect(wrapper.find('[data-testid="principals-create-guide"]').exists()).toBe(true)
    })

    it('hides the guide when the host says principalsCreationGuideVisible is false', () => {
      const wrapper = mountKonnect({}, {}, { principalsCreationGuideVisible: false })

      expect(wrapper.find('[data-testid="principals-create-guide"]').exists()).toBe(false)
    })

    it('shows a loading skeleton while principalsCreationGuideVisible is unresolved (undefined)', () => {
      const wrapper = mountKonnect()

      expect(wrapper.find('[data-testid="principals-create-guide-loading"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="principals-create-guide"]').exists()).toBe(false)
    })

    it('adopts config-principals-directory from the host-resolved name in Kong Identity mode on create', () => {
      const wrapper = mountKonnect({}, {}, { principalsDirectoryName: 'my-directory' })

      expect(wrapper.props('formModel')['config-principals-directory']).toBe('my-directory')
    })

    it('does not overwrite a saved config-principals-directory on a Kong Identity edit-load', () => {
      const wrapper = mountKonnect(
        { 'config-issuer': KONG_IDENTITY_ISSUER, 'config-principals-directory': 'saved-dir' },
        { isEditing: true },
        { principalsDirectoryName: 'my-directory' },
      )

      expect((wrapper.vm as any).selectedMode).toBe('kong-identity')
      expect(wrapper.props('formModel')['config-principals-directory']).toBe('saved-dir')
    })

    it('adopts the host-resolved directory name once switching into Kong Identity mode after an edit-load', async () => {
      const wrapper = mountKonnect(
        { 'config-issuer': KONG_IDENTITY_ISSUER, 'config-principals-directory': 'saved-dir' },
        { isEditing: true },
        { principalsDirectoryName: 'my-directory' },
      )

      // Simulate leaving and re-entering Kong Identity mode via the radios (v-model sets
      // selectedMode before @change fires handleModeChange) — no longer the initial edit-load.
      ;(wrapper.vm as any).selectedMode = 'external'
      ;(wrapper.vm as any).handleModeChange('external')
      ;(wrapper.vm as any).selectedMode = 'kong-identity'
      ;(wrapper.vm as any).handleModeChange('kong-identity')
      await wrapper.vm.$nextTick()

      expect(wrapper.props('formModel')['config-principals-directory']).toBe('my-directory')
    })

    it('does not adopt a host-resolved directory name in External mode', () => {
      const wrapper = mountKonnect(
        { 'config-issuer': 'https://idp.example.com' },
        { isEditing: true },
        { principalsDirectoryName: 'my-directory' },
      )

      expect((wrapper.vm as any).selectedMode).toBe('external')
      expect(wrapper.props('formModel')['config-principals-directory']).toBe('default')
    })

    it('opens the leave-page prompt on Create principal and emits click:create-entity on confirm', async () => {
      const wrapper = mountKonnect({}, {}, { principalsCreationGuideVisible: true })

      // Clicking opens the leave-page confirmation; the event fires only on confirm
      await wrapper.find('[data-testid="principals-create-principal"]').trigger('click')
      expect((wrapper.vm as any).leavePromptType).toBe('principal')
      expect(wrapper.emitted('click:create-entity')).toBeUndefined()

      ;(wrapper.vm as any).handleLeaveConfirmed()
      expect(wrapper.emitted('click:create-entity')?.[0]).toEqual([{ type: 'principal' }])
    })

    it('emits click:learn-more with "kong-identity" when Learn more is clicked', async () => {
      const wrapper = mountKonnect({}, {}, { principalsCreationGuideVisible: true })

      await wrapper.find('[data-testid="principals-learn-more"]').trigger('click')
      expect(wrapper.emitted('click:learn-more')?.[0]).toEqual(['kong-identity'])
    })

    it('emits click:create-entity with type "auth-server" when the create-auth-server prompt is confirmed', () => {
      const wrapper = mountKonnect()

      ;(wrapper.vm as any).leavePromptType = 'authServer'
      ;(wrapper.vm as any).handleLeaveConfirmed()
      expect(wrapper.emitted('click:create-entity')?.[0]).toEqual([{ type: 'auth-server' }])
    })

    it('emits click:create-entity with type "client" and the selected auth server id', () => {
      const wrapper = mountKonnect()

      ;(wrapper.vm as any).selectedServer = { id: 'srv-1' }
      ;(wrapper.vm as any).leavePromptType = 'client'
      ;(wrapper.vm as any).handleLeaveConfirmed()
      expect(wrapper.emitted('click:create-entity')?.[0]).toEqual([{ type: 'client', authServerId: 'srv-1' }])
    })

    it('does not show the guide outside Konnect, even if principalsCreationGuideVisible is true', () => {
      const wrapper = mount(OIDCPrincipals, {
        props: { ...baseProps, formModel: buildFormModel() },
        global: { provide: { [FORMS_CONFIG]: { apiBaseUrl: '/us', principalsCreationGuideVisible: true } } }, // no app: 'konnect'
      })

      expect(wrapper.find('[data-testid="principals-create-guide"]').exists()).toBe(false)
    })

    it('shows the guide in External mode when principalsCreationGuideVisible is true, regardless of lookup toggle', () => {
      const wrapperEnabled = mountKonnect(
        { 'config-issuer': 'https://idp.example.com', 'config-principals-enabled': true },
        { isEditing: true },
        { principalsCreationGuideVisible: true },
      )
      expect((wrapperEnabled.vm as any).selectedMode).toBe('external')
      expect(wrapperEnabled.find('[data-testid="principals-create-guide"]').exists()).toBe(true)

      const wrapperDisabled = mountKonnect(
        { 'config-issuer': 'https://idp.example.com', 'config-principals-enabled': false },
        { isEditing: true },
        { principalsCreationGuideVisible: true },
      )
      expect((wrapperDisabled.vm as any).selectedMode).toBe('external')
      expect(wrapperDisabled.find('[data-testid="principals-create-guide"]').exists()).toBe(true)
    })
  })

  describe('KRN permission flags', () => {
    const konnectConfig = { apiBaseUrl: '/us', app: 'konnect' }

    it('skips the auth-servers fetch when isKongIdentityAuthServersAvailable is false', async () => {
      mount(OIDCPrincipals, {
        props: { ...baseProps, formModel: buildFormModel() },
        global: {
          provide: {
            [FORMS_CONFIG]: { ...konnectConfig, isKongIdentityAuthServersAvailable: false },
          },
        },
      })
      await flushPromises()

      expect(mockGet).not.toHaveBeenCalledWith(expect.stringContaining('/v1/auth-servers'), expect.anything())
    })

    // The "Create authorization server"/"Create client" actions live inside KSelect's
    // #dropdown-footer-text named slot. Kongponents aren't globally registered in this
    // Vitest/jsdom setup, so named slots on an unresolved component never render — these
    // assert on the underlying computed flags instead; DOM-level coverage would need Cypress.
    it('defaults canCreateAuthServer and canCreateAuthServerClient to true (fail open)', () => {
      const wrapper = mount(OIDCPrincipals, {
        props: { ...baseProps, formModel: buildFormModel() },
        global: { provide: { [FORMS_CONFIG]: konnectConfig } },
      })

      expect((wrapper.vm as any).canCreateAuthServer).toBe(true)
      expect((wrapper.vm as any).canCreateAuthServerClient).toBe(true)
    })

    it('sets canCreateAuthServer to false when the host explicitly denies it', () => {
      const wrapper = mount(OIDCPrincipals, {
        props: { ...baseProps, formModel: buildFormModel() },
        global: {
          provide: {
            [FORMS_CONFIG]: { ...konnectConfig, canCreateAuthServer: false },
          },
        },
      })

      expect((wrapper.vm as any).canCreateAuthServer).toBe(false)
      // A separate, unaffected permission — selecting an existing server still works.
      expect((wrapper.vm as any).canCreateAuthServerClient).toBe(true)
    })

    it('sets canCreateAuthServerClient to false when the host explicitly denies it', () => {
      const wrapper = mount(OIDCPrincipals, {
        props: { ...baseProps, formModel: buildFormModel() },
        global: {
          provide: {
            [FORMS_CONFIG]: { ...konnectConfig, canCreateAuthServerClient: false },
          },
        },
      })

      expect((wrapper.vm as any).canCreateAuthServerClient).toBe(false)
      expect((wrapper.vm as any).canCreateAuthServer).toBe(true)
    })

    it('still shows the mode picker in Kong Identity mode when isKongIdentityAuthServersAvailable is false', async () => {
      const wrapper = mount(OIDCPrincipals, {
        props: { ...baseProps, formModel: buildFormModel() },
        global: {
          provide: {
            [FORMS_CONFIG]: { ...konnectConfig, isKongIdentityAuthServersAvailable: false },
          },
        },
      })
      await flushPromises()

      expect((wrapper.vm as any).selectedMode).toBe('kong-identity')
      expect(wrapper.find('[data-testid="oidc-auth-mode-radio-group"]').exists()).toBe(true)
      // Auth server KSelect replaced by plain text issuer input.
      expect(wrapper.find('[data-testid="principals-directory-select"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="kong-identity-issuer-input"]').exists()).toBe(true)
      // Client KSelect replaced by plain text client id input.
      expect(wrapper.find('[data-testid="principals-client-select"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="principals-client-id-input"]').exists()).toBe(true)
      // Client secret and Add client are not disabled in fallback mode.
      expect(wrapper.find('[data-testid="principals-client-secret"]').attributes('disabled')).not.toBe('true')
      expect(wrapper.find('[data-testid="add-client-action"]').classes()).not.toContain('add-client-inline-disabled')
    })

    it('still shows the mode picker and Kong Identity mode when isKongIdentityAuthServersAvailable is true', () => {
      const wrapper = mount(OIDCPrincipals, {
        props: { ...baseProps, formModel: buildFormModel() },
        global: { provide: { [FORMS_CONFIG]: konnectConfig } },
      })

      expect((wrapper.vm as any).selectedMode).toBe('kong-identity')
      expect(wrapper.find('[data-testid="oidc-auth-mode-radio-group"]').exists()).toBe(true)
    })

    it('shows Principal lookup fields in Kong Identity mode', () => {
      const wrapper = mount(OIDCPrincipals, {
        props: { ...baseProps, formModel: buildFormModel() },
        slots: { 'advanced-fields': '<div data-testid="sibling-advanced-field">Sibling</div>' },
        global: {
          provide: {
            [FORMS_CONFIG]: { ...konnectConfig },
          },
        },
      })

      expect((wrapper.vm as any).selectedMode).toBe('kong-identity')
      expect(wrapper.findComponent(PrincipalLookupSettings).exists()).toBe(true)
      // Fields are shown even without principals access.
      expect(wrapper.find('[data-testid="use-principal-lookup"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="principals-lookup-method"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="sibling-advanced-field"]').exists()).toBe(true)
      // Auth server select is unaffected — gated by auth-server access, not principals access.
      expect(wrapper.find('[data-testid="principals-directory-select"]').exists()).toBe(true)
      // Creation guide is NOT shown — host has not set principalsCreationGuideVisible to true.
      expect(wrapper.find('[data-testid="principals-create-guide"]').exists()).toBe(false)
    })

    it('shows Principal lookup fields in External mode', () => {
      const wrapper = mount(OIDCPrincipals, {
        props: {
          ...baseProps,
          formModel: buildFormModel({ 'config-issuer': 'https://idp.example.com' }),
          isEditing: true,
        },
        slots: { 'advanced-fields': '<div data-testid="sibling-advanced-field">Sibling</div>' },
        global: {
          provide: {
            [FORMS_CONFIG]: { ...konnectConfig },
          },
        },
      })

      expect((wrapper.vm as any).selectedMode).toBe('external')
      expect(wrapper.findComponent(PrincipalLookupSettings).exists()).toBe(true)
      // Fields are shown even without principals access.
      expect(wrapper.find('[data-testid="use-principal-lookup"]').exists()).toBe(true)
      // Creation guide is NOT shown — host has not set principalsCreationGuideVisible to true.
      expect(wrapper.find('[data-testid="principals-create-guide"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="sibling-advanced-field"]').exists()).toBe(true)
      expect(wrapper.find('.stub-vfg').exists()).toBe(true)
    })
  })

  describe('data plane version compatibility alert', () => {
    const konnectConfig = { apiBaseUrl: '/us', app: 'konnect' }

    const mountKonnect = (formModelOverrides = {}, propsOverrides = {}, configOverrides = {}) =>
      mount(OIDCPrincipals, {
        props: { ...baseProps, formModel: buildFormModel(formModelOverrides), ...propsOverrides },
        global: { provide: { [FORMS_CONFIG]: { ...konnectConfig, ...configOverrides } } },
      })

    it('does not show the alert when no data plane versions are provided', () => {
      const wrapper = mountKonnect({}, {}, { principalsCreationGuideVisible: false })

      expect(wrapper.find('[data-testid="oidc-principals-dp-version-alert"]').exists()).toBe(false)
    })

    it('does not show the alert when all data plane versions meet the minimum', () => {
      const wrapper = mountKonnect({}, {}, { principalsCreationGuideVisible: false, dataPlaneVersions: ['3.15.0.0', '3.16.1.2'] })

      expect(wrapper.find('[data-testid="oidc-principals-dp-version-alert"]').exists()).toBe(false)
    })

    it('shows the alert alongside the "Add principals" guide when no principals are configured yet (different sections)', () => {
      const wrapper = mountKonnect({}, {}, { principalsCreationGuideVisible: true, dataPlaneVersions: ['3.10.0.0'] })

      expect(wrapper.find('[data-testid="principals-create-guide"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="oidc-principals-dp-version-alert"]').exists()).toBe(true)
    })

    it('shows the alert once principals are configured but a connected node is below 3.15 in Kong Identity mode', () => {
      const wrapper = mountKonnect({}, {}, { principalsCreationGuideVisible: false, dataPlaneVersions: ['3.10.0.0'] })

      expect(wrapper.find('[data-testid="principals-create-guide"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="oidc-principals-dp-version-alert"]').exists()).toBe(true)
    })

    it('shows the alert in External mode when principal lookup is opted in and a connected node is below 3.15', () => {
      const wrapper = mountKonnect(
        { 'config-issuer': 'https://idp.example.com', 'config-principals-enabled': true },
        { isEditing: true },
        { principalsCreationGuideVisible: false, dataPlaneVersions: ['3.10.0.0'] },
      )

      expect((wrapper.vm as any).selectedMode).toBe('external')
      expect(wrapper.find('[data-testid="oidc-principals-dp-version-alert"]').exists()).toBe(true)
    })
  })
})
