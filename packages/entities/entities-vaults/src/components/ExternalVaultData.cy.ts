import { VaultForm, SecretForm, SecretList } from '../index'
import type { KonnectVaultFormConfig, KonnectSecretFormConfig, KonnectSecretListConfig } from '../types'

const config: KonnectVaultFormConfig & KonnectSecretFormConfig & KonnectSecretListConfig = {
  app: 'konnect', apiBaseUrl: '/external-data', controlPlaneId: 'cp', cancelRoute: '/',
  createRoute: '/', getEditRoute: () => '/',
}
const record = Object.freeze({ id: 'v', name: 'env', prefix: 'initial', description: 'original', tags: Object.freeze(['tag']), config: Object.freeze({ prefix: 'ENV_', base64_decode: false }) })
const noVaultGet = () => cy.intercept('GET', '**/vaults/*', req => {
  throw new Error(`Unexpected Vault GET ${req.url}`)
})

describe('externally loaded Vault data', () => {
  it('initializes a cloned draft without a Vault GET and preserves edits across query refreshes', () => {
    noVaultGet()
    cy.mount(VaultForm, { props: { config, vaultId: 'v', initialRecord: record, fetchOnMount: false } }).then(({ wrapper }) => {
      cy.getTestId('vault-form-prefix').should('have.value', 'initial')
      cy.getTestId('vault-form-prefix').clear()
      cy.getTestId('vault-form-prefix').type('user-edit')
      cy.getTestId('vault-form-config-kong-prefix').clear()
      cy.getTestId('vault-form-config-kong-prefix').type('CHANGED_')
      cy.then(() => wrapper.setProps({ initialRecord: { ...record, prefix: 'background-refresh' } }))
      cy.getTestId('vault-form-prefix').should('have.value', 'user-edit')
      cy.then(() => {
        expect(record.prefix).to.equal('initial')
        expect(record.config.prefix).to.equal('ENV_')
      })
    })
  })

  it('never falls back to GET before a late initialRecord and only initializes once', () => {
    noVaultGet()
    cy.mount(VaultForm, { props: { config, vaultId: 'v', fetchOnMount: false } }).then(({ wrapper }) => {
      cy.getTestId('vault-form-prefix').should('have.value', '')
      cy.then(() => wrapper.setProps({ initialRecord: record }))
      cy.getTestId('vault-form-prefix').should('have.value', 'initial')
      cy.getTestId('vault-form-prefix').clear()
      cy.getTestId('vault-form-prefix').type('edited')
      cy.then(() => wrapper.setProps({ initialRecord: { ...record, prefix: 'late-refresh' } }))
      cy.getTestId('vault-form-prefix').should('have.value', 'edited')
    })
  })

  it('automatically skips initialization GET when initialRecord is ready on mount', () => {
    noVaultGet()
    cy.mount(VaultForm, { props: { config, vaultId: 'v', initialRecord: record } })
    cy.getTestId('vault-form-prefix').should('have.value', 'initial')
  })

  it('keeps the externally initialized Vault draft editable after a save failure', () => {
    noVaultGet()
    cy.intercept('PUT', '**/vaults/v', { statusCode: 500, body: { message: 'save failed' } }).as('saveVault')
    cy.mount(VaultForm, { props: { config, vaultId: 'v', initialRecord: record, fetchOnMount: false } })
    cy.getTestId('vault-form-prefix').clear()
    cy.getTestId('vault-form-prefix').type('edited-vault')
    cy.getTestId('vault-edit-form-submit').click()
    cy.wait('@saveVault')
    cy.getTestId('form-error').should('be.visible')
    cy.getTestId('vault-form-prefix').should('have.value', 'edited-vault').and('not.be.disabled')
  })

  for (const apiType of ['gateway', 'aiGateway'] as const) {
    const secretConfig = apiType === 'aiGateway' ? { ...config, apiType, aiGatewayId: 'ai' } : config
    it(`loads Secret list directly from configStoreId (${apiType})`, () => {
      noVaultGet()
      cy.intercept('GET', '**/config-stores/store/secrets*', { data: [], total: 0 }).as('secrets')
      cy.mount(SecretList, { props: { config: secretConfig, vaultId: 'v', configStoreId: 'store' } })
      cy.wait('@secrets')
    })
    it(`keeps Secret edit GET and update requests (${apiType})`, () => {
      noVaultGet()
      cy.intercept('GET', '**/config-stores/store/secrets/secret', { key: 'test-key', value: 'old-value' }).as('secret')
      cy.intercept('PUT', '**/config-stores/store/secrets/secret', { statusCode: 500, body: { message: 'save failed' } }).as('save')
      cy.mount(SecretForm, { props: { config: secretConfig, vaultId: 'v', configStoreId: 'store', secretId: 'secret' } })
      cy.wait('@secret')
      cy.getTestId('secret-form-value').findTestId('sensitive-input-rotate').click()
      cy.getTestId('secret-form-value').find('textarea').clear()
      cy.getTestId('secret-form-value').find('textarea').type('new-value')
      cy.getTestId('other-edit-form-submit').click()
      cy.wait('@save')
      cy.getTestId('form-error').should('be.visible')
    })
  }

  it('does not fall back for empty explicit IDs and remounts the Secret form on store changes', () => {
    noVaultGet()
    cy.mount(SecretForm, { props: { config, vaultId: 'v', configStoreId: '' } }).then(({ wrapper }) => {
      cy.getTestId('secret-form-key').should('not.exist')
      cy.then(() => wrapper.setProps({ configStoreId: 'one' }))
      cy.getTestId('secret-form-key').type('draft-for-one')
      cy.then(() => wrapper.setProps({ configStoreId: 'two' }))
      cy.getTestId('secret-form-key').should('have.value', '')
    })
  })

  it('ignores a pending Vault resolution after an explicit configStoreId arrives', () => {
    cy.intercept('GET', '**/vaults/v', { delay: 250, body: { config: { config_store_id: 'stale' } } }).as('vault')
    cy.intercept('GET', '**/config-stores/stale/secrets*', req => {
      throw new Error(`Stale store request ${req.url}`)
    })
    cy.intercept('GET', '**/config-stores/fresh/secrets*', { data: [], total: 0 }).as('fresh')
    cy.mount(SecretList, { props: { config, vaultId: 'v' } }).then(({ wrapper }) => {
      cy.then(() => wrapper.setProps({ configStoreId: 'fresh' }))
      cy.wait('@fresh')
      cy.wait('@vault')
      cy.get('.kong-ui-entities-secrets-list').should('be.visible')
    })
  })

  it('reinitializes a Secret edit when workspace scope changes with the same explicit store', () => {
    noVaultGet()
    cy.intercept('GET', '**/cp/config-stores/store/secrets/secret', { key: 'old-key', value: 'old-value' }).as('old')
    cy.intercept('GET', '**/cp/next/config-stores/store/secrets/secret', { key: 'new-key', value: 'new-value' }).as('next')
    cy.mount(SecretForm, { props: { config, vaultId: 'v', configStoreId: 'store', secretId: 'secret' } }).then(({ wrapper }) => {
      cy.wait('@old')
      cy.getTestId('secret-form-key').should('have.value', 'old-key')
      cy.then(() => wrapper.setProps({ config: { ...config, workspace: 'next' } }))
      cy.wait('@next')
      cy.getTestId('secret-form-key').should('have.value', 'new-key')
    })
  })
})
