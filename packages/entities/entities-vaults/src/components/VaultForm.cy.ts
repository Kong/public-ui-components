import type { KonnectVaultFormConfig, KongManagerVaultFormConfig } from '../types'
import VaultForm from './VaultForm.vue'
import { vault } from '../../fixtures/mockData'
import { EntityBaseForm } from '@kong-ui-public/entities-shared'

const cancelRoute = { name: 'vaults-list' }

const baseConfigKonnect: KonnectVaultFormConfig = {
  app: 'konnect',
  controlPlaneId: '1234-abcd-ilove-dogs',
  apiBaseUrl: '/us/kong-api',
  cancelRoute,
  azureVaultProviderAvailable: false,
  ttl: true,
  hcvAppRoleMethodAvailable: true,
  hcvCertMethodAvailable: true,
  hcvJwtMethodAvailable: true,
  hcvCspAuthMethodsAvailable: true,
  hcvSslVerifyAvailable: true,
}

const baseConfigKonnectTurnOffTTL: KonnectVaultFormConfig = {
  app: 'konnect',
  controlPlaneId: '1234-abcd-ilove-dogs',
  apiBaseUrl: '/us/kong-api',
  cancelRoute,
  azureVaultProviderAvailable: false,
  ttl: false,
}

const baseConfigKM: KongManagerVaultFormConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  cancelRoute,
  azureVaultProviderAvailable: false,
  ttl: true,
  awsStsEndpointUrlAvailable: true,
  hcvAppRoleMethodAvailable: true,
  hcvCertMethodAvailable: true,
  hcvJwtMethodAvailable: true,
  hcvCspAuthMethodsAvailable: true,
  hcvSslVerifyAvailable: true,
}

const baseConfigKMTurnOffTTL: KongManagerVaultFormConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  cancelRoute,
  azureVaultProviderAvailable: false,
  ttl: false,
}

const cspMethods = ['aws_iam', 'aws_ec2', 'azure', 'gcp_gce', 'gcp_iam'] as const
type CspMethod = typeof cspMethods[number]

const cspFields = [
  'aws_auth_role',
  'aws_auth_region',
  'aws_access_key_id',
  'aws_secret_access_key',
  'aws_auth_nonce',
  'azure_auth_role',
  'gcp_auth_role',
  'gcp_service_account',
  'gcp_jwt_exp',
] as const
type CspField = typeof cspFields[number]
const cspVisibility: Array<{ method: CspMethod, visible: CspField[] }> = [
  { method: 'aws_iam', visible: ['aws_auth_role', 'aws_auth_region', 'aws_access_key_id', 'aws_secret_access_key'] },
  { method: 'aws_ec2', visible: ['aws_auth_role', 'aws_auth_nonce'] },
  { method: 'azure', visible: ['azure_auth_role'] },
  { method: 'gcp_gce', visible: ['gcp_auth_role'] },
  { method: 'gcp_iam', visible: ['gcp_auth_role', 'gcp_service_account', 'gcp_jwt_exp'] },
]
const cspSubmit: Array<{ method: CspMethod, required: Array<{ field: CspField, value: string }>, optional?: Array<{ field: CspField, value: string }> }> = [
  {
    method: 'aws_iam',
    required: [
      { field: 'aws_auth_role', value: 'aws-role' },
      { field: 'aws_auth_region', value: 'ap-northeast-1' },
    ],
    optional: [
      { field: 'aws_access_key_id', value: 'access-key-id' },
      { field: 'aws_secret_access_key', value: 'secret-access-key' },
    ],
  },
  {
    method: 'aws_ec2',
    required: [
      { field: 'aws_auth_role', value: 'aws-role' },
      { field: 'aws_auth_nonce', value: 'nonce' },
    ],
  },
  { method: 'azure', required: [{ field: 'azure_auth_role', value: 'azure-role' }] },
  { method: 'gcp_gce', required: [{ field: 'gcp_auth_role', value: 'gcp-role' }] },
  {
    method: 'gcp_iam',
    required: [
      { field: 'gcp_auth_role', value: 'gcp-iam-role' },
      { field: 'gcp_service_account', value: 'svc@example.iam.gserviceaccount.com' },
      { field: 'gcp_jwt_exp', value: '300' },
    ],
  },
]

function pickAuth(method: CspMethod): void {
  cy.getTestId('vault-form-config-hcv-auth_method').click()
  cy.get(`[data-testid="select-item-${method}"] button`).click()
}

function hcvFieldId(field: CspField): string {
  return `vault-form-config-hcv-${field}`
}

function checkSubmit(enabled: boolean): void {
  cy.getTestId('vault-create-form-submit').should(enabled ? 'be.enabled' : 'be.disabled')
}

function fillHcvField(field: CspField, value: string): void {
  cy.getTestId(hcvFieldId(field)).clear()
  cy.getTestId(hcvFieldId(field)).type(value)
}

function checkCspVisibility(): void {
  cspVisibility.forEach(({ method, visible }) => {
    pickAuth(method)
    cy.getTestId('vault-form-config-hcv-token').should('not.exist')

    const visibleSet = new Set(visible)
    cspFields.forEach((field) => {
      cy.getTestId(hcvFieldId(field)).should(visibleSet.has(field) ? 'be.visible' : 'not.exist')
    })
  })
}

