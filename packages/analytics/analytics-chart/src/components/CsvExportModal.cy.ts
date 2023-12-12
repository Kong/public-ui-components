// Cypress component test spec file
import CsvExportModal from './CsvExportModal.vue'
import composables from '../composables'
import { exploreResult, exploreV2Result, emptyExploreResult } from './mockData'

describe('<CsvExportModal />', () => {
  beforeEach(() => {
    cy.viewport(800, 800)
  })

  it('Export Modal with empty dataset', () => {
    cy.mount(CsvExportModal, {
      props: {
        chartData: emptyExploreResult,
        modalTitle: 'Total requests',
        selectedRange: composables.useChartSelectedRange(exploreResult),
      },
    })

    cy.getTestId('csv-export-modal').should('exist')
    cy.get('.k-table-empty-state').should('be.visible')
    cy.getTestId('csv-download-button').should('be.disabled')
  })

  it('Export Modal with v1 explore data', () => {
    cy.mount(CsvExportModal, {
      props: {
        chartData: exploreResult,
        modalTitle: 'Total requests',
        selectedRange: composables.useChartSelectedRange(exploreResult),
      },
    })

    cy.getTestId('csv-export-modal').should('exist')
    cy.get('.k-table-empty-state').should('not.exist')
    cy.get('.modal-body .vitals-table').should('exist')
    cy.get('.modal-body .vitals-table').should('exist')
    cy.getTestId('csv-download-button').should('not.be.disabled')
  })

  it('Export Modal with v2 explore data', () => {
    cy.mount(CsvExportModal, {
      props: {
        chartData: exploreV2Result,
        modalTitle: 'Total requests',
        selectedRange: composables.useChartSelectedRange(exploreV2Result),
      },
    })

    cy.getTestId('csv-export-modal').should('exist')
    cy.get('.k-table-empty-state').should('not.exist')
    cy.get('.modal-body .vitals-table').should('exist')
    cy.get('.modal-body .vitals-table').should('exist')
    cy.getTestId('csv-download-button').should('not.be.disabled')
  })
})
