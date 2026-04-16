import SingleValue from './SingleValue.vue'

const buildExploreResult = ({
  previous = 10,
  current = 100,
  metricName = 'request_per_minute',
  metricUnit = 'count/minute',
}: {
  previous?: number
  current?: number
  metricName?: string
  metricUnit?: string
} = {}) => ({
  data: [
    {
      timestamp: '2023-05-30T13:09:00.987Z',
      event: {
        [metricName]: previous,
      },
    },
    {
      timestamp: '2023-05-30T14:09:00.987Z',
      event: {
        [metricName]: current,
      },
    },
  ],
  meta: {
    start: '2023-05-30T13:09:00.987Z',
    end: '2023-05-30T19:09:00.987Z',
    query_id: 'trend-test',
    metric_names: [metricName],
    metric_units: {
      [metricName]: metricUnit,
    },
    granularity_ms: 3600000,
    truncated: false,
    limit: 10,
  },
})

describe('<SingleValue />', () => {
  it('renders the value from the first bucket when trend is disabled', () => {
    const exploreResult = buildExploreResult({ previous: 100, current: 250 })

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
    const exploreResult = buildExploreResult({ previous: 100, current: 250 })

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
    const exploreResult = buildExploreResult({ previous: 100, current: 250 })
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
    const exploreResult = buildExploreResult({ previous: 100, current: 250 })
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
    const exploreResult = buildExploreResult({ previous: 100, current: 250 })

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
    const exploreResult = buildExploreResult({ previous: 100, current: 250 })

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

  it('renders value and unit on the same horizontal line', () => {
    const exploreResult = buildExploreResult({ previous: 100, current: 250 })

    cy.mount(SingleValue, {
      props: {
        data: exploreResult,
        showTrend: false,
      },
    })

    const getBaseline = (el: HTMLElement) => {
      const range = document.createRange()
      range.selectNodeContents(el)
      const rects = range.getClientRects()
      return rects[rects.length - 1].bottom
    }

    // Verify value and unit appear horizontally, not stacked vertically
    cy.get('.single-value').then($value => {
      cy.get('.single-value-unit').then($unit => {
        const valueRect = $value[0].getBoundingClientRect()
        const unitRect = $unit[0].getBoundingClientRect()

        const valueBaseline = getBaseline($value[0])
        const unitBaseline = getBaseline($unit[0])

        // Unit should start after the value horizontally, not below it
        expect(unitRect.left).to.be.greaterThan(valueRect.left)

        // Baselines of selections are sometimes as different as 3 pixels. This
        // doesn't mean the text isn't aligned, it just means there are rendering
        // differences depending on the relative font sizes and glyphs used.
        expect(Math.abs(valueBaseline - unitBaseline)).to.be.lessThan(3)
      })
    })
  })

  it('renders expected unit for request_per_minute', () => {
    const exploreResult = buildExploreResult({ metricName: 'request_per_minute', metricUnit: 'count/minute' })
    cy.mount(SingleValue, { props: { data: exploreResult, showTrend: false } })
    cy.get('.single-value-unit').should('have.html', ' &nbsp;rpm')
  })

  it('renders expected unit for _latency_ measures', () => {
    const exploreResult = buildExploreResult({ metricName: 'response_latency_avg', metricUnit: 'ms' })
    cy.mount(SingleValue, { props: { data: exploreResult, showTrend: false } })
    cy.get('.single-value-unit').should('have.html', ' &nbsp;ms')
  })

  it('renders expected unit for error_rate measure', () => {
    const exploreResult = buildExploreResult({ metricName: 'error_rate', metricUnit: '%' })
    cy.mount(SingleValue, { props: { data: exploreResult, showTrend: false } })
    cy.get('.single-value-unit').should('have.html', ' &nbsp;%')
  })

  it('renders no unit when backend returns unexpected result', () => {
    const exploreResult = buildExploreResult({ metricName: 'error_rate', metricUnit: 'percent' })
    cy.mount(SingleValue, { props: { data: exploreResult, showTrend: false } })
    cy.get('.single-value-unit').should('not.exist')
  })

  it('renders no unit when the unit is something unique', () => {
    const exploreResult = buildExploreResult({ metricName: 'foo_bar_baz', metricUnit: 'foo' })
    cy.mount(SingleValue, { props: { data: exploreResult, showTrend: false } })
    cy.get('.single-value-unit').should('not.exist')
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
        start: '2023-05-30T13:00:00.000Z',
        end: '2023-05-31T13:00:00.000Z',
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
