import TopNTable from './TopNTable.vue'

const ROUTE_ID = 'b486fb30-e058-4b5f-85c2-495ec26ba522:09ba7bc7-58d6-42d5-b9c0-3ffb28b307e6'
const ROUTE_NAME = 'GetMeAKongDefault (secondaryRuntime)'
const DELETED_NAME = 'No longer extant entity'
const SERVICE_ID = 'service-1'
const SERVICE_NAME = 'Gateway Service 1'
const CONSUMER_ID = 'consumer-1'
const CONSUMER_NAME = 'Consumer 1'

const ROUTE_DISPLAY_V2 = {
  [ROUTE_ID]: {
    name: ROUTE_NAME,
    deleted: false,
  },
  'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:2a3e9d21-804b-4b3b-ab7e-c6f002dadbf4': {
    name: DELETED_NAME,
    deleted: true,
  },
  'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:8b1db7eb-5c3c-489c-9344-eb0b272019ca': {
    name: '8b1db (default)',
    deleted: false,
  },
  'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:8f3f6808-a723-4793-8444-f2046961226b': {
    name: 'dp-mock-us-dev (default)',
    deleted: false,
  },
  'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:b4cd1c10-d77f-41b0-a84d-31fc0d99f0d9': {
    name: 'GetMeASongRoute (default)',
    deleted: false,
  },
}

const SERVICE_DISPLAY = {
  [SERVICE_ID]: {
    name: SERVICE_NAME,
    deleted: false,
  },
  'service-2': {
    name: 'Gateway Service 2',
    deleted: false,
  },
}

const CONSUMER_DISPLAY = {
  [CONSUMER_ID]: {
    name: CONSUMER_NAME,
    deleted: false,
  },
  'consumer-2': {
    name: 'Consumer 2',
    deleted: false,
  },
}

const TABLE_RECORDS = [
  {
    event: {
      REQUEST_COUNT: 9483,
      ROUTE: ROUTE_ID,
    },
    timestamp: '2023-08-17T17:55:53.000Z',
  },
  {
    event: {
      REQUEST_COUNT: 5587,
      ROUTE: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:b4cd1c10-d77f-41b0-a84d-31fc0d99f0d9',
    },
    timestamp: '2023-08-17T17:55:53.000Z',
  },
  {
    event: {
      REQUEST_COUNT: 5583,
      ROUTE: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:8b1db7eb-5c3c-489c-9344-eb0b272019ca',
    },
    timestamp: '2023-08-17T17:55:53.000Z',
  },
  {
    event: {
      REQUEST_COUNT: 1485,
      ROUTE: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:8f3f6808-a723-4793-8444-f2046961226b',
    },
    timestamp: '2023-08-17T17:55:53.000Z',
  },
  {
    event: {
      REQUEST_COUNT: 309,
      ROUTE: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:2a3e9d21-804b-4b3b-ab7e-c6f002dadbf4',
    },
    timestamp: '2023-08-17T17:55:53.000Z',
  },
]

const MULTI_METRIC_TABLE_RECORDS = TABLE_RECORDS.map((entry, index) => {
  return {
    ...entry,
    event: {
      ...entry.event,
      '4XX': index + 1,
      '5XX': index,
      response_latency_average: index + 100,
    },
  }
})

const TABLE_DATA_V2 = {
  meta: {
    display: {
      ROUTE: ROUTE_DISPLAY_V2,
    },
    end: '2023-08-17T18:00:53.000Z',
    granularity_ms: 300000,
    limit: 50,
    metric_names: [
      'REQUEST_COUNT',
    ],
    metric_units: {
      REQUEST_COUNT: 'count',
    },
    query_id: '4cc77ce4-6458-49f0-8a7e-443a4312dacd',
    start: '2023-08-17T17:55:53.000Z',
    truncated: false,
  },
  data: TABLE_RECORDS,
}

