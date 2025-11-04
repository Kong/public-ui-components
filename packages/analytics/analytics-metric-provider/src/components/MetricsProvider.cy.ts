import MetricsTestHarness from './MetricsTestHarness.vue'
import { ref } from 'vue'
import type {
  AdvancedDatasourceQuery,
  AnalyticsBridge,
  AnalyticsConfigV2,
  DatasourceAwareQuery,
  ExploreFilterAll,
  ExploreResultV4,
  TimeRangeV4,
} from '@kong-ui-public/analytics-utilities'
import type { MockOptions } from '../mockExploreResponse'
import { mockExploreResponse } from '../mockExploreResponse'
import { INJECT_QUERY_PROVIDER } from '../constants'
import { createPinia, setActivePinia } from 'pinia'


const custom1DayTimeRange: TimeRangeV4 = {
  type: 'absolute',
  start: new Date('2023-01-01T00:00:00Z'),
  end: new Date('2023-01-02T00:00:00Z'),
}

const custom10MinuteTimeRange: TimeRangeV4 = {
  type: 'absolute',
  start: new Date('2023-01-01T00:00:00Z'),
  end: new Date('2023-01-01T00:10:00Z'),

}
const custom1hourTimeRange: TimeRangeV4 = {
  type: 'absolute',
  start: new Date('2023-01-01T00:00:00Z'),
  end: new Date('2023-01-01T01:00:00Z'),
}

