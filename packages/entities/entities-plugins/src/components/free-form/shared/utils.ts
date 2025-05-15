import type { UnionFieldSchema } from 'src/types/plugins/form-schema'
import { toValue, type MaybeRefOrGetter } from 'vue'

export function toSelectItems<T extends string>(
  items: T[],
): { value: T, label: T }[] {
  return items.map((item) => ({ value: item, label: item }))
}

export const arraySymbol = '*'
export const rootSymbol = '$'
export const separator = '.'

export function resolve(...args: string[]): string {
  return args.join(separator)
}

export function resolveRoot(...args: string[]): string {
  return resolve(rootSymbol, ...args)
}

export function isAbsolute(p: string): boolean {
  return p.startsWith(resolve(rootSymbol, ''))
}

export function toArray(p: string): string[] {
  return p.split(separator).filter(n => n !== '')
}

export function getName(p: string): string {
  const arr = toArray(p)
  return arr[arr.length - 1]
}

export function isTagField(schema: MaybeRefOrGetter<UnionFieldSchema | undefined>): boolean {
  const schemaVal = toValue(schema)
  if (!schemaVal) return false
  return schemaVal.type === 'set'
    && schemaVal.elements.type === 'string'
    && !schemaVal.elements.one_of
}
