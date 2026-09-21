// Utility for deriving filterable dimensions from queryable dimensions with correct types.
export const makeFilterable = <T extends readonly unknown[]>(queryable: T) =>
  queryable.filter(d => d !== 'time') as Array<Exclude<T[number], 'time'>>
