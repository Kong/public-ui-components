import { h } from 'vue'
import TopNTable from './TopNTable.vue'

const ROUTE_ID = 'b486fb30-e058-4b5f-85c2-495ec26ba522:09ba7bc7-58d6-42d5-b9c0-3ffb28b307e6'
const ROUTE_NAME = 'GetMeAKongDefault (secondaryRuntime)'
const DELETED_NAME = 'No longer extant entity'

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

const TABLE_DATA_V2 = {
  meta: {
    display: {
      ROUTE: ROUTE_DISPLAY_V2,
    },
    end_ms: 1692295253000,
    granularity_ms: 300000,
    limit: 50,
    metric_names: [
      'REQUEST_COUNT',
    ],
    metric_units: {
      REQUEST_COUNT: 'count',
    },
    query_id: '4cc77ce4-6458-49f0-8a7e-443a4312dacd',
    start_ms: 1692294953000,
    truncated: false,
  },
  data: TABLE_RECORDS,
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
    cy.get('.table-headers').should('have.length', TABLE_DATA_V2.meta.metric_names.length + 1)
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
        end_ms: 1692295253000,
        granularity_ms: 300000,
        limit: 50,
        metric_names: [metricKey],
        // Only include metric_units when provided; otherwise we test fallback behavior
        ...(unit ? { metric_units: { [metricKey]: unit } } : {}),
        query_id: 'unit-format-test',
        start_ms: 1692294953000,
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
        description: 'approximates counts and pluralizes (e.g. 9,483 -> 9.4K requests)',
        metricKey: 'REQUEST_COUNT',
        unit: 'count',
        value: 9483,
        expected: /9\.4K\s?(requests|count)/,
      },
      {
        description: 'renders singular for count when value === 1 (e.g. 1 -> 1 request)',
        metricKey: 'REQUEST_COUNT',
        unit: 'count',
        value: 1,
        expected: /1\s?(request|count)/,
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
      {
        description: 'falls back to "count" when metric_units is missing',
        metricKey: 'test',
        unit: undefined,
        value: 5587,
        expected: /5\.5K\s?(requests|count)/,
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
})
