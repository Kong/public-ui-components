export const INJECT_QUERY_PROVIDER = 'analytics-query-provider'

// TODO: Explore v4
export interface QueryProvider {
  query(query: any, abortController: AbortController): Promise<any>
}
