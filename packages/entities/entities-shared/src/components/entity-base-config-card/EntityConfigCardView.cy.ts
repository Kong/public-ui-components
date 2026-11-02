import { h } from 'vue'
import { EntityBaseConfigCard, EntityConfigCardView, ConfigurationSchemaSection, ConfigurationSchemaType, SupportedEntityType } from '../../index'

const configSchema = {
  secret: { type: ConfigurationSchemaType.Redacted, section: ConfigurationSchemaSection.Basic },
  credentials: { type: ConfigurationSchemaType.RedactedArray },
  nested: { type: ConfigurationSchemaType.Json },
  missing: { forceShow: true, section: ConfigurationSchemaSection.Basic },
  hidden: { hidden: true },
}
const schema = { fields: [{ nested: { type: 'record', fields: [
  { tokens: { type: 'set', encrypted: true, elements: { type: 'string' } } },
] } }] }
const record = Object.freeze({ id: 'one', name: 'first', secret: 'scalar-value', credentials: Object.freeze(['array-value']), nested: Object.freeze({ tokens: Object.freeze(['nested-value']) }), hidden: 'hidden-value', created_at: 1700000000 })
const select = (format: string) => {
  cy.getTestId('select-config-format').click()
  cy.getTestId(`select-item-${format}`).click()
}

describe('EntityConfigCardView public record interface', () => {
  beforeEach(() => {
    localStorage.clear()
    cy.intercept({ resourceType: /xhr|fetch/ }, req => {
      throw new Error(`Unexpected View request: ${req.method} ${req.url}`)
    })
  })

  it('renders immutable records, forceShow fields, sections and slots without an HTTP provider', () => {
    cy.mount(EntityConfigCardView, {
      props: { record, configSchema, schema, entityType: SupportedEntityType.Consumer },
      slots: { 'missing': ({ record: slotRecord, row }: any) => h('span', `${slotRecord.name}:${row.value}`) },
    })
    cy.getTestId('config-card-details-basic-props').should('contain.text', 'first:null')
    cy.getTestId('hidden-property-value').should('not.exist')
    cy.getTestId('secret-property-value').should('not.contain.text', 'scalar-value')
    cy.getTestId('nested-property-value').should('not.contain.text', 'nested-value')
    cy.then(() => expect(record).not.to.have.property('missing'))
    for (const format of ['json', 'yaml']) {
      select(format)
      cy.get(`#${format}-codeblock`).should('not.contain.text', 'scalar-value').and('not.contain.text', 'array-value').and('not.contain.text', 'nested-value')
    }
    cy.getTestId('sensitive-fields-checkbox').check({ force: true })
    cy.get('#yaml-codeblock').should('contain.text', 'scalar-value').and('contain.text', 'nested-value')
  })

  it('updates both representations while preserving format and sensitive preference for the same identity', () => {
    cy.mount(EntityConfigCardView, { props: { record, configSchema, entityType: SupportedEntityType.Consumer } }).then(({ wrapper }) => {
      select('json')
      cy.getTestId('sensitive-fields-checkbox').check({ force: true })
      cy.then(() => wrapper.setProps({ record: { ...record, name: 'refreshed', secret: 'new-value' } }))
      cy.get('#json-codeblock').should('contain.text', 'refreshed').and('contain.text', 'new-value')
      cy.then(() => wrapper.setProps({ record: { ...record, id: 'two', secret: 'other-entity-value' } }))
      cy.get('#json-codeblock').should('not.contain.text', 'other-entity-value')
      cy.getTestId('sensitive-fields-checkbox').should('not.be.checked')
      select('structured')
      cy.getTestId('name-property-value').should('contain.text', 'first')
    })
  })

  it('keeps explicit code payloads, formatter ordering and timestamps', () => {
    const codeBlockRecord = Object.freeze({ envelope: Object.freeze({ renamed: 'value', secret: 'raw-secret' }), created_at: 'kept' })
    cy.mount(EntityConfigCardView, { props: {
      record: { id: 'one', name: 'structured-name' }, codeBlockRecord,
      schema: { fields: [{ envelope: { type: 'record', fields: [{ secret: { type: 'string', encrypted: true } }] } }] },
      entityType: SupportedEntityType.Consumer, preserveCodeBlockTimestamps: true,
      codeBlockRecordFormatter: (input, format) => ({ ...input, format }),
    } })
    select('json')
    cy.get('#json-codeblock').should('contain.text', 'envelope').and('contain.text', 'kept').and('contain.text', 'json').and('not.contain.text', 'structured-name').and('not.contain.text', 'raw-secret')
    cy.get('#json-endpoint-codeblock').should('not.exist')
    cy.getTestId('sensitive-fields-checkbox').check({ force: true })
    cy.get('#json-codeblock').should('contain.text', 'raw-secret')
    cy.then(() => expect(codeBlockRecord).not.to.have.property('format'))
  })

  it('needs only a record and enables typed exports only while entity metadata is available', () => {
    localStorage.setItem('optional-type', 'terraform')
    cy.mount(EntityConfigCardView, { props: {
      record: { id: 'consumer', username: 'user' },
      config: { app: 'konnect', enableDeckConfig: true },
    } }).then(({ wrapper }) => {
      cy.getTestId('username-property-value').should('contain.text', 'user')
      cy.getTestId('select-config-format').click()
      cy.getTestId('select-item-terraform').should('not.exist')
      cy.getTestId('select-item-deck').should('not.exist')
      cy.getTestId('select-item-json').click()
      cy.get('#json-codeblock').should('contain.text', 'user')
      select('yaml')
      cy.get('#yaml-codeblock').should('contain.text', 'user')
      cy.then(() => expect(localStorage.getItem('optional-type')).to.equal('terraform'))
      cy.then(() => wrapper.setProps({ entityType: SupportedEntityType.Consumer }))
      select('terraform')
      cy.get('#terraform-codeblock').should('contain.text', 'konnect_gateway_consumer')
      select('deck')
      cy.get('#deck-codeblock').should('exist')
      cy.then(() => wrapper.setProps({ entityType: undefined }))
      cy.getTestId('username-property-value').should('contain.text', 'user')
      cy.get('#deck-codeblock').should('not.exist')
    })
  })

  for (const section of ['plugin', 'policy'] as const) {
    it(`keeps empty arrays and stable null ordering in ${section} sections with readonly records`, () => {
      const pluginRecord = Object.freeze({ id: 'p', config: Object.freeze({ absent: null, empty: '', array: Object.freeze([]), value: 1 }) })
      cy.mount(EntityConfigCardView, { props: {
        record: pluginRecord, entityType: SupportedEntityType.Plugin,
        pluginConfigKey: section === 'plugin' ? 'config' : '',
        policyConfigKey: section === 'policy' ? 'config' : '',
        pluginConfigSchema: { value: { order: 1 }, absent: { order: -1 } },
        policyConfigSchema: { value: { order: 1 }, absent: { order: -1 } },
      } })
      cy.getTestId(`config-card-details-${section}-props`).find('.config-card-details-row').first().should('contain.text', 'Value')
      cy.getTestId('array-property-value').should('exist')
      cy.getTestId(`config-card-details-${section}-props`).find('.config-card-details-row').last().should('contain.text', 'Absent')
    })
  }

  it('redacts resolved API-schema scalars, encrypted sets and nested arrays without mutating the schema', () => {
    const schema = Object.freeze({ fields: [
      { secret: Object.freeze({ type: 'string', encrypted: true }) },
      { tokens: Object.freeze({ type: 'set', encrypted: true, elements: Object.freeze({ type: 'string' }) }) },
      { nested: { type: 'array', elements: { type: 'record', fields: [{ secret: { type: 'string', encrypted: true } }] } } },
    ] })
    cy.mount(EntityConfigCardView, { props: {
      record: Object.freeze({ id: 'encrypted', secret: 'scalar-secret', tokens: Object.freeze(['set-secret']), nested: [{ secret: 'nested-secret' }] }),
      schema, entityType: SupportedEntityType.Consumer,
    } })
    cy.getTestId('secret-property-value').should('not.contain.text', 'scalar-secret')
    cy.getTestId('tokens-property-value').should('not.contain.text', 'set-secret')
    cy.getTestId('nested-property-value').should('not.contain.text', 'nested-secret')
    select('json')
    cy.get('#json-codeblock').should('not.contain.text', 'scalar-secret').and('not.contain.text', 'set-secret').and('not.contain.text', 'nested-secret')
  })
})

