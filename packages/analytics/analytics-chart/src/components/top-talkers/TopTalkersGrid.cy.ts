import type { AllAggregations, ExploreResultV4, MetricUnit } from '@kong-ui-public/analytics-utilities'

import TopTalkersGrid from './TopTalkersGrid.vue'
import { OTHER_DIMENSION_ID } from '../../constants'

const makeResult = (dimension: string, rows: Array<[string, number, number?]>): ExploreResultV4 => ({
  data: rows.map(([id, requests, errorRate]) => ({
    timestamp: '2026-09-21T00:00:00.000Z',
    event: {
      [dimension]: id,
      ai_request_count: requests,
      error_rate: errorRate ?? null,
    },
  })),
  meta: {
    start: '2026-09-20T00:00:00.000Z',
    end: '2026-09-21T00:00:00.000Z',
    granularity_ms: 86400000,
    query_id: 'test',
    metric_names: ['ai_request_count', 'error_rate'] as AllAggregations[],
    metric_units: { ai_request_count: 'count', error_rate: '%' } as MetricUnit,
    display: {
      [dimension]: Object.fromEntries(rows.map(([id]) => [id, { name: id === OTHER_DIMENSION_ID ? 'Others' : `${id} name` }])),
    },
  },
})

const MODELS = makeResult('llm_model', [
  ['claude-sonnet-4', 2160, 2.1],
  ['gpt-4o-mini', 1983, 1.4],
  [OTHER_DIMENSION_ID, 4268],
])

const PROVIDERS = makeResult('llm_provider', [
  ['Anthropic', 3639, 1.6],
  ['OpenAI', 1975, 2.2],
])

const columns = [
  { dimension: 'llm_model', label: 'Models', data: MODELS },
  { dimension: 'llm_provider', label: 'Providers', data: PROVIDERS },
]

describe('<TopTalkersGrid />', () => {
  it('renders one column per dimension with its heading and total', () => {
    cy.mount(TopTalkersGrid, {
      props: { columns, sizeMetric: 'ai_request_count', title: 'Top 5 consumers by request' },
    })

    cy.get('[data-testid="top-talkers-card-title"]').should('contain.text', 'Top 5 consumers by request')
    cy.get('[data-testid="top-talkers-column"]').should('have.length', 2)
    cy.get('[data-testid="top-talkers-column"]').eq(0).within(() => {
      cy.get('[data-testid="top-talkers-column-label"]').should('have.text', 'Models')
      cy.get('[data-testid="top-talkers-column-total"]').should('contain.text', '8,411')
    })
  })

  it('sizes blocks by share and labels them with value and percentage', () => {
    cy.mount(TopTalkersGrid, { props: { columns, sizeMetric: 'ai_request_count' } })

    cy.get('[data-testid="top-talkers-column"]').eq(0).within(() => {
      // 2160 / 8411. The grow factor sits on the KPop wrapper, which is what the
      // column lays out; the block itself just fills the height it's given.
      cy.get('.top-talkers-cell-wrapper').eq(0).should('have.css', 'flex-grow', '0.256807')
      cy.get('[data-testid="top-talkers-cell-value"]').eq(0).should('have.text', '2,160')
      cy.get('[data-testid="top-talkers-cell-relative"]').eq(0).should('have.text', '(25.68%)')
    })
  })

  it('marks the `empty` and OTHER buckets', () => {
    cy.mount(TopTalkersGrid, {
      props: {
        columns: [{ dimension: 'llm_model', label: 'Models', data: makeResult('llm_model', [['gpt-4o', 100], ['empty', 40], [OTHER_DIMENSION_ID, 20]]) }],
        sizeMetric: 'ai_request_count',
      },
    })

    cy.get('[data-testid="top-talkers-cell"]').eq(1).should('have.class', 'top-talkers-cell--empty')
    cy.get('[data-testid="top-talkers-cell"]').last().should('have.class', 'top-talkers-cell--other')
  })

  it('shows the non-sizing metrics in a tooltip on hover', () => {
    cy.mount(TopTalkersGrid, {
      props: {
        columns,
        sizeMetric: 'ai_request_count',
        columnOptions: { error_rate: { label: 'Error rate' } },
      },
    })

    cy.get('[data-testid="top-talkers-cell"]').eq(0).trigger('mouseenter')
    cy.get('[data-testid="top-talkers-tooltip"]').should('be.visible')
    cy.get('[data-testid="top-talkers-tooltip"]').should('contain.text', 'Error rate')
    cy.get('[data-testid="top-talkers-tooltip"]').should('contain.text', '2.1%')
    // The size metric stays on the block itself rather than repeating in the tooltip.
    cy.get('[data-testid="top-talkers-tooltip"]').should('not.contain.text', 'Requests')
  })

  it('shows a no-data box in a column whose query returned no rows', () => {
    const emptyResult = makeResult('llm_provider', [])
    emptyResult.meta.display = {}

    cy.mount(TopTalkersGrid, {
      props: {
        columns: [columns[0], { dimension: 'llm_provider', label: 'Providers', data: emptyResult }],
        sizeMetric: 'ai_request_count',
      },
    })

    cy.get('[data-testid="top-talkers-column"]').eq(0).find('[data-testid="top-talkers-column-empty"]').should('not.exist')
    cy.get('[data-testid="top-talkers-column"]').eq(1).within(() => {
      cy.get('[data-testid="top-talkers-column-empty"]').should('have.text', 'No data to display')
      cy.get('[data-testid="top-talkers-column-total"]').should('not.exist')
    })
  })

  it('renders columns that share a dimension, e.g. with different per-column filters', () => {
    const sharedColumns = [
      { dimension: 'llm_model', label: 'OpenAI models', data: makeResult('llm_model', [['gpt-4o-mini', 1983]]) },
      { dimension: 'llm_model', label: 'Anthropic models', data: makeResult('llm_model', [['claude-sonnet-4', 2160]]) },
      columns[1],
    ]
    const labels = () => cy.get('[data-testid="top-talkers-column-label"]').then(($els) => [...$els].map((el) => el.textContent))

    cy.mount(TopTalkersGrid, {
      props: { columns: sharedColumns, sizeMetric: 'ai_request_count' },
    }).then(({ wrapper }) => {
      labels().should('deep.equal', ['OpenAI models', 'Anthropic models', 'Providers'])

      // Keyed by dimension alone, a reorder like this one duplicated a column.
      cy.then(() => wrapper.setProps({ columns: [...sharedColumns].reverse() }))
      labels().should('deep.equal', ['Providers', 'Anthropic models', 'OpenAI models'])
    })
  })

  it('shows the empty state when no column has data', () => {
    cy.mount(TopTalkersGrid, {
      props: { columns: [{ dimension: 'llm_model', label: 'Models' }], sizeMetric: 'ai_request_count' },
    })

    cy.get('[data-testid="top-talkers-empty-state"]').should('be.visible')
  })

  it('shows the error state when an error message is passed', () => {
    cy.mount(TopTalkersGrid, {
      props: { columns, errorMessage: 'Query failed' },
    })

    cy.get('[data-testid="top-talkers-error-state"]').should('contain.text', 'Query failed')
    cy.get('[data-testid="top-talkers-grid"]').should('not.exist')
  })
})
