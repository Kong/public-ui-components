import { testConfigCardView } from '../../../entities-shared/fixtures/config-card'
import { KeyConfigCard, KeyConfigCardView } from '../index'

describe('<KeyConfigCardView />', () => {
  testConfigCardView('KeyConfigCardView', KeyConfigCardView, { record: { id: 'key', jwk: '{"kty":"RSA"}', set: { id: 'set' } } })

  it('updates the Key Set display and JWK fields without keeping previous parsed fields', () => {
    cy.mount(KeyConfigCardView, { props: { record: { id: 'key', set: { id: 'set' }, jwk: '{"kty":"RSA","old":"field"}' } } }).then(({ wrapper }) => {
      cy.getTestId('jwk.old-plain-text').should('contain.text', 'field')
      cy.then(() => wrapper.setProps({ keySet: { id: 'set', loading: true } }))
      cy.getTestId('key-set-name-loader').should('exist')
      cy.then(() => wrapper.setProps({ keySet: { id: 'set', name: 'resolved-set' }, record: { id: 'key', set: { id: 'set' }, jwk: '{"kty":"EC"}' } }))
      cy.getTestId('set-property-value').should('contain.text', 'resolved-set')
      cy.getTestId('jwk.old-plain-text').should('not.exist')
      cy.getTestId('jwk.kty-plain-text').should('contain.text', 'EC')
      cy.then(() => wrapper.setProps({ keySet: { id: 'other', name: 'stale-set' } }))
      cy.getTestId('set-property-value').should('contain.text', 'set').and('not.contain.text', 'stale-set')
    })
  })

  it('expands PEM fields and switches to JWK without keeping the previous format', () => {
    cy.mount(KeyConfigCardView, { props: {
      record: { id: 'key', pem: { public_key: 'public-pem', private_key: 'private-pem' } },
    } }).then(({ wrapper }) => {
      cy.getTestId('pem.public_key-plain-text').should('contain.text', 'public-pem')
      cy.getTestId('pem.private_key-plain-text').should('contain.text', 'private-pem')
      cy.then(() => wrapper.setProps({ record: { id: 'key', jwk: '{"kty":"RSA"}' } }))
      cy.getTestId('jwk.kty-plain-text').should('contain.text', 'RSA')
      cy.getTestId('pem.public_key-plain-text').should('not.exist')
    })
  })

  it('emits a parse error once for an invalid JWK', () => {
    cy.mount(KeyConfigCardView, { props: { record: { id: 'key', jwk: '{invalid' }, 'onError:parse': cy.spy().as('parse') } })
    cy.get('.kong-ui-entity-base-config-card').should('exist')
    cy.get('@parse').should('have.been.calledOnce')
  })

  it('emits a parse error for a JWK serialized as null', () => {
    cy.mount(KeyConfigCardView, { props: { record: { id: 'key', jwk: 'null' }, 'onError:parse': cy.spy().as('parse') } })
    cy.get('.kong-ui-entity-base-config-card').should('exist')
    cy.get('@parse').should('have.been.calledOnce')
  })
})

describe('<KeyConfigCard />', () => {
  it('reads the Key Set name and expands the key locally', () => {
    const config = { app: 'konnect' as const, apiBaseUrl: '/related', controlPlaneId: 'cp', entityId: 'entity' }
    cy.intercept('GET', '**/core-entities/keys/entity', { id: 'entity', set: { id: 'set' }, jwk: '{"kty":"RSA"}' }).as('key')
    cy.intercept('GET', '**/core-entities/key-sets/set', { id: 'set', name: 'set-name' }).as('set')
    cy.mount(KeyConfigCard, { props: { config } })
    cy.wait('@key')
    cy.wait('@set')
    cy.getTestId('set-property-value').should('contain.text', 'set-name')
    cy.getTestId('jwk.kty-plain-text').should('contain.text', 'RSA')
    cy.get('@key.all').should('have.length', 1)
    cy.get('@set.all').should('have.length', 1)
  })
})
