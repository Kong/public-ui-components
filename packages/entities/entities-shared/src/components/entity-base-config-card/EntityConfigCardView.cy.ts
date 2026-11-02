import { h } from 'vue'
import { EntityConfigCardView, ConfigurationSchemaSection, ConfigurationSchemaType, SupportedEntityType } from '../../index'

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

  it('keeps explicit code payloads, formatter ordering, timestamps and display URL metadata', () => {
    const codeBlockRecord = Object.freeze({ envelope: { renamed: 'value' }, created_at: 'kept' })
    cy.mount(EntityConfigCardView, { props: {
      record: { id: 'one', name: 'structured-name' }, codeBlockRecord,
      entityType: SupportedEntityType.Consumer, preserveCodeBlockTimestamps: true,
      requestUrl: '/display-only/record',
      codeBlockRecordFormatter: (input, format) => ({ ...input, format }),
    } })
    select('json')
    cy.get('#json-codeblock').should('contain.text', 'envelope').and('contain.text', 'kept').and('contain.text', 'json').and('not.contain.text', 'structured-name')
    cy.get('#json-endpoint-codeblock').should('contain.text', '/display-only/record')
    cy.then(() => expect(codeBlockRecord).not.to.have.property('format'))
  })

  it('keeps empty arrays and stable null ordering in plugin sections with readonly API schemas', () => {
    const pluginRecord = Object.freeze({ id: 'p', config: Object.freeze({ absent: null, empty: '', array: Object.freeze([]), value: 1 }) })
    cy.mount(EntityConfigCardView, { props: {
      record: pluginRecord, entityType: SupportedEntityType.Plugin, pluginConfigKey: 'config',
      pluginConfigSchema: { value: { order: 1 }, absent: { order: -1 } },
    } })
    cy.getTestId('config-card-details-plugin-props').find('.config-card-details-row').first().should('contain.text', 'Value')
    cy.getTestId('array-property-value').should('exist')
    cy.getTestId('config-card-details-plugin-props').find('.config-card-details-row').last().should('contain.text', 'Absent')
  })

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
