import { h } from 'vue'
import EntityBaseConfigCard from './EntityBaseConfigCard.vue'
import EntityConfigCardView from './EntityConfigCardView.vue'
import { ConfigurationSchemaType, SupportedEntityType } from '../../types'

const config = { app: 'konnect' as const, apiBaseUrl: '/resolvers', controlPlaneId: 'cp', entityId: 'entity' }
const selectJson = () => {
  cy.getTestId('select-config-format').click()
  cy.getTestId('select-item-json').click()
}
describe('EntityBaseConfigCard response boundary', () => {
  it('keeps a nested View independent of the reader record and request metadata', () => {
    cy.intercept('GET', '/resolvers/record/entity', { id: 'entity', name: 'parent-record' }).as('parent')
    cy.mount(EntityBaseConfigCard, {
      props: { config, fetchUrl: '/record/{id}', entityType: SupportedEntityType.Consumer, configCardDoc: '/parent-docs' },
      slots: { actions: () => h(EntityConfigCardView, { record: { id: 'child', name: 'child-record' } }) },
    })
    cy.wait('@parent')
    cy.get('.config-card-actions .kong-ui-entity-base-config-card').within(() => {
      selectJson()
      cy.get('#json-codeblock').should('contain.text', 'child-record').and('not.contain.text', 'parent-record')
      cy.get('#json-endpoint-codeblock').should('not.exist')
      cy.getTestId('book-icon').should('not.exist')
    })
  })

  it('preserves reader-owned format persistence and custom selector text', () => {
    localStorage.setItem('legacy-reader-format', 'yaml')
    cy.intercept('GET', '/resolvers/record/entity', { id: 'entity', name: 'consumer' })
    cy.mount(EntityBaseConfigCard, { props: {
      config: { ...config, formatPreferenceKey: 'legacy-reader-format' },
      fetchUrl: '/record/{id}', entityType: SupportedEntityType.Consumer,
      label: 'Render as:',
    } })
    cy.get('#yaml-codeblock').should('contain.text', 'consumer')
    cy.get('.config-format-select-label').should('contain.text', 'Render as:')
    selectJson()
    cy.then(() => expect(localStorage.getItem('legacy-reader-format')).to.equal('json'))
  })

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
