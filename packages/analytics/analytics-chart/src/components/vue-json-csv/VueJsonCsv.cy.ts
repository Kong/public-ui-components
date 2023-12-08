import VueJsonCsv from './VueJsonCsv.vue'

const CSV_DATA = [
  { requests: 206, tzOffset: '-08:00', timestamp: '2022-10-15 13:43:27' },
  { requests: 381, tzOffset: '-08:00', timestamp: '2022-12-15 06:00:53' },
  { requests: 648, tzOffset: '-08:00', timestamp: '2022-04-26 06:26:28' },
  { requests: 925, tzOffset: '-08:00', timestamp: '2022-04-10 10:28:46' },
  { requests: 134, tzOffset: '-08:00', timestamp: '2022-12-06 14:38:38' },
]

const LABELS = { timestamp: 'Timestamp', tzOffset: 'UtcOffset', requests: 'TotalRequests' }
const FIELDS = ['timestamp', 'tzOffset', 'requests']

describe('<VueJsonCsv />', () => {
  it('loads the table data and emits export events', () => {
    cy.mount(VueJsonCsv, {
      props: {
        data: CSV_DATA,
        labels: LABELS,
        fields: FIELDS,
        testing: true,
        onUpdate: cy.spy().as('onUpdateExport'),
      },
    })

    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getTestId('export-csv').click().then(() => {
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.wrap(Cypress.vueWrapper.emitted()).should('have.property', 'export-started').then((evt) => {
        const incomingData = evt[0][0]
        const firstRow = incomingData[0]

        cy.wrap(firstRow).should('have.property', LABELS.requests)
        cy.wrap(firstRow).should('have.property', LABELS.timestamp)
        cy.wrap(firstRow).should('not.have.property', 'id')
        cy.wrap(incomingData).should('have.length', CSV_DATA.length)
      })

      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.wrap(Cypress.vueWrapper.emitted()).should('have.property', 'export-finished').then((evt) => {
        const exportedFilename = evt[0][0]

        // No filename was provided, shoudl have defaulted to 'report-data.csv'
        cy.wrap(exportedFilename).should('be.equal', 'report-data.csv')
      })
    })
  })

  it('emits event on export', () => {
    cy.mount(VueJsonCsv, {
      props: {
        data: CSV_DATA,
        labels: LABELS,
        fields: FIELDS,
        testing: true,
        filename: 'custom-export.csv',
      },
    })

    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getTestId('export-csv').click().then(() => {
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.wrap(Cypress.vueWrapper.emitted()).should('have.property', 'export-finished').then((evt) => {
        const exportedFilename = evt[0][0]

        // No filename was provided, shoudl have defaulted to 'report-data.csv'
        cy.wrap(exportedFilename).should('be.equal', 'custom-export.csv')
      })
    })
  })
})