function checkCspSubmit(): void {
  cspSubmit.forEach(({ method, required, optional }) => {
    pickAuth(method)

    required.forEach(({ field }) => {
      cy.getTestId(hcvFieldId(field)).clear()
    })
    checkSubmit(false)

    required.forEach(({ field, value }, index) => {
      fillHcvField(field, value)
      checkSubmit(index === required.length - 1)
    })

    optional?.forEach(({ field, value }) => {
      fillHcvField(field, value)
      checkSubmit(true)
    })
  })
}

describe('<VaultForm />', () => {
  describe('Kong Manager', () => {
    const interceptKM = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/vaults/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? vault,
        },
      ).as(params?.alias ?? 'getVault')
    }

    const interceptUpdate = (status = 200): void => {
      cy.intercept(
        {
          method: 'PATCH',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/vaults/*`,
        },
        {
          statusCode: status,
          body: { ...vault, tags: ['tag1', 'tag2'] },
        },
      ).as('updateVault')
    }

    it('should show create form', () => {
      cy.mount(VaultForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.get('.kong-ui-entities-vault-form').should('be.visible')
      cy.get('.kong-ui-entities-vault-form form').should('be.visible')
      // button state
      cy.getTestId('vault-create-form-cancel').should('be.visible')
      cy.getTestId('vault-create-form-submit').should('be.visible')
      cy.getTestId('vault-create-form-cancel').should('be.enabled')
      cy.getTestId('vault-create-form-submit').should('be.disabled')

      // form fields - general
      cy.getTestId('vault-form-prefix').should('be.visible')
      cy.getTestId('vault-form-description').should('be.visible')
      cy.getTestId('vault-form-tags').should('be.visible')

      // vault provider selector
      cy.getTestId('vault-form-provider-env').should('exist').should('not.be.visible')
      cy.getTestId('vault-form-provider-aws').should('exist').should('not.be.visible')
      cy.getTestId('vault-form-provider-gcp').should('exist').should('not.be.visible')
      cy.getTestId('vault-form-provider-hcv').should('exist').should('not.be.visible')

      // form fields - kong
      cy.getTestId('vault-form-config-kong-prefix').should('be.visible')
      cy.getTestId('advanced-fields-collapse').should('not.exist')

      // form fields - aws
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-aws').click({ force: true })
      cy.getTestId('vault-form-config-aws-region').should('be.visible')
      cy.getTestId('vault-form-config-aws-sts_endpoint_url').should('be.visible')
      cy.getTestId('advanced-fields-collapse').should('be.visible')

      // form fields - gcp
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-gcp').click({ force: true })
      cy.getTestId('vault-form-config-gcp-project-id').should('be.visible')
      cy.getTestId('advanced-fields-collapse').should('be.visible')

      // form fields - hcv
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-hcv').click({ force: true })
      cy.getTestId('vault-form-config-hcv-protocol').should('be.visible')
      cy.getTestId('vault-form-config-hcv-host').should('be.visible')
      cy.getTestId('vault-form-config-hcv-port').should('be.visible')
      cy.getTestId('vault-form-config-hcv-mount').should('be.visible')
      cy.getTestId('vault-form-config-hcv-kv').should('be.visible')
      cy.getTestId('vault-form-config-hcv-namespace').should('be.visible')
      cy.getTestId('vault-form-config-hcv-ssl_verify').should('be.visible').should('be.checked')
      cy.getTestId('vault-form-config-hcv-auth_method').should('be.visible')
      cy.getTestId('vault-form-config-hcv-token').should('be.visible')

      cy.getTestId('vault-form-config-hcv-auth_method').click()
      cy.get('[data-testid="select-item-kubernetes"] button').click()
      cy.getTestId('vault-form-config-hcv-token').should('not.exist')
      cy.getTestId('vault-form-config-hcv-kube_role').should('be.visible')
      cy.getTestId('vault-form-config-hcv-kube_api_token_file').should('be.visible')

      cy.getTestId('vault-form-config-hcv-auth_method').click()
      cy.get('[data-testid="select-item-approle"] button').click()
      cy.getTestId('vault-form-config-hcv-token').should('not.exist')
      cy.getTestId('vault-form-config-hcv-approle_role_id').should('be.visible')
      cy.getTestId('vault-form-config-hcv-approle_secret_id').should('be.visible')

      cy.getTestId('vault-form-config-hcv-auth_method').click()
      cy.get('[data-testid="select-item-cert"] button').click()
      cy.getTestId('vault-form-config-hcv-token').should('not.exist')
      cy.getTestId('vault-form-config-hcv-cert_auth_cert').should('be.visible')

      cy.getTestId('vault-form-config-hcv-auth_method').click()
      cy.get('[data-testid="select-item-jwt"] button').click()
      cy.getTestId('vault-form-config-hcv-token').should('not.exist')
      cy.getTestId('vault-form-config-hcv-oauth2_client_id').should('be.visible')
      cy.getTestId('vault-form-config-hcv-oauth2_audiences').should('be.visible')
      checkCspVisibility()

      cy.getTestId('advanced-fields-collapse').should('be.visible')
    })

    it('should show create form - with turn off TTL', () => {
      cy.mount(VaultForm, {
        props: {
          config: baseConfigKMTurnOffTTL,
        },
      })

      cy.get('.kong-ui-entities-vault-form').should('be.visible')
      cy.get('.kong-ui-entities-vault-form form').should('be.visible')
      // button state
      cy.getTestId('vault-create-form-cancel').should('be.visible')
      cy.getTestId('vault-create-form-submit').should('be.visible')
      cy.getTestId('vault-create-form-cancel').should('be.enabled')
      cy.getTestId('vault-create-form-submit').should('be.disabled')

      // form fields - general
      cy.getTestId('vault-form-prefix').should('be.visible')
      cy.getTestId('vault-form-description').should('be.visible')
      cy.getTestId('vault-form-tags').should('be.visible')

      // vault provider selector
      cy.getTestId('vault-form-provider-env').should('exist').should('not.be.visible')
      cy.getTestId('vault-form-provider-aws').should('exist').should('not.be.visible')
      cy.getTestId('vault-form-provider-gcp').should('exist').should('not.be.visible')
      cy.getTestId('vault-form-provider-hcv').should('exist').should('not.be.visible')

      // form fields - kong
      cy.getTestId('vault-form-config-kong-prefix').should('be.visible')
      cy.getTestId('advanced-fields-collapse').should('not.exist')

      // form fields - aws
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-aws').click({ force: true })
      cy.getTestId('vault-form-config-aws-region').should('be.visible')
      cy.getTestId('vault-form-config-aws-sts_endpoint_url').should('not.exist')
      cy.getTestId('advanced-fields-collapse').should('not.exist')

      // form fields - gcp
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-gcp').click({ force: true })
      cy.getTestId('vault-form-config-gcp-project-id').should('be.visible')
      cy.getTestId('advanced-fields-collapse').should('not.exist')

      // form fields - hcv
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-hcv').click({ force: true })
      cy.getTestId('vault-form-config-hcv-protocol').should('be.visible')
      cy.getTestId('vault-form-config-hcv-host').should('be.visible')
      cy.getTestId('vault-form-config-hcv-port').should('be.visible')
      cy.getTestId('vault-form-config-hcv-mount').should('be.visible')
      cy.getTestId('vault-form-config-hcv-kv').should('be.visible')
      cy.getTestId('vault-form-config-hcv-namespace').should('be.visible')
      cy.getTestId('vault-form-config-hcv-ssl_verify').should('not.exist')
      cy.getTestId('vault-form-config-hcv-auth_method').should('be.visible')
      cy.getTestId('vault-form-config-hcv-token').should('be.visible')
      cy.getTestId('vault-form-config-hcv-auth_method').click({ force: true })
      cspMethods.forEach((method) => {
        cy.get(`[data-testid="select-item-${method}"]`).should('not.exist')
      })
      cy.get('[data-testid="select-item-kubernetes"] button').click({ force: true })
      cy.getTestId('vault-form-config-hcv-token').should('not.exist')
      cy.getTestId('vault-form-config-hcv-kube_role').should('be.visible')
      cy.getTestId('vault-form-config-hcv-kube_api_token_file').should('be.visible')
      cy.getTestId('advanced-fields-collapse').should('not.exist')
    })

    it('should correctly handle button state - create', () => {
      cy.mount(VaultForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.get('.kong-ui-entities-vault-form').should('be.visible')
      // default button state
      cy.getTestId('vault-create-form-cancel').should('be.visible')
      cy.getTestId('vault-create-form-submit').should('be.visible')
      cy.getTestId('vault-create-form-cancel').should('be.enabled')
      cy.getTestId('vault-create-form-submit').should('be.disabled')
      // enables save when required fields have values
      // form fields - general
      cy.getTestId('vault-form-prefix').type(vault.prefix)

      // form fields - kong
      cy.getTestId('vault-form-config-kong-prefix').type(vault.config.prefix)
      cy.getTestId('vault-create-form-submit').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('vault-form-config-kong-prefix').clear()
      cy.getTestId('vault-create-form-submit').should('be.disabled')

      // form fields - aws
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-aws').click({ force: true })
      cy.getTestId('vault-create-form-submit').should('be.disabled')
      cy.getTestId('vault-form-config-aws-region').click({ force: true })
      cy.get('.vault-form-config-fields-container .select-item:eq(0) button').click({ force: true })
      cy.getTestId('vault-create-form-submit').should('be.enabled')

      // form fields - gcp
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-gcp').click({ force: true })
      cy.getTestId('vault-create-form-submit').should('be.disabled')
      cy.getTestId('vault-form-config-gcp-project-id').type('test123')
      cy.getTestId('vault-create-form-submit').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('vault-form-config-gcp-project-id').clear()
      cy.getTestId('vault-create-form-submit').should('be.disabled')

      // form fields - hcv
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-hcv').click({ force: true })
      cy.getTestId('vault-form-config-hcv-protocol').click({ force: true })
      cy.get('[data-testid="select-item-http"] button').click({ force: true })
      cy.getTestId('vault-form-config-hcv-host').type('localhost')
      cy.getTestId('vault-form-config-hcv-mount').type('mount')
      cy.getTestId('vault-form-config-hcv-kv').click({ force: true })
      cy.get('[data-testid="select-item-v1"] button').click()
      cy.getTestId('vault-form-config-hcv-token').type('token')
      cy.getTestId('vault-create-form-submit').should('be.enabled')

      cy.getTestId('vault-form-config-hcv-auth_method').click()
      cy.get('[data-testid="select-item-kubernetes"] button').click()
      cy.getTestId('vault-create-form-submit').should('be.disabled')
      cy.getTestId('vault-form-config-hcv-kube_role').type('role')
      cy.getTestId('vault-form-config-hcv-kube_api_token_file').type('file.txt')
      cy.getTestId('vault-create-form-submit').should('be.enabled')

      cy.getTestId('vault-form-config-hcv-auth_method').click()
      cy.get('[data-testid="select-item-approle"] button').click()
      cy.getTestId('vault-create-form-submit').should('be.disabled')
      cy.getTestId('vault-form-config-hcv-approle_role_id').type('id')
      cy.getTestId('vault-create-form-submit').should('be.enabled')

      cy.getTestId('vault-form-config-hcv-auth_method').click()
      cy.get('[data-testid="select-item-cert"] button').click()
      cy.getTestId('vault-create-form-submit').should('be.disabled')
      cy.getTestId('vault-form-config-hcv-cert_auth_role_name').type('name')
      cy.getTestId('vault-form-config-hcv-cert_auth_cert').type('cert')
      cy.getTestId('vault-form-config-hcv-cert_auth_cert_key').type('key')
      cy.getTestId('vault-create-form-submit').should('be.enabled')

      cy.getTestId('vault-form-config-hcv-auth_method').click()
      cy.get('[data-testid="select-item-jwt"] button').click()
      cy.getTestId('vault-create-form-submit').should('be.disabled')
      cy.getTestId('vault-form-config-hcv-oauth2_client_id').type('id')
      cy.getTestId('vault-form-config-hcv-oauth2_client_secret').type('secret')
      cy.getTestId('vault-form-config-hcv-jwt_role').type('name')
      cy.getTestId('vault-form-config-hcv-oauth2_token_endpoint').type('endpoint')
      cy.getTestId('vault-create-form-submit').should('be.enabled')
      checkCspSubmit()

      // disables save when required field is cleared - general
      cy.getTestId('vault-form-prefix').clear()
      cy.getTestId('vault-create-form-submit').should('be.disabled')
    })

    it('should show edit form', () => {
      interceptKM()

      cy.mount(VaultForm, {
        props: {
          config: baseConfigKM,
          vaultId: vault.id,
        },
      })

      cy.wait('@getVault')
      cy.get('.kong-ui-entities-vault-form').should('be.visible')
      // button state
      cy.getTestId('vault-edit-form-cancel').should('be.visible')
      cy.getTestId('vault-edit-form-submit').should('be.visible')
      cy.getTestId('vault-edit-form-cancel').should('be.enabled')
      cy.getTestId('vault-edit-form-submit').should('be.disabled')

      // form fields
      cy.getTestId('vault-form-prefix').should('have.value', vault.prefix)
      cy.getTestId('vault-form-description').should('have.value', vault.description)
      cy.getTestId('vault-form-config-kong-prefix').should('have.value', vault.config.prefix)
      cy.getTestId('advanced-fields-collapse').should('not.exist')
    })

    it('should show edit form - with turn off TTL', () => {
      interceptKM()

      cy.mount(VaultForm, {
        props: {
          config: baseConfigKMTurnOffTTL,
          vaultId: vault.id,
        },
      })

      cy.wait('@getVault')
      cy.get('.kong-ui-entities-vault-form').should('be.visible')
      // button state
      cy.getTestId('vault-edit-form-cancel').should('be.visible')
      cy.getTestId('vault-edit-form-submit').should('be.visible')
      cy.getTestId('vault-edit-form-cancel').should('be.enabled')
      cy.getTestId('vault-edit-form-submit').should('be.disabled')

      // form fields
      cy.getTestId('vault-form-prefix').should('have.value', vault.prefix)
      cy.getTestId('vault-form-description').should('have.value', vault.description)
      cy.getTestId('vault-form-config-kong-prefix').should('have.value', vault.config.prefix)
      cy.getTestId('advanced-fields-collapse').should('not.exist')

      // form fields - aws
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-aws').click({ force: true })
      cy.getTestId('advanced-fields-collapse').should('not.exist')
    })

    it('should correctly handle button state - edit', () => {
      interceptKM()

      cy.mount(VaultForm, {
        props: {
          config: baseConfigKM,
          vaultId: vault.id,
        },
      })

      cy.wait('@getVault')
      cy.get('.kong-ui-entities-vault-form').should('be.visible')
      // default button state
      cy.getTestId('vault-edit-form-cancel').should('be.visible')
      cy.getTestId('vault-edit-form-submit').should('be.visible')
      cy.getTestId('vault-edit-form-cancel').should('be.enabled')
      cy.getTestId('vault-edit-form-submit').should('be.disabled')
      // enables save when form has changes
      cy.getTestId('vault-form-config-kong-prefix').type('edited')
      cy.getTestId('vault-edit-form-submit').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('vault-form-prefix').clear()
      cy.getTestId('vault-edit-form-submit').should('be.disabled')
    })

    it('should disable vault provider field - edit', () => {
      interceptKM()

      cy.mount(VaultForm, {
        props: {
          config: baseConfigKM,
          vaultId: vault.id,
        },
      })

      cy.wait('@getVault')
      cy.get('.kong-ui-entities-vault-form').should('be.visible')
      cy.getTestId('provider-select').should('be.disabled')
    })

    it('should handle error state - failed to load vault', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/vaults/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getVault')

      cy.mount(VaultForm, {
        props: {
          config: baseConfigKM,
          vaultId: vault.id,
        },
      })

      cy.wait('@getVault')
      cy.get('.kong-ui-entities-vault-form').should('be.visible')
      // error state is displayed
      cy.getTestId('form-fetch-error').should('be.visible')
      // buttons and form hidden
      cy.getTestId('vault-edit-form-cancel').should('not.exist')
      cy.getTestId('vault-edit-form-submit').should('not.exist')
      cy.get('.kong-ui-entities-vault-form form').should('not.exist')
    })

    it('update event should be emitted when Vault was edited', () => {
      interceptKM()
      interceptUpdate()

      cy.mount(VaultForm, {
        props: {
          config: baseConfigKM,
          vaultId: vault.id,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getVault')
      cy.getTestId('vault-form-tags').clear()
      cy.getTestId('vault-form-tags').type('tag1,tag2')

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateVault')

      cy.get('@onUpdateSpy').should('have.been.calledOnce')
    })

    it('should disable vault provider options except `env` when not supported', () => {
      cy.mount(VaultForm, {
        props: {
          config: {
            ...baseConfigKM,
            gatewayInfo: {
              edition: 'community',
              version: '3.3.0.0',
            },
          },
        },
      })

      cy.get('.kong-ui-entities-vault-form').should('be.visible')
      cy.getTestId('vault-form-provider-env').parents('button').first().should('be.enabled')
      cy.getTestId('vault-form-provider-aws').parents('button').first().should('be.disabled')
      cy.getTestId('vault-form-provider-gcp').parents('button').first().should('be.disabled')
      cy.getTestId('vault-form-provider-hcv').parents('button').first().should('be.disabled')
    })
  })

  describe('Konnect', () => {
    const interceptKonnect = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/vaults/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? vault,
        },
      ).as(params?.alias ?? 'getVault')
    }

    const interceptUpdate = (status = 200): void => {
      cy.intercept(
        {
          method: 'PUT',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/vaults/*`,
        },
        {
          statusCode: status,
          body: { ...vault, tags: ['tag1', 'tag2'] },
        },
      ).as('updateVault')
    }

    it('should show create form', () => {
      cy.mount(VaultForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.get('.kong-ui-entities-vault-form').should('be.visible')
      cy.get('.kong-ui-entities-vault-form form').should('be.visible')
      // button state
      cy.getTestId('vault-create-form-cancel').should('be.visible')
      cy.getTestId('vault-create-form-submit').should('be.visible')
      cy.getTestId('vault-create-form-cancel').should('be.enabled')
      cy.getTestId('vault-create-form-submit').should('be.disabled')

      // form fields - general
      cy.getTestId('vault-form-prefix').should('be.visible')
      cy.getTestId('vault-form-description').should('be.visible')
      cy.getTestId('vault-form-tags').should('be.visible')

      // vault provider selector
      cy.getTestId('vault-form-provider-konnect').should('exist').should('not.be.visible')
      cy.getTestId('vault-form-provider-env').should('exist').should('not.be.visible')
      cy.getTestId('vault-form-provider-aws').should('exist').should('not.be.visible')
      cy.getTestId('vault-form-provider-gcp').should('exist').should('not.be.visible')
      cy.getTestId('vault-form-provider-hcv').should('exist').should('not.be.visible')

      // form fields - konnect
      cy.getTestId('vault-form-config-kong-prefix').should('not.exist')
      cy.getTestId('advanced-fields-collapse').should('not.exist')

      // form fields - env
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-env').click({ force: true })
      cy.getTestId('vault-form-config-kong-prefix').should('be.visible')
      cy.getTestId('advanced-fields-collapse').should('not.exist')

      // form fields - aws
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-aws').click({ force: true })
      cy.getTestId('vault-form-config-aws-region').should('be.visible')
      cy.getTestId('advanced-fields-collapse').should('be.visible')

      // form fields - gcp
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-gcp').click({ force: true })
      cy.getTestId('vault-form-config-gcp-project-id').should('be.visible')
      cy.getTestId('advanced-fields-collapse').should('be.visible')

      // form fields - hcv
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-hcv').click({ force: true })
      cy.getTestId('vault-form-config-hcv-protocol').should('be.visible')
      cy.getTestId('vault-form-config-hcv-host').should('be.visible')
      cy.getTestId('vault-form-config-hcv-port').should('be.visible')
      cy.getTestId('vault-form-config-hcv-mount').should('be.visible')
      cy.getTestId('vault-form-config-hcv-kv').should('be.visible')
      cy.getTestId('vault-form-config-hcv-namespace').should('be.visible')
      cy.getTestId('vault-form-config-hcv-ssl_verify').should('be.visible').should('be.checked')
      cy.getTestId('vault-form-config-hcv-auth_method').should('be.visible')
      cy.getTestId('vault-form-config-hcv-token').should('be.visible')

      cy.getTestId('vault-form-config-hcv-auth_method').click()
      cy.get('[data-testid="select-item-kubernetes"] button').click()
      cy.getTestId('vault-form-config-hcv-token').should('not.exist')
      cy.getTestId('vault-form-config-hcv-kube_role').should('be.visible')
      cy.getTestId('vault-form-config-hcv-kube_api_token_file').should('be.visible')

      cy.getTestId('vault-form-config-hcv-auth_method').click()
      cy.get('[data-testid="select-item-approle"] button').click()
      cy.getTestId('vault-form-config-hcv-token').should('not.exist')
      cy.getTestId('vault-form-config-hcv-approle_role_id').should('be.visible')
      cy.getTestId('vault-form-config-hcv-approle_secret_id').should('be.visible')

      cy.getTestId('vault-form-config-hcv-auth_method').click()
      cy.get('[data-testid="select-item-cert"] button').click()
      cy.getTestId('vault-form-config-hcv-token').should('not.exist')
      cy.getTestId('vault-form-config-hcv-cert_auth_cert').should('be.visible')

      cy.getTestId('vault-form-config-hcv-auth_method').click()
      cy.get('[data-testid="select-item-jwt"] button').click()
      cy.getTestId('vault-form-config-hcv-token').should('not.exist')
      cy.getTestId('vault-form-config-hcv-oauth2_client_id').should('be.visible')
      cy.getTestId('vault-form-config-hcv-oauth2_audiences').should('be.visible')
      checkCspVisibility()

      cy.getTestId('advanced-fields-collapse').should('be.visible')
    })

    it('should show create form - with turn off TTL', () => {
      cy.mount(VaultForm, {
        props: {
          config: baseConfigKonnectTurnOffTTL,
        },
      })

      cy.get('.kong-ui-entities-vault-form').should('be.visible')
      cy.get('.kong-ui-entities-vault-form form').should('be.visible')
      // button state
      cy.getTestId('vault-create-form-cancel').should('be.visible')
      cy.getTestId('vault-create-form-submit').should('be.visible')
      cy.getTestId('vault-create-form-cancel').should('be.enabled')
      cy.getTestId('vault-create-form-submit').should('be.disabled')

      // form fields - general
      cy.getTestId('vault-form-prefix').should('be.visible')
      cy.getTestId('vault-form-description').should('be.visible')
      cy.getTestId('vault-form-tags').should('be.visible')

      // vault provider selector
      cy.getTestId('vault-form-provider-konnect').should('exist').should('not.be.visible')
      cy.getTestId('vault-form-provider-env').should('exist').should('not.be.visible')
      cy.getTestId('vault-form-provider-aws').should('exist').should('not.be.visible')
      cy.getTestId('vault-form-provider-gcp').should('exist').should('not.be.visible')
      cy.getTestId('vault-form-provider-hcv').should('exist').should('not.be.visible')

      // form fields - konnect
      cy.getTestId('vault-form-config-kong-prefix').should('not.exist')
      cy.getTestId('advanced-fields-collapse').should('not.exist')

      // form fields - env
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-env').click({ force: true })
      cy.getTestId('vault-form-config-kong-prefix').should('be.visible')
      cy.getTestId('advanced-fields-collapse').should('not.exist')

      // form fields - aws
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-aws').click({ force: true })
      cy.getTestId('vault-form-config-aws-region').should('be.visible')
      cy.getTestId('advanced-fields-collapse').should('not.exist')

      // form fields - gcp
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-gcp').click({ force: true })
      cy.getTestId('vault-form-config-gcp-project-id').should('be.visible')
      cy.getTestId('advanced-fields-collapse').should('not.exist')

      // form fields - hcv
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-hcv').click({ force: true })
      cy.getTestId('vault-form-config-hcv-protocol').should('be.visible')
      cy.getTestId('vault-form-config-hcv-host').should('be.visible')
      cy.getTestId('vault-form-config-hcv-port').should('be.visible')
      cy.getTestId('vault-form-config-hcv-mount').should('be.visible')
      cy.getTestId('vault-form-config-hcv-kv').should('be.visible')
      cy.getTestId('vault-form-config-hcv-namespace').should('be.visible')
      cy.getTestId('vault-form-config-hcv-ssl_verify').should('not.exist')
      cy.getTestId('vault-form-config-hcv-auth_method').should('be.visible')
      cy.getTestId('vault-form-config-hcv-token').should('be.visible')
      cy.getTestId('vault-form-config-hcv-auth_method').click({ force: true })
      cspMethods.forEach((method) => {
        cy.get(`[data-testid="select-item-${method}"]`).should('not.exist')
      })
      cy.get('[data-testid="select-item-kubernetes"] button').click({ force: true })
      cy.getTestId('vault-form-config-hcv-token').should('not.exist')
      cy.getTestId('vault-form-config-hcv-kube_role').should('be.visible')
      cy.getTestId('vault-form-config-hcv-kube_api_token_file').should('be.visible')
      cy.getTestId('advanced-fields-collapse').should('not.exist')
    })

    it('should correctly handle button state - create', () => {
      cy.mount(VaultForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.get('.kong-ui-entities-vault-form').should('be.visible')
      // default button state
      cy.getTestId('vault-create-form-cancel').should('be.visible')
      cy.getTestId('vault-create-form-submit').should('be.visible')
      cy.getTestId('vault-create-form-cancel').should('be.enabled')
      cy.getTestId('vault-create-form-submit').should('be.disabled')
      // enables save when required fields have values
      // form fields - general
      cy.getTestId('vault-form-prefix').type(vault.prefix)

      // form fields - konnect
      cy.getTestId('vault-create-form-submit').should('be.enabled')

      // form fields - env
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-env').click({ force: true })
      cy.getTestId('vault-form-config-kong-prefix').type(vault.config.prefix)
      cy.getTestId('vault-create-form-submit').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('vault-form-config-kong-prefix').clear()
      cy.getTestId('vault-create-form-submit').should('be.disabled')

      // form fields - aws
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-aws').click({ force: true })
      cy.getTestId('vault-create-form-submit').should('be.disabled')

      // advanced fields form
      cy.getTestId('collapse-trigger-content').click()
      cy.getTestId('vault-ttl-input').type('123')
      cy.getTestId('vault-neg-ttl-input').type('456')
      cy.getTestId('vault-resurrect-ttl-input').type('789')

      cy.getTestId('vault-form-config-aws-region').click({ force: true })
      cy.get('.vault-form-config-fields-container .select-item:eq(0) button').click({ force: true })

      cy.getTestId('vault-create-form-submit').should('be.enabled')

      // form fields - gcp
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-gcp').click({ force: true })
      cy.getTestId('vault-create-form-submit').should('be.disabled')

      // advanced fields form
      cy.getTestId('vault-ttl-input').type('123')
      cy.getTestId('vault-neg-ttl-input').type('456')
      cy.getTestId('vault-resurrect-ttl-input').type('789')

      cy.getTestId('vault-form-config-gcp-project-id').type('test123')
      cy.getTestId('vault-create-form-submit').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('vault-form-config-gcp-project-id').clear()
      cy.getTestId('vault-create-form-submit').should('be.disabled')

      // form fields - hcv
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-hcv').click({ force: true })

      // advanced fields form
      cy.getTestId('vault-ttl-input').type('123')
      cy.getTestId('vault-neg-ttl-input').type('456')
      cy.getTestId('vault-resurrect-ttl-input').type('789')

      cy.getTestId('vault-form-config-hcv-protocol').click({ force: true })
      cy.get('[data-testid="select-item-http"] button').click({ force: true })
      cy.getTestId('vault-form-config-hcv-host').type('localhost')
      cy.getTestId('vault-form-config-hcv-mount').type('mount')
      cy.getTestId('vault-form-config-hcv-kv').click({ force: true })
      cy.get('[data-testid="select-item-v1"] button').click()
      cy.getTestId('vault-form-config-hcv-token').type('token')
      cy.getTestId('vault-create-form-submit').should('be.enabled')

      cy.getTestId('vault-form-config-hcv-auth_method').click()
      cy.get('[data-testid="select-item-kubernetes"] button').click()
      cy.getTestId('vault-create-form-submit').should('be.disabled')
      cy.getTestId('vault-form-config-hcv-kube_role').type('role')
      cy.getTestId('vault-form-config-hcv-kube_api_token_file').type('file.txt')
      cy.getTestId('vault-create-form-submit').should('be.enabled')

      cy.getTestId('vault-form-config-hcv-auth_method').click()
      cy.get('[data-testid="select-item-approle"] button').click()
      cy.getTestId('vault-create-form-submit').should('be.disabled')
      cy.getTestId('vault-form-config-hcv-approle_role_id').type('id')
      cy.getTestId('vault-create-form-submit').should('be.enabled')

      cy.getTestId('vault-form-config-hcv-auth_method').click()
      cy.get('[data-testid="select-item-cert"] button').click()
      cy.getTestId('vault-create-form-submit').should('be.disabled')
      cy.getTestId('vault-form-config-hcv-cert_auth_role_name').type('name')
      cy.getTestId('vault-form-config-hcv-cert_auth_cert').type('cert')
      cy.getTestId('vault-form-config-hcv-cert_auth_cert_key').type('key')
      cy.getTestId('vault-create-form-submit').should('be.enabled')

      cy.getTestId('vault-form-config-hcv-auth_method').click()
      cy.get('[data-testid="select-item-jwt"] button').click()
      cy.getTestId('vault-create-form-submit').should('be.disabled')
      cy.getTestId('vault-form-config-hcv-oauth2_client_id').type('id')
      cy.getTestId('vault-form-config-hcv-oauth2_client_secret').type('secret')
      cy.getTestId('vault-form-config-hcv-jwt_role').type('name')
      cy.getTestId('vault-form-config-hcv-oauth2_token_endpoint').type('endpoint')
      cy.getTestId('vault-create-form-submit').should('be.enabled')
      checkCspSubmit()

      // disables save when required field is cleared - general
      cy.getTestId('vault-form-prefix').clear()
      cy.getTestId('vault-create-form-submit').should('be.disabled')
    })

    it('should show edit form', () => {
      interceptKonnect()

      cy.mount(VaultForm, {
        props: {
          config: baseConfigKonnect,
          vaultId: vault.id,
        },
      })

      cy.wait('@getVault')
      cy.get('.kong-ui-entities-vault-form').should('be.visible')
      // button state
      cy.getTestId('vault-edit-form-cancel').should('be.visible')
      cy.getTestId('vault-edit-form-submit').should('be.visible')
      cy.getTestId('vault-edit-form-cancel').should('be.enabled')
      cy.getTestId('vault-edit-form-submit').should('be.disabled')
      // form fields
      cy.getTestId('vault-form-prefix').should('have.value', vault.prefix)
      cy.getTestId('vault-form-description').should('have.value', vault.description)
      cy.getTestId('vault-form-config-kong-prefix').should('have.value', vault.config.prefix)
      cy.getTestId('advanced-fields-collapse').should('not.exist')

      // form fields - aws
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-aws').click({ force: true })
      cy.getTestId('advanced-fields-collapse').should('be.visible')
    })

    it('should show edit form - with turn off TTL', () => {
      interceptKonnect()

      cy.mount(VaultForm, {
        props: {
          config: baseConfigKonnectTurnOffTTL,
          vaultId: vault.id,
        },
      })

      cy.wait('@getVault')
      cy.get('.kong-ui-entities-vault-form').should('be.visible')
      // button state
      cy.getTestId('vault-edit-form-cancel').should('be.visible')
      cy.getTestId('vault-edit-form-submit').should('be.visible')
      cy.getTestId('vault-edit-form-cancel').should('be.enabled')
      cy.getTestId('vault-edit-form-submit').should('be.disabled')
      // form fields
      cy.getTestId('vault-form-prefix').should('have.value', vault.prefix)
      cy.getTestId('vault-form-description').should('have.value', vault.description)
      cy.getTestId('vault-form-config-kong-prefix').should('have.value', vault.config.prefix)
      cy.getTestId('advanced-fields-collapse').should('not.exist')

      // form fields - aws
      cy.getTestId('provider-select').click({ force: true })
      cy.getTestId('vault-form-provider-aws').click({ force: true })
      cy.getTestId('advanced-fields-collapse').should('not.exist')
    })

    it('should correctly handle button state - edit', () => {
      interceptKonnect()

      cy.mount(VaultForm, {
        props: {
          config: baseConfigKonnect,
          vaultId: vault.id,
        },
      })

      cy.wait('@getVault')
      cy.get('.kong-ui-entities-vault-form').should('be.visible')
      // default button state
      cy.getTestId('vault-edit-form-cancel').should('be.visible')
      cy.getTestId('vault-edit-form-submit').should('be.visible')
      cy.getTestId('vault-edit-form-cancel').should('be.enabled')
      cy.getTestId('vault-edit-form-submit').should('be.disabled')
      // enables save when form has changes
      cy.getTestId('vault-form-config-kong-prefix').type('edited')
      cy.getTestId('vault-edit-form-submit').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('vault-form-prefix').clear()
      cy.getTestId('vault-edit-form-submit').should('be.disabled')
    })

    it('should handle error state - failed to load vault', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/vaults/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getVault')

      cy.mount(VaultForm, {
        props: {
          config: baseConfigKonnect,
          vaultId: vault.id,
        },
      })

      cy.wait('@getVault')
      cy.get('.kong-ui-entities-vault-form').should('be.visible')
      // error state is displayed
      cy.getTestId('form-fetch-error').should('be.visible')
      // buttons and form hidden
      cy.getTestId('vault-edit-form-cancel').should('not.exist')
      cy.getTestId('vault-edit-form-submit').should('not.exist')
      cy.get('.kong-ui-entities-vault-form form').should('not.exist')
    })

    it('update event should be emitted when Vault was edited', () => {
      interceptKonnect()
      interceptUpdate()

      cy.mount(VaultForm, {
        props: {
          config: baseConfigKonnect,
          vaultId: vault.id,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getVault')
      cy.getTestId('vault-form-tags').clear()
      cy.getTestId('vault-form-tags').type('tag1,tag2')

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateVault')

      cy.get('@onUpdateSpy').should('have.been.calledOnce')
    })
  })
})