const MULTI_METRIC_TABLE_DATA = {
  meta: {
    display: {
      ROUTE: ROUTE_DISPLAY_V2,
    },
    end: '2023-08-17T18:00:53.000Z',
    granularity_ms: 300000,
    limit: 50,
    metric_names: [
      'REQUEST_COUNT',
      '4XX',
      '5XX',
      'response_latency_average',
    ],
    metric_units: {
      REQUEST_COUNT: 'count',
      '4XX': 'count',
      '5XX': 'count',
      response_latency_average: 'ms',
    },
    query_id: '5be9e04d-b62d-4e52-80ba-0e3a961380fa',
    start: '2023-08-17T17:55:53.000Z',
    truncated: false,
  },
  data: MULTI_METRIC_TABLE_RECORDS,
}

const MULTI_DIMENSION_TABLE_DATA = {
  meta: {
    display: {
      ROUTE: ROUTE_DISPLAY_V2,
      GATEWAY_SERVICE: SERVICE_DISPLAY,
    },
    end: '2023-08-17T18:00:53.000Z',
    granularity_ms: 300000,
    limit: 50,
    metric_names: [
      'REQUEST_COUNT',
    ],
    metric_units: {
      REQUEST_COUNT: 'count',
    },
    query_id: 'ef7602a5-43c4-457a-921c-576f9bf716d5',
    start: '2023-08-17T17:55:53.000Z',
    truncated: false,
  },
  data: [
    {
      event: {
        REQUEST_COUNT: 9483,
        ROUTE: ROUTE_ID,
        GATEWAY_SERVICE: SERVICE_ID,
      },
      timestamp: '2023-08-17T17:55:53.000Z',
    },
    {
      event: {
        REQUEST_COUNT: 5587,
        ROUTE: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:b4cd1c10-d77f-41b0-a84d-31fc0d99f0d9',
        GATEWAY_SERVICE: 'service-2',
      },
      timestamp: '2023-08-17T17:55:53.000Z',
    },
  ],
}

const THREE_DIMENSION_TABLE_DATA = {
  meta: {
    ...MULTI_DIMENSION_TABLE_DATA.meta,
    display: {
      ROUTE: ROUTE_DISPLAY_V2,
      GATEWAY_SERVICE: SERVICE_DISPLAY,
      consumer: CONSUMER_DISPLAY,
    },
  },
  data: MULTI_DIMENSION_TABLE_DATA.data.map((entry, index) => {
    return {
      ...entry,
      event: {
        ...entry.event,
        consumer: index === 0 ? CONSUMER_ID : 'consumer-2',
      },
    }
  }),
}

const EMPTY_ROUTE_DISPLAY = {
  ...ROUTE_DISPLAY_V2,
  empty: {
    name: 'empty',
    deleted: false,
  },
}

const EMPTY_ROW_TABLE_DATA = {
  ...TABLE_DATA_V2,
  meta: {
    ...TABLE_DATA_V2.meta,
    display: {
      ROUTE: EMPTY_ROUTE_DISPLAY,
    },
  },
  data: [
    {
      event: {
        REQUEST_COUNT: 9483,
        ROUTE: ROUTE_ID,
      },
      timestamp: '2023-08-17T17:55:53.000Z',
    },
    {
      event: {
        REQUEST_COUNT: 9001,
        ROUTE: 'empty',
      },
      timestamp: '2023-08-17T17:55:53.000Z',
    },
  ],
}

const EMPTY_DIMENSION_TABLE_DATA = {
  ...MULTI_DIMENSION_TABLE_DATA,
  meta: {
    ...MULTI_DIMENSION_TABLE_DATA.meta,
    display: {
      ROUTE: ROUTE_DISPLAY_V2,
      GATEWAY_SERVICE: {
        ...SERVICE_DISPLAY,
        empty: {
          name: 'empty',
          deleted: false,
        },
      },
    },
  },
  data: [
    {
      event: {
        REQUEST_COUNT: 9483,
        ROUTE: ROUTE_ID,
        GATEWAY_SERVICE: 'empty',
      },
      timestamp: '2023-08-17T17:55:53.000Z',
    },
  ],
}

