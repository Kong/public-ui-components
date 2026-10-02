import 'cypress-real-events'
import { EntityLink } from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'
import type { ExploreResultV4, TopNTableOptions } from '@kong-ui-public/analytics-utilities'
import TopNTableRenderer from './TopNTableRenderer.vue'
import DashboardTile from './DashboardTile.vue'
import { INJECT_QUERY_PROVIDER } from '../constants'
import { setupPiniaTestStore } from '../stores/tests/setupPiniaTestStore'

const result: ExploreResultV4 = {
  data: Array.from({ length: 40 }, (_, index) => ({
    timestamp: '2026-09-21T00:00:00Z',
    event: { gateway_service: `service-${index + 1}`, request_count: 40 - index },
  })),
  meta: {
    start: '', end: '', granularity_ms: 0, query_id: 'topn-grid',
    display: { gateway_service: Object.fromEntries(Array.from({ length: 40 }, (_, index) => [`service-${index + 1}`, { name: `Service ${index + 1}` }])) },
    metric_names: ['request_count'], metric_units: { request_count: 'count' },
  },
}

const defaultChartOptions: TopNTableOptions = {
  type: 'top_n',
  entity_link: 'https://example.com/services/{entity-id}',
  column_options: { request_count: { label: 'Requests', value: 'relative', bar: 'max' } },
}
const longName = `app_${'c0bec4c0-76bd-4908-92c8-ea5f488fd0a1'.repeat(4)}`
const longNameResult: ExploreResultV4 = {
  ...result,
  data: result.data.slice(0, 2),
  meta: { ...result.meta, display: { gateway_service: { 'service-1': { name: 'Short name' }, 'service-2': { name: longName } } } },
}
const viewport = { width: Cypress.config('viewportWidth'), height: Cypress.config('viewportHeight') }

const mountRenderer = ({
  data = result,
  chartOptions = defaultChartOptions,
}: {
  data?: ExploreResultV4
  chartOptions?: TopNTableOptions
} = {}) => {
  const queryFn = cy.stub().as('queryFn').resolves(data)
  const chartData = cy.stub().as('chartData')
  const queryComplete = cy.stub().as('queryComplete')

  return cy.mount(TopNTableRenderer, {
    props: {
      context: { filters: [], tz: 'UTC', editable: false, refreshInterval: 0 },
      query: { datasource: 'basic', metrics: ['request_count'], dimensions: ['gateway_service'], limit: 40 },
      queryReady: true, refreshCounter: 0, height: 280,
      chartOptions,
      onChartData: chartData,
      onQueryComplete: queryComplete,
    },
    global: {
      provide: {
        [INJECT_QUERY_PROVIDER]: {
          queryFn,
          fetchComponent: async () => EntityLink,
          datasourceConfigFn: async () => [],
        },
      },
    },
  })
}

const cell = (index: number, key: string) => cy.get(`[row-index="${index}"] [col-id="${key}"]`)
const expectHeaders = (labels: string[]) => cy.get('.ag-header-cell-text').should(headers => {
  expect(Array.from(headers, header => header.textContent)).to.deep.equal(labels)
})
const expectOverflowTooltip = ({ selector, name }: { selector: string, name: string }) => {
  cy.get(selector).should(label => {
    expect(label[0].scrollWidth).to.be.greaterThan(label[0].clientWidth)
  }).and('have.css', 'text-overflow', 'ellipsis')
  cy.get(selector).realHover()
  cy.contains('.popover', name).should('be.visible').should(tooltip => {
    expect(tooltip.closest('.ag-cell')).to.have.length(0)
    const bounds = tooltip[0].getBoundingClientRect()
    const hit = tooltip[0].ownerDocument.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2)
    expect(hit !== null && tooltip[0].contains(hit)).to.equal(true)
  })
}

