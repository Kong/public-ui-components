import { ref } from 'vue'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import OpenidConnectForm from './OpenidConnectForm.vue'
import type { FormSchema } from '../../../../types/plugins/form-schema'
import { REDIS_PARTIAL_INFO } from '../../shared/const'
import { appendEntityChecksFromMetadata, distributeEntityChecks } from '../../shared/schema-enhancement'
import schemaOidc from '../../../../../fixtures/schemas/oidc'


// ─── Constants ────────────────────────────────────────────────────────────────

// All 9 auth methods — all rendered as checkboxes (session included)
const AUTH_METHOD_VALUES = [
  'password',
  'client_credentials',
  'authorization_code',
  'bearer',
  'introspection',
  'userinfo',
  'kong_oauth2',
  'refresh_token',
  'session',
] as const

const AUTH_METHOD_LABELS: Record<typeof AUTH_METHOD_VALUES[number], string> = {
  password: 'Passwords Grant',
  client_credentials: 'Client Credentials Grant',
  authorization_code: 'Authorization Code Flow',
  bearer: 'Bearer Access Token',
  introspection: 'Introspection',
  userinfo: 'UserInfo',
  kong_oauth2: 'Kong OAuth',
  refresh_token: 'Refresh Token',
  session: 'Enable Session Management',
}

// Testids for Common tab fields. Array fields render as ArrayField → `ff-array-{path}`;
// scalar fields render as `ff-{path}`.
const COMMON_FIELD_PATHS = ['ff-array-config.client_id', 'ff-array-config.client_secret', 'ff-config.issuer'] as const

// All Authorization tab fields are arrays → `ff-array-{path}`
const AUTH_FIELD_PATHS = [
  'ff-array-config.scopes_claim',
  'ff-array-config.scopes_required',
  'ff-array-config.audience_claim',
  'ff-array-config.audience_required',
  'ff-array-config.roles_claim',
  'ff-array-config.roles_required',
  'ff-array-config.groups_claim',
  'ff-array-config.groups_required',
  'ff-array-config.authenticated_groups_claim',
] as const

// ─── Schema fixtures ──────────────────────────────────────────────────────────

// Use the real OIDC fixture from the Kong Admin API as the FormSchema. The fixture
// is the raw API response shape (`{ fields, entity_checks, supported_partials }`);
// FormSchema additionally requires `type: 'record'` at the root. Run the same
// schema-enhancement pipeline PluginEntityForm uses before passing into free-form
// components so entity_checks land at the right nesting level.
const createSchema = (): FormSchema => {
  const raw: FormSchema = { type: 'record', ...(schemaOidc as any) }
  return distributeEntityChecks(appendEntityChecksFromMetadata('openid-connect', raw))
}

// Minimal VFG schema — only used by StandardLayout for global fields (enabled, name, scope)
const createFormSchema = () => ({
  fields: [
    { model: 'enabled', type: 'switch', default: true },
    { model: 'name', type: 'input', inputType: 'hidden' },
  ],
})

// ─── Model fixtures ───────────────────────────────────────────────────────────

// API-format model (nested config, not dash-keyed VFG model)
const createModel = (configOverrides: Record<string, any> = {}) => ({
  config: {
    auth_methods: [...AUTH_METHOD_VALUES],
    audience_claim: ['aud'],
    ...configOverrides,
  },
})

// ─── Mount helper ─────────────────────────────────────────────────────────────

interface MountOptions {
  isEditing?: boolean
  model?: Record<string, any>
}

const mountForm = (options: MountOptions = {}) => {
  const {
    isEditing = false,
    model = createModel(),
  } = options

  cy.mount(OpenidConnectForm, {
    props: {
      schema: createSchema(),
      formSchema: createFormSchema(),
      formModel: {},
      model,
      isEditing,
      pluginName: 'openid-connect',
      onFormChange: cy.spy().as('onFormChange'),
      onValidityChange: cy.spy().as('onValidityChange'),
    },
    global: {
      // PluginForm.vue always provides REDIS_PARTIAL_INFO; the OIDC fixture declares
      // `supported_partials: { 'redis-ee': ['config.redis'] }`. FORMS_CONFIG is
      // required by RedisConfigurationSelector inside RedisSelector.
      provide: {
        [REDIS_PARTIAL_INFO as symbol]: {
          redisType: ref('redis-ee'),
          redisPath: ref('config.redis'),
          isEditing,
        },
        [FORMS_CONFIG]: {
          app: 'konnect' as const,
          apiBaseUrl: '/us/kong-api',
          controlPlaneId: '123',
        },
      },
    },
  })
}

