import type { Plugin } from 'vue'
import { INJECT_QUERY_PROVIDER } from '../src/types/query-provider'
import { exploreV3Response } from '../src/mock-data'

const query = async (): Promise<any> => {
  return exploreV3Response
}

const sandboxQueryProvider: Plugin = {
  install(app) {
    app.provide(INJECT_QUERY_PROVIDER, { query })
  },
}

export default sandboxQueryProvider
