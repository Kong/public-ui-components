export * from './common'
export * from './basic'
export * from './advanced'
export * from './ai'
export * from './requests'
export * from './result'
export * from './all'
export * from './mcp'

// To add a new datasource:
// - Create a new file for the datasource and export it from this file.
// - Define queryable dimensions (things that you can group by).  Define both a const list and a type.
//   - Consider basing this list off of Basic, if possible.
// - Define filterable dimensions (things that you can filter by).  Define both a const list and a type.
//   - If your filterable dimensions are the same as your queryable dimensions, minus time, you can use `makeFilterable` to define the list and associated types.
// - Define your filter interface as `extends Omit<BasicExploreFilter, 'dimension'>`.
//   - We will have more varied filters; let's talk about it when we get there.
// - Define your aggregations.  Define both a const list and a type.
//   - Consider basing this list off of Basic, if possible.
// - Define your query interface (likely by extending `Omit<BasicExploreQuery, 'metrics' | 'dimensions' | 'filters'>`).
// - Update `all.ts` to include the new datasource in these types / values:
//   - AllAggregation, AllFilters, queryDatasources, FilterTypeMap, datasourceToFilterableDimensions
// - [TODO - more detail] Update the dashboard renderer types.
// - Add a new type to the DatasourceAwareQuery union in `query-bridge.ts`.
// - Update query bridge implementations (public and / or internal) to route to the new query endpoint.