// ─── Tab navigation helpers ───────────────────────────────────────────────────

// Tabs are navigated via data-testid set in the KTabs anchor slot by the implementation.
// Convention: oidc-tab-{name} where name matches the hash without the '#'.
const clickTab = (name: 'common' | 'authorization' | 'advanced') => {
  cy.getTestId(`oidc-tab-${name}`).click()
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('OpenidConnectForm', () => {
  // ── C: Tab structure ─────────────────────────────────────────────────────

  describe('tab structure', () => {
    it('renders three tab triggers: Common, Authorization, Advanced', () => {
      mountForm()

      cy.getTestId('oidc-tab-common').should('be.visible').and('contain.text', 'Common')
      cy.getTestId('oidc-tab-authorization').should('be.visible').and('contain.text', 'Authorization')
      cy.getTestId('oidc-tab-advanced').should('be.visible').and('contain.text', 'Advanced')
    })

    it('shows Common tab content by default', () => {
      mountForm()

      // Common tab fields are visible without any click
      cy.getTestId('ff-array-config.client_id').should('exist')
    })

    it('switches to Authorization tab content on click', () => {
      mountForm()

      clickTab('authorization')

      cy.getTestId('ff-array-config.scopes_claim').should('exist')
    })

    it('switches to Advanced tab content on click', () => {
      mountForm()

      clickTab('advanced')

      cy.getTestId('ff-config.authorization_endpoint').should('exist')
    })
  })

  // ── E: Common tab field distribution ─────────────────────────────────────

  describe('Common tab', () => {
    beforeEach(() => {
      mountForm()
      // Common tab is active by default — no click needed
    })

    it('renders client_id, client_secret, and issuer inputs', () => {
      for (const path of COMMON_FIELD_PATHS) {
        cy.getTestId(path).should('be.visible')
      }
    })

    it('renders all 9 auth method checkboxes with correct labels', () => {
      for (const [value, label] of Object.entries(AUTH_METHOD_LABELS)) {
        cy.getTestId(`oidc-auth-method-${value}`)
          .should('be.visible')
          .and('contain.text', label)
      }
    })

    it('does not show Authorization tab fields', () => {
      for (const path of AUTH_FIELD_PATHS) {
        cy.getTestId(path).should('not.exist')
      }
    })

    it('does not show Advanced tab fields', () => {
      cy.getTestId('ff-config.authorization_endpoint').should('not.exist')
    })
  })

  // ── F: Authorization tab field distribution ───────────────────────────────

  describe('Authorization tab', () => {
    beforeEach(() => {
      mountForm()
      clickTab('authorization')
    })

    it('renders all 9 authorization claim fields', () => {
      for (const path of AUTH_FIELD_PATHS) {
        cy.getTestId(path).should('be.visible')
      }
    })

    it('does not show Common tab fields', () => {
      for (const path of COMMON_FIELD_PATHS) {
        cy.getTestId(path).should('not.exist')
      }
    })

    it('does not show auth method checkboxes', () => {
      cy.getTestId('oidc-auth-method-bearer').should('not.exist')
    })

    it('does not show Advanced tab fields', () => {
      cy.getTestId('ff-config.authorization_endpoint').should('not.exist')
    })
  })

  // ── G: Advanced tab field distribution ───────────────────────────────────

  describe('Advanced tab', () => {
    beforeEach(() => {
      mountForm()
      clickTab('advanced')
    })

    it('renders config fields not belonging to Common or Authorization tabs', () => {
      cy.getTestId('ff-config.authorization_endpoint').should('be.visible')
    })

    it('renders the client_jwk array field', () => {
      cy.getTestId('ff-array-config.client_jwk').should('be.visible')
    })

    it('does not show Common tab fields', () => {
      for (const path of COMMON_FIELD_PATHS) {
        cy.getTestId(path).should('not.exist')
      }
    })

    it('does not show Authorization tab fields', () => {
      for (const path of AUTH_FIELD_PATHS) {
        cy.getTestId(path).should('not.exist')
      }
    })

    it('does not render config.auth_methods as a standard ff-* field', () => {
      // auth_methods is controlled by the checkboxes in Common tab, never a raw ff field
      cy.getTestId('ff-array-config.auth_methods').should('not.exist')
    })
  })

  // ── H: Auth methods checkbox interaction ──────────────────────────────────

  describe('auth methods interaction', () => {
    it('checks all 9 auth method checkboxes when all methods are in the model', () => {
      mountForm({ model: createModel() })

      for (const value of AUTH_METHOD_VALUES) {
        cy.getTestId(`oidc-auth-method-${value}`)
          .find('input[type="checkbox"]')
          .should('be.checked')
      }
    })

    it('checks the session checkbox when session is in the model', () => {
      mountForm({ model: createModel({ auth_methods: ['bearer', 'session'] }) })

      cy.getTestId('oidc-auth-method-session')
        .find('input[type="checkbox"]')
        .should('be.checked')
    })

    it('leaves the session checkbox unchecked when session is absent from the model', () => {
      mountForm({ model: createModel({ auth_methods: ['bearer'] }) })

      cy.getTestId('oidc-auth-method-session')
        .find('input[type="checkbox"]')
        .should('not.be.checked')
    })

    it('unchecking a method removes it from auth_methods via onFormChange', () => {
      mountForm()

      cy.getTestId('oidc-auth-method-bearer')
        .find('input[type="checkbox"]')
        .uncheck()

      cy.get('@onFormChange').should('have.been.called')
      cy.get('@onFormChange').its('lastCall').its('args.0').then((payload) => {
        expect(payload.config.auth_methods).not.to.include('bearer')
        for (const method of AUTH_METHOD_VALUES.filter(m => m !== 'bearer')) {
          expect(payload.config.auth_methods).to.include(method)
        }
      })
    })

    it('checking an unchecked method adds it to auth_methods via onFormChange', () => {
      mountForm({ model: createModel({ auth_methods: [] }) })

      cy.getTestId('oidc-auth-method-bearer')
        .find('input[type="checkbox"]')
        .check()

      cy.get('@onFormChange').its('lastCall').its('args.0').then((payload) => {
        expect(payload.config.auth_methods).to.include('bearer')
      })
    })

    it('unchecking session removes it without affecting other method checkboxes', () => {
      mountForm({ model: createModel({ auth_methods: [...AUTH_METHOD_VALUES] }) })

      cy.getTestId('oidc-auth-method-session')
        .find('input[type="checkbox"]')
        .uncheck()

      cy.get('@onFormChange').its('lastCall').its('args.0').then((payload) => {
        expect(payload.config.auth_methods).not.to.include('session')
        for (const method of AUTH_METHOD_VALUES.filter(m => m !== 'session')) {
          expect(payload.config.auth_methods).to.include(method)
        }
      })
    })

    it('checking session adds it without affecting other method checkboxes', () => {
      mountForm({ model: createModel({ auth_methods: ['bearer'] }) })

      cy.getTestId('oidc-auth-method-session')
        .find('input[type="checkbox"]')
        .check()

      cy.get('@onFormChange').its('lastCall').its('args.0').then((payload) => {
        expect(payload.config.auth_methods).to.include('session')
        expect(payload.config.auth_methods).to.include('bearer')
      })
    })

    it('unchecking all methods with session on yields auth_methods: ["session"]', () => {
      mountForm({ model: createModel({ auth_methods: ['bearer', 'session'] }) })

      cy.getTestId('oidc-auth-method-bearer')
        .find('input[type="checkbox"]')
        .uncheck()

      cy.get('@onFormChange').its('lastCall').its('args.0').then((payload) => {
        expect(payload.config.auth_methods).to.deep.equal(['session'])
      })
    })

    it('renders all 9 checkboxes unchecked when auth_methods is empty', () => {
      mountForm({ model: createModel({ auth_methods: [] }) })

      for (const value of AUTH_METHOD_VALUES) {
        cy.getTestId(`oidc-auth-method-${value}`)
          .find('input[type="checkbox"]')
          .should('not.be.checked')
      }
    })
  })

  // ── I: Edit mode pre-population ───────────────────────────────────────────

  describe('edit mode pre-population', () => {
    it('pre-populates issuer from the model', () => {
      mountForm({
        isEditing: true,
        model: createModel({ issuer: 'https://issuer.example.com' }),
      })

      cy.getTestId('ff-config.issuer').should('have.value', 'https://issuer.example.com')
    })

    it('reflects saved auth_methods in checkboxes', () => {
      mountForm({
        isEditing: true,
        model: createModel({ auth_methods: ['bearer'] }),
      })

      cy.getTestId('oidc-auth-method-bearer')
        .find('input[type="checkbox"]')
        .should('be.checked')

      for (const value of AUTH_METHOD_VALUES.filter(m => m !== 'bearer')) {
        cy.getTestId(`oidc-auth-method-${value}`)
          .find('input[type="checkbox"]')
          .should('not.be.checked')
      }
    })

    it('pre-populates only the session checkbox when auth_methods is ["session"]', () => {
      mountForm({
        isEditing: true,
        model: createModel({ auth_methods: ['session'] }),
      })

      cy.getTestId('oidc-auth-method-session')
        .find('input[type="checkbox"]')
        .should('be.checked')

      for (const value of AUTH_METHOD_VALUES.filter(m => m !== 'session')) {
        cy.getTestId(`oidc-auth-method-${value}`)
          .find('input[type="checkbox"]')
          .should('not.be.checked')
      }
    })

    it('pre-populates Authorization tab fields from the model', () => {
      mountForm({
        isEditing: true,
        model: createModel({ scopes_claim: ['email'] }),
      })

      clickTab('authorization')
      cy.getTestId('ff-array-config.scopes_claim').should('be.visible')
    })
  })

  // ── J: Redis partial (Advanced tab) ──────────────────────────────────────

  describe('redis partial', () => {
    it('shows redis-config-card in the Advanced tab', () => {
      mountForm()

      clickTab('advanced')
      cy.getTestId('redis-config-card').should('exist')
    })
  })

  // ── K: External documentation links ──────────────────────────────────────

  describe('external documentation links', () => {
    it('Common tab has link to OpenID Connect reference', () => {
      mountForm()

      cy.get('a[href="https://developer.konghq.com/plugins/openid-connect/reference/"]')
        .should('be.visible')
    })

    it('Authorization tab has link to authorization section', () => {
      mountForm()

      clickTab('authorization')
      cy.get('a[href="https://developer.konghq.com/plugins/openid-connect/#authorization"]')
        .should('be.visible')
    })

    it('Advanced tab has link to main OpenID Connect docs', () => {
      mountForm()

      clickTab('advanced')
      cy.get('a[href="https://developer.konghq.com/plugins/openid-connect/"]')
        .should('be.visible')
    })
  })

  // ── L: consumer_claim migration ───────────────────────────────────────────

  describe('consumer_claim → consumer_claims migration', () => {
    it('calls onFormChange with migrated consumer_claims on mount when consumer_claims is null', () => {
      mountForm({
        model: createModel({
          consumer_claim: ['sub'],
          consumer_claims: null,
        }),
      })

      // Find the migration call: it's the one whose consumer_claims is a non-empty
      // array of arrays. Form @change emits also include consumer_claims (as null,
      // pulled straight from the model), so we have to filter by shape, not by
      // "is defined".
      cy.get('@onFormChange').should((spy: any) => {
        const migrationCall = spy.args.find(
          (args: any[]) => Array.isArray(args[0]?.config?.consumer_claims)
            && args[0].config.consumer_claims.length > 0,
        )
        expect(migrationCall, 'migration call not found').not.to.equal(undefined)
        expect(migrationCall[0].config.consumer_claims).to.deep.equal([['sub']])
      })
    })

    it('does not overwrite existing consumer_claims', () => {
      mountForm({
        model: createModel({
          consumer_claim: ['sub'],
          consumer_claims: [['username']],
        }),
      })

      cy.get('@onFormChange').then((spy: any) => {
        for (const args of spy.args) {
          if (args[0]?.config?.consumer_claims !== undefined) {
            expect(args[0].config.consumer_claims).to.deep.equal([['username']])
          }
        }
      })
    })

    it('does not call onFormChange for migration when consumer_claim is null', () => {
      mountForm({
        model: createModel({
          consumer_claim: null,
          consumer_claims: null,
        }),
      })

      cy.get('@onFormChange').then((spy: any) => {
        const hasMigrationCall = spy.args.some(
          (args: any[]) => args[0]?.config?.consumer_claims != null,
        )
        expect(hasMigrationCall).to.equal(false)
      })
    })
  })
})

// ── M: token_exchange and proof_of_possession_mtls_from_header cleanup ────────
// The form must emit the same cleaned values that shamefullyTransformPayload produces.
// These tests mount the form with problematic model data and verify that onFormChange
// is called with the cleaned-up config (null where the value is empty/default).

describe('token_exchange cleanup on mount', () => {
  it('emits token_exchange: null when it matches the default empty shape', () => {
    mountForm({
      model: createModel({
        token_exchange: {
          cache: { enabled: true },
          request: { audience: null, scopes: null, empty_audience: false, empty_scopes: false },
          subject_token_issuers: null,
        },
      }),
    })

    cy.get('@onFormChange').should((spy: any) => {
      const emittedValues = spy.args.map((args: any[]) => args[0]?.config?.token_exchange)
      expect(emittedValues).to.include(null)
    })
  })

  it('emits token_exchange: null when request.audience and scopes are empty arrays', () => {
    mountForm({
      model: createModel({
        token_exchange: {
          cache: {},
          request: { audience: [], scopes: [] },
        },
      }),
    })

    cy.get('@onFormChange').should((spy: any) => {
      const emittedValues = spy.args.map((args: any[]) => args[0]?.config?.token_exchange)
      expect(emittedValues).to.include(null)
    })
  })

  it('does not null out a non-empty token_exchange', () => {
    mountForm({
      model: createModel({
        token_exchange: {
          cache: { enabled: true },
          request: { audience: ['my-api'], scopes: null, empty_audience: false, empty_scopes: false },
        },
      }),
    })

    cy.get('@onFormChange').then((spy: any) => {
      const hasNulledTokenExchange = spy.args.some(
        (args: any[]) => args[0]?.config?.token_exchange === null,
      )
      expect(hasNulledTokenExchange).to.equal(false)
    })
  })
})

describe('proof_of_possession_mtls_from_header cleanup on mount', () => {
  it('emits proof_of_possession_mtls_from_header: null when ca_certificates is empty', () => {
    mountForm({
      model: createModel({
        proof_of_possession_mtls_from_header: { ca_certificates: [] },
      }),
    })

    cy.get('@onFormChange').should((spy: any) => {
      const emittedValues = spy.args.map((args: any[]) => args[0]?.config?.proof_of_possession_mtls_from_header)
      expect(emittedValues).to.include(null)
    })
  })

  it('emits proof_of_possession_mtls_from_header: null when ca_certificates is absent', () => {
    mountForm({
      model: createModel({
        proof_of_possession_mtls_from_header: { ssl_verify: true },
      }),
    })

    cy.get('@onFormChange').should((spy: any) => {
      const emittedValues = spy.args.map((args: any[]) => args[0]?.config?.proof_of_possession_mtls_from_header)
      expect(emittedValues).to.include(null)
    })
  })

  it('does not null out proof_of_possession_mtls_from_header when ca_certificates is non-empty', () => {
    mountForm({
      model: createModel({
        proof_of_possession_mtls_from_header: { ca_certificates: ['ca-cert-uuid'], ssl_verify: true },
      }),
    })

    cy.get('@onFormChange').then((spy: any) => {
      const hasNulledMtls = spy.args.some(
        (args: any[]) => args[0]?.config?.proof_of_possession_mtls_from_header === null,
      )
      expect(hasNulledMtls).to.equal(false)
    })
  })
})
