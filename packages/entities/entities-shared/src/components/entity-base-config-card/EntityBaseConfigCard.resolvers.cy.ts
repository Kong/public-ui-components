import EntityBaseConfigCard from './EntityBaseConfigCard.vue'
import { ConfigurationSchemaType, SupportedEntityType } from '../../types'

const config = { app: 'konnect' as const, apiBaseUrl: '/resolvers', controlPlaneId: 'cp', entityId: 'entity' }
const selectJson = () => {
  cy.getTestId('select-config-format').click()
  cy.getTestId('select-item-json').click()
}
describe('EntityBaseConfigCard response boundary', () => {
  it('preserves raw fetch payload, dataKey precedence, and one initialization GET', () => {
    const payload = { item: { id: 'entity', name: 'selected' }, metadata: 'raw' }
    cy.intercept('GET', '/resolvers/record/entity', payload).as('get')
    const resolver = cy.spy().as('resolver')
    cy.mount(EntityBaseConfigCard, { props: { config, fetchUrl: '/record/{id}', entityType: SupportedEntityType.Consumer,
      dataKey: 'item', recordResolver: resolver, 'onFetch:success': cy.spy().as('success') } })
    cy.wait('@get')
    cy.getTestId('name-property-value').should('contain.text', 'selected')
    cy.get('@resolver').should('not.have.been.called')
    cy.get('@success').should('have.been.calledOnceWith', payload)
    cy.get('@get.all').should('have.length', 1)
    cy.get('.kong-ui-entity-base-config-card').should('have.length', 1)
    selectJson()
    cy.get('#json-endpoint-codeblock').should('contain.text', '/resolvers/record/entity')
  })

  it('retains non-invertible structured resolution and legacy resolver-after-redaction ordering', () => {
    const payload = { original: 'raw-name', secret: 'sensitive-value' }
    cy.intercept('GET', '/resolvers/record/entity', payload)
    cy.mount(EntityBaseConfigCard, { props: { config, fetchUrl: '/record/{id}', entityType: SupportedEntityType.Consumer,
      recordResolver: data => ({ name: data.original }),
      codeBlockRecordResolver: data => ({ envelope: data }),
      configSchema: { secret: { type: ConfigurationSchemaType.Redacted } },
      codeBlockRecordFormatter: (data, format) => ({ ...data, format }),
    } })
    cy.getTestId('name-property-value').should('contain.text', 'raw-name')
    selectJson()
    cy.get('#json-codeblock .highlighted-code-block code').invoke('text').then(text => {
      const json = JSON.parse(text)
      expect(json).to.deep.equal({ envelope: { envelope: { original: 'raw-name', secret: '********' } }, format: 'json' })
    })
    cy.getTestId('sensitive-fields-checkbox').check({ force: true })
    cy.get('#json-codeblock').should('contain.text', 'sensitive-value')
  })
})
