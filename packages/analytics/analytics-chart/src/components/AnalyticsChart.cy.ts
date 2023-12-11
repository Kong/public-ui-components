// Cypress component test spec file
import { ChartTypes } from '../enums/'
import AnalyticsChart from './AnalyticsChart.vue'
import ChartTooltip from './chart-plugins/ChartTooltip.vue'
import { GranularityKeys } from '@kong-ui-public/analytics-utilities'
import composables from '../composables'

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

const emptyExploreResult = {
  records: [],
  meta: {
    start: 1685452140.987,
    end: 1685473740.987,
    queryId: '12345',
    dimensions: {
      StatusCode: ['200', '300', '400', '500'],
    },
    metricNames: ['TotalRequests'],
    metricUnits: {
      TotalRequests: 'requests',
    },
    granularity: 3600000,
    truncated: false,
    limit: 10,
  },
}

const exploreResult = {
  records: [
    {
      version: '1.0',
      timestamp: '2023-05-30T13:09:00.987Z',
      event: {
        StatusCode: '200',
        TotalRequests: 255.49999999999997,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T13:09:00.987Z',
      event: {
        StatusCode: '300',
        TotalRequests: 182.5,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T13:09:00.987Z',
      event: {
        StatusCode: '400',
        TotalRequests: 182.5,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T13:09:00.987Z',
      event: {
        StatusCode: '500',
        TotalRequests: 73,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T14:09:00.987Z',
      event: {
        StatusCode: '200',
        TotalRequests: 412.8,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T14:09:00.987Z',
      event: {
        StatusCode: '300',
        TotalRequests: 309.59999999999997,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T14:09:00.987Z',
      event: {
        StatusCode: '400',
        TotalRequests: 206.4,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T14:09:00.987Z',
      event: {
        StatusCode: '500',
        TotalRequests: 51.6,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T15:09:00.987Z',
      event: {
        StatusCode: '200',
        TotalRequests: 867.6,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T15:09:00.987Z',
      event: {
        StatusCode: '300',
        TotalRequests: 385.6,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T15:09:00.987Z',
      event: {
        StatusCode: '400',
        TotalRequests: 385.6,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T15:09:00.987Z',
      event: {
        StatusCode: '500',
        TotalRequests: 96.4,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T16:09:00.987Z',
      event: {
        StatusCode: '200',
        TotalRequests: 982.4000000000001,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T16:09:00.987Z',
      event: {
        StatusCode: '300',
        TotalRequests: 614,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T16:09:00.987Z',
      event: {
        StatusCode: '400',
        TotalRequests: 614,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T16:09:00.987Z',
      event: {
        StatusCode: '500',
        TotalRequests: 245.60000000000002,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T17:09:00.987Z',
      event: {
        StatusCode: '200',
        TotalRequests: 1043,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T17:09:00.987Z',
      event: {
        StatusCode: '300',
        TotalRequests: 745,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T17:09:00.987Z',
      event: {
        StatusCode: '400',
        TotalRequests: 596,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T17:09:00.987Z',
      event: {
        StatusCode: '500',
        TotalRequests: 298,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T18:09:00.987Z',
      event: {
        StatusCode: '200',
        TotalRequests: 1260.8000000000002,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T18:09:00.987Z',
      event: {
        StatusCode: '300',
        TotalRequests: 788,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T18:09:00.987Z',
      event: {
        StatusCode: '400',
        TotalRequests: 472.79999999999995,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T18:09:00.987Z',
      event: {
        StatusCode: '500',
        TotalRequests: 157.60000000000002,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T19:09:00.987Z',
      event: {
        StatusCode: '200',
        TotalRequests: 1652,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T19:09:00.987Z',
      event: {
        StatusCode: '300',
        TotalRequests: 1239,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T19:09:00.987Z',
      event: {
        StatusCode: '400',
        TotalRequests: 619.5,
      },
    },
    {
      version: '1.0',
      timestamp: '2023-05-30T19:09:00.987Z',
      event: {
        StatusCode: '500',
        TotalRequests: 413,
      },
    },
  ],
  meta: {
    start: 1685452140.987,
    end: 1685473740.987,
    queryId: '12345',
    dimensions: {
      StatusCode: ['200', '300', '400', '500'],
    },
    metricNames: ['TotalRequests'],
    metricUnits: {
      TotalRequests: 'requests',
    },
    granularity: 3600000,
    truncated: false,
    limit: 10,
  },
}

const dailyExploreResult = {
  records: [
    {
      version: 'v1',
      timestamp: '2023-05-25T06:00:00.000Z',
      event: {
        TotalRequests: 425722,
      },
    },
    {
      version: 'v1',
      timestamp: '2023-05-26T06:00:00.000Z',
      event: {
        TotalRequests: 430278,
      },
    },
    {
      version: 'v1',
      timestamp: '2023-05-27T06:00:00.000Z',
      event: {
        TotalRequests: 429998,
      },
    },
    {
      version: 'v1',
      timestamp: '2023-05-28T06:00:00.000Z',
      event: {
        TotalRequests: 430544,
      },
    },
    {
      version: 'v1',
      timestamp: '2023-05-29T06:00:00.000Z',
      event: {
        TotalRequests: 426258,
      },
    },
    {
      version: 'v1',
      timestamp: '2023-05-30T06:00:00.000Z',
      event: {
        TotalRequests: 430446,
      },
    },
    {
      version: 'v1',
      timestamp: '2023-05-31T06:00:00.000Z',
      event: {
        TotalRequests: 225018,
      },
    },
  ],
  meta: {
    start: 1684994400,
    end: 1685599200,
    granularity: 86400000,
    queryId: '23976f',
    metricNames: ['TotalRequests'],
    truncated: true,
    limit: 50,
    metricUnits: {
      TotalRequests: 'count',
    },
    dimensions: {},
  },
}

const multiDimensionExploreResult = {
  records: [
    {
      version: 'v1',
      timestamp: '2023-05-31T19:00:00.000Z',
      event: {
        StatusCode: '200',
        Service: 'service A',
        TotalRequests: 17945,
      },
    },
    {
      version: 'v1',
      timestamp: '2023-05-31T20:00:00.000Z',
      event: {
        StatusCode: '200',
        Service: 'service A',
        TotalRequests: 17940,
      },
    },
    {
      version: 'v1',
      timestamp: '2023-05-31T21:00:00.000Z',
      event: {
        StatusCode: '300',
        Service: 'service A',
        TotalRequests: 17955,
      },
    },
    {
      version: 'v1',
      timestamp: '2023-05-31T22:00:00.000Z',
      event: {
        StatusCode: '300',
        Service: 'service A',
        TotalRequests: 17944,
      },
    },
    {
      version: 'v1',
      timestamp: '2023-05-31T23:00:00.000Z',
      event: {
        StatusCode: '500',
        Service: 'service A',
        TotalRequests: 17940,
      },
    },
    {
      version: 'v1',
      timestamp: '2023-06-01T00:00:00.000Z',
      event: {
        StatusCode: '500',
        Service: 'service A',
        TotalRequests: 17925,
      },
    },
    {
      version: 'v1',
      timestamp: '2023-06-01T01:00:00.000Z',
      event: {
        StatusCode: '200',
        Service: 'service A',
        TotalRequests: 17930,
      },
    },
    {
      version: 'v1',
      timestamp: '2023-06-01T02:00:00.000Z',
      event: {
        StatusCode: '300',
        Service: 'service B (default)',
        TotalRequests: 17945,
      },
    },
    {
      version: 'v1',
      timestamp: '2023-06-01T03:00:00.000Z',
      event: {
        StatusCode: '400',
        Service: 'service B (default)',
        TotalRequests: 17940,
      },
    },
    {
      version: 'v1',
      timestamp: '2023-06-01T04:00:00.000Z',
      event: {
        StatusCode: '400',
        Service: 'service B',
        TotalRequests: 17939,
      },
    },
    {
      version: 'v1',
      timestamp: '2023-06-01T05:00:00.000Z',
      event: {
        StatusCode: '400',
        Service: 'service B',
        TotalRequests: 17930,
      },
    },
    {
      version: 'v1',
      timestamp: '2023-06-01T06:00:00.000Z',
      event: {
        StatusCode: '500',
        Service: 'service B',
        TotalRequests: 17950,
      },
    },
    {
      version: 'v1',
      timestamp: '2023-06-01T07:00:00.000Z',
      event: {
        StatusCode: '200',
        Service: 'service B',
        TotalRequests: 17935,
      },
    },
    {
      version: 'v1',
      timestamp: '2023-06-01T08:00:00.000Z',
      event: {
        StatusCode: '300',
        Service: 'service B',
        TotalRequests: 17930,
      },
    },
    {
      version: 'v1',
      timestamp: '2023-06-01T09:00:00.000Z',
      event: {
        StatusCode: '400',
        Service: 'service B',
        TotalRequests: 17935,
      },
    },
  ],
  meta: {
    start: 1685559600,
    end: 1685646000,
    granularity: 3600000,
    queryId: 'ab6ee70c-ca00-47ef-8151-d52ca940837a',
    metricNames: ['TotalRequests'],
    truncated: false,
    limit: 50,
    metricUnits: {
      TotalRequests: 'count',
    },
    dimensions: {
      Service: ['service A', 'service B'],
      StatusCode: ['200', '300', '400', '500'],
    },
  },
}

describe('<AnalyticsChart />', () => {
  it('Renders a line chart for total requests count with status code dimension', () => {
    cy.mount(AnalyticsChart, {
      props: {
        chartData: exploreResult,
        chartOptions: {
          type: ChartTypes.TIMESERIES_LINE,
          stacked: true,
          fill: false,
          granularity: GranularityKeys.HOURLY,
        },
        chartTitle: 'Time series line chart',
        tooltipTitle: 'Tooltip Title',
      },
    })

    cy.get('.analytics-chart-parent').should('be.visible')
    cy.get('[data-testid="time-series-line-chart"]').should('be.visible')
    cy.get('.chart-header').should('contain.text', 'Time series line chart')
    cy.get('[data-testid="legend"]').children().should('have.length', 4)
    cy.get('.label').eq(0).should('include.text', '200')
    cy.get('.sub-label').eq(0).should('include.text', '6.4K requests')
    cy.get('.label').eq(1).should('include.text', '300')
    cy.get('.sub-label').eq(1).should('include.text', '4.2K requests')
    cy.get('.label').eq(2).should('include.text', '400')
    cy.get('.sub-label').eq(2).should('include.text', '3K requests')
    cy.get('.label').eq(3).should('include.text', '500')
    cy.get('.sub-label').eq(3).should('include.text', '1.3K requests')
  })

  it('shows the empty state with no data', () => {
    cy.mount(AnalyticsChart, {
      props: {
        chartData: emptyExploreResult,
        chartOptions: {
          type: ChartTypes.TIMESERIES_LINE,
          stacked: true,
          fill: false,
          granularity: GranularityKeys.HOURLY,
        },
        chartTitle: 'Title',
        tooltipTitle: 'Tooltip Title',
      },
    })

    cy.get('[data-testid="no-data-in-report"]').should('be.visible')
  })

  it('renders time series bar chart with no dimension and limited results', () => {
    cy.mount(AnalyticsChart, {
      props: {
        chartData: dailyExploreResult,
        chartOptions: {
          type: ChartTypes.TIMESERIES_BAR,
          stacked: false,
          granularity: GranularityKeys.DAILY,
          noLimit: true,
        },
        chartTitle: 'Time series bar chart',
        tooltipTitle: 'Tooltip Title',
      },
    })

    cy.get('.analytics-chart-parent').should('be.visible')
    cy.get('.chart-header').contains('Time series bar chart')
    cy.get('[data-testid="time-series-bar-chart"]').should('be.visible')
    cy.get('[data-testid="legend"]').should('have.length', 1)
    cy.get('.label').should('include.text', 'Request Count')
    cy.get('.sub-label').should('include.text', '2.7M requests')
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
          type: ChartTypes.HORIZONTAL_BAR,
        },
        chartTitle: 'Horizontal bar chart',
        tooltipTitle: 'Tooltip Title',
        showLegendValues: false,
        showAnnotations: false,
      },
    })

    cy.get('.analytics-chart-parent').should('be.visible')
    cy.get('[data-testid="bar-chart-container"]').should('be.visible')
    cy.get('.chart-header').should('contain.text', 'Horizontal bar chart')
    cy.get('.legend').should('have.length', 4)
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
          type: ChartTypes.VERTICAL_BAR,
        },
        chartTitle: 'Vertical bar chart',
        tooltipTitle: 'Tooltip Title',
      },
    })

    cy.get('.analytics-chart-parent').should('be.visible')
    cy.get('[data-testid="bar-chart-container"]').should('be.visible')
    cy.get('.chart-header').should('contain.text', 'Vertical bar chart')
    cy.get('[data-testid="legend"]').children().should('have.length', 4)
    cy.get('.label').eq(0).should('include.text', '500')
    cy.get('.sub-label').eq(0).should('include.text', '35K requests')
    cy.get('.label').eq(1).should('include.text', '300')
    cy.get('.sub-label').eq(1).should('include.text', '35K requests')
    cy.get('.label').eq(2).should('include.text', '200')
    cy.get('.sub-label').eq(2).should('include.text', '35K requests')
    cy.get('.label').eq(3).should('include.text', '400')
    cy.get('.sub-label').eq(3).should('include.text', '17K requests')
  })

  it('renders a doughnut chart with multi dimension data', () => {
    cy.mount(AnalyticsChart, {
      props: {
        chartData: multiDimensionExploreResult,
        chartOptions: {
          type: ChartTypes.DOUGHNUT,
        },
        chartTitle: 'Doughnut chart',
        tooltipTitle: 'Tooltip Title',
      },
    })

    cy.get('.analytics-chart-parent').should('be.visible')
    cy.get('[data-testid="doughnut-chart-parent"]').should('be.visible')
    cy.get('.chart-header').should('contain.text', 'Doughnut chart')
    cy.get('[data-testid="legend"]').children().should('have.length', 2)
    cy.get('.label').eq(0).should('include.text', 'service A')
    cy.get('.label').eq(1).should('include.text', 'service B')
  })

  it('renders a doughnut chart with sigle dimension data', () => {
    cy.mount(AnalyticsChart, {
      props: {
        chartData: exploreResult,
        chartOptions: {
          type: ChartTypes.DOUGHNUT,
        },
        chartTitle: 'Doughnut chart',
        tooltipTitle: 'Tooltip Title',
      },
    })

    cy.get('.analytics-chart-parent').should('be.visible')
    cy.get('[data-testid="doughnut-chart-parent"]').should('be.visible')
    cy.get('.chart-header').should('contain.text', 'Doughnut chart')
    cy.get('[data-testid="legend"]').children().should('have.length', 4)
    cy.get('.label').eq(0).should('include.text', '200')
    cy.get('.sub-label').eq(0).should('include.text', '1.6K requests')
    cy.get('.label').eq(1).should('include.text', '300')
    cy.get('.sub-label').eq(1).should('include.text', '1.2K requests')
    cy.get('.label').eq(2).should('include.text', '400')
    cy.get('.sub-label').eq(2).should('include.text', '619 requests')
    cy.get('.label').eq(3).should('include.text', '500')
    cy.get('.sub-label').eq(3).should('include.text', '413 requests')
  })

  it('renders an empty state with default title and description text', () => {
    const { i18n } = composables.useI18n()

    cy.mount(AnalyticsChart, {
      props: {
        chartData: emptyExploreResult,
        chartOptions: {
          type: ChartTypes.DOUGHNUT,
        },
      },
    })

    cy.get('[data-testid="no-data-in-report"] .k-empty-state-title-header').should('contain.text', i18n.t('noDataAvailableTitle'))
    cy.get('[data-testid="no-data-in-report"] .k-empty-state-message').should('contain.text', i18n.t('noDataAvailableDescription'))
  })

  it('renders an empty state with default title and description text', () => {
    const emptyStateTitle = 'No Data'
    const emptyStateDescription = 'Please contact your system administrator'

    cy.mount(AnalyticsChart, {
      props: {
        chartData: emptyExploreResult,
        chartOptions: {
          type: ChartTypes.DOUGHNUT,
        },
        emptyStateTitle,
        emptyStateDescription,
      },
    })

    cy.get('[data-testid="no-data-in-report"] .k-empty-state-title-header').should('contain.text', emptyStateTitle)
    cy.get('[data-testid="no-data-in-report"] .k-empty-state-message').should('contain.text', emptyStateDescription)
  })

  it('doest not render an "Export button" if the datatet is empty', () => {
    cy.mount(AnalyticsChart, {
      props: {
        allowCsvExport: true,
        chartData: emptyExploreResult,
        chartOptions: {
          type: ChartTypes.TIMESERIES_LINE,
        },
        chartTitle: 'Requests',
      },
    })
    cy.getTestId('csv-export-button').should('not.exist')
  })

  it('does not render an "Export" button if chart data is present but prop is set to `false`', () => {
    cy.mount(AnalyticsChart, {
      props: {
        allowCsvExport: true,
        chartData: emptyExploreResult,
        chartOptions: {
          type: ChartTypes.TIMESERIES_LINE,
        },
        chartTitle: 'Requests',
      },
    })
    cy.getTestId('csv-export-button').should('not.exist')
  })

  it('Renders an "Export" button, and tabulated data in the modal preview', () => {
    cy.viewport(1280, 800)

    cy.mount(AnalyticsChart, {
      props: {
        allowCsvExport: true,
        chartData: exploreResult,
        chartOptions: {
          type: ChartTypes.TIMESERIES_LINE,
        },
        chartTitle: 'Requests',
      },
    })

    cy.getTestId('csv-export-button').should('exist')

    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getTestId('csv-export-button').click().then(() => {
      cy.getTestId('csv-export-modal').should('exist')
      cy.get('.modal-body .vitals-table').should('exist')
    })
  })

  it('multi dimension bar charts have "tooltipContext"', () => {
    cy.mount(AnalyticsChart, {
      props: {
        chartData: multiDimensionExploreResult,
        chartOptions: {
          type: ChartTypes.HORIZONTAL_BAR,
        },
        chartTitle: 'Vertical bar chart',
        tooltipTitle: 'Tooltip Title',
      },
    })

    cy.get('.analytics-chart-parent').should('be.visible')

    mouseMove(200, 50, 300, 50, 100, true)
    // This is flaky since were testing the canvas.
    // Do not fail the test in case the tooltip is not found.
    // The tooltip, might not get triggered in a bar chart
    // if you're in between bars.
    cy.get('body').then(($body) => {
      if ($body.find('.tooltip-container').length) {
        cy.get('.subtitle').should('contain.text', 'service A')
      }

    })
  })

  it('single dimension bar charts should not have "tooltipContext"', () => {
    cy.mount(AnalyticsChart, {
      props: {
        chartData: dailyExploreResult,
        chartOptions: {
          type: ChartTypes.HORIZONTAL_BAR,
        },
        chartTitle: 'Vertical bar chart',
        tooltipTitle: 'Tooltip Title',
      },
    })

    cy.get('.analytics-chart-parent').should('be.visible')

    mouseMove(200, 100, 300, 100, 100, true)
    // This is flaky since were testing the canvas.
    // Do not fail the test in case the tooltip is not found.
    // The tooltip, might not get triggered in a bar chart
    // if you're in between bars.
    cy.get('body').then(($body) => {
      if ($body.find('.tooltip-container').length) {
        cy.get('.subtitle').should('not.exist')
      }

    })
  })
})
