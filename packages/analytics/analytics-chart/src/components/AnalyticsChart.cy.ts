// Cypress component test spec file
import AnalyticsChart from './AnalyticsChart.vue'
import ChartTooltip from './chart-plugins/ChartTooltip.vue'
import composables from '../composables'
import { exploreResult, emptyExploreResult, multiDimensionExploreResult } from '../../fixtures/mockData'

function mouseMove(x1: number, y1: number, x2: number, y2: number, duration: number, withClick = false) {
  const stepCount = duration / 100 // change denominator for more or less steps
  const dx = (x2 - x1) / stepCount
  const dy = (y2 - y1) / stepCount

  for (let step = 0; step < stepCount; step++) {
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(100) // wait 100ms between each step
    cy.get('.chart-body > canvas').trigger('mousemove', x1 + dx * step, y1 + dy * step, { force: true })
    if (withClick) {
      cy.get('.chart-body > canvas').click()
    }
  }
}

describe('<AnalyticsChart />', () => {
  beforeEach(() => {
    cy.viewport(1280, 800)
    cy.stub(composables, 'useEvaluateFeatureFlag').returns({
      evaluateFeatureFlag: () => false,
    })
  })

  it('Renders a line chart for total requests count with status code dimension', () => {
    cy.mount(AnalyticsChart, {
      props: {
        chartData: exploreResult,
        chartOptions: {
          type: 'timeseries_line',
          stacked: true,
          fill: false,
          granularity: 'hourly',
        },
        tooltipTitle: 'Tooltip Title',
      },
    })

    cy.get('.analytics-chart-parent').should('be.visible')
    cy.get('.debug-tooltip').should('not.exist')

    cy.get('[data-testid="time-series-line-chart"]').should('be.visible')
    cy.get('[data-testid="legend"]').children().should('have.length', 5)
    cy.get('.label').eq(0).should('include.text', '200')
    cy.get('.sub-label').eq(0).should('include.text', '1.2M requests')
    cy.get('.label').eq(1).should('include.text', '201')
    cy.get('.sub-label').eq(1).should('include.text', '907K requests')
    cy.get('.label').eq(2).should('include.text', '202')
    cy.get('.sub-label').eq(2).should('include.text', '910K requests')
    cy.get('.label').eq(3).should('include.text', '300')
    cy.get('.sub-label').eq(3).should('include.text', '378K requests')
  })

  it('shows the empty state with no data', () => {
    cy.mount(AnalyticsChart, {
      props: {
        chartData: emptyExploreResult,
        chartOptions: {
          type: 'timeseries_line',
          stacked: true,
          fill: false,
          granularity: 'hourly',
        },
        tooltipTitle: 'Tooltip Title',
      },
    })

    cy.get('[data-testid="no-data-in-report"]').should('be.visible')
  })

  it('renders time series bar chart with no dimension and limited results', () => {
    cy.mount(AnalyticsChart, {
      props: {
        chartData: exploreResult,
        chartOptions: {
          type: 'timeseries_bar',
          stacked: false,
          granularity: 'daily',
          noLimit: true,
        },
        tooltipTitle: 'Tooltip Title',
      },
    })

    cy.get('.analytics-chart-parent').should('be.visible')
    cy.get('[data-testid="time-series-bar-chart"]').should('be.visible')
    cy.get('[data-testid="legend"]').should('have.length', 1)
    cy.get(':nth-child(1) > .label-container > .label').should('include.text', '200')
    cy.get(':nth-child(1) > .label-container > .sub-label').should('include.text', '1.2M requests')
    cy.get("[role='tooltip']").should(
      'include.text',
      'Not all data is shown in the below report. Reports are currently limited to a maximum of 50 entities.',
    )
  })

  it('renders a horizontal bar chart with no legend values', () => {
    cy.mount(AnalyticsChart, {
      props: {
        chartData: exploreResult,
        chartOptions: {
          type: 'horizontal_bar',
        },
        tooltipTitle: 'Tooltip Title',
        showLegendValues: false,
        showAnnotations: false,
      },
    })

    cy.get('.analytics-chart-parent').should('be.visible')
    cy.get('[data-testid="bar-chart-container"]').should('be.visible')
    cy.get('.square-marker').should('have.length', 5)
    cy.get('.label').eq(0).should('have.text', '200')
    cy.get('.sub-label').should('not.exist')
  })

  it('renders a tooltip with the title', () => {
    cy.mount(ChartTooltip, {
      props: {
        showTooltip: true,
        tooltipTitle: 'Requests count',
      },
    })
    cy.get('.tooltip-title').should('contain.text', 'Requests count')

  })

  it('renders a vertical bar chart with multi dimension data', () => {
    cy.mount(AnalyticsChart, {
      props: {
        chartData: multiDimensionExploreResult,
        chartOptions: {
          type: 'vertical_bar',
        },
        tooltipTitle: 'Tooltip Title',
      },
    })

    cy.get('.analytics-chart-parent').should('be.visible')
    cy.get('[data-testid="bar-chart-container"]').should('be.visible')
    cy.get('[data-testid="legend"]').children().should('have.length', 20)
    cy.get('.label').eq(0).should('include.text', '200')
    cy.get('.sub-label').eq(0).should('include.text', '1.2M requests')
    cy.get('.label').eq(1).should('include.text', '201')
    cy.get('.sub-label').eq(1).should('include.text', '882K requests')
    cy.get('.label').eq(2).should('include.text', '202')
    cy.get('.sub-label').eq(2).should('include.text', '885K requests')
    cy.get('.label').eq(3).should('include.text', '300')
    cy.get('.sub-label').eq(3).should('include.text', '367K requests')
  })

  it('renders a donut chart with multi dimension data', () => {
    cy.mount(AnalyticsChart, {
      props: {
        chartData: multiDimensionExploreResult,
        chartOptions: {
          type: 'donut',
        },
        tooltipTitle: 'Tooltip Title',
      },
    })

    cy.get('.analytics-chart-parent').should('be.visible')
    cy.get('[data-testid="donut-chart-parent"]').should('be.visible')
    cy.get('[data-testid="legend"]').children().should('have.length', 6)
    cy.get('.label').eq(0).should('include.text', 'GetMeAKongDefault')
    cy.get('.label').eq(1).should('include.text', 'GetMeASongRoute')
  })

  it('renders a donut chart with sigle dimension data', () => {
    cy.mount(AnalyticsChart, {
      props: {
        chartData: exploreResult,
        chartOptions: {
          type: 'donut',
        },
        tooltipTitle: 'Tooltip Title',
      },
    })

    cy.get('.analytics-chart-parent').should('be.visible')
    cy.get('[data-testid="donut-chart-parent"]').should('be.visible')
    cy.get('[data-testid="legend"]').children().should('have.length', 5)
    cy.get('.label').eq(0).should('include.text', '200')
    cy.get('.sub-label').eq(0).should('include.text', '42K requests')
    cy.get('.label').eq(1).should('include.text', '201')
    cy.get('.sub-label').eq(1).should('include.text', '31K requests')
    cy.get('.label').eq(2).should('include.text', '202')
    cy.get('.sub-label').eq(2).should('include.text', '30K requests')
    cy.get('.label').eq(3).should('include.text', '300')
    cy.get('.sub-label').eq(3).should('include.text', '12K requests')
  })

  it('renders an empty state with default title and description text', () => {
    const { i18n } = composables.useI18n()

    cy.mount(AnalyticsChart, {
      props: {
        chartData: emptyExploreResult,
        chartOptions: {
          type: 'donut',
        },
      },
    })

    cy.get('[data-testid="no-data-in-report"] .empty-state-title').should('contain.text', i18n.t('noDataAvailableTitle'))
    cy.get('[data-testid="no-data-in-report"] .empty-state-message').should('contain.text', i18n.t('noDataAvailableDescription'))
  })

  it('renders an empty state with default title and description text', () => {
    const emptyStateTitle = 'No Data'
    const emptyStateDescription = 'Please contact your system administrator'

    cy.mount(AnalyticsChart, {
      props: {
        chartData: emptyExploreResult,
        chartOptions: {
          type: 'donut',
        },
        emptyStateTitle,
        emptyStateDescription,
      },
    })

    cy.get('[data-testid="no-data-in-report"] .empty-state-title').should('contain.text', emptyStateTitle)
    cy.get('[data-testid="no-data-in-report"] .empty-state-message').should('contain.text', emptyStateDescription)
  })

  it('multi dimension bar charts have "tooltipContext"', () => {
    cy.mount(AnalyticsChart, {
      props: {
        chartData: multiDimensionExploreResult,
        chartOptions: {
          type: 'horizontal_bar',
        },
        tooltipTitle: 'Tooltip Title',
      },
    })

    cy.get('.analytics-chart-parent').should('be.visible')

    // Move mouse from (x1, y1) to (x2, y2), over 400ms, while clicking
    mouseMove(200, 50, 300, 50, 400, true)

    cy.get('body').should(($body) => {
      const tooltipExists = $body.find('.tooltip-container').length > 0
      return expect(tooltipExists).to.be.true
    })

    cy.get('.tooltip-container')
      .should('be.visible')
      .find('.subtitle')
      .should('exist')
  })

  it('single dimension bar charts should not have "tooltipContext"', () => {
    cy.mount(AnalyticsChart, {
      props: {
        chartData: exploreResult,
        chartOptions: {
          type: 'horizontal_bar',
        },
        tooltipTitle: 'Tooltip Title',
      },
    })

    cy.get('.analytics-chart-parent').should('be.visible')

    mouseMove(200, 50, 300, 50, 100, true)
    cy.get('body').should(($body) => {
      const tooltipExists = $body.find('.tooltip-container').length > 0
      return expect(tooltipExists).to.be.true
    })

    cy.get('.tooltip-container')
      .should('be.visible')
      .find('.subtitle')
      .should('not.exist')
  })
})