const TITLE = 'Top 5 Routes'
const DESCRIPTION = 'Last 30-Day Summary'

describe('<TopNTable />', () => {
  it('correctly renders explore prop data', () => {
    cy.mount(TopNTable, {
      props: {
        data: TABLE_DATA_V2,
        title: TITLE,
        description: DESCRIPTION,
      },
    })

    cy.get('.kong-ui-public-top-n-table').should('be.visible')
    cy.getTestId('top-n-card-title').should('contain.text', TITLE)
    cy.getTestId('top-n-card-description').should('contain.text', DESCRIPTION)
    cy.getTestId('top-n-table').should('be.visible')
    cy.getTestId('top-n-table-header-column').should('have.length', TABLE_DATA_V2.meta.metric_names.length + 1)
    cy.get('tbody tr').should('have.length', TABLE_DATA_V2.data.length)
    cy.get('tbody tr').last().should('contain.text', DELETED_NAME)
  })

  it('displays empty state when no records', () => {
    cy.mount(TopNTable, {
      props: {
        data: {
          meta: {},
          data: [],
        },
        title: TITLE,
        description: DESCRIPTION,
      },
    })

    cy.get('.kong-ui-public-top-n-table').should('be.visible')
    cy.getTestId('top-n-empty-state').should('be.visible')
  })

  it('displays error when invalid response structure passed through `data` prop', () => {
    cy.mount(TopNTable, {
      props: {
        data: {
          meta: {},
          data: TABLE_DATA_V2.data,
        },
        title: TITLE,
        description: DESCRIPTION,
      },
    })

    cy.get('.kong-ui-public-top-n-table').should('be.visible')
    cy.getTestId('top-n-error-state').should('be.visible')
  })

  it('allows slotting column name value', () => {
    const slottedName = `${ROUTE_NAME}-${ROUTE_ID}`

    cy.mount(TopNTable, {
      props: {
        data: TABLE_DATA_V2,
        title: TITLE,
        description: DESCRIPTION,
      },
      slots: {
        name: `<template #name="params">
                {{ params.record.name }}-{{ params.record.id }}
               </template>
        `,
      },
    })

    cy.get('.kong-ui-public-top-n-table').should('be.visible')
    cy.get(`[data-testid="row-${ROUTE_ID}"]`).should('contain', slottedName)
  })

  it('renders deleted items', () => {
    cy.mount(TopNTable, {
      props: {
        data: TABLE_DATA_V2,
        title: TITLE,
        description: DESCRIPTION,
      },
      slots: {
        name: `<template #name="params">
                {{ params.record.name }}-{{ params.record.id }}-{{ params.record.deleted ? 'deleted' : ''}}
               </template>
        `,
      },
    })

    cy.get('.kong-ui-public-top-n-table').should('be.visible')
    cy.get('tbody tr').last().should('contain', 'deleted')
  })

  describe('dimensions', () => {
    it('aligns metric headers and values when no dimensions are selected', () => {
      cy.mount(TopNTable, {
        props: {
          data: {
            meta: {
              ...MULTI_METRIC_TABLE_DATA.meta,
              display: {},
            },
            data: [{
              event: {
                REQUEST_COUNT: 9483,
                '4XX': 1,
                '5XX': 0,
                response_latency_average: 100,
              },
              timestamp: '2023-08-17T17:55:53.000Z',
            }],
          },
        },
      })

      const expectedHeaders = ['Request count', '4xx', '5xx', 'Response latency (avg)']
      const expectedValues = ['9.4K', '1', '0', '100 ms']

      cy.getTestId('top-n-table-header-column').should('have.length', expectedHeaders.length)
      expectedHeaders.forEach((header, index) => {
        cy.getTestId('top-n-table-header-column').eq(index).should('have.text', header)
      })
      cy.get('tbody tr').should('have.length', 1).within(() => {
        cy.get('td').should('have.length', expectedValues.length)
        expectedValues.forEach((value, index) => {
          cy.get('td').eq(index).should(($cell) => {
            expect($cell.text().trim()).to.equal(value)
          })
        })
      })
    })

    it('keeps the name header for single-dimension responses', () => {
      cy.mount(TopNTable, {
        props: {
          data: TABLE_DATA_V2,
          title: TITLE,
          description: DESCRIPTION,
        },
      })

      cy.getTestId('top-n-table-header-column').first().should('contain.text', 'Name')
      cy.getTestId('top-n-table-header-column').first().should('not.have.class', 'top-n-table-header-cell-dimension-compact')
      cy.get('tbody tr').first().within(() => {
        cy.get('td').first().should('contain.text', ROUTE_NAME)
        cy.get('td').first().should('not.have.class', 'top-n-table-cell-dimension-compact')
      })
    })

    it('renders dimension labels as headers when multiple dimensions are present', () => {
      cy.mount(TopNTable, {
        props: {
          data: MULTI_DIMENSION_TABLE_DATA,
          title: TITLE,
          description: DESCRIPTION,
        },
      })

      cy.getTestId('top-n-table-header-column').should('have.length', 3)
      cy.getTestId('top-n-table-header-column').eq(0).should('contain.text', 'Route')
      cy.getTestId('top-n-table-header-column').eq(1).should('contain.text', 'Gateway service')
      cy.getTestId('top-n-table-header-column').eq(2).should('contain.text', 'Request count')
      cy.getTestId('top-n-table-header-column').eq(0).should('have.class', 'top-n-table-header-cell-dimension-compact')
      cy.getTestId('top-n-table-header-column').eq(1).should('not.have.class', 'top-n-table-header-cell-dimension-compact')
    })

    it('renders one cell per dimension before metric cells', () => {
      cy.mount(TopNTable, {
        props: {
          data: MULTI_DIMENSION_TABLE_DATA,
          title: TITLE,
          description: DESCRIPTION,
        },
      })

      cy.get('tbody tr').first().within(() => {
        cy.get('td').should('have.length', 3)
        cy.get('td').eq(0).should('contain.text', ROUTE_NAME)
        cy.get('td').eq(1).should('contain.text', SERVICE_NAME)
        cy.get('td').eq(2).should('contain.text', '9.4K')
        cy.get('td').eq(0).should('have.class', 'top-n-table-cell-dimension-compact')
        cy.get('td').eq(1).should('not.have.class', 'top-n-table-cell-dimension-compact')
      })
    })

    it('provides all dimensions to the name slot payload', () => {
      cy.mount(TopNTable, {
        props: {
          data: MULTI_DIMENSION_TABLE_DATA,
          title: TITLE,
          description: DESCRIPTION,
        },
        slots: {
          name: `<template #name="params">
                  {{ params.record.dimension }}:{{ params.record.dimensions.length }}:{{ params.record.dimensions[1].dimension }}:{{ params.record.dimensions[1].id }}:{{ params.record.dimensions[1].name }}
                 </template>
          `,
        },
      })

      cy.get(`[data-testid="row-${ROUTE_ID}"]`).should('contain', `ROUTE:2:GATEWAY_SERVICE:${SERVICE_ID}:${SERVICE_NAME}`)
    })

    it('uses the name slot for additional dimension cells', () => {
      cy.mount(TopNTable, {
        props: {
          data: MULTI_DIMENSION_TABLE_DATA,
          title: TITLE,
          description: DESCRIPTION,
        },
        slots: {
          name: `<template #name="params">
                  {{ params.record.dimension }}={{ params.record.name }}
                 </template>
          `,
        },
      })

      cy.get('tbody tr').first().within(() => {
        cy.get('td').eq(0).should('contain.text', `ROUTE=${ROUTE_NAME}`)
        cy.get('td').eq(1).should('contain.text', `GATEWAY_SERVICE=${SERVICE_NAME}`)
        cy.get('td').eq(2).should('contain.text', '9.4K')
      })
    })

    it('supports rendering three dimensions before metric cells', () => {
      cy.mount(TopNTable, {
        props: {
          data: THREE_DIMENSION_TABLE_DATA,
          title: TITLE,
          description: DESCRIPTION,
        },
      })

      cy.getTestId('top-n-table-header-column').should('have.length', 4)
      cy.getTestId('top-n-table-header-column').eq(0).should('contain.text', 'Route')
      cy.getTestId('top-n-table-header-column').eq(1).should('contain.text', 'Gateway service')
      cy.getTestId('top-n-table-header-column').eq(2).should('contain.text', 'Consumer')
      cy.getTestId('top-n-table-header-column').eq(3).should('contain.text', 'Request count')
      cy.getTestId('top-n-table-header-column').eq(0).should('have.class', 'top-n-table-header-cell-dimension-compact')
      cy.getTestId('top-n-table-header-column').eq(1).should('have.class', 'top-n-table-header-cell-dimension-compact')
      cy.getTestId('top-n-table-header-column').eq(2).should('not.have.class', 'top-n-table-header-cell-dimension-compact')

      cy.get('tbody tr').first().within(() => {
        cy.get('td').should('have.length', 4)
        cy.get('td').eq(0).should('contain.text', ROUTE_NAME)
        cy.get('td').eq(1).should('contain.text', SERVICE_NAME)
        cy.get('td').eq(2).should('contain.text', CONSUMER_NAME)
        cy.get('td').eq(3).should('contain.text', '9.4K')
        cy.get('td').eq(0).should('have.class', 'top-n-table-cell-dimension-compact')
        cy.get('td').eq(1).should('have.class', 'top-n-table-cell-dimension-compact')
        cy.get('td').eq(2).should('not.have.class', 'top-n-table-cell-dimension-compact')
      })
    })
  })

  describe('formatting', () => {
    const buildTopNData = (opts: {
      metricKey: string
      unit?: string
      value: number
      entityKey?: string
      entityId?: string
    }) => {
      const {
        metricKey,
        unit,
        value,
        entityKey = 'ROUTE',
        entityId = ROUTE_ID,
      } = opts

      const meta: any = {
        display: { [entityKey]: ROUTE_DISPLAY_V2 },
        end: '2023-08-17T18:00:53.000Z',
        granularity_ms: 300000,
        limit: 50,
        metric_names: [metricKey],
        // Only include metric_units when provided; otherwise we test fallback behavior
        ...(unit ? { metric_units: { [metricKey]: unit } } : {}),
        query_id: 'unit-format-test',
        start: '2023-08-17T17:55:53.000Z',
        truncated: false,
      }

      return {
        meta,
        data: [
          {
            event: {
              [entityKey]: entityId,
              [metricKey]: value,
            },
            timestamp: '2023-08-17T17:55:53.000Z',
          },
        ],
      } as any
    }

    const formattingTests = [
      {
        description: 'formats latency in ms without approximation (e.g. 12.345 -> 12.35 ms)',
        metricKey: 'LATENCY_P50',
        unit: 'ms',
        value: 12.345,
        expected: /12\.35\s?ms/,
        additionalCheck: (el: any) => el.should('contain.text', ROUTE_NAME),
      },
      {
        description: 'keeps very small ms precise (0.009 -> 0.009 ms)',
        metricKey: 'LATENCY_P50',
        unit: 'ms',
        value: 0.009,
        expected: /0\.009\s?ms/,
      },
      {
        description: 'approximates counts and pluralizes (e.g. 9,483 -> 9.4K)',
        metricKey: 'REQUEST_COUNT',
        unit: 'count',
        value: 9483,
        expected: /9\.4K\s?/,
      },
      {
        description: 'renders singular for count when value === 1 (e.g. 1 -> 1)',
        metricKey: 'REQUEST_COUNT',
        unit: 'count',
        value: 1,
        expected: /1\s?/,
      },
      {
        description: 'formats count/minute with approximation and translation (rpm)',
        metricKey: 'RPM',
        unit: 'count/minute',
        value: 98_765,
        expected: /98K\s?(rpm|count\/minute)/,
      },
      {
        description: 'formats bytes using binary units (isBytes1024: true -> 1 MB)',
        metricKey: 'BODY_BYTES',
        unit: 'bytes',
        value: 1_048_576,
        expected: /1 MB$/,
      },
      {
        description: 'formats tiny USD values with threshold',
        metricKey: 'COST',
        unit: 'usd',
        value: 0.00005,
        expected: /<\s?\$0\.0001/,
      },
      {
        description: 'formats standard USD values',
        metricKey: 'COST',
        unit: 'usd',
        value: 12.3,
        expected: /\$12\.30/,
      },
    ]

    formattingTests.forEach(({ description, metricKey, unit, value, expected }) => {
      it(description, () => {
        const result = buildTopNData({
          metricKey,
          unit,
          value,
        })

        cy.mount(TopNTable, {
          props: {
            data: result,
            title: TITLE,
            description: DESCRIPTION,
          },
        })

        cy.get(`[data-testid="row-${ROUTE_ID}"]`)
          .should('exist')
          .contains(expected)
      })
    })
  })

  describe('multiple metrics', () => {
    it('renders one column per metric plus the name column', () => {
      cy.mount(TopNTable, {
        props: {
          data: MULTI_METRIC_TABLE_DATA,
          title: TITLE,
          description: DESCRIPTION,
        },
      })

      const expectedColumnCount = MULTI_METRIC_TABLE_DATA.meta.metric_names.length + 1

      cy.get('.kong-ui-public-top-n-table').should('be.visible')
      cy.getTestId('top-n-table-header-column').should('have.length', expectedColumnCount)
      cy.getTestId('top-n-table-header-column').eq(2).should('contain.text', '4xx')
      cy.getTestId('top-n-table-header-column').eq(3).should('contain.text', '5xx')
      cy.getTestId('top-n-table-header-column').eq(4).should('contain.text', 'Response latency (avg)')

      cy.get('tbody tr').first().within(() => {
        cy.get('td').should('have.length', expectedColumnCount)
      })
    })

    it('renders values for additional metrics in their own columns', () => {
      cy.mount(TopNTable, {
        props: {
          data: MULTI_METRIC_TABLE_DATA,
          title: TITLE,
          description: DESCRIPTION,
        },
      })

      cy.get('tbody tr').first().within(() => {
        cy.get('td').eq(2).should('contain.text', '1')
        cy.get('td').eq(3).should('contain.text', '0')
        cy.get('td').eq(4).should('contain.text', '100 ms')
      })
    })
  })

  describe('empty rows', () => {
    it('flags the primary dimension cell as empty for an "empty" id', () => {
      cy.mount(TopNTable, {
        props: {
          data: EMPTY_ROW_TABLE_DATA,
          title: TITLE,
          description: DESCRIPTION,
        },
        slots: {
          name: `<template #name="params">
                  {{ params.record.isEmpty }}
                 </template>
          `,
        },
      })

      cy.get(`[data-testid="row-${ROUTE_ID}"]`).should('contain.text', 'false')
      cy.get('[data-testid="row-empty"]').should('contain.text', 'true')
    })

    it('flags an additional dimension cell as empty for an "empty" id', () => {
      cy.mount(TopNTable, {
        props: {
          data: EMPTY_DIMENSION_TABLE_DATA,
          title: TITLE,
          description: DESCRIPTION,
        },
        slots: {
          name: `<template #name="params">
                  {{ params.record.dimension }}={{ params.record.isEmpty }}
                 </template>
          `,
        },
      })

      cy.get('tbody tr').first().within(() => {
        cy.get('td').eq(0).should('contain.text', 'ROUTE=false')
        cy.get('td').eq(1).should('contain.text', 'GATEWAY_SERVICE=true')
      })
    })
  })

  describe('column options', () => {
    const AI_PROVIDER_TABLE_DATA = {
      meta: {
        display: {
          ai_provider: {
            openai: { name: 'OpenAI', deleted: false },
            anthropic: { name: 'Anthropic', deleted: false },
            'new-provider': { name: 'New provider', deleted: false },
          },
        },
        end: '2024-01-31T20:00:00.000Z',
        granularity_ms: 3600000,
        metric_names: ['cost', 'ai_request_count', 'error_rate'],
        metric_units: { cost: 'usd', ai_request_count: 'count', error_rate: '%' },
        query_id: 'ai-provider-top-n',
        start: '2024-01-31T19:00:00.000Z',
        truncated: false,
      },
      data: [
        ['openai', 60, 500, 20],
        ['anthropic', 30, 300, 10],
        ['new-provider', 10, 200, 5],
      ].map(([aiProvider, cost, requests, errorRate]) => ({
        event: { ai_provider: aiProvider, cost, ai_request_count: requests, error_rate: errorRate },
        timestamp: '2024-01-31T20:00:00.000Z',
      })),
    }

    const mountWithOptions = (columnOptions?: Record<string, unknown>) => {
      cy.mount(TopNTable, {
        props: {
          data: AI_PROVIDER_TABLE_DATA,
          title: TITLE,
          columnOptions,
        },
      })
    }

    const metricCell = (rowIndex: number, colIndex: number) => cy.get('tbody tr').eq(rowIndex).find('td').eq(colIndex)

    it('overrides header labels', () => {
      mountWithOptions({
        ai_provider: { label: 'Provider' },
        cost: { label: 'Share of spend' },
        error_rate: { label: 'Failure rate' },
      })

      cy.getTestId('top-n-table-header-column').eq(0).should('have.text', 'Provider')
      cy.getTestId('top-n-table-header-column').eq(1).should('have.text', 'Share of spend')
      cy.getTestId('top-n-table-header-column').eq(3).should('have.text', 'Failure rate')
    })

    it('displays values relative to the column total', () => {
      mountWithOptions({ cost: { value: 'relative' }, ai_request_count: { value: 'relative' } })

      metricCell(0, 1).find('.top-n-metric-cell-value').should('have.text', '$60.00')
      metricCell(0, 1).find('[data-testid="top-n-metric-cell-relative"]').should('have.text', '(60 %)')
      metricCell(2, 1).find('[data-testid="top-n-metric-cell-relative"]').should('have.text', '(10 %)')
      metricCell(0, 2).find('[data-testid="top-n-metric-cell-relative"]').should('have.text', '(50 %)')
    })

    it('omits the relative value without the relative option', () => {
      mountWithOptions({ cost: { label: 'Cost' } })

      metricCell(0, 1).find('.top-n-metric-cell-value').should('have.text', '$60.00')
      metricCell(0, 1).find('[data-testid="top-n-metric-cell-relative"]').should('not.exist')
    })

    it('clamps tiny relative values at 0.01 %', () => {
      const data = structuredClone(AI_PROVIDER_TABLE_DATA)
      data.data[2].event.cost = 0.001

      cy.mount(TopNTable, { props: { data, columnOptions: { cost: { value: 'relative' } } } })

      metricCell(2, 1).find('[data-testid="top-n-metric-cell-relative"]').should('have.text', '(< 0.01 %)')
    })

    it('clamps tiny percent metrics at 0.01 %', () => {
      const data = structuredClone(AI_PROVIDER_TABLE_DATA)
      data.data[2].event.error_rate = 0.00004
      data.data[1].event.error_rate = 0

      cy.mount(TopNTable, { props: { data } })

      metricCell(2, 3).should('have.text', '< 0.01 %')
      metricCell(1, 3).should('have.text', '0 %')
    })

    it('spans bar column headers across the value and bar cells', () => {
      mountWithOptions({ cost: { bar: 'relative' } })

      cy.getTestId('top-n-table-header-column').eq(1).should('have.attr', 'colspan', '2')
      cy.getTestId('top-n-table-header-column').eq(2).should('not.have.attr', 'colspan')
      metricCell(0, 1).find('.top-n-metric-cell-bar').should('not.exist')
      metricCell(0, 2).find('.top-n-metric-cell-bar').should('exist')
      metricCell(0, 3).should('contain.text', '500')
    })

    it('sizes relative bars against the column total', () => {
      mountWithOptions({ cost: { value: 'relative', bar: 'relative' } })

      cy.get('th[colspan="2"]').should('have.length', 1)
      metricCell(0, 2).find('.top-n-metric-cell-bar-fill').should('have.attr', 'style').and('contain', 'width: 60%')
      metricCell(1, 2).find('.top-n-metric-cell-bar-fill').should('have.attr', 'style').and('contain', 'width: 30%')
    })

    it('fills bars with the datavis palette rather than the theme primary color', () => {
      mountWithOptions({ cost: { bar: 'relative' } })

      metricCell(0, 2).find('.top-n-metric-cell-bar-fill').should('have.css', 'background-color', 'rgb(106, 134, 210)')
    })

    it('sizes max bars against the column maximum', () => {
      mountWithOptions({ error_rate: { bar: 'max' } })

      metricCell(0, 4).find('.top-n-metric-cell-bar-fill').should('have.attr', 'style').and('contain', 'width: 100%')
      metricCell(1, 4).find('.top-n-metric-cell-bar-fill').should('have.attr', 'style').and('contain', 'width: 50%')
      metricCell(2, 4).find('.top-n-metric-cell-bar-fill').should('have.attr', 'style').and('contain', 'width: 25%')
    })

    it('colors the value when a threshold is crossed without a bar', () => {
      mountWithOptions({ error_rate: { thresholds: [{ type: 'warning', value: 10 }, { type: 'error', value: 20 }] } })

      metricCell(0, 3).find('.top-n-metric-cell').should('have.class', 'top-n-metric-cell--text-error')
      metricCell(1, 3).find('.top-n-metric-cell').should('have.class', 'top-n-metric-cell--text-warning')
      metricCell(2, 3).find('.top-n-metric-cell').should('not.have.attr', 'data-threshold')
    })

    it('colors the bar instead of the value when a bar is shown', () => {
      mountWithOptions({ error_rate: { bar: 'max', thresholds: [{ type: 'error', value: 15 }] } })

      metricCell(0, 3).find('.top-n-metric-cell').should('not.have.class', 'top-n-metric-cell--text-error')
      metricCell(0, 4).find('.top-n-metric-cell-bar').should('have.class', 'top-n-metric-cell--bar-error')
      metricCell(0, 4).find('.top-n-metric-cell-bar-fill').should('have.css', 'background-color', 'rgb(214, 0, 39)')
    })

    it('renders ai provider icons for known providers only', () => {
      mountWithOptions({ ai_provider: { icon_set: 'ai_provider' } })

      metricCell(0, 0).find('[data-testid="top-n-table-cell-icon"]').should('exist')
      metricCell(1, 0).find('[data-testid="top-n-table-cell-icon"]').should('exist')
      metricCell(2, 0).find('[data-testid="top-n-table-cell-icon"]').should('not.exist')
      metricCell(2, 0).should('contain.text', 'New provider')
    })

    it('keeps the name slot alongside the icon', () => {
      cy.mount(TopNTable, {
        props: {
          data: AI_PROVIDER_TABLE_DATA,
          columnOptions: { ai_provider: { icon_set: 'ai_provider' } },
        },
        slots: {
          name: '<template #name="params">slotted-{{ params.record.id }}</template>',
        },
      })

      metricCell(0, 0).find('[data-testid="top-n-table-cell-icon"]').should('exist')
      metricCell(0, 0).should('contain.text', 'slotted-openai')
    })

    it('renders plain values without column options', () => {
      mountWithOptions()

      cy.get('.top-n-metric-cell-bar').should('not.exist')
      cy.getTestId('top-n-table-cell-icon').should('not.exist')
      metricCell(0, 1).should('contain.text', '$60.00')
      metricCell(0, 3).should('have.text', '20 %')
    })
  })
})