describe('legacy documentation action', () => {
  it('allows web and relative documentation links and rejects dangerous or malformed URLs', () => {
    cy.intercept('GET', '/docs/consumer', { id: 'consumer' })
    cy.mount(EntityBaseConfigCard, { props: {
      config: { app: 'konnect', apiBaseUrl: '/docs', controlPlaneId: 'cp', entityId: 'consumer' },
      fetchUrl: '/consumer', entityType: SupportedEntityType.Consumer,
      configCardDoc: 'https://example.com/docs',
    } }).then(({ wrapper }) => {
      cy.getTestId('book-icon').find('a').should('have.attr', 'href', 'https://example.com/docs')
      for (const url of ['http://example.com/docs', '/docs/consumer', './docs', '//example.com/docs']) {
        cy.then(() => wrapper.setProps({ configCardDoc: url }))
        cy.getTestId('book-icon').find('a').should('have.attr', 'href', url)
      }
      for (const url of ['javascript:alert(1)', '  JaVaScRiPt:alert(1)', 'java\nscript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox(1)', 'file:///etc/passwd', 'https://[', '', null as unknown as string]) {
        cy.then(() => wrapper.setProps({ configCardDoc: url }))
        cy.getTestId('book-icon').should('not.exist')
      }
      cy.then(() => wrapper.setProps({ configCardDoc: 'https://example.com/restored' }))
      cy.getTestId('book-icon').find('a').should('have.attr', 'href', 'https://example.com/restored')
    })
  })
})
