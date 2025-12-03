import { INJECT_QUERY_PROVIDER } from '../constants'
import { COUNTRIES } from '@kong-ui-public/analytics-utilities'
import type {
  AllFilters,
  AnalyticsBridge,
  ExploreResultV4,
} from '@kong-ui-public/analytics-utilities'
import GeoMapRenderer from './GeoMapRenderer.vue'
import { createPinia, setActivePinia } from 'pinia'

describe('<GeoMapRenderer />', () => {
  beforeEach(() => {
    cy.viewport(1200, 1000)
    setActivePinia(createPinia())
  })

  let refreshCounter = 0

  const render = ({
    limit,
    filters = [],
  }: {
    limit?: number
    filters?: AllFilters[]
  } = {}) => {
    // cache bust
    refreshCounter++

    const mockQueryProvider = (): AnalyticsBridge => {
      const queryFn = (): Promise<ExploreResultV4> => {
        return Promise.resolve({ data: [], meta: {} }) as any
      }

      return {
        queryFn: cy.spy(queryFn).as('fetcher'),
      } as any
    }

    cy.mount(GeoMapRenderer, {
      props: {
        query: {
          datasource: 'api_usage',
          metrics: ['request_count'],
          dimensions: ['country_code'],
          filters,
          ...(limit !== undefined && { limit }),
        } as any,
        context: {
          filters: [],
          zoomable: false,
        } as any,
        queryReady: true,
        chartOptions: {
          type: 'choropleth_map',
        },
        height: 200,
        refreshCounter,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProvider(),
        },
        stubs: ['AnalyticsGeoMap'],
      },
    })
  }

  const getQuery = (fn: (query: any) => void) => {
    cy.get('@fetcher').then((spy) => {
      // @ts-ignore getCall does in fact exist
      const call = spy.getCall(0)
      fn(call.args[0].query)
    })
  }

  it('adds another limit automatically when one is not explicitly set', () => {
    render()
    cy.get('@fetcher').should('have.been.calledOnce')
    getQuery((query) => {
      expect(query.limit).to.equal(COUNTRIES.length)
    })
  })

  it('respects a limit that is intentionally set', () => {
    render({ limit: 25 })
    cy.get('@fetcher').should('have.been.calledOnce')
    getQuery((query) => {
      expect(query.limit).to.equal(25)
    })
  })

  it('adds a `not_empty` filter on country code', () => {
    render()
    cy.get('@fetcher').should('have.been.calledOnce')
    getQuery((query) => {
      expect(query.filters).to.deep.equal([{ operator: 'not_empty', field: 'country_code' }])
    })
  })

  it('does not add a `not_empty` filter if the query already has an `in` filter for `country_code`', () => {
    const existingFilters: AllFilters[] = [{ field: 'country_code', operator: 'in', value: ['jp'] }]
    render({ filters: existingFilters })
    cy.get('@fetcher').should('have.been.calledOnce')
    getQuery((query) => {
      expect(query.filters).to.deep.equal(existingFilters)
    })
  })

  it('does not add a `not_empty` filter if the query already has a `not_empty` filter for `country_code`', () => {
    const existingFilters: AllFilters[] = [{ field: 'country_code', operator: 'not_empty' }]
    render({ filters: existingFilters })
    cy.get('@fetcher').should('have.been.calledOnce')
    getQuery((query) => {
      expect(query.filters).to.deep.equal(existingFilters)
    })
  })

  it('does not add a `not_empty` filter if the query already has an `empty` filter for `country_code`', () => {
    const existingFilters: AllFilters[] = [{ field: 'country_code', operator: 'empty' }]
    render({ filters: existingFilters })
    cy.get('@fetcher').should('have.been.calledOnce')
    getQuery((query) => {
      expect(query.filters).to.deep.equal(existingFilters)
    })
  })
})

