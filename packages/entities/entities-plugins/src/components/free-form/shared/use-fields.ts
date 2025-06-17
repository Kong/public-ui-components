import ArrayField from './ArrayField.vue'
import BooleanField from './BooleanField.vue'
import EnumField from './EnumField.vue'
import Field from './Field.vue'
import KeyValueField from './KeyValueField.vue'
import NumberField from './NumberField.vue'
import ObjectField from './ObjectField.vue'
import StringField from './StringField.vue'
import TagField from './TagField.vue'

type Equal<A, B> = (
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false
)
type Expect<T extends true> = T

type IsRecord<T> = T extends Record<Exclude<keyof any, keyof string>, any> ? true : false
type IsArrayOfRecords<T> = T extends Array<infer OI> ? (OI extends Record<string, any> ? true : false) : false
type AppendPath<P extends string, K extends string> = P extends '' ? K : `${P}.${K}`
type Decrement = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

/**
 * Recursively flattens the keys of a nested object type into a union of string paths.
 *
 * @template T - The object type to flatten.
 * @template P - The prefix for the current path, defaults to an empty string.
 * @template Depth - The maximum recursion depth, default and maximum is 6.
 *
 * @description
 * This utility type generates a union of string paths representing all possible keys
 * in a deeply nested object. It supports arrays of records and distinguishes between
 * regular arrays and arrays of objects. The recursion depth can be controlled to prevent
 * excessive computation.
 *
 * - If a key points to an array of records, paths include indexed access (`K.${number}`),
 *   wildcard access (`K.*`), and the key itself (`K`).
 * - If a key points to a nested object, paths include the flattened keys of the object
 *   prefixed by the current key (`K`).
 * - If a key points to a primitive value, the path is simply the key itself (`K`).
 *
 * @example
 * type Example = {
 *   a: {
 *     b: {
 *       c: number;
 *     };
 *   };
 *   d: string[];
 * };
 *
 * type Flattened = FlattenKeys<Example>;
 * // Result: "a" | "a.b" | "a.b.c" | "d" | "d.*"
 */
type FlattenKeys<T extends Record<string, any>, P extends string = '', Depth extends number = 6> = Depth extends 0
  ? never
  : {
    [K in keyof T]-?:
    K extends string
      ? NonNullable<T[K]> extends any[]
        ? IsArrayOfRecords<NonNullable<T[K]>> extends true
          ? | FlattenKeys<NonNullable<T[K]>[number], AppendPath<P, `${K}.*`>, Decrement[Depth]>
            | AppendPath<P, K>
            | AppendPath<P, `${K}.*`>
          : AppendPath<P, K>
        : IsRecord<NonNullable<T[K]>> extends true
          ? | FlattenKeys<NonNullable<T[K]>, AppendPath<P, K>, Decrement[Depth]>
            | AppendPath<P, K>
          : AppendPath<P, K>
      : never;
  }[keyof T]

/**
 * A utility type that retrieves the type of a deeply nested property within a given object type `T`
 * based on a dot-separated path string `P`.
 *
 * @template T - The object type to retrieve the property type from.
 * @template P - A dot-separated string representing the path to the desired property within `T`.
 *               Defaults to an empty string (`''`), which represents the root object `T`.
 *
 * @remarks
 * - If `P` is a valid path within `T`, the type of the property at that path is returned.
 * - If `P` is an empty string (`''`), the type `T` itself is returned.
 * - If the path is invalid or does not exist within `T`, the type resolves to `never`.
 * - Handles nested objects and ensures type safety by validating the path against the structure of `T`.
 *
 * @example
 * ```typescript
 * type Example = {
 *   user: {
 *     profile: {
 *       name: string;
 *       age: number;
 *     };
 *   };
 * };
 *
 * type NameType = GetByPath<Example, 'user.profile.name'>; // Resolves to string
 * type AgeType = GetByPath<Example, 'user.profile.age'>;   // Resolves to number
 * type InvalidType = GetByPath<Example, 'user.profile.height'>; // Resolves to never
 * type RootType = GetByPath<Example, ''>; // Resolves to Example
 * ```
 */
