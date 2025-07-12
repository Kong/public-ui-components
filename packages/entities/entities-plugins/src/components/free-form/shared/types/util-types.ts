/*
 * Forked from “TanStack/Form” (https://github.com/TanStack/form/blob/main/packages/form-core/src/util-types.ts)
 * Original license: MIT
 * Modifications:
 *   - Add wildcard support for arrays
 */

/**
 * @private
 */
export type UnwrapOneLevelOfArray<T> = T extends (infer U)[] ? U : T

type Narrowable = string | number | bigint | boolean

type NarrowRaw<A> =
  | (A extends [] ? [] : never)
  | (A extends Narrowable ? A : never)
  | {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    [K in keyof A]: A[K] extends Function ? A[K] : NarrowRaw<A[K]>
  }

type Try<A1, A2, Catch = never> = A1 extends A2 ? A1 : Catch

/**
 * @private
 */
export type Narrow<A> = Try<A, [], NarrowRaw<A>>

export interface AnyDeepKeyAndValue<
  K extends string = string,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
  V extends any = any,
> {
  key: K
  value: V
}

export type ArrayWildcardAccessor<TParent extends AnyDeepKeyAndValue> =
  TParent['key'] extends never
    ? '*'
    : `${TParent['key']}.*`

export type ArrayIndexAccessor<TParent extends AnyDeepKeyAndValue> =
  TParent['key'] extends never
    ? `${number}`
    : `${TParent['key']}.${number}`

export interface ArrayWildcardDeepKeyAndValue<
  in out TParent extends AnyDeepKeyAndValue,
  in out T extends ReadonlyArray<any>,
> extends AnyDeepKeyAndValue {
  key: ArrayWildcardAccessor<TParent>
  value: T[number] | Nullable<TParent['value']>
}

export interface ArrayIndexDeepKeyAndValue<
  in out TParent extends AnyDeepKeyAndValue,
  in out T extends ReadonlyArray<any>,
> extends AnyDeepKeyAndValue {
  key: ArrayIndexAccessor<TParent>
  value: T[number] | Nullable<TParent['value']>
}

export type DeepKeyAndValueArray<
  TParent extends AnyDeepKeyAndValue,
  T extends ReadonlyArray<any>,
  TAcc,
  TIncludeWildcard extends boolean = false,
> = TIncludeWildcard extends true
  ? DeepKeysAndValuesImpl<
    NonNullable<T[number]>,
    ArrayWildcardDeepKeyAndValue<TParent, T>,
    TAcc | ArrayWildcardDeepKeyAndValue<TParent, T> | ArrayIndexDeepKeyAndValue<TParent, T>,
    TIncludeWildcard
  >
  : DeepKeysAndValuesImpl<
    NonNullable<T[number]>,
    ArrayIndexDeepKeyAndValue<TParent, T>,
    TAcc | ArrayIndexDeepKeyAndValue<TParent, T>,
    TIncludeWildcard
  >

export type TupleAccessor<
  TParent extends AnyDeepKeyAndValue,
  TKey extends string,
> = TParent['key'] extends never
  ? `[${TKey}]`
  : `${TParent['key']}[${TKey}]`

export interface TupleDeepKeyAndValue<
  in out TParent extends AnyDeepKeyAndValue,
  in out T,
  in out TKey extends AllTupleKeys<T>,
> extends AnyDeepKeyAndValue {
  key: TupleAccessor<TParent, TKey>
  value: T[TKey] | Nullable<TParent['value']>
}

export type AllTupleKeys<T> = T extends any ? keyof T & `${number}` : never

export type DeepKeyAndValueTuple<
  TParent extends AnyDeepKeyAndValue,
  T extends ReadonlyArray<any>,
  TAcc,
  TIncludeWildcard extends boolean = false,
  TAllKeys extends AllTupleKeys<T> = AllTupleKeys<T>,
> = TAllKeys extends any
  ? DeepKeysAndValuesImpl<
    NonNullable<T[TAllKeys]>,
    TupleDeepKeyAndValue<TParent, T, TAllKeys>,
    TAcc | TupleDeepKeyAndValue<TParent, T, TAllKeys>,
    TIncludeWildcard
  >
  : never

export type AllObjectKeys<T> = T extends any
  ? keyof T & (string | number)
  : never

export type ObjectAccessor<
  TParent extends AnyDeepKeyAndValue,
  TKey extends string | number,
> = TParent['key'] extends never
  ? `${TKey}`
  : `${TParent['key']}.${TKey}`

