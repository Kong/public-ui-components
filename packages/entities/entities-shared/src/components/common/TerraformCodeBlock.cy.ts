import TerraformCodeBlock from './TerraformCodeBlock.vue'
import { SupportedEntityType } from '../../types'

const records = {
  [SupportedEntityType.AuthServer]: {
    audience: 'api://default',
    created_at: new Date().toISOString(),
    description: 'Lorem ipsum dolor sit amet.',
    id: '733f357b-f784-45e4-91b4-c4f875287bca',
    issuer: 'https://26bd3xvsmw5312at.us.identity.konghq.tech/auth',
    labels: { foo: 'bar' },
    metadata_uri: 'https://26bd3xvsmw5312at.us.identity.konghq.tech/auth/.well-known/openid-configuration',
    name: 'Auth server 1',
    signing_algorithm: 'RS256',
    trusted_origins: [],
    updated_at: new Date().toISOString(),
  },
  [SupportedEntityType.Route]: {
    destinations: [{ ip: '255.255.255.255', port: 123 }],
    https_redirect_status_code: 426,
    id: '15dea234-1725-4f5e-9564-ecb097a8f448',
    name: 'onboarding-ok-1682959038143',
    path_handling: 'v0',
    preserve_host: false,
    protocols: ['tcp'],
    regex_priority: 0,
    request_buffering: true,
    response_buffering: true,
    service: { id: 'b32e7e90-a3fb-450e-be12-454fc0f1925e' },
    sources: [{ ip: '255.255.255.255', port: 345 }],
    strip_path: true,
    tags: ['dev', 'prod'],
  },
  [SupportedEntityType.SchemaRegistry]: {
    provider: 'konnect-beta',
    confluent: {
      config: {
        authentication: {
          password: '${vault.env.password}',
          type: 'basic',
          username: 'bc',
        },
        endpoint: 'as',
        timeout_seconds: 10,
      },
    },
    name: 'schema-registry-demo',
    gateway_id: '7b2f8c6a-3e4b-4f6e-9a6d-2d8f3c1e9b42',
  },
}

describe('<TerraformCodeBlock />', () => {
  describe(`entity type: ${SupportedEntityType.Route}`, () => {
    it('renders the Terraform content correctly', () => {
      cy.mount(TerraformCodeBlock, {
        props: {
          entityRecord: records[SupportedEntityType.Route],
          entityType: SupportedEntityType.Route,
        },
      })

      cy.get('.terraform-config').should('be.visible')
    })
  })

  describe(`entity type: ${SupportedEntityType.AuthServer}`, () => {
    it('renders the Terraform content correctly', () => {
      cy.mount(TerraformCodeBlock, {
        props: {
          entityRecord: records[SupportedEntityType.AuthServer],
          entityType: SupportedEntityType.AuthServer,
        },
      })

      cy.get('.terraform-config').should('be.visible').should('contain.text', 'provider = konnect-beta')
    })
  })

  describe(`entity type: ${SupportedEntityType.SchemaRegistry}`, () => {
    it('renders and escapes Terraform interpolation in SchemaRegistry config', () => {
      cy.mount(TerraformCodeBlock, {
        props: {
          entityRecord: records[SupportedEntityType.SchemaRegistry],
          entityType: SupportedEntityType.SchemaRegistry,
        },
      })

      cy.get('.terraform-config')
        .should('be.visible')
        .and('contain.text', 'provider = konnect-beta')
        .and('contain.text', 'password = "$${vault.env.password}"')
        .and('not.contain.text', 'password = "${vault.env.password}"')
        .and('contain.text', 'name = "schema-registry-demo"')
        .and('contain.text', 'gateway_id = "7b2f8c6a-3e4b-4f6e-9a6d-2d8f3c1e9b42"')
    })
  })
})
