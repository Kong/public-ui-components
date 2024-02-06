// Cypress component test spec file
import CsvExportModal from './CsvExportModal.vue'
import { exploreResult, emptyExploreResult } from '../../fixtures/mockData'

const DOWNLOADS_FOLDER = Cypress.config('downloadsFolder')
const MAX_ROWS = 3

describe('<CsvExportModal />', () => {
  beforeEach(() => {
    cy.viewport(800, 800)
  })

  it('Export Modal with empty dataset', () => {
    cy.mount(CsvExportModal, {
      props: {
        chartData: emptyExploreResult,
        filename: 'Total requests',
      },
    })

    cy.getTestId('csv-export-modal').should('exist')
    cy.get('.k-table-empty-state').should('be.visible')
    cy.getTestId('csv-download-button').should('be.disabled')
  })

  it('Export Modal with explore data', () => {
    cy.mount(CsvExportModal, {
      props: {
        chartData: exploreResult,
        filename: 'Total requests',
      },
    })

    cy.getTestId('csv-export-modal').should('exist')
    cy.get('.k-table-empty-state').should('not.exist')
    cy.get('.modal-content .vitals-table').should('exist')
    cy.get('.modal-content .vitals-table').should('exist')
    cy.getTestId('csv-download-button').should('not.be.disabled')

    // Timestamp should be naive localtime
    cy.getTestId('csv-export-modal').find('.k-table tbody td').eq(0).invoke('text').should('match', /\d{4}-\d\d-\d\d \d\d:\d\d:\d\d/)

    // Table should contain the max number of rows allowed + 1 Header row
    const numTableRows = MAX_ROWS + 1

    cy.getTestId('csv-export-modal').find('.k-table tr').should('have.length', numTableRows)

    // Column headers should be as expected.
    cy.getTestId('csv-export-modal').find('.k-table thead th').should(th => {
      const elements = Array.from(th, e => e.innerText)

      expect(elements.join(',')).eql('Timestamp,UTC Offset,Status Code,Request Count')
    })

    // Save to CSV and check actual contents
    cy.getTestId('csv-download-button').click()

    cy.readFile(`${DOWNLOADS_FOLDER}/total-requests-${new Date().toISOString().slice(0, 10)}.csv`).then(contents => {
      expect(contents).contain('Timestamp,UTC Offset,Status Code,Request Count')
      expect(contents).contain('2024-02-06 13:00:00,-08:00,500,10022')
    })
  })
})
