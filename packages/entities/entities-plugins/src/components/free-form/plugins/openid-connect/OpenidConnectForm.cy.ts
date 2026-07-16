import { ref } from 'vue'
import { cloneDeep } from 'lodash-es'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import OpenidConnectForm from './OpenidConnectForm.vue'
import type { FormSchema } from '../../../../types/plugins/form-schema'
import { REDIS_PARTIAL_INFO } from '../../shared/const'
import { FEATURE_FLAGS } from '../../../../constants'
import { appendEntityChecksFromMetadata, distributeEntityChecks } from '../../shared/schema-enhancement'
import schemaOidc from '../../../../../fixtures/schemas/oidc'


// ─── Constants ────────────────────────────────────────────────────────────────

// The 8 credential auth methods; `session` is presented separately (radio group on
// Konnect, switch on Kong Manager) but still stored in config.auth_methods.
const AUTH_METHOD_VALUES = [
  'authorization_code',
  'bearer',
  'client_credentials',
  'password',
  'introspection',
  'userinfo',
  'kong_oauth2',
  'refresh_token',
] as const

const AUTH_METHOD_LABELS: Record<typeof AUTH_METHOD_VALUES[number], string> = {
  authorization_code: 'Authorization code flow',
  bearer: 'Bearer access token',
  client_credentials: 'Client credentials grant',
  password: 'Passwords grant',
  introspection: 'Introspection',
  userinfo: 'UserInfo',
  kong_oauth2: 'Kong OAuth',
  refresh_token: 'Refresh token',
}

const KONG_IDENTITY_METHODS = ['bearer', 'client_credentials', 'introspection', 'userinfo']

// `config.shorthand_fields` holds deprecated aliases the backend keeps in sync with their
// canonical fields (see PluginEntityForm.vue's stripUnknownConfigFields). They live in a
// separate array from `fields[]`, so the free-form renderer never builds `ff-*` testids for
// them. Derive the expected testids from the fixture itself rather than hand-maintaining
// the ~30-entry list.
const SHORTHAND_FIELD_TEST_IDS = (() => {
  const configField = ((schemaOidc as any).fields as any[]).find(f => 'config' in f)
  return (configField.config.shorthand_fields as any[]).map((entry) => {
    const [name, def] = Object.entries(entry)[0] as [string, any]
    const prefix = def.type === 'array' ? 'ff-array-config' : 'ff-config'
    return `${prefix}.${name}`
  })
})()

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

// `config.principals` from the API Gateway 3.15 OIDC schema. The base fixture predates
// 3.15, so principals-specific tests append it to the config record.
const PRINCIPALS_SCHEMA_FIELD = {
  principals: {
    description: 'Configuration for Kong Identity principal hydration after token verification.',
    required: true,
    type: 'record',
    fields: [
      { directory: { default: 'default', description: 'The Kong Identity directory instance to look up against.', match: '^[a-zA-Z0-9_-]+$', type: 'string' } },
      { enabled: { default: false, description: 'When true, query Kong Identity to map a Principal after token verification.', type: 'boolean' } },
      { error_on_miss: { default: true, description: 'When true (default), return 401 on principal lookup miss.', type: 'boolean' } },
      { match_consumer: { default: true, description: 'Load the Consumer attached to the matched Principal.', type: 'boolean' } },
      { match_consumer_groups: { default: true, description: 'Load Consumer Groups attached to the matched Principal.', type: 'boolean' } },
      { principal_by: { description: 'Custom identity name for a type=custom Kong Identity lookup.', len_min: 1, required: false, type: 'string' } },
      { principal_claim: { description: 'Token claim to use for the Kong Identity lookup.', elements: { len_min: 1, type: 'string' }, len_min: 1, required: false, type: 'array' } },
    ],
  },
}

const DEFAULT_PRINCIPALS_MODEL = {
  directory: 'default',
  enabled: false,
  error_on_miss: true,
  match_consumer: true,
  match_consumer_groups: true,
  principal_by: null,
  principal_claim: null,
}

