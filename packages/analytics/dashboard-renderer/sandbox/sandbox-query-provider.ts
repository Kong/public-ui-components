import type { Plugin } from 'vue'
import { exploreV3Response, timeSeriesExploreResponse } from './mock-data'
import { INJECT_QUERY_PROVIDER } from '../src/constants'
import type { AnalyticsBridge, ExploreQuery, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import { QueryableExploreDimensions } from '@kong-ui-public/analytics-utilities'

const delayedResponse = (response: any) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(response)
    }, 1000)
  })
}

// TODO: Remove the type hacks
const queryFn = async (query: ExploreQuery): Promise<ExploreResultV4> => {
  if (query.dimensions && query.dimensions.findIndex(d => d === QueryableExploreDimensions.time) > -1) {
    return await delayedResponse(timeSeriesExploreResponse) as ExploreResultV4
  }
  return await delayedResponse(exploreV3Response) as ExploreResultV4
}

const sandboxQueryProvider: Plugin = {
  install(app) {
    app.provide(INJECT_QUERY_PROVIDER, { queryFn } as AnalyticsBridge)
  },
}

export default sandboxQueryProvider
