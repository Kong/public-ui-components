import MetricsTestHarness from './MetricsTestHarness.vue'
import { ref } from 'vue'
import type { DataFetcher, ExploreV2Query } from '../types'
import { EXPLORE_V2_AGGREGATIONS, EXPLORE_V2_DIMENSIONS, EXPLORE_V2_FILTER_TYPES } from '../types'
import type { QueryTime } from '@kong-ui-public/analytics-utilities'
import type { MockOptions } from '../mockExploreResponse'
import { mockExploreResponse } from '../mockExploreResponse'
import type { AxiosResponse } from 'axios'

describe('<AnalyticsMetricProvider />', () => {

  const makeDataFetcher = (opts?: MockOptions) => {
    const dataFetcher: DataFetcher = (queryTime: QueryTime, query: ExploreV2Query) => {
      if (opts?.injectErrors) {

        if (
          (opts.injectErrors === 'traffic' && query.metrics.includes(EXPLORE_V2_AGGREGATIONS.REQUEST_COUNT)) ||
          (opts.injectErrors === 'latency' && query.metrics.includes(EXPLORE_V2_AGGREGATIONS.RESPONSE_LATENCY_P99)) ||
          opts.injectErrors === 'all'
        ) {
          // If injectErrors is latency or traffic, fail that specific query.
          // If it's all, let no query succeed.
          const errorResponse: AxiosResponse = {
            data: null,
            status: 500,
            statusText: 'Internal Server Error',
            headers: {},
            config: {} as any,
          }

          // See notes below about enabling this.
          // cy.log('Generated error response:', errorResponse, 'given query', query)

          return Promise.reject(errorResponse)
        }
      }
      const result = mockExploreResponse(query, queryTime.startMs(), queryTime.endMs(), opts)

      // Note: it can be very helpful to log the generated response while developing
      // tests.  However, doing so can sometimes cause Cypress flakiness -- something to do
      // with the order in which promises resolve.  To avoid the flakiness, this log call is
      // not enabled by default, but left here for reference:
      // cy.log('Generated explore response:', result, 'given query', query)

      const response: AxiosResponse = {
        data: result,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      }

      return Promise.resolve(response)
    }

    return cy.spy(dataFetcher).as('fetcher')
  }

  it('displays global metrics', () => {
    const dataFetcher = makeDataFetcher()

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        dataFetcher,
        hasTrendAccess: true,
      },
    })

    cy.get('@fetcher').should('have.been.calledTwice')

    // Ensure the filter is undefined.
    cy.get('@fetcher').should('always.have.not.been.calledWithMatch', Cypress.sinon.match.any, Cypress.sinon.match.has('filter'))

    cy.get('.metricscard').should('exist')

    cy.get('.metricscard-title').eq(0).should('have.text', 'Requests')
    cy.get('.metricscard-title').eq(1).should('have.text', 'Error Rate')
    cy.get('.metricscard-title').eq(2).should('have.text', 'P99 Latency')

    // 1001 req each for 1xx, 2xx, 3xx, 4xx, 5xx
    // 5005 total; 2002/5005 = .4 (error rate for 4xx and 5xx)
    cy.getTestId('metric-value').eq(0).should('have.text', '5K')
    cy.getTestId('metric-value').eq(1).should('have.text', '40.00%')
    cy.getTestId('metric-value').eq(2).should('have.text', '1001ms')

    // 2001 req each for 1xx, 2xx, 3xx, 4xx, 5xx in the prior period.
    // 10005 total; 4002/10005 = .4 (error rate for 4xx and 5xx).  Expected error rate change is 0.
    // 5005/10005-1 = −0.499750125.  Expected drop in traffic is 49.98%.
    cy.get('.metricscard-trend-change > div').eq(0).should('have.text', '49.98%')
    cy.get('.metricscard-trend-change > div').eq(1).should('have.text', '0.00%')
    cy.get('.metricscard-trend-change > div').eq(2).should('have.text', '49.98%')
  })

  it('displays long titles if required', () => {
    const dataFetcher = makeDataFetcher()

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        dataFetcher,
        hasTrendAccess: true,
        longCardTitles: true,
      },
    })

    cy.get('@fetcher').should('have.been.calledTwice')

    cy.get('.metricscard').should('exist')
    cy.get('.metricscard-title').eq(0).should('have.text', 'Number of Requests')
    cy.get('.metricscard-title').eq(1).should('have.text', 'Average Error Rate')
    cy.get('.metricscard-title').eq(2).should('have.text', 'P99 Latency')
  })

  it('handles no trend', () => {
    const dataFetcher = makeDataFetcher()

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        dataFetcher,
        hasTrendAccess: false,
      },
    })

    cy.get('@fetcher').should('have.been.calledTwice')

    cy.get('.metricscard').should('exist')

    cy.getTestId('metric-value').eq(0).should('have.text', '5K')
    cy.getTestId('metric-value').eq(1).should('have.text', '40.00%')
    cy.getTestId('metric-value').eq(2).should('have.text', '1001ms')

    cy.get('.metricscard-trend-change > div').eq(0).should('have.text', 'N/A')
    cy.get('.metricscard-trend-change > div').eq(1).should('have.text', 'N/A')
    cy.get('.metricscard-trend-change > div').eq(2).should('have.text', 'N/A')
  })

  it('handles queryReady', () => {
    const dataFetcher = makeDataFetcher()
    const queryReady = ref(false)

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        dataFetcher,
        hasTrendAccess: false,
        queryReady,
      },
    })

    cy.get('.loading-tabs').should('exist')
    cy.get('.metricscard').should('not.exist')
    cy.get('@fetcher').should('not.have.been.called').then(() => {

      queryReady.value = true

      cy.get('.loading-tabs').should('not.exist')

      // Note: I'd like to assert that the fetcher was called, but this seems to cause Cypress
      // to flake with an error about promises and the use of `cy.log` in the fetcher.
      cy.get('.metricscard').should('exist')

      cy.getTestId('metric-value').eq(0).should('have.text', '5K')
    })
  })

  it('displays filtered metrics', () => {
    const dataFetcher = makeDataFetcher()

    const additionalFilter = ref([{
      dimension: EXPLORE_V2_DIMENSIONS.APPLICATION,
      type: EXPLORE_V2_FILTER_TYPES.IN,
      values: ['app1'],
    }])

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        dataFetcher,
        hasTrendAccess: true,
        additionalFilter,
      },
    })

    cy.get('@fetcher').should('have.been.calledTwice')
    cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match.any, Cypress.sinon.match({
      filter: [{
        dimension: 'APPLICATION',
        type: 'IN',
        values: ['app1'],
      }],
    }))

    cy.get('.metricscard').should('exist')

    cy.getTestId('metric-value').eq(0).should('have.text', '5K')
    cy.getTestId('metric-value').eq(1).should('have.text', '40.00%')
    cy.getTestId('metric-value').eq(2).should('have.text', '1001ms')

    cy.get('.metricscard-trend-change > div').eq(0).should('have.text', '49.98%')
    cy.get('.metricscard-trend-change > div').eq(1).should('have.text', '0.00%')
    cy.get('.metricscard-trend-change > div').eq(2).should('have.text', '49.98%').then(() => {
      additionalFilter.value = [{
        dimension: EXPLORE_V2_DIMENSIONS.API_PRODUCT,
        type: EXPLORE_V2_FILTER_TYPES.IN,
        values: ['product1'],
      }]

      cy.get('@fetcher').should('have.been.calledWithMatch', Cypress.sinon.match.any, Cypress.sinon.match({
        filter: [{
          dimension: 'API_PRODUCT',
          type: 'IN',
          values: ['product1'],
        }],
      }))
    })
  })

  it('displays single-entity metrics', () => {
    const dataFetcher = makeDataFetcher({ dimensionNames: ['blah'] })

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'single',
        dataFetcher,
        hasTrendAccess: true,
      },
    })

    cy.get('@fetcher').should('have.been.calledTwice')
    cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match.any, Cypress.sinon.match({
      filter: [{
        dimension: 'ROUTE',
        type: 'IN',
        values: ['blah'],
      }],
    }))

    cy.get('.metricscard').should('exist')

    cy.getTestId('metric-value').eq(0).should('have.text', '5K')
    cy.getTestId('metric-value').eq(1).should('have.text', '40.00%')
    cy.getTestId('metric-value').eq(2).should('have.text', '1001ms')

    cy.get('.metricscard-trend-change > div').eq(0).should('have.text', '49.98%')
    cy.get('.metricscard-trend-change > div').eq(1).should('have.text', '0.00%')

    // Latency trend: 1001/2001−1 = −0.499750125
    cy.get('.metricscard-trend-change > div').eq(2).should('have.text', '49.98%')
  })

  it('displays single-entity metrics with no trend', () => {
    const dataFetcher = makeDataFetcher({ dimensionNames: ['blah'] })

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'single',
        dataFetcher,
        hasTrendAccess: false,
      },
    })

    cy.get('@fetcher').should('have.been.calledTwice')

    cy.get('.metricscard').should('exist')

    cy.getTestId('metric-value').eq(0).should('have.text', '5K')
    cy.getTestId('metric-value').eq(1).should('have.text', '40.00%')
    cy.getTestId('metric-value').eq(2).should('have.text', '1001ms')

    cy.get('.metricscard-trend-change > div').eq(0).should('have.text', 'N/A')
    cy.get('.metricscard-trend-change > div').eq(1).should('have.text', 'N/A')
    cy.get('.metricscard-trend-change > div').eq(2).should('have.text', 'N/A')
  })

  it('displays multi-entity metrics', () => {
    const dataFetcher = makeDataFetcher({ dimensionNames: ['blah', 'arrgh'] })

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'multi',
        dataFetcher,
        hasTrendAccess: true,
      },
    })

    cy.get('@fetcher').should('have.been.calledTwice')

    cy.get('#route-blah').within(() => {
      cy.get('.metricscard').should('exist')

      cy.getTestId('metric-value').eq(0).should('have.text', '5K')
      cy.getTestId('metric-value').eq(1).should('have.text', '40.00%')
      cy.getTestId('metric-value').eq(2).should('have.text', '1001ms')

      cy.get('.metricscard-trend-change').should('not.exist')
    })

    cy.get('#route-arrgh').within(() => {
      cy.get('.metricscard').should('exist')

      cy.getTestId('metric-value').eq(0).should('have.text', '5.5K')
      cy.getTestId('metric-value').eq(1).should('have.text', '40.00%')
      cy.getTestId('metric-value').eq(2).should('have.text', '1101ms')

      cy.get('.metricscard-trend-change').should('not.exist')
    })
  })

  it('displays only one card', () => {
    const dataFetcher = makeDataFetcher({ dimensionNames: ['blah'] })

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'latencyCard',
        dataFetcher,
        hasTrendAccess: true,
      },
    })

    // The fetcher is still called twice; this property only impacts the display.
    // (The main use case as of writing is for showing cards in a tab panel, so all data is still required.)
    cy.get('@fetcher').should('have.been.calledTwice')

    cy.get('.metricscard').should('exist')

    cy.get('.metricscard-value').should('have.length', 1)
    cy.getTestId('metric-value').should('have.text', '1001ms')
    cy.get('.metricscard-trend-change > div').should('have.text', '49.98%')
  })

  it('handles errors in all cards', () => {
    const dataFetcher = makeDataFetcher({ injectErrors: 'all' })

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        dataFetcher,
        hasTrendAccess: true,
        additionalFilter: ref([{
          dimension: EXPLORE_V2_DIMENSIONS.APPLICATION,
          type: EXPLORE_V2_FILTER_TYPES.IN,
          values: ['all-cards'], // SWRV cache busting
        }]),
      },
    })

    cy.get('@fetcher').should('have.been.calledTwice')

    cy.get('#global').within(() => {
      cy.get('.error-display').should('exist')
      cy.get('.metricscard').should('not.exist')
    })
  })

  it('handles errors in latency query', () => {
    const dataFetcher = makeDataFetcher({ injectErrors: 'latency' })

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        dataFetcher,
        hasTrendAccess: true,
        additionalFilter: ref([{
          dimension: EXPLORE_V2_DIMENSIONS.APPLICATION,
          type: EXPLORE_V2_FILTER_TYPES.IN,
          values: ['latency-cards'], // SWRV cache busting
        }]),
      },
    })

    cy.get('@fetcher').should('have.been.calledTwice')

    cy.get('#global').within(() => {
      cy.get('.metricscard').should('exist')
      cy.get('.error-display').should('not.exist')

      cy.getTestId('metric-value').eq(0).should('have.text', '5K')
      cy.getTestId('metric-value').eq(1).should('have.text', '40.00%')
      cy.get('.metricscard').eq(2).children('.metricscard-error').should('exist')
    })
  })

  it('handles errors in traffic query', () => {
    const dataFetcher = makeDataFetcher({ injectErrors: 'traffic' })

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        dataFetcher,
        hasTrendAccess: true,
        additionalFilter: ref([{
          dimension: EXPLORE_V2_DIMENSIONS.APPLICATION,
          type: EXPLORE_V2_FILTER_TYPES.IN,
          values: ['traffic-cards'], // SWRV cache busting
        }]),
      },
    })

    cy.get('@fetcher').should('have.been.calledTwice')

    cy.get('#global').within(() => {
      cy.get('.metricscard').should('exist')
      cy.get('.error-display').should('not.exist')

      cy.get('.metricscard').eq(0).children('.metricscard-error').should('exist')
      cy.get('.metricscard').eq(1).children('.metricscard-error').should('exist')
      cy.getTestId('metric-value').eq(0).should('have.text', '1001ms')
    })
  })
})