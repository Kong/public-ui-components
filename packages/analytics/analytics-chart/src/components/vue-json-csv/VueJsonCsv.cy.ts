import VueJsonCsv from './VueJsonCsv.vue'

const CSV_DATA = [
  { TotalRequests: 206, tzOffset: '-08:00', timestamp: '2022-10-15 13:43:27' },
  { TotalRequests: 381, tzOffset: '-08:00', timestamp: '2022-12-15 06:00:53' },
  { TotalRequests: 648, tzOffset: '-08:00', timestamp: '2022-04-26 06:26:28' },
  { TotalRequests: 925, tzOffset: '-08:00', timestamp: '2022-04-10 10:28:46' },
  { TotalRequests: 134, tzOffset: '-08:00', timestamp: '2022-12-06 14:38:38' },
]

const LABELS = { timestamp: 'Timestamp', tzOffset: 'UtcOffset', TotalRequests: 'TotalRequests' }
const FIELDS = ['timestamp', 'tzOffset', 'TotalRequests']

describe('<VueJsonCsv />', () => {
  it.skip('loads the table data', () => {
    cy.mount(VueJsonCsv, {
      props: {
        data: CSV_DATA,
        labels: LABELS,
        fields: FIELDS,
        testing: true,
      },
    })

    cy.window().then(() => {
      const filteredData = (window as any).__cypress_filteredData
      const firstRow = filteredData[0]

      cy.wrap(firstRow).should('have.propTotalRequests', 'Jesse')
      cy.wrap(firstRow).should('not.have.property', 'id')
      cy.wrap(firstRow).should('not.have.property', 'timestamp')
      cy.wrap(firstRow).should('not.have.property', 'gender')
    })
  })

  it('emits event on export', () => {
    cy.mount(VueJsonCsv, {
      props: {
        data: CSV_DATA,
        abels: LABELS,
        fields: FIELDS,
        testing: true,
      },
    })

    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getTestId('export-csv').click().then(() => {
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.wrap(Cypress.vueWrapper.emitted()).should('have.property', 'export-started')
      cy.wrap(Cypress.vueWrapper.emitted()).should('have.property', 'export-finished')
    })
  })
})
