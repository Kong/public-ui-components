import DashboardTilePreview from './DashboardTilePreview.vue'
import DashboardTile from './DashboardTile.vue'
import { defineComponent, h, onMounted } from 'vue'
import { setupPiniaTestStore } from '../stores/tests/setupPiniaTestStore'
import { INJECT_QUERY_PROVIDER } from '../constants'
import type { DashboardRendererContext } from '../types'
import type {
  AllFilters,
  TileDefinition,
} from '@kong-ui-public/analytics-utilities'
import { useAnalyticsConfigStore } from '@kong-ui-public/analytics-config-store'

describe('<DashboardTilePreview />', () => {
  beforeEach(() => {
    setupPiniaTestStore()
  })

  const setup = async ({
    editable,
    wrappedInDivWithHeight,
    metrics = ['response_size_p99'],
  }: {
    editable?: boolean
    wrappedInDivWithHeight?: number
    metrics?: any[]
  } = {}) => {
    const globalFilters: AllFilters[] = []

    const context: DashboardRendererContext = {
      filters: [],
      ...(editable !== undefined && {
        editable: editable,
      }),
    }

    const definition: TileDefinition = {
      chart: {
        type: 'horizontal_bar',
      },
      query: {
        datasource: 'api_usage',
        metrics,
        dimensions: ['control_plane'],
        filters: [],
      },
    }

    cy.mount(DashboardTilePreview, {
      attachTo: document.body,
      devTools: false,
      props: {
        globalFilters,
        context,
        definition,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: {
            configFn: () => Promise.resolve(),
          },
        },
        stubs: {
          DashboardTile: defineComponent({
            name: 'DashboardTile',
            props: Object.keys(DashboardTile.props ?? {}),
            emits: ['update:refreshCounter'],
            setup(props) {
              return () => h(
                'pre',
                {
                  'data-testid': 'test-stub',
                  'data-props': JSON.stringify(props),
                  'data-preview-props': JSON.stringify({ context, definition, globalFilters }),
                },
                `Stubbed DashboardTile
DashboardTilePreview props:
${JSON.stringify({ context, definition, globalFilters }, null, 2)}
DashboardTile props:
${JSON.stringify(props, null, 2)}`,
              )
            },
          }),
        },
      },
    }).then(() => {
      if (wrappedInDivWithHeight) {
        // cypress wraps all mounted components in a `<div data-v-app>` with a default
        // height of 500ish.
        const wrappers = document.querySelectorAll('[data-v-app]')
        wrappers.forEach((ell) => {
          const el = ell as HTMLElement
          if (el.querySelector('[data-testid="dashboard-tile-preview-root"]')) {
            el.style.height = `${wrappedInDivWithHeight}px`
          } else {
            // get rid of all other nonsense vue debugger stuff just so the test looks nice
            el.style.display = 'none'
          }
        })
      }
    })
  }

  const getTileProps = (attr = 'data-props') => {
    return cy.getTestId('test-stub')
      .invoke('attr', attr)
      .then(JSON.parse)
  }

  const expectPropIs = (propPath: string, expectedValue: any, fromPreview = false) => {
    cy.getTestId('test-stub').should(($el: any) => {
      const el = $el[0] as HTMLElement
      const props = fromPreview
        ? JSON.parse(el.getAttribute('data-preview-props') ?? '')
        : JSON.parse(el.getAttribute('data-props') ?? '')

      const actualValue: any = propPath.split('.').reduce((acc, key) => acc[key], props)
      expect(actualValue).to.deep.eq(expectedValue)
    })
  }

  const expectPreviewPropIs = (propPath: string, expectedValue: any) => {
    return expectPropIs(propPath, expectedValue, true)
  }

  const expectTilePropIs = (propPath: string, expectedValue: any) => {
    return expectPropIs(propPath, expectedValue, false)
  }

  it('uses the height of its parent as the DashboardTile prop', () => {
    setup({ wrappedInDivWithHeight: 100 })
    expectPropIs('height', 100)
  })

  it('always sets editable as false', () => {
    setup({ editable: true })
    expectPreviewPropIs('context.editable', true)
    expectTilePropIs('context.editable', false)

    setup({ editable: false })
    expectPreviewPropIs('context.editable', false)
    expectTilePropIs('context.editable', false)
  })

  it('sets hideActions', () => {
    setup()
    expectTilePropIs('hideActions', '') // this is actually `true` because of how simple props work in vue
  })

  it('sets showRefresh', () => {
    setup()
    expectTilePropIs('showRefresh', '') // this is actually `true` because of how simple props work in vue
  })

  it('sets a random tile id for each instance', () => {
    setup()
    let firstTileId: string
    getTileProps().then((props: any) => {
      expect(props.tileId).to.not.eq(undefined)
      firstTileId = props.tileId
    })

    setup()
    getTileProps().then((props: any) => {
      expect(props.tileId).to.not.eq(undefined)
      expect(props.tileId).to.not.eq(firstTileId)
    })
  })

  it('sets a default timeSpec when one is not provided', () => {
    setup()
    const configStore = useAnalyticsConfigStore()
    expectPreviewPropIs('context.timeSpec', undefined)
    expectTilePropIs('context.timeSpec', {
      type: 'relative',
      time_range: configStore.defaultQueryTimeForOrg,
    })
  })

  it('shows the "Chart not configured" empty state when metrics are not provided', () => {
    setup({ metrics: [] })
    cy.getTestId('chart-not-configured-empty-state').should('exist')
    cy.getTestId('test-stub').should('not.exist')
  })

  it('forwards chart-data emit from DashboardTile', () => {
    const chartDataSpy = cy.spy().as('chartDataSpy')
    const mockChartData = {
      data: [{ event: { request_count: 100 }, timestamp: '2024-01-01T00:00:00Z' }],
      meta: {
        start_ms: 1704067200000,
        end_ms: 1704153600000,
        granularity_ms: 3600000,
        metric_names: ['request_count'],
        metric_units: { request_count: 'count' },
        display: {},
        query_id: '',
      },
    }

    const context: DashboardRendererContext = {
      filters: [],
    }

    const definition: TileDefinition = {
      chart: {
        type: 'horizontal_bar',
      },
      query: {
        datasource: 'api_usage',
        metrics: ['request_count'],
        dimensions: ['control_plane'],
        filters: [],
      },
    }

    cy.mount(DashboardTilePreview, {
      attachTo: document.body,
      props: {
        globalFilters: [],
        context,
        definition,
      },
      attrs: {
        onChartData: chartDataSpy,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: {
            configFn: () => Promise.resolve(),
          },
        },
        stubs: {
          DashboardTile: defineComponent({
            name: 'DashboardTile',
            props: Object.keys(DashboardTile.props ?? {}),
            emits: ['update:refreshCounter', 'chart-data'],
            setup(_props, { emit }) {
              onMounted(() => {
                emit('chart-data', mockChartData)
              })

              return () => h('div', { 'data-testid': 'chart-data-stub' }, 'Stub')
            },
          }),
        },
      },
    })

    cy.get('@chartDataSpy').should('have.been.calledOnce').then(() => {
      const emitted = chartDataSpy.getCall(0).args[0]
      expect(emitted).to.have.property('meta')
      expect(emitted.meta).to.have.property('granularity_ms', 3600000)
    })
  })
})
