import { formatTimestamp, type ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { VueWrapper } from '@vue/test-utils'
import type { ComponentPublicInstance } from 'vue'
import CsvExportModal from './CsvExportModal.vue'

const DOWNLOADS_FOLDER = Cypress.config('downloadsFolder')

const populatedExploreResult: ExploreResultV4 = {
  data: [
    { timestamp: '2024-02-05T22:00:00.000Z', event: { status_code: '200', request_count: 10022 } },
    { timestamp: '2024-02-05T23:00:00.000Z', event: { status_code: '500', request_count: 10023 } },
    { timestamp: '2024-02-06T00:00:00.000Z', event: { status_code: '200', request_count: 10024 } },
    { timestamp: '2024-02-06T01:00:00.000Z', event: { status_code: '500', request_count: 10025 } },
  ],
  meta: {
    start: '2024-02-05T22:00:00.000Z',
    end: '2024-02-06T02:00:00.000Z',
    start_ms: 1707170400000,
    end_ms: 1707184800000,
    display: {
      status_code: {
        200: { name: '200' },
        500: { name: '500' },
      },
    },
    metric_names: ['request_count'],
    metric_units: { request_count: 'requests' },
    granularity_ms: 3600000,
    truncated: false,
    limit: 1000,
    query_id: 'csv-export-test',
    datasource: 'api_usage',
  },
}

const emptyExploreResult: ExploreResultV4 = {
  ...populatedExploreResult,
  data: [],
}

describe('<CsvExportModal />', () => {
  let wrapper: VueWrapper<ComponentPublicInstance>

  const mount = (props: InstanceType<typeof CsvExportModal>['$props']) => {
    return cy.mount(CsvExportModal, { props }).then(({ wrapper: mountedWrapper }) => {
      wrapper = mountedWrapper
    })
  }

  beforeEach(() => {
    cy.viewport(800, 800)
  })

  afterEach(() => {
    cy.then(() => wrapper?.unmount())
  })

  it('shows a loading skeleton while export data is loading', () => {
    mount({
      exportState: { status: 'loading' },
      filename: 'Total requests',
    })

    cy.getTestId('csv-export-modal').should('exist')
    cy.get('.chart-skeleton').should('be.visible')
    cy.get('.vitals-table').should('not.exist')
    cy.getTestId('csv-download-button').should('be.disabled')
  })

  it('shows an error state when export data fails to load', () => {
    mount({
      exportState: { status: 'error' },
      filename: 'Total requests',
    })

    cy.getTestId('csv-export-modal').should('contain.text', 'Error loading data')
    cy.get('.vitals-table').should('not.exist')
    cy.getTestId('csv-download-button').should('be.disabled')
  })

  it('shows an empty state for a successful empty export', () => {
    mount({
      exportState: { status: 'success', chartData: emptyExploreResult },
      filename: 'Total requests',
    })

    cy.get('.table-empty-state').should('be.visible')
    cy.get('.selected-range').should('not.exist')
    cy.getTestId('csv-download-button').should('be.disabled')
  })

  it('previews the first three populated rows with translated headers', () => {
    const { start, end } = populatedExploreResult.meta
    const expectedRange = `${formatTimestamp(new Date(start))} - ${formatTimestamp(new Date(end), { includeTZ: true })}`

    mount({
      exportState: { status: 'success', chartData: populatedExploreResult },
      filename: 'Total requests',
    })

    cy.get('.selected-range').should('contain.text', 'Exports a CSV of the data represented in the chart.')
    cy.get('.selected-range').should('contain.text', `Time range: ${expectedRange}`)
    cy.get('.vitals-table').should('exist')
    cy.get('.k-table-data .table thead th').should(th => {
      expect(Array.from(th, element => element.textContent)).to.deep.equal([
        'Timestamp',
        'UTC offset',
        'Status code',
        'Request count',
      ])
    })
    cy.get('.k-table-data .table tbody tr').should('have.length', 3)
    cy.getTestId('csv-download-button').should('not.be.disabled')
  })

  it('uses a custom modal description', () => {
    mount({
      exportState: { status: 'success', chartData: populatedExploreResult },
      filename: 'Total requests',
      modalDescription: 'Export for audit review.',
    })

    cy.get('.selected-range').should('contain.text', 'Export for audit review.')
    cy.get('.selected-range').should('not.contain.text', 'Exports a CSV of the data represented in the chart.')
  })

  it('emits closeModal from the footer cancel button', () => {
    mount({
      exportState: { status: 'loading' },
      filename: 'Total requests',
    })

    cy.get('.cancel-btn').click()
    cy.then(() => {
      expect(wrapper.emitted('closeModal')).to.have.length(1)
    })
  })

  it('emits closeModal from modal cancel and Escape events', () => {
    mount({
      exportState: { status: 'loading' },
      filename: 'Total requests',
    })

    cy.then(() => {
      const modal = wrapper.findComponent({ name: 'KModal' })

      modal.vm.$emit('cancel')
      modal.vm.$emit('keyup', new KeyboardEvent('keyup', { key: 'Escape' }))
      expect(wrapper.emitted('closeModal')).to.have.length(2)
    })
  })

  it('downloads the populated CSV with its normalized filename', () => {
    mount({
      exportState: { status: 'success', chartData: populatedExploreResult },
      filename: 'Total requests',
    })

    cy.getTestId('csv-download-button').click()
    cy.readFile(`${DOWNLOADS_FOLDER}/total-requests-${new Date().toISOString().slice(0, 10)}.csv`).then(contents => {
      expect(contents).to.contain('Timestamp,UTC offset,Status code,Request count')
      expect(contents).to.contain('500,10023')
    })
  })
})