type GetByPath<T extends Record<string, any>, P extends FlattenKeys<T> | '' = ''> = P extends FlattenKeys<T>
  ? P extends infer S
    ? P extends `${infer H}.${infer R}`
      ? H extends keyof T
        ? R extends FlattenKeys<T[H]>
          ? GetByPath<T[H], R> // X.Y
          : R extends '*'
            ? GetByPath<T[H][0]> // X.*
            : R extends `*.${infer E}`
              ? E extends FlattenKeys<T[H][0]>
                ? GetByPath<T[H][0], E> // X.*.Y
                : never
              : never
        : never
      : S extends keyof T
        ? T[S]// leaf
        : T extends any[]
          ? S extends '*'
            ? T[0]
            : never
          : never
    : never
  : T // P = ''

export const useFields = <T extends Record<string, any> = any, P extends FlattenKeys<T> | '' = ''>() => {
  return {
    ArrayField: ArrayField as typeof ArrayField<FlattenKeys<GetByPath<T, P>>>,
    BooleanField: BooleanField as typeof BooleanField<FlattenKeys<GetByPath<T, P>>>,
    EnumField: EnumField as typeof EnumField<FlattenKeys<GetByPath<T, P>>>,
    Field: Field as typeof Field<FlattenKeys<GetByPath<T, P>>>,
    KeyValueField: KeyValueField as typeof KeyValueField<FlattenKeys<GetByPath<T, P>>>,
    NumberField: NumberField as typeof NumberField<FlattenKeys<GetByPath<T, P>>>,
    ObjectField: ObjectField as typeof ObjectField<FlattenKeys<GetByPath<T, P>>>,
    StringField: StringField as typeof StringField<FlattenKeys<GetByPath<T, P>>>,
    TagField: TagField as typeof TagField<FlattenKeys<GetByPath<T, P>>>,
  }
}

// Test cases
// FlattenKeys
declare const _F1: Expect<Equal<FlattenKeys<{ a: number, b?: string }>, 'a' | 'b'>>
declare const _F2: Expect<Equal<FlattenKeys<{ a: { b: number } }>, 'a' | 'a.b'>>
declare const _F3: Expect<Equal<FlattenKeys<{ a: { b: number }[] }>, 'a' | 'a.*' | 'a.*.b'>>
declare const _F4: Expect<Equal<
  FlattenKeys<{ a: { b: number, c: { d: boolean[] } }[] }>,
  'a' | 'a.*' | 'a.*.b' | 'a.*.c' | 'a.*.c.d'
>>

// GetByPath
declare const _G1: Expect<Equal<GetByPath<{ a: number, b?: string }>, { a: number, b?: string }>>
declare const _G2: Expect<Equal<GetByPath<{ a: number, b?: string }, 'a'>, number>>
declare const _G3: Expect<Equal<GetByPath<{ a: number, b?: string }, 'b'>, string | undefined>>
declare const _G4: Expect<Equal<GetByPath<{ a: { b: number } }, 'a'>, { b: number }>>
declare const _G5: Expect<Equal<GetByPath<{ a: { b: number } }, 'a.b'>, number>>
declare const _G6: Expect<Equal<GetByPath<{ a: { b: number }[] }, 'a'>, { b: number }[]>>
declare const _G7: Expect<Equal<GetByPath<{ a: { b: number }[] }, 'a.*'>, { b: number }>>
declare const _G8: Expect<Equal<GetByPath<{ a: { b: number }[] }, 'a.*.b'>, number>>
declare const _G9: Expect<Equal<GetByPath<{ a: { b: number, c: { d: number }[] }[] }, 'a.*.c'>, { d: number }[]>>
declare const _G10: Expect<Equal<GetByPath<{ a: { b: number, c: { d: number }[] }[] }, 'a.*.c.*'>, { d: number }>>
declare const _G11: Expect<Equal<GetByPath<{ a: { b: number, c: { d: number }[] }[] }, 'a.*.c.*.d'>, number>>
