// Utility types for `makeFilterable`.
// In essence: recurse through the tuple type `T` and exclude elements that match `E`.
// https://stackoverflow.com/questions/58984164/typescript-filter-tuple-type-by-an-arbitrary-type
type ExcludeFromTuple<T extends readonly any[], E> =
  T extends readonly [infer F, ...infer R] ? [F] extends readonly [E] ? ExcludeFromTuple<R, E> :
    [F, ...ExcludeFromTuple<R, E>] : []

// Basically, all dimensions are filterable except for time.
type ExceptTime<T extends readonly any[]> = ExcludeFromTuple<T, 'time'>

// Utility for deriving filterable dimensions from queryable dimensions with correct types.
export const makeFilterable = <T extends Readonly<unknown[]>>(queryable: T) =>
  queryable.filter(d => d !== 'time') as ExceptTime<T>
