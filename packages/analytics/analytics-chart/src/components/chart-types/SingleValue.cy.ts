import SingleValue from './SingleValue.vue'

const buildExploreResult = (previous: number, current: number) => ({
  data: [
    {
      timestamp: '2023-05-30T13:09:00.987Z',
      event: {
        request_per_minute: previous,
      },
    },
    {
      timestamp: '2023-05-30T14:09:00.987Z',
      event: {
        request_per_minute: current,
      },
    },
  ],
  meta: {
    start_ms: 1685452140.987,
    end_ms: 1685473740.987,
    query_id: 'trend-test',
    metric_names: ['request_per_minute'],
    metric_units: {
      request_per_minute: 'count/minute',
    },
    granularity_ms: 3600000,
    truncated: false,
    limit: 10,
  },
})

describe('<SingleValue />', () => {
  it('renders the value from the first bucket when trend is disabled', () => {
    const exploreResult = buildExploreResult(100, 250)

    cy.mount(SingleValue, {
      props: {
        data: exploreResult,
        showTrend: false,
      },
    })

    const expected = parseFloat(
      exploreResult.data[0].event.request_per_minute.toFixed(2),
    )

    cy.getTestId('single-value-chart')
      .should('be.visible')
      .contains(expected)

    cy.getTestId('single-value-trend').should('not.exist')
  })

  it('uses the second bucket as the current value and shows trend when trend is enabled', () => {
    const exploreResult = buildExploreResult(100, 250)

    cy.mount(SingleValue, {
      props: {
        data: exploreResult,
        showTrend: true,
      },
    })

    const expected = parseFloat(
      exploreResult.data[1].event.request_per_minute.toFixed(2),
    )

    cy.getTestId('single-value-chart')
      .should('be.visible')
      .contains(expected)

    cy.getTestId('single-value-trend').should('be.visible')
  })

  it('treats a non-numeric value as empty and shows the error state', () => {
    const exploreResult = buildExploreResult(100, 250)
    // @ts-expect-error - this is intentionally invalid for the test
    exploreResult.data[0].event.request_per_minute = 'not a number'

    cy.mount(SingleValue, {
      props: {
        data: exploreResult,
      },
    })

    cy.getTestId('single-value-chart').should('not.exist')
    cy.getTestId('single-value-error').should('be.visible')
  })

  it('shows the error state when no metric name is provided', () => {
    const exploreResult = buildExploreResult(100, 250)
    exploreResult.meta.metric_names = []

    cy.mount(SingleValue, {
      props: {
        data: exploreResult,
      },
    })

    cy.getTestId('single-value-chart').should('not.exist')
    cy.getTestId('single-value-error').should('be.visible')
  })

  it('maps leftAlign and alignX props to container alignment class', () => {
    const exploreResult = buildExploreResult(100, 250)

    // leftAlign takes precedence
    cy.mount(SingleValue, {
      props: {
        data: exploreResult,
        leftAlign: true,
      },
    })

    cy.getTestId('single-value-parent')
      .should('have.class', 'align-left')

    // alignX is used when leftAlign is false
    cy.mount(SingleValue, {
      props: {
        data: exploreResult,
        leftAlign: false,
        alignX: 'center',
      },
    })

    cy.getTestId('single-value-parent')
      .should('have.class', 'align-center')
  })

  it('applies positive/negative classes based on increaseIsBad', () => {
    const exploreResult = buildExploreResult(100, 250)

    // increase is good (default)
    cy.mount(SingleValue, {
      props: {
        data: exploreResult,
        showTrend: true,
        increaseIsBad: false,
      },
    })

    cy.get('.trend-change').should('have.class', 'positive')

    // increase is bad
    cy.mount(SingleValue, {
      props: {
        data: exploreResult,
        showTrend: true,
        increaseIsBad: true,
      },
    })

    cy.get('.trend-change').should('have.class', 'negative')
  })

  it('renders a non-empty trend range when trend is enabled', () => {
    const exploreResultWithMeta = {
      data: [
        {
          timestamp: '2023-05-30T13:00:00.000Z',
          event: {
            TotalRequests: 100,
          },
        },
        {
          timestamp: '2023-05-31T13:00:00.000Z',
          event: {
            TotalRequests: 200,
          },
        },
      ],
      meta: {
        metric_names: ['TotalRequests'],
        metric_units: {
          TotalRequests: 'count',
        },
        start_ms: new Date('2023-05-30T13:00:00.000Z').getTime(),
        end_ms: new Date('2023-05-31T13:00:00.000Z').getTime(),
        truncated: false,
        limit: 2,
        granularity_ms: 60 * 60 * 1000,
        query_id: 'single-value-trend-range-test',
      },
    }

    cy.mount(SingleValue, {
      props: {
        data: exploreResultWithMeta,
        showTrend: true,
      },
    })

    cy.getTestId('single-value-trend-range')
      .should('exist')
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        expect(text.trim()).to.not.equal('')
        expect(text.trim()).to.equal('vs previous 12 hours')
      })
  })
})
