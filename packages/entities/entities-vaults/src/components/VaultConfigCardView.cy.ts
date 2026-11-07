import { VaultConfigCardView } from '../index'

// Independent API fixtures and expected masks: do not derive these from the production key list.
const authCases = [
  { method: 'token', ai: { token: 'token-secret' }, gw: { token: 'token-secret' }, keys: ['token'] },
  { method: 'cert', ai: { cert: 'public-cert', key: 'private-secret' }, gw: { cert_auth_cert: 'public-cert', cert_auth_cert_key: 'private-secret' }, keys: ['cert_auth_cert_key'] },
  { method: 'jwt', ai: { client_secret: 'jwt-secret' }, gw: { oauth2_client_secret: 'jwt-secret' }, keys: ['oauth2_client_secret'] },
  { method: 'approle', ai: { secret_id: 'approle-secret' }, gw: { approle_secret_id: 'approle-secret' }, keys: ['approle_secret_id'] },
  { method: 'aws_iam', ai: { access_key_id: 'access-secret', secret_access_key: 'aws-secret' }, gw: { aws_access_key_id: 'access-secret', aws_secret_access_key: 'aws-secret' }, keys: ['aws_access_key_id', 'aws_secret_access_key'] },
  { method: 'aws_ec2', ai: { nonce: 'nonce-secret' }, gw: { aws_auth_nonce: 'nonce-secret' }, keys: ['aws_auth_nonce'] },
]
describe('VaultConfigCardView', () => {
  for (const apiType of ['gateway', 'aiGateway'] as const) {
    for (const fixture of authCases) {
      it(`always masks ${apiType} ${fixture.method} across structured, JSON and YAML`, () => {
        cy.intercept({ resourceType: /xhr|fetch/ }, req => {
          throw new Error(`Unexpected request ${req.url}`)
        })
        const config = Object.freeze({ auth_method: fixture.method, ...(apiType === 'aiGateway' ? fixture.ai : fixture.gw) })
        const record = Object.freeze({ id: 'vault', ...(apiType === 'aiGateway' ? { type: 'hcv', name: 'vault-name', labels: { env: 'test' } } : { name: 'hcv', prefix: 'vault-name' }), config })
        cy.mount(VaultConfigCardView, { props: { record, config: { apiType, app: 'konnect', enableDeckConfig: true } } })
        for (const key of fixture.keys) cy.getTestId(`${key}-plain-text`).should('contain.text', '************')
        cy.getTestId('sensitive-fields-checkbox').check({ force: true })
        for (const format of apiType === 'aiGateway' ? ['json', 'yaml'] : ['json', 'yaml', 'terraform', 'deck']) {
          cy.getTestId('select-config-format').click()
          cy.getTestId(`select-item-${format}`).click()
          cy.get(`#${format}-codeblock`).should('contain.text', '************').and('contain.text', 'vault-name')
          for (const value of Object.values(config).filter(value => value.endsWith('-secret'))) cy.get(`#${format}-codeblock`).should('not.contain.text', value)
          if (format === 'json') {
            cy.get('#json-codeblock .highlighted-code-block code').invoke('text').then(text => {
              const code = JSON.parse(text)
              expect(code.config.auth_method).to.equal(fixture.method)
              for (const key of fixture.keys) expect(code.config[key]).to.equal('************')
              if (apiType === 'aiGateway') {
                expect(code.type).to.equal('hcv')
                expect(code.name).to.equal('vault-name')
                expect(code).not.to.have.property('prefix')
                expect(code.labels).to.deep.equal(['env: test'])
              } else {
                expect(code.name).to.equal('hcv')
                expect(code.prefix).to.equal('vault-name')
              }
            })
          }
        }
        cy.then(() => expect(record.config).to.deep.equal(config))
      })
    }
  }
})
