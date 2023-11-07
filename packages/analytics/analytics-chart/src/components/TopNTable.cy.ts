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
    endMs: 1692295253000,
    granularity: 300000,
    limit: 50,
    metricNames: [
      'REQUEST_COUNT',
    ],
    metricUnits: {
      REQUEST_COUNT: 'count',
    },
    queryId: '4cc77ce4-6458-49f0-8a7e-443a4312dacd',
    startMs: 1692294953000,
    truncated: false,
  },
  records: TABLE_RECORDS,
}
const TITLE = 'Top 5 Routes'
const DESCRIPTION = 'Last 30-Day Summary'

describe('<TopNTable />', () => {
  it('correctly renders explore v3 prop data', () => {
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
    cy.get('.table-row').should('have.length', TABLE_DATA_V2.records.length + 1)
    cy.get('.table-row').last().should('contain.text', DELETED_NAME)
  })

  it('displays empty state when no records', () => {
    cy.mount(TopNTable, {
      props: {
        data: {
          meta: {},
          records: [],
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
          records: TABLE_DATA_V2.records,
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
    cy.get('.table-row').last().should('contain', 'deleted')
  })
})