export type Nullable<T> = T & (undefined | null)

export type ObjectValue<
  TParent extends AnyDeepKeyAndValue,
  T,
  TKey extends AllObjectKeys<T>,
> = T[TKey] | Nullable<TParent['value']>

export interface ObjectDeepKeyAndValue<
  in out TParent extends AnyDeepKeyAndValue,
  in out T,
  in out TKey extends AllObjectKeys<T>,
> extends AnyDeepKeyAndValue {
  key: ObjectAccessor<TParent, TKey>
  value: ObjectValue<TParent, T, TKey>
}

export type DeepKeyAndValueObject<
  TParent extends AnyDeepKeyAndValue,
  T,
  TAcc,
  TIncludeWildcard extends boolean = false,
  TAllKeys extends AllObjectKeys<T> = AllObjectKeys<T>,
> = TAllKeys extends any
  ? DeepKeysAndValuesImpl<
    NonNullable<T[TAllKeys]>,
    ObjectDeepKeyAndValue<TParent, T, TAllKeys>,
    TAcc | ObjectDeepKeyAndValue<TParent, T, TAllKeys>,
    TIncludeWildcard
  >
  : never

export type UnknownAccessor<TParent extends AnyDeepKeyAndValue> =
  TParent['key'] extends never
    ? string
    : `${TParent['key']}.${string}`

export interface UnknownDeepKeyAndValue<TParent extends AnyDeepKeyAndValue>
  extends AnyDeepKeyAndValue {
  key: UnknownAccessor<TParent>
  value: unknown
}

export type DeepKeysAndValues<T, TIncludeWildcard extends boolean = false> =
  DeepKeysAndValuesImpl<T, never, never, TIncludeWildcard> extends AnyDeepKeyAndValue
    ? DeepKeysAndValuesImpl<T, never, never, TIncludeWildcard>
    : never

export type DeepKeysAndValuesImpl<
  T,
  TParent extends AnyDeepKeyAndValue = never,
  TAcc = never,
  TIncludeWildcard extends boolean = false,
> = unknown extends T
  ? TAcc | UnknownDeepKeyAndValue<TParent>
  : unknown extends T // this stops runaway recursion when T is any
    ? T
    : T extends string | number | boolean | bigint | Date
      ? TAcc
      : T extends ReadonlyArray<any>
        ? number extends T['length']
          ? DeepKeyAndValueArray<TParent, T, TAcc, TIncludeWildcard>
          : DeepKeyAndValueTuple<TParent, T, TAcc, TIncludeWildcard>
        : keyof T extends never
          ? TAcc | UnknownDeepKeyAndValue<TParent>
          : T extends object
            ? DeepKeyAndValueObject<TParent, T, TAcc, TIncludeWildcard>
            : TAcc

export type DeepRecord<T, TIncludeWildcard extends boolean = false> = {
  [TRecord in DeepKeysAndValues<T, TIncludeWildcard> as TRecord['key']]: TRecord['value']
}

/**
 * The keys of an object or array, deeply nested.
 * @param T The type to get deep keys for
 * @param TIncludeWildcard Whether to include array wildcard keys (*.0, *.1, etc.), defaults to false
 */
export type DeepKeys<T, TIncludeWildcard extends boolean = false> = unknown extends NonNullable<T>
  ? string
  : DeepKeysAndValues<NonNullable<T>, TIncludeWildcard>['key']

/**
 * Infer the type of a deeply nested property within an object or an array.
 * @param TValue The type to get deep value from
 * @param TAccessor The accessor path
 * @param TIncludeWildcard Whether to include array wildcard keys (*.0, *.1, etc.), defaults to false
 */
export type DeepValue<TValue, TAccessor, TIncludeWildcard extends boolean = false> = unknown extends TValue
  ? TValue
  : TAccessor extends DeepKeys<TValue, TIncludeWildcard>
    ? DeepRecord<TValue, TIncludeWildcard>[TAccessor]
    : never

/**
 * The keys of an object or array, deeply nested and only with a value of TValue
 * @param TData The type to get deep keys for
 * @param TValue The value type to filter by
 * @param TIncludeWildcard Whether to include array wildcard keys (*.0, *.1, etc.), defaults to false
 */
export type DeepKeysOfType<TData, TValue, TIncludeWildcard extends boolean = false> = Extract<
  DeepKeysAndValues<TData, TIncludeWildcard>,
  AnyDeepKeyAndValue<string, TValue>
>['key']
