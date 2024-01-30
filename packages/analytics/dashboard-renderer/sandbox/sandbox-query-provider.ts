import type { Plugin } from 'vue'
import { exploreV3Response, timeSeriesExploreResponse } from './mock-data'
import { INJECT_QUERY_PROVIDER } from '../src'

const delayedResponse = (response: any) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(response)
    }, 1000)
  })
}

const query = async (query: any): Promise<any> => {
  if (query.type === 'timeseries') {
    return await delayedResponse(timeSeriesExploreResponse)
  }
  return await delayedResponse(exploreV3Response)
}

const sandboxQueryProvider: Plugin = {
  install(app) {
    app.provide(INJECT_QUERY_PROVIDER, { query })
  },
}

export default sandboxQueryProvider