describe('<TopNTableRenderer /> grid integration', () => {
  beforeEach(() => {
    setupPiniaTestStore()
  })

  afterEach(() => {
    cy.document().then(async document => {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      document.querySelectorAll('[data-testid="enter-native-fullscreen"]').forEach(button => button.remove())
    })
    // Native fullscreen resizes Chrome independently of Cypress's cached viewport.
    cy.viewport(viewport.width + 1, viewport.height)
    cy.viewport(viewport.width, viewport.height)
  })

  it('downloads every expanded TopN row with display names and raw metrics', () => {
    const expandedResult: ExploreResultV4 = {
      data: [...result.data, { timestamp: result.data[0].timestamp, event: { gateway_service: 'export-only', request_count: 0 } }],
      meta: {
        ...result.meta,
        display: { gateway_service: { ...result.meta.display.gateway_service, 'export-only': { name: 'Export-only, "service"' } } },
      },
    }
    const queryFn = cy.stub().as('queryFn')
    queryFn.onFirstCall().resolves(result)
    queryFn.onSecondCall().resolves(expandedResult)

    cy.mount(DashboardTile, {
      props: {
        context: { filters: [], tz: 'UTC', editable: false, showTileActions: true, refreshInterval: 0 },
        definition: {
          chart: defaultChartOptions,
          query: { datasource: 'basic', metrics: ['request_count'], dimensions: ['gateway_service'], limit: 40 },
        },
        queryReady: true, refreshCounter: 0, tileId: 'topn-csv', height: 320,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: {
            queryFn, datasourceConfigFn: async () => [],
            fetchComponent: async () => EntityLink,
            configFn: async () => ({ analytics: { percentiles: true }, requests: null }),
          },
        },
      },
    })
    cell(0, 'gateway_service').should('contain.text', 'Service 1')
    cell(0, 'request_count').should('contain.text', '%')
    cy.get('@queryFn').should('have.been.calledOnce')
    const filename = `chart-export-${new Date().toISOString().slice(0, 10)}.csv`
    const csv = [
      'Gateway service,Request count',
      ...Array.from({ length: 40 }, (_, index) => `Service ${index + 1},${40 - index}`),
      '"Export-only, ""service""",0',
    ].join('\r\n')
    cy.getTestId('kebab-action-menu-topn-csv').click()
    cy.getTestId('chart-csv-export-topn-csv').click()
    cy.window().then(win => {
      const createObjectURL = cy.spy(win.URL, 'createObjectURL')
      cy.getTestId('csv-download-button').should('be.enabled').click()
      // Observe this click's real download Blob, even if a previous run left the dated file behind.
      cy.then(() => {
        expect(createObjectURL.callCount).to.equal(1)
        const blob = createObjectURL.firstCall.args[0]
        expect(blob).to.be.instanceOf(win.Blob)
        if (!(blob instanceof win.Blob)) {
          throw new Error('CSV download did not create a Blob')
        }
        expect(blob.type).to.equal('text/csv;charset=utf-8')
        return blob.text()
      }).should('equal', csv)
      cy.readFile(`${Cypress.config('downloadsFolder')}/${filename}`).should('equal', `\ufeff${csv}`)
    })
    cy.then(() => {
      expect(queryFn.callCount).to.equal(2)
      const initialRequest = queryFn.firstCall.args[0]
      expect(initialRequest.query.limit).to.equal(40)
      expect(queryFn.secondCall.args[0]).to.deep.equal({
        ...initialRequest,
        query: { ...initialRequest.query, limit: 1000 },
      })
    })
  })

  it('keeps backend row order while scrolling and clicking the metric header without another query', () => {
    const backendOrderedResult: ExploreResultV4 = {
      ...result,
      data: [result.data[0], result.data[39], ...result.data.slice(1, 39)],
    }
    mountRenderer({ data: backendOrderedResult })
    cy.getTestId('table-data-grid').should('be.visible')
    expectHeaders(['Name', 'Requests'])
    cell(0, 'gateway_service').should('contain.text', 'Service 1')
    cell(1, 'gateway_service').should('contain.text', 'Service 40')
    cy.get('a[href="https://example.com/services/service-1"]').should('exist')
    cy.get('[row-index="0"] .entity-link-label').should(label => {
      expect(label[0].scrollWidth).to.be.at.most(label[0].clientWidth)
    })
    cy.get('.ag-header-cell[col-id="request_count"]').click()
    cell(0, 'gateway_service').should('contain.text', 'Service 1')
    cell(1, 'gateway_service').should('contain.text', 'Service 40')
    cy.get('.ag-grid-viewport').scrollTo('bottom')
    cy.contains('.entity-link-label', /^Service 39$/).should('be.visible')
    cy.get('@queryFn').should('have.been.calledOnce')
    cy.get('@chartData').should('have.been.calledOnceWithExactly', backendOrderedResult)
    cy.get('@queryComplete').should('have.been.calledOnce')
  })

  for (const entityLinks of [true, false]) {
    it(`truncates long ${entityLinks ? 'entity links' : 'plain dimensions'} and shows the full label above the grid on hover`, () => {
      mountRenderer({ data: longNameResult, chartOptions: entityLinks ? defaultChartOptions : { type: 'top_n' } })
      cell(1, 'gateway_service').should('contain.text', longName)
      expectOverflowTooltip({
        selector: `[row-index="1"] [col-id="gateway_service"] ${entityLinks ? '.entity-link-label' : '.table-data-grid-cell-content'}`,
        name: longName,
      })
      if (entityLinks) {
        cy.get('a[href="https://example.com/services/service-2"]').should('exist')
      }
    })
  }

  for (const entityLinks of [true, false]) {
    it(`keeps long ${entityLinks ? 'entity link' : 'plain dimension'} tooltips visible inside native fullscreen and returns them to body on exit`, () => {
      mountRenderer({ data: longNameResult, chartOptions: entityLinks ? defaultChartOptions : { type: 'top_n' } })
      cell(1, 'gateway_service').should('contain.text', longName)
      let fullscreenRequest: Promise<void> | undefined
      cy.get('[data-cy-root]').then(root => {
        const container = root[0]
        const document = container.ownerDocument
        expect(document.fullscreenEnabled, 'native fullscreen permitted in the component frame').to.equal(true)
        const button = document.createElement('button')
        button.textContent = 'Enter fullscreen'
        button.dataset.testid = 'enter-native-fullscreen'
        button.addEventListener('click', () => {
          fullscreenRequest = container.requestFullscreen()
        })
        container.append(button)
      })
      // A CDP click provides the native user activation required by requestFullscreen.
      cy.getTestId('enter-native-fullscreen').should('have.length', 1).realClick()
      cy.then(() => {
        expect(fullscreenRequest, 'fullscreen requested by the real click').not.to.equal(undefined)
        return fullscreenRequest
      })
      cy.document().should(document => {
        expect(document.fullscreenElement).to.equal(document.querySelector('[data-cy-root]'))
      })
      const selector = `[row-index="1"] [col-id="gateway_service"] ${entityLinks ? '.entity-link-label' : '.table-data-grid-cell-content'}`
      expectOverflowTooltip({ selector, name: longName })
      cy.contains('.popover', longName).should(tooltip => {
        const fullscreenElement = tooltip[0].ownerDocument.fullscreenElement
        expect(fullscreenElement?.contains(tooltip[0])).to.equal(true)
      })
      cy.get(selector).trigger('mouseleave')
      cy.document().then(document => document.exitFullscreen())
      cy.document().its('fullscreenElement').should('be.null')
      cy.viewport(viewport.width + 1, viewport.height)
      cy.viewport(viewport.width, viewport.height)
      cy.get('body').realHover({ position: 'topLeft' })
      cy.get(selector).realHover()
      cy.contains('.popover', longName).should('be.visible').should(tooltip => {
        expect(tooltip.closest('[data-cy-root]')).to.have.length(0)
      })
    })
  }

  it('renders zero-dimension aggregate metrics without an extra name column', () => {
    mountRenderer({
      data: {
        data: [{ timestamp: '', event: { request_count: 1200, error_rate: 0.001 } }],
        meta: { ...result.meta, display: {}, metric_names: ['request_count', 'error_rate'], metric_units: { request_count: 'count', error_rate: '%' } },
      },
      chartOptions: { type: 'top_n', column_options: { request_count: { label: 'Requests' }, error_rate: { label: 'Errors' } } },
    })
    expectHeaders(['Requests', 'Errors'])
    cell(0, 'request_count').should('contain.text', '1.2K')
    cell(0, 'error_rate').should('contain.text', '< 0.01%')
  })

  it('aligns three dimensions and multiple metrics with labels, opt-in provider icons, and thresholds', () => {
    cy.viewport(1200, viewport.height)
    mountRenderer({
      data: {
        data: [
          { timestamp: '', event: { ai_provider: 'OpenAI', ai_model: 'azure', status_code: '200', request_count: 10, error_rate: 20 } },
          { timestamp: '', event: { ai_provider: 'provider-2', ai_model: 'azure', status_code: '200', request_count: 10, error_rate: 10 } },
        ],
        meta: {
          ...result.meta,
          display: {
            ai_provider: { OpenAI: { name: 'OpenAI' }, 'provider-2': { name: 'Anthropic' } },
            ai_model: { azure: { name: 'GPT' } }, status_code: { 200: { name: '200' } },
          },
          metric_names: ['request_count', 'error_rate'], metric_units: { request_count: 'count', error_rate: '%' },
        },
      },
      chartOptions: { type: 'top_n', column_options: {
        ai_provider: { label: 'Provider', icon_set: 'ai_provider' }, ai_model: { label: 'Model' }, status_code: { label: 'Status' },
        request_count: { label: 'Requests', value: 'relative', bar: 'relative' },
        error_rate: { label: 'Errors', bar: 'max', thresholds: [{ type: 'error', value: 15 }] },
      } },
    })
    expectHeaders(['Provider', 'Model', 'Status', 'Requests', 'Errors'])
    cell(0, 'ai_provider').should('contain.text', 'OpenAI').findTestId('top-n-provider-icon').should('be.visible')
    cell(1, 'ai_provider').should('contain.text', 'Anthropic').findTestId('top-n-provider-icon').should('not.exist')
    cell(0, 'ai_model').should('contain.text', 'GPT').findTestId('top-n-provider-icon').should('not.exist')
    cell(0, 'status_code').should('contain.text', '200')
    cell(0, 'request_count').should('contain.text', '10').and('contain.text', '(50%)')
    cell(0, 'error_rate').should('contain.text', '20%').findTestId('table-data-grid-cell-bar').should('have.attr', 'data-threshold', 'error')
    cell(0, 'error_rate').find<HTMLElement>('[data-testid="table-data-grid-cell-bar-fill"]').should((fill) => {
      expect(fill[0].style.width).to.equal('100%')
    })
  })

  it('updates labels and metric presentation without issuing another query', () => {
    mountRenderer().then(({ wrapper }) => {
      cell(0, 'request_count').should('contain.text', '%')
      cy.then(() => wrapper.setProps({ chartOptions: { type: 'top_n', column_options: { request_count: { label: 'New label', bar: 'relative' } } } }))
      expectHeaders(['Name', 'New label'])
      cell(0, 'request_count').should('contain.text', '40').and('not.contain.text', '%')
      cy.get('@queryFn').should('have.been.calledOnce')
    })
  })

  it('preserves empty and deleted entity presentation without navigable links', () => {
    mountRenderer({ data: {
      data: [
        { timestamp: '', event: { gateway_service: 'empty', request_count: null } },
        { timestamp: '', event: { gateway_service: 'deleted-service', request_count: 2 } },
      ],
      meta: { ...result.meta, display: { gateway_service: { empty: { name: 'empty' }, 'deleted-service': { name: 'Old service', deleted: true } } } },
    } })
    cell(0, 'gateway_service').find('i').should('have.text', 'empty')
    cell(0, 'gateway_service').find('a').should('not.exist')
    cell(0, 'request_count').should('contain.text', '–')
    cell(1, 'gateway_service').should('contain.text', 'delet (deleted)').find('a').should('not.exist')
  })
})
