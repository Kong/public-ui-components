import MetricsTestHarness from './MetricsTestHarness.vue'
import { ref } from 'vue'
import type { AnalyticsBridge, ExploreQuery, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { MockOptions } from '../mockExploreResponse'
import { mockExploreResponse } from '../mockExploreResponse'
import { INJECT_QUERY_PROVIDER } from '../constants'

describe('<AnalyticsMetricProvider />', () => {

  const makeQueryBridge = (opts?: MockOptions): AnalyticsBridge => {
    const queryFn = (query: ExploreQuery): Promise<ExploreResultV4> => {
      if (opts?.injectErrors) {

        if (
          (opts.injectErrors === 'traffic' && query.metrics?.includes('request_count')) ||
          (opts.injectErrors === 'latency' && query.metrics?.includes('response_latency_p99')) ||
          opts.injectErrors === 'all'
        ) {
          // If injectErrors is latency or traffic, fail that specific query.
          // If it's all, let no query succeed.

          // See notes below about enabling this.
          // cy.log('Generated error response:', errorResponse, 'given query', query)

          return Promise.reject(new Error('blah'))
        }
      }
      const result = mockExploreResponse(query, opts)

      // Note: it can be very helpful to log the generated response while developing
      // tests.  However, doing so can sometimes cause Cypress flakiness -- something to do
      // with the order in which promises resolve.  To avoid the flakiness, this log call is
      // not enabled by default, but left here for reference:
      // cy.log('Generated explore response:', result, 'given query', query)

      return Promise.resolve(result)
    }

    return {
      queryFn: cy.spy(queryFn).as('fetcher'),
    }
  }

  it('renders an error if no query bridge is provided', () => {
    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        hasTrendAccess: true,
      },
    })

    cy.get('#global').within(() => {
      cy.get('.error-display').should('exist')
      cy.get('.metricscard').should('not.exist')
    })
  })

  it('displays global metrics', () => {
    const queryBridge = makeQueryBridge()

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        hasTrendAccess: true,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
      },
    })

    cy.get('@fetcher').should('have.been.calledTwice')

    // Ensure the filter is undefined.
    cy.get('@fetcher').should('always.have.not.been.calledWithMatch', Cypress.sinon.match.has('filter'))

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
    const queryBridge = makeQueryBridge()

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        hasTrendAccess: true,
        longCardTitles: true,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
      },
    })

    cy.get('@fetcher').should('have.been.calledTwice')

    cy.get('.metricscard').should('exist')
    cy.get('.metricscard-title').eq(0).should('have.text', 'Number of Requests')
    cy.get('.metricscard-title').eq(1).should('have.text', 'Average Error Rate')
    cy.get('.metricscard-title').eq(2).should('have.text', 'P99 Latency')
  })

  it('displays a card description if provided', () => {
    const queryBridge = makeQueryBridge()

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        hasTrendAccess: true,
        description: 'Lorem ipsum golden signal details',
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
      },
    })

    cy.get('.metricscard').should('exist')
    cy.get('.metricscard-description').eq(0).should('exist')
  })

  it('displays "30 days" if trend access allows', () => {
    const queryBridge = makeQueryBridge()

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        hasTrendAccess: true,
        description: 'Lorem ipsum golden signal details',
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
      },
    })

    cy.get('.metricscard').should('exist')
    cy.get('.metricscard').eq(0).find('.metricscard-trend-range').should('contain', 'vs previous 30 days')
  })

  it('displays "24 hours" if trend access allows', () => {
    const queryBridge = makeQueryBridge()

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        hasTrendAccess: false,
        description: 'Lorem ipsum golden signal details',
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
      },
    })

    cy.get('.metricscard').should('exist')
    cy.get('.metricscard').eq(0).find('.metricscard-trend-range').should('contain', 'vs previous 24 hours')
  })

  it('handles no trend', () => {
    const queryBridge = makeQueryBridge()

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        hasTrendAccess: false,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
      },
    })

    cy.get('.metricscard').should('exist')

    cy.getTestId('metric-value').eq(0).should('have.text', '5K')
    cy.getTestId('metric-value').eq(1).should('have.text', '40.00%')
    cy.getTestId('metric-value').eq(2).should('have.text', '1001ms')

    cy.get('.metricscard-trend-change > div').eq(0).should('have.text', 'N/A')
    cy.get('.metricscard-trend-change > div').eq(1).should('have.text', 'N/A')
    cy.get('.metricscard-trend-change > div').eq(2).should('have.text', 'N/A')
  })

  it('handles queryReady', () => {
    const queryBridge = makeQueryBridge()
    const queryReady = ref(false)

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        hasTrendAccess: false,
        queryReady,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
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
    const queryBridge = makeQueryBridge()

    const additionalFilter = ref([{
      dimension: 'application',
      type: 'in',
      values: ['app1'],
    }])

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        hasTrendAccess: true,
        additionalFilter,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
      },
    })

    cy.get('@fetcher').should('have.been.calledTwice')
    cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match({
      filter: [{
        dimension: 'application',
        type: 'in',
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
        dimension: 'api_product',
        type: 'in',
        values: ['product1'],
      }]

      cy.get('@fetcher').should('have.been.calledWithMatch', Cypress.sinon.match({
        filter: [{
          dimension: 'api_product',
          type: 'in',
          values: ['product1'],
        }],
      }))
    })
  })

  it('displays single-entity metrics', () => {
    const queryBridge = makeQueryBridge({ dimensionNames: ['blah'] })

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'single',
        hasTrendAccess: true,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
      },
    })

    cy.get('@fetcher').should('have.been.calledTwice')
    cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match({
      filter: [{
        dimension: 'route',
        type: 'in',
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
    const queryBridge = makeQueryBridge({ dimensionNames: ['blah'] })

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'single',
        hasTrendAccess: false,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
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
    const queryBridge = makeQueryBridge({ dimensionNames: ['blah', 'arrgh'] })

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'multi',
        hasTrendAccess: true,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
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
    const queryBridge = makeQueryBridge({ dimensionNames: ['blah'] })

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'latencyCard',
        hasTrendAccess: true,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
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
    const queryBridge = makeQueryBridge({ injectErrors: 'all' })

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        hasTrendAccess: true,
        additionalFilter: ref([{
          dimension: 'application',
          type: 'in',
          values: ['all-cards'], // SWRV cache busting
        }]),
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
      },
    })

    cy.get('@fetcher').should('have.been.calledTwice')

    cy.get('#global').within(() => {
      cy.get('.error-display').should('exist')
      cy.get('.metricscard').should('not.exist')
    })
  })

  it('handles errors in latency query', () => {
    const queryBridge = makeQueryBridge({ injectErrors: 'latency' })

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        hasTrendAccess: true,
        additionalFilter: ref([{
          dimension: 'application',
          type: 'in',
          values: ['latency-cards'], // SWRV cache busting
        }]),
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
      },
    })

    cy.get('@fetcher').should('have.been.calledTwice')

    cy.get('#global').within(() => {
      cy.get('.metricscard').should('exist')
      cy.get('.error-display').should('not.exist')

      cy.getTestId('metric-value').eq(0).should('have.text', '5K')
      cy.getTestId('metric-value').eq(1).should('have.text', '40.00%')
      cy.get('.metricscard').eq(2).get('.metricscard-error').should('exist')
    })
  })

  it('handles errors in traffic query', () => {
    const queryBridge = makeQueryBridge({ injectErrors: 'traffic' })

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        hasTrendAccess: true,
        additionalFilter: ref([{
          dimension: 'application',
          type: 'in',
          values: ['traffic-cards'], // SWRV cache busting
        }]),
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
      },
    })

    cy.get('@fetcher').should('have.been.calledTwice')

    cy.get('#global').within(() => {
      cy.get('.metricscard').should('exist')
      cy.get('.error-display').should('not.exist')

      cy.get('.metricscard').eq(0).get('.metricscard-error').should('exist')
      cy.get('.metricscard').eq(1).get('.metricscard-error').should('exist')
      cy.getTestId('metric-value').eq(0).should('have.text', '1001ms')
    })
  })
})