// Use the real OIDC fixture from the Kong Admin API as the FormSchema. The fixture
// is the raw API response shape (`{ fields, entity_checks, supported_partials }`);
// FormSchema additionally requires `type: 'record'` at the root. Run the same
// schema-enhancement pipeline PluginEntityForm uses before passing into free-form
// components so entity_checks land at the right nesting level.
const createSchema = (withPrincipals = false): FormSchema => {
  const raw: FormSchema = cloneDeep({ type: 'record', ...(schemaOidc as any) })
  if (withPrincipals) {
    const configField = (raw.fields as any[]).find(f => 'config' in f)
    configField.config.fields.push(cloneDeep(PRINCIPALS_SCHEMA_FIELD))
  }
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
    auth_methods: [...AUTH_METHOD_VALUES, 'session'],
    audience_claim: ['aud'],
    ...configOverrides,
  },
})

const createPrincipalsModel = (configOverrides: Record<string, any> = {}) => createModel({
  principals: cloneDeep(DEFAULT_PRINCIPALS_MODEL),
  ...configOverrides,
})

// ─── Mount helper ─────────────────────────────────────────────────────────────

interface MountOptions {
  isEditing?: boolean
  model?: Record<string, any>
  app?: 'konnect' | 'kongManager'
  /** Extra FORMS_CONFIG fields (dataPlaneVersions, principalsCreationGuideVisible, ...) */
  formsConfig?: Record<string, any>
  /** Append the 3.15 `config.principals` record to the schema */
  withPrincipals?: boolean
  /** Provide the Identity Principals UI feature flag */
  identityPrincipalsUi?: boolean
}

const mountForm = (options: MountOptions = {}) => {
  const {
    isEditing = false,
    model = createModel(),
    app = 'konnect',
    formsConfig = {},
    withPrincipals = false,
    identityPrincipalsUi = false,
  } = options

  cy.mount(OpenidConnectForm, {
    props: {
      schema: createSchema(withPrincipals),
      formSchema: createFormSchema(),
      formModel: {},
      model,
      isEditing,
      pluginName: 'openid-connect',
      onFormChange: cy.spy().as('onFormChange'),
      onValidityChange: cy.spy().as('onValidityChange'),
      'onClick:create-entity': cy.spy().as('onCreateEntity'),
      'onClick:learn-more': cy.spy().as('onLearnMore'),
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
          app,
          apiBaseUrl: '/us/kong-api',
          controlPlaneId: '123',
          ...formsConfig,
        },
        [FEATURE_FLAGS.KHCP_20393_IDENTITY_PRINCIPALS_UI]: identityPrincipalsUi,
      },
    },
  })
}

// Konnect + principals schema + feature flag, with auth servers API stubbed.
const mountPrincipalsForm = (
  options: MountOptions = {},
  servers: Array<Record<string, any>> = [],
  clients: Array<Record<string, any>> = [],
) => {
  cy.intercept('GET', '**/v1/auth-servers/_computed', { body: { data: servers } }).as('getAuthServers')
  cy.intercept('GET', '**/v1/auth-servers/*/clients', { body: { data: clients } }).as('getAuthServerClients')

  mountForm({
    withPrincipals: true,
    identityPrincipalsUi: true,
    model: createPrincipalsModel(),
    ...options,
  })
}

// ─── Tab navigation helpers ───────────────────────────────────────────────────

// Tabs are navigated via data-testid set in the KTabs anchor slot by the implementation.
// Convention: oidc-tab-{name} where name matches the hash without the '#'.
const clickTab = (name: 'common' | 'authorization' | 'advanced') => {
  cy.getTestId(`oidc-tab-${name}`).click()
}

const lastFormChange = () => cy.get('@onFormChange').its('lastCall').its('args.0')

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

    it('does not show auth methods controls', () => {
      cy.getTestId('auth-methods-multiselect').should('not.exist')
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

    it('renders the client_jwk array field with its docs link', () => {
      cy.getTestId('ff-array-config.client_jwk').should('be.visible')
      cy.get('a[href="https://developer.konghq.com/plugins/openid-connect/reference/#schema--config-client-jwk"]')
        .should('be.visible')
    })

    it('renders consumer_claims as an editable field', () => {
      cy.getTestId('ff-array-config.consumer_claims').should('exist')
    })

    it('does not render any deprecated config.shorthand_fields entries (e.g. consumer_claim)', () => {
      for (const testId of SHORTHAND_FIELD_TEST_IDS) {
        cy.getTestId(testId).should('not.exist')
      }
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
      // auth_methods is controlled by the auth methods control in Common tab, never a raw ff field
      cy.getTestId('ff-array-config.auth_methods').should('not.exist')
    })

    it('renders upstream/downstream headers as tabbed array fields', () => {
      mountForm({
        model: createModel({
          upstream_headers: [{ header: 'X-User', path: ['user', 'name'] }],
        }),
      })
      clickTab('advanced')

      cy.getTestId('ff-array-tabs-config.upstream_headers').should('exist')
      cy.getTestId('ff-array-config.upstream_headers').should('contain.text', '#1 Upstream header')
      // Empty arrays still render in tabs appearance (header + add button only)
      cy.getTestId('ff-array-config.downstream_headers')
        .should('have.attr', 'data-appearance', 'tabs')
    })

    it('renders the error message fields as textareas', () => {
      cy.getTestId('ff-config.unauthorized_error_message').should('have.prop', 'tagName', 'TEXTAREA')
      cy.getTestId('ff-config.forbidden_error_message').should('have.prop', 'tagName', 'TEXTAREA')
    })

    it('renders JWK key-material members as textareas inside client_jwk items', () => {
      mountForm({
        model: createModel({
          client_jwk: [{ kty: 'RSA', n: 'abc', alg: null }],
        }),
      })
      clickTab('advanced')

      cy.getTestId('ff-config.client_jwk.0.n').should('have.prop', 'tagName', 'TEXTAREA')
      // Short identifier members stay single-line inputs
      cy.getTestId('ff-config.client_jwk.0.kid').should('have.prop', 'tagName', 'INPUT')
    })

    it('renders redis sentinel/cluster nodes as tabbed array fields', () => {
      mountForm({
        model: createModel({
          cluster_cache_redis: { cluster_nodes: [{ ip: '127.0.0.1', port: 7000 }] },
        }),
      })
      clickTab('advanced')

      cy.getTestId('ff-array-tabs-config.cluster_cache_redis.cluster_nodes').should('exist')
      cy.getTestId('ff-array-config.cluster_cache_redis.cluster_nodes')
        .should('contain.text', '#1 Cluster node')
    })
  })

  // ── H1: Auth methods — Konnect (multiselect + session radios) ─────────────

  describe('auth methods (Konnect)', () => {
    it('renders the multiselect and session radios instead of checkboxes', () => {
      mountForm()

      cy.getTestId('auth-methods-multiselect').should('be.visible')
      cy.getTestId('session-radio-use').should('exist')
      cy.getTestId('session-radio-no-use').should('exist')
      cy.getTestId('auth-method-checkbox-bearer').should('not.exist')
      cy.getTestId('session-management-switch').should('not.exist')
    })

    it('selects the "Use sessions" radio when session is in the model', () => {
      mountForm({ model: createModel({ auth_methods: ['bearer', 'session'] }) })

      cy.getTestId('session-radio-use').closest('.k-radio').should('have.class', 'checked')
      cy.getTestId('session-radio-no-use').closest('.k-radio').should('not.have.class', 'checked')
    })

    it('selects the "Do not use sessions" radio when session is absent', () => {
      mountForm({ model: createModel({ auth_methods: ['bearer'] }) })

      cy.getTestId('session-radio-no-use').closest('.k-radio').should('have.class', 'checked')
    })

    it('turning sessions off removes session from auth_methods without touching other methods', () => {
      mountForm({ model: createModel({ auth_methods: ['bearer', 'session'] }) })

      cy.getTestId('session-radio-no-use').click({ force: true })

      lastFormChange().then((payload) => {
        expect(payload.config.auth_methods).to.deep.equal(['bearer'])
      })
    })

    it('turning sessions on appends session to auth_methods', () => {
      mountForm({ model: createModel({ auth_methods: ['bearer'] }) })

      cy.getTestId('session-radio-use').click({ force: true })

      lastFormChange().then((payload) => {
        expect(payload.config.auth_methods).to.deep.equal(['bearer', 'session'])
      })
    })

    it('deselecting a method in the multiselect keeps session membership', () => {
      mountForm({ model: createModel({ auth_methods: ['bearer', 'introspection', 'session'] }) })

      cy.getTestId('auth-methods-multiselect').click()
      cy.get('[data-testid="multiselect-item-bearer"] button').click({ force: true })

      lastFormChange().then((payload) => {
        expect(payload.config.auth_methods).not.to.include('bearer')
        expect(payload.config.auth_methods).to.include('introspection')
        expect(payload.config.auth_methods).to.include('session')
      })
    })

    it('restricts the multiselect to Kong Identity methods when the saved issuer is a Kong Identity issuer', () => {
      mountForm({
        isEditing: true,
        model: createModel({
          issuer: 'https://my-server.us.identity.konghq.com',
          auth_methods: ['bearer', 'session'],
          id: 'plugin-id',
        }),
      })

      cy.getTestId('auth-methods-multiselect').click()
      for (const method of KONG_IDENTITY_METHODS) {
        cy.get(`[data-testid="multiselect-item-${method}"]`).should('exist')
      }
      for (const method of AUTH_METHOD_VALUES.filter(m => !KONG_IDENTITY_METHODS.includes(m))) {
        cy.get(`[data-testid="multiselect-item-${method}"]`).should('not.exist')
      }
    })

    it('offers all methods when the saved issuer is an external IdP', () => {
      mountForm({
        isEditing: true,
        model: createModel({
          issuer: 'https://accounts.example.com',
          auth_methods: ['bearer'],
          id: 'plugin-id',
        }),
      })

      cy.getTestId('auth-methods-multiselect').click()
      for (const method of AUTH_METHOD_VALUES) {
        cy.get(`[data-testid="multiselect-item-${method}"]`).should('exist')
      }
    })
  })

  // ── H2: Auth methods — Kong Manager (checkbox list + session switch) ──────

  describe('auth methods (Kong Manager)', () => {
    it('renders 8 method checkboxes with correct labels and a session switch', () => {
      mountForm({ app: 'kongManager' })

      for (const [value, label] of Object.entries(AUTH_METHOD_LABELS)) {
        cy.getTestId(`auth-method-checkbox-${value}`)
          .should('exist')
          .parents('.auth-method')
          .should('contain.text', label)
      }
      cy.getTestId('session-management-switch').should('exist')
      cy.getTestId('auth-methods-multiselect').should('not.exist')
    })

    it('checks the checkboxes for methods present in the model', () => {
      mountForm({ app: 'kongManager', model: createModel({ auth_methods: ['bearer'] }) })

      cy.getTestId('auth-method-checkbox-bearer').should('be.checked')

      for (const value of AUTH_METHOD_VALUES.filter(m => m !== 'bearer')) {
        cy.getTestId(`auth-method-checkbox-${value}`).should('not.be.checked')
      }
    })

    it('unchecking a method removes it from auth_methods via onFormChange', () => {
      mountForm({ app: 'kongManager' })

      cy.getTestId('auth-method-checkbox-bearer').uncheck({ force: true })

      lastFormChange().then((payload) => {
        expect(payload.config.auth_methods).not.to.include('bearer')
        for (const method of AUTH_METHOD_VALUES.filter(m => m !== 'bearer')) {
          expect(payload.config.auth_methods).to.include(method)
        }
        expect(payload.config.auth_methods).to.include('session')
      })
    })

    it('checking an unchecked method adds it to auth_methods via onFormChange', () => {
      mountForm({ app: 'kongManager', model: createModel({ auth_methods: [] }) })

      cy.getTestId('auth-method-checkbox-bearer').check({ force: true })

      lastFormChange().then((payload) => {
        expect(payload.config.auth_methods).to.include('bearer')
      })
    })

    it('turns the session switch on when session is in the model', () => {
      mountForm({ app: 'kongManager', model: createModel({ auth_methods: ['bearer', 'session'] }) })

      cy.getTestId('session-management-switch').should('be.checked')
    })

    it('toggling the session switch off removes session without affecting other methods', () => {
      mountForm({ app: 'kongManager', model: createModel({ auth_methods: ['bearer', 'session'] }) })

      cy.getTestId('session-management-switch').click({ force: true })

      lastFormChange().then((payload) => {
        expect(payload.config.auth_methods).to.deep.equal(['bearer'])
      })
    })

    it('unchecking all methods with session on yields auth_methods: ["session"]', () => {
      mountForm({ app: 'kongManager', model: createModel({ auth_methods: ['bearer', 'session'] }) })

      cy.getTestId('auth-method-checkbox-bearer').uncheck({ force: true })

      lastFormChange().then((payload) => {
        expect(payload.config.auth_methods).to.deep.equal(['session'])
      })
    })
  })

  // ── H3: auth_methods must not be clobbered by unrelated edits (KM-4.2) ────

  describe('auth_methods stability', () => {
    it('editing an unrelated field preserves auth_methods from the model', () => {
      mountForm({ model: createModel({ auth_methods: ['bearer', 'session'] }) })

      cy.getTestId('ff-config.issuer').type('https://accounts.example.com')

      lastFormChange().then((payload) => {
        expect(payload.config.issuer).to.equal('https://accounts.example.com')
        expect(payload.config.auth_methods).to.deep.equal(['bearer', 'session'])
      })
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

    it('reflects saved auth_methods in the Kong Manager checkboxes', () => {
      mountForm({
        app: 'kongManager',
        isEditing: true,
        model: createModel({ auth_methods: ['bearer'] }),
      })

      cy.getTestId('auth-method-checkbox-bearer').should('be.checked')

      for (const value of AUTH_METHOD_VALUES.filter(m => m !== 'bearer')) {
        cy.getTestId(`auth-method-checkbox-${value}`).should('not.be.checked')
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
      // assert only 1 instance exists in advanced tab, make sure cluster_redis is not rendered with redis selector
      cy.getTestId('redis-config-card').should('exist').and('have.length', 1)
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

  // ── N: Kong Identity Principals UI ─────────────────────────────────────────

  describe('Kong Identity principals section', () => {
    it('renders the mode radio cards and defaults to Kong Identity on create', () => {
      mountPrincipalsForm()

      cy.getTestId('oidc-principals-section').should('be.visible')
      cy.getTestId('oidc-auth-mode-kong-identity').closest('.k-radio').should('have.class', 'checked')
      cy.getTestId('oidc-auth-mode-external').closest('.k-radio').should('not.have.class', 'checked')
      cy.getTestId('principals-directory-select').should('exist')
      // Plain common fields are replaced by the guided experience
      cy.getTestId('ff-array-config.client_id').should('not.exist')
    })

    it('does not render the section on Kong Manager even when the schema has principals', () => {
      mountForm({
        app: 'kongManager',
        withPrincipals: true,
        identityPrincipalsUi: true,
        model: createPrincipalsModel(),
      })

      cy.getTestId('oidc-principals-section').should('not.exist')
      cy.getTestId('ff-array-config.client_id').should('exist')
    })

    it('does not render the section when the feature flag is off', () => {
      mountForm({
        withPrincipals: true,
        identityPrincipalsUi: false,
        model: createPrincipalsModel(),
      })

      cy.getTestId('oidc-principals-section').should('not.exist')
      cy.getTestId('ff-array-config.client_id').should('exist')
    })

    it('does not render the section when the schema has no principals record', () => {
      mountForm({ identityPrincipalsUi: true })

      cy.getTestId('oidc-principals-section').should('not.exist')
    })

    it('never renders the bare principals record in the Advanced tab', () => {
      mountPrincipalsForm()

      clickTab('advanced')
      cy.getTestId('ff-object-config.principals').should('not.exist')
    })

    it('auto-selects the Kong Identity auth methods (+ session) on create', () => {
      mountPrincipalsForm()

      cy.get('@onFormChange').should((spy: any) => {
        const call = spy.args.find((args: any[]) => Array.isArray(args[0]?.config?.auth_methods))
        expect(call, 'auth methods call not found').not.to.equal(undefined)
      })
      lastFormChange().then((payload) => {
        expect(payload.config.auth_methods).to.have.members([...KONG_IDENTITY_METHODS, 'session'])
      })
    })

    it('switching to External selects all auth methods (+ session) and shows paired client inputs', () => {
      mountPrincipalsForm()

      cy.getTestId('oidc-auth-mode-external').click({ force: true })

      cy.getTestId('external-client-id').should('exist')
      cy.getTestId('external-client-secret').should('exist')
      cy.getTestId('ff-config.issuer').should('exist')

      lastFormChange().then((payload) => {
        expect(payload.config.auth_methods).to.have.members([...AUTH_METHOD_VALUES, 'session'])
        expect(payload.config.principals.enabled).to.equal(false)
        expect(payload.config.principals.directory).to.equal('default')
      })
    })

    it('adds and removes external client rows', () => {
      mountPrincipalsForm()

      cy.getTestId('oidc-auth-mode-external').click({ force: true })
      cy.getTestId('add-external-client-action').click()

      cy.getTestId('external-client-id').should('have.length', 2)

      cy.getTestId('remove-external-client-action').first().click()
      cy.getTestId('external-client-id').should('have.length', 1)
    })

    it('on edit, restores the matching auth server + client from the API, infers Kong Identity mode, keeps saved auth_methods, and prefills issuer + client on selection', () => {
      mountPrincipalsForm({
        isEditing: true,
        model: createPrincipalsModel({
          id: 'plugin-id',
          issuer: 'https://my-server.us.identity.konghq.com',
          auth_methods: ['bearer'],
          client_id: ['client-1-id'],
        }),
      }, [
        { id: 'server-1', name: 'My Auth Server', issuer: 'https://my-server.us.identity.konghq.com' },
        { id: 'server-2', name: 'Other Auth Server', issuer: 'https://other-server.us.identity.konghq.com' },
      ], [
        { id: 'client-1', name: 'My Client', client_id: 'client-1-id' },
      ])

      // The existing issuer matches server-1, so the select auto-restores it (no click
      // needed) and its clients are fetched — mode is inferred as Kong Identity, the saved
      // client_id stays selected, and the saved auth_methods must survive the edit-load.
      cy.wait('@getAuthServers')
      cy.wait('@getAuthServerClients')

      cy.getTestId('oidc-auth-mode-kong-identity').closest('.k-radio').should('have.class', 'checked')
      cy.getTestId('principals-client-select').should('have.value', 'My Client')
      cy.get('@onFormChange').then((spy: any) => {
        for (const args of spy.args) {
          if (Array.isArray(args[0]?.config?.auth_methods)) {
            expect(args[0].config.auth_methods).to.deep.equal(['bearer'])
          }
        }
      })

      // Switching to a different server resets the client selection and prefills issuer;
      // picking a client from that server's freshly-fetched list prefills client_id
      cy.getTestId('principals-directory-select').click()
      cy.getTestId('select-item-server-2').click()

      cy.getTestId('principals-client-select').click()
      cy.getTestId('select-item-client-1-id').click()

      lastFormChange().then((payload) => {
        expect(payload.config.issuer).to.equal('https://other-server.us.identity.konghq.com')
        expect(payload.config.client_id).to.deep.equal(['client-1-id'])
      })
    })

    it('falls back to a free-text issuer input without auth servers access', () => {
      mountPrincipalsForm({ formsConfig: { isKongIdentityAuthServersAvailable: false } })

      cy.getTestId('kong-identity-issuer-input').should('exist')
      cy.getTestId('principals-directory-select').should('not.exist')
      cy.getTestId('principals-client-id-input').should('exist')
    })

    it('infers External mode from a non-Kong-Identity issuer on edit', () => {
      mountPrincipalsForm({
        isEditing: true,
        model: createPrincipalsModel({
          id: 'plugin-id',
          issuer: 'https://accounts.example.com',
          auth_methods: ['bearer'],
        }),
      })

      cy.getTestId('oidc-auth-mode-external').closest('.k-radio').should('have.class', 'checked')
      cy.getTestId('external-client-id').should('exist')
    })

    it('adopts the host-resolved principals directory name on create', () => {
      mountPrincipalsForm({ formsConfig: { principalsDirectoryName: 'my-directory' } })

      cy.get('@onFormChange').should((spy: any) => {
        const call = spy.args.find((args: any[]) => args[0]?.config?.principals?.directory === 'my-directory')
        expect(call, 'directory adoption call not found').not.to.equal(undefined)
      })
    })
  })

  // ── O: Principal lookup settings ───────────────────────────────────────────

  describe('principal lookup settings', () => {
    const expandSettings = () => {
      cy.getTestId('principals-advanced-settings').findTestId('collapse-trigger-content').click()
    }

    it('renders the auth methods control inside the additional settings collapse, below principal lookup', () => {
      mountPrincipalsForm()

      // Hidden until the collapse is expanded
      cy.getTestId('auth-methods-multiselect').should('not.be.visible')
      expandSettings()
      cy.getTestId('auth-methods-multiselect').should('be.visible')
      cy.getTestId('session-radio-use').should('exist')
      cy.getTestId('principals-lookup-method').should('be.visible')
      // Auth methods render below the principal lookup settings
      cy.getTestId('principals-match-consumer-groups').parents('.principals-field-group')
        .nextAll()
        .find('[data-testid="auth-methods-multiselect"]')
        .should('exist')
    })

    it('restricts the multiselect to the 4 Kong Identity methods in Kong Identity mode', () => {
      mountPrincipalsForm()

      expandSettings()
      cy.getTestId('auth-methods-multiselect').click()
      for (const method of KONG_IDENTITY_METHODS) {
        cy.get(`[data-testid="multiselect-item-${method}"]`).should('exist')
      }
      cy.get('[data-testid="multiselect-item-authorization_code"]').should('not.exist')
    })

    it('enabling principal lookup flips config.principals.enabled', () => {
      mountPrincipalsForm()

      expandSettings()
      cy.getTestId('use-principal-lookup').click({ force: true })

      lastFormChange().then((payload) => {
        expect(payload.config.principals.enabled).to.equal(true)
      })
    })

    it('writes the token claim as a dot-notation path array', () => {
      mountPrincipalsForm()

      expandSettings()
      cy.getTestId('use-principal-lookup').click({ force: true })
      cy.getTestId('principals-token-claim').clear()
      cy.getTestId('principals-token-claim').type('user.employee_id')

      lastFormChange().then((payload) => {
        expect(payload.config.principals.principal_claim).to.deep.equal(['user', 'employee_id'])
      })
    })

    it('treats escaped periods in the token claim as literal dots', () => {
      mountPrincipalsForm()

      expandSettings()
      cy.getTestId('use-principal-lookup').click({ force: true })
      cy.getTestId('principals-token-claim').clear()
      cy.getTestId('principals-token-claim').type('workload\\.id')

      lastFormChange().then((payload) => {
        expect(payload.config.principals.principal_claim).to.deep.equal(['workload.id'])
      })
    })

    it('unsets the token claim (null, not []) when the input is cleared', () => {
      mountPrincipalsForm({
        model: createPrincipalsModel({
          principals: { ...DEFAULT_PRINCIPALS_MODEL, principal_claim: ['user'] },
        }),
      })

      expandSettings()
      cy.getTestId('use-principal-lookup').click({ force: true })
      cy.getTestId('principals-token-claim').clear()

      lastFormChange().then((payload) => {
        expect(payload.config.principals.principal_claim).to.equal(null)
      })
    })

    it('shows the custom identity name input only for the custom claim lookup method', () => {
      mountPrincipalsForm()

      expandSettings()
      cy.getTestId('use-principal-lookup').click({ force: true })
      cy.getTestId('principals-custom-identity-name').should('not.exist')

      cy.getTestId('principals-lookup-method').click()
      cy.getTestId('select-item-custom-identity').click()

      cy.getTestId('principals-custom-identity-name').should('exist')
    })

    it('unchecking "Use linked consumers" also unchecks consumer groups', () => {
      mountPrincipalsForm()

      expandSettings()
      cy.getTestId('use-principal-lookup').click({ force: true })
      cy.getTestId('principals-match-consumer').uncheck({ force: true })

      lastFormChange().then((payload) => {
        expect(payload.config.principals.match_consumer).to.equal(false)
        expect(payload.config.principals.match_consumer_groups).to.equal(false)
      })
    })

    it('shows the DP version alert when a data plane is older than 3.15', () => {
      mountPrincipalsForm({ formsConfig: { dataPlaneVersions: ['3.14.1.0', '3.15.0.0'] } })

      expandSettings()
      cy.getTestId('oidc-principals-dp-version-alert').should('be.visible')
    })

    it('hides the DP version alert when all data planes are 3.15+', () => {
      mountPrincipalsForm({ formsConfig: { dataPlaneVersions: ['3.15.0.0', '3.16.0.0'] } })

      expandSettings()
      cy.getTestId('oidc-principals-dp-version-alert').should('not.exist')
    })

    it('shows the principals creation guide once the host resolved it visible, regardless of the lookup toggle', () => {
      mountPrincipalsForm({ formsConfig: { principalsCreationGuideVisible: true } })

      expandSettings()
      cy.getTestId('principals-create-guide').should('be.visible')
    })

    it('shows the creation guide instead of the DP version alert when no principals exist yet, even on an old data plane', () => {
      mountPrincipalsForm({
        formsConfig: {
          principalsCreationGuideVisible: true,
          dataPlaneVersions: ['3.14.1.0', '3.15.0.0'],
        },
      })

      expandSettings()
      cy.getTestId('principals-create-guide').should('be.visible')
      cy.getTestId('oidc-principals-dp-version-alert').should('not.exist')
    })
  })
})

// ── P: token_exchange jwks_uri conditional visibility (Advanced tab) ──────────

describe('token_exchange subject_token_issuers jwks_uri', () => {
  const issuerItem = {
    issuer_regex: 'https://issuer.example.com',
    verify_signature: false,
    jwks_uri: null,
    allowed_audiences: null,
  }

  it('hides jwks_uri while verify_signature is off and shows it when toggled on', () => {
    mountForm({
      model: createModel({
        token_exchange: {
          cache: { enabled: true },
          request: { audience: ['my-api'], scopes: null, empty_audience: false, empty_scopes: false },
          subject_token_issuers: [issuerItem],
        },
      }),
    })

    clickTab('advanced')

    cy.getTestId('ff-config.token_exchange.subject_token_issuers.0.jwks_uri').should('not.be.visible')

    cy.getTestId('ff-config.token_exchange.subject_token_issuers.0.verify_signature').check({ force: true })

    cy.getTestId('ff-config.token_exchange.subject_token_issuers.0.jwks_uri').should('be.visible')
  })
})

// ── Q: config.redis conditional visibility based on session_storage ────────────

describe('config.redis visibility based on session_storage', () => {
  it('hides config.redis when session_storage is not redis', () => {
    mountForm({
      model: createModel({ session_storage: 'cookie' }),
    })

    clickTab('advanced')

    cy.getTestId('redis-config-card').should('not.be.visible')
  })

  it('shows config.redis when session_storage is redis', () => {
    mountForm({
      model: createModel({ session_storage: 'redis' }),
    })

    clickTab('advanced')

    cy.getTestId('redis-config-card').should('be.visible')
  })

  it('shows config.redis after switching session_storage to redis', () => {
    mountForm({
      model: createModel({ session_storage: 'cookie' }),
    })

    clickTab('advanced')

    cy.getTestId('redis-config-card').should('not.be.visible')

    cy.getTestId('ff-config.session_storage').first().click()
    cy.get('[data-testid="select-item-redis"]:visible').click()

    cy.getTestId('redis-config-card').should('be.visible')
  })
})
