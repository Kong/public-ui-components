// Cypress component test spec file
import CsvExportModal from './CsvExportModal.vue'
import { exploreResult, emptyExploreResult } from '../../fixtures/mockData'

const DOWNLOADS_FOLDER = Cypress.config('downloadsFolder')
const MAX_ROWS = 3

describe('<CsvExportModal />', () => {
  beforeEach(() => {
    cy.viewport(800, 800)
  })

  afterEach(() => {
    cy.then(() => {
      const wrapper = Cypress.vueWrapper

      if (wrapper) {
        wrapper.unmount()
      }
    })
  })

  it('Export Modal with empty dataset', () => {
    cy.mount(CsvExportModal, {
      props: {
        exportState: { status: 'success', chartData: emptyExploreResult },
        filename: 'Total requests',
      },
    })

    cy.getTestId('csv-export-modal').should('exist')
    cy.get('.table-empty-state').should('be.visible')
    cy.getTestId('csv-download-button').should('be.disabled')
  })

  it('Export Modal with explore data', () => {
    cy.mount(CsvExportModal, {
      props: {
        exportState: { status: 'success', chartData: exploreResult },
        filename: 'Total requests',
      },
    })

    cy.getTestId('csv-export-modal').should('exist')
    cy.get('.table-empty-state').should('not.exist')
    cy.get('.modal-content .vitals-table').should('exist')
    cy.get('.modal-content .vitals-table').should('exist')
    cy.getTestId('csv-download-button').should('not.be.disabled')

    // Timestamp should be naive localtime
    cy.getTestId('csv-export-modal').find('.k-table-data .table tbody td').eq(0).invoke('text').should('match', /\d{4}-\d\d-\d\d \d\d:\d\d:\d\d/)

    // Table should contain the max number of rows allowed + 1 Header row
    const numTableRows = MAX_ROWS + 1

    cy.getTestId('csv-export-modal').find('.k-table-data .table tr').should('have.length', numTableRows)

    // Column headers should be as expected.
    cy.getTestId('csv-export-modal').find('.k-table-data .table thead th').should(th => {
      const elements = Array.from(th, e => e.innerText)

      expect(JSON.stringify(elements)).to.equal('["Timestamp","UTC offset","Status code","Request count"]')
    })

    // Save to CSV and check actual contents
    cy.getTestId('csv-download-button').click()

    cy.readFile(`${DOWNLOADS_FOLDER}/total-requests-${new Date().toISOString().slice(0, 10)}.csv`).then(contents => {
      expect(contents).contain('Timestamp,UTC offset,Status code,Request count')
      expect(contents).contain('500,10022')
    })
  })
})
