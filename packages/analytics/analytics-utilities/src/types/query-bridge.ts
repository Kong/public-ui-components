import type { ExploreQuery, ExploreResultV4 } from './explore-v4'

export interface AnalyticsBridge {
  queryFn: (query: ExploreQuery, abortController: AbortController) => Promise<ExploreResultV4>
}