describe('<AnalyticsMetricProvider />', () => {

  // General note when working on these tests: SWRV tends to cache the results of queries between tests.
  // This is fine, but if you're checking for whether the fetcher was called with certain arguments, it
  // can result in the order of the tests mattering.  To help avoid this issue, each test that cares about matchers
  // should set a unique filter; this results in a different cache key.

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const makeQueryBridge = (opts?: MockOptions): AnalyticsBridge => {
    const queryFn = (dsAwareQuery: DatasourceAwareQuery): Promise<ExploreResultV4> => {
      const { query } = dsAwareQuery as AdvancedDatasourceQuery

      if (opts?.injectErrors) {

        if (
          (opts.injectErrors === 'traffic' && query.metrics?.includes('request_count')) ||
          (opts.injectErrors === 'latency' && (
            query.metrics?.includes('response_latency_p99') ||
            query.metrics?.includes('response_latency_average'))) ||
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

    const configFn = (): Promise<AnalyticsConfigV2> => Promise.resolve({
      analytics: {
        percentiles: true,
        retention_ms: 2592000000, // 30d
      },
      requests: {
        retention_ms: 86400000,
      },
    })

    const evaluateFeatureFlagFn: AnalyticsBridge['evaluateFeatureFlagFn'] = () => (true) as any

    return {
      queryFn: cy.spy(queryFn).as('fetcher'),
      configFn,
      evaluateFeatureFlagFn,
    }
  }

  it('renders an error if no query bridge is provided', () => {
    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        additionalFilter: [{ operator: 'in', field: 'api_product', value: ['renders an error if no query bridge is provided'] } as ExploreFilterAll],
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
        // This test is the only one that shouldn't have filters; it ensures no extraneous filters are added.
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
      },
    })

    cy.get('@fetcher').should('have.been.calledTwice')

    // Ensure the filter is undefined.
    cy.get('@fetcher').should('always.have.not.been.calledWithMatch', Cypress.sinon.match.hasNested('query.filters'))

    // Ensure timezone is included.
    cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match.hasNested('query.time_range.tz'))

    // Datasource should be basic.
    cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match({
      datasource: 'basic',
    }))

    cy.get('.metricscard').should('exist')

    cy.get('.metricscard-title').eq(0).should('have.text', 'Requests')
    cy.get('.metricscard-title').eq(1).should('have.text', 'Error rate')
    cy.get('.metricscard-title').eq(2).should('have.text', 'Average latency')

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
    cy.get('.metricscard-title').eq(0).should('have.text', 'Number of requests')
    cy.get('.metricscard-title').eq(1).should('have.text', 'Average error rate')
    cy.get('.metricscard-title').eq(2).should('have.text', 'Average latency')
  })

  it('renders percentiles if the override is set', () => {
    const queryBridge = makeQueryBridge()

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        longCardTitles: true,
        percentileLatency: true,
        additionalFilter: [{ operator: 'in', field: 'api_product', value: ['renders percentiles if the override is set'] } as ExploreFilterAll],
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
      },
    })

    cy.get('@fetcher').should('have.been.calledTwice')

    cy.get('@fetcher').should('have.been.calledWithMatch', Cypress.sinon.match({ query: { metrics: ['response_latency_p99'] } }))
    cy.get('@fetcher').should('always.have.not.been.calledWithMatch', Cypress.sinon.match({ query: { metrics: ['response_latency_average'] } }))

    cy.get('.metricscard').should('exist')
    cy.get('.metricscard-title').eq(0).should('have.text', 'Number of requests')
    cy.get('.metricscard-title').eq(1).should('have.text', 'Average error rate')
    cy.get('.metricscard-title').eq(2).should('have.text', 'P99 latency')
  })

  it('displays a container description if provided', () => {
    const queryBridge = makeQueryBridge()

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        containerTitle: 'Analytics',
        description: 'Lorem ipsum golden signal details',
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
      },
    })

    cy.get('.metricscard').should('exist')
    cy.get('.container-description').eq(0).should('contain', 'Lorem ipsum golden signal details')
  })

  it('displays "7 days" by default', () => {
    const queryBridge = makeQueryBridge()

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        description: 'Lorem ipsum golden signal details',
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
      },
    })

    cy.get('.metricscard').should('exist')
    cy.get('.metricscard').eq(0).find('.metricscard-trend-range').should('contain', 'vs previous 7 days')
  })

  it('handles queryReady', () => {
    const queryBridge = makeQueryBridge({ hasTrendAccess: false })

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        queryReady: false,
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
      cy.wrap(Cypress.vueWrapper.setProps({ queryReady: true })).then(() => {
        cy.get('.loading-tabs').should('not.exist')

        // Note: I'd like to assert that the fetcher was called, but this seems to cause Cypress
        // to flake with an error about promises and the use of `cy.log` in the fetcher.
        cy.get('.metricscard').should('exist')

        cy.getTestId('metric-value').eq(0).should('have.text', '5K')
      })
    })
  })

  it('displays filtered metrics', () => {
    const queryBridge = makeQueryBridge()

    const additionalFilter = ref([{
      field: 'application',
      operator: 'in',
      value: ['app1'],
    }])

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        datasource: 'api_usage',
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
      query: {
        filters: [{
          field: 'application',
          operator: 'in',
          value: ['app1'],
        }],
      },
    }))

    cy.get('.metricscard').should('exist')

    cy.getTestId('metric-value').eq(0).should('have.text', '5K')
    cy.getTestId('metric-value').eq(1).should('have.text', '40.00%')
    cy.getTestId('metric-value').eq(2).should('have.text', '1001ms')

    cy.get('.metricscard-trend-change > div').eq(0).should('have.text', '49.98%')
    cy.get('.metricscard-trend-change > div').eq(1).should('have.text', '0.00%')
    cy.get('.metricscard-trend-change > div').eq(2).should('have.text', '49.98%').then(() => {
      additionalFilter.value = [{
        field: 'api_product',
        operator: 'in',
        value: ['product1'],
      }]

      cy.get('@fetcher').should('have.been.calledWithMatch', Cypress.sinon.match({
        query: {
          filters: [{
            field: 'api_product',
            operator: 'in',
            value: ['product1'],
          }],
        } }))
    })
  })

  it('displays single-entity metrics', () => {
    const queryBridge = makeQueryBridge({ dimensionNames: ['blah'] })

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'single',
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
      },
    })

    cy.get('@fetcher').should('have.been.calledTwice')
    cy.get('@fetcher').should('always.have.been.calledWithMatch', Cypress.sinon.match({ query:
        {
          filters: [{
            field: 'route',
            operator: 'in',
            value: ['blah'],
          }],
        } }))

    cy.get('.metricscard').should('exist')

    cy.getTestId('metric-value').eq(0).should('have.text', '5K')
    cy.getTestId('metric-value').eq(1).should('have.text', '40.00%')
    cy.getTestId('metric-value').eq(2).should('have.text', '1001ms')

    cy.get('.metricscard-trend-change > div').eq(0).should('have.text', '49.98%')
    cy.get('.metricscard-trend-change > div').eq(1).should('have.text', '0.00%')

    // Latency trend: 1001/2001−1 = −0.499750125
    cy.get('.metricscard-trend-change > div').eq(2).should('have.text', '49.98%')
  })

  it('displays multi-entity metrics', () => {
    const queryBridge = makeQueryBridge({ dimensionNames: ['blah', 'arrgh'] })

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'multi',
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
        additionalFilter: ref([{
          field: 'api_product',
          operator: 'in',
          value: ['all-cards'], // SWRV cache busting
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
        additionalFilter: ref([{
          field: 'api_product',
          operator: 'in',
          value: ['latency-cards'], // SWRV cache busting
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
        additionalFilter: ref([{
          field: 'api_product',
          operator: 'in',
          value: ['traffic-cards'], // SWRV cache busting
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

  it('1 day custom time frame', () => {
    const queryBridge = makeQueryBridge({
      timeRange: custom1DayTimeRange,
    })

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        overrideTimeRange: custom1DayTimeRange,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
      },
    })

    cy.get('.metricscard-trend-range').first().should('contain', 'vs previous day')
  })

  it('1 hour custom time frame', () => {
    const queryBridge = makeQueryBridge({
      timeRange: custom1hourTimeRange,
    })

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        overrideTimeRange: custom1hourTimeRange,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
      },
    })

    cy.get('.metricscard-trend-range').first().should('contain', 'vs previous hour')
  })

  it('10 min custom time frame', () => {
    const queryBridge = makeQueryBridge({
      timeRange: custom10MinuteTimeRange,
    })

    cy.mount(MetricsTestHarness, {
      props: {
        render: 'global',
        overrideTimeRange: custom10MinuteTimeRange,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: queryBridge,
        },
      },
    })

    cy.get('.metricscard-trend-range').first().should('contain', 'vs previous 10 minutes')
  })
})
