import type { Plugin } from 'vue'
import { INJECT_QUERY_PROVIDER } from '../src/types/query-provider'
import { exploreV3Response, timeSeriesExploreResponse } from '../src/mock-data'

const query = async (query: any): Promise<any> => {
  if (query.type === 'timeseries') {
    return timeSeriesExploreResponse
  }
  return exploreV3Response
}

const sandboxQueryProvider: Plugin = {
  install(app) {
    app.provide(INJECT_QUERY_PROVIDER, { query })
  },
}

export default sandboxQueryProvider
