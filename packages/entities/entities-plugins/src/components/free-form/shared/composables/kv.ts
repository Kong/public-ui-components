import type { useSchemaHelpers } from './schema'
import * as utils from '../utils'

export type KeyId = symbol & { __brand: 'KeyId' }
type Data = Record<string, any>

let idCounter = 0
function useId() {
  return `kv_${++idCounter}`
}

export function useKeyValueStore(
  getSchema: ReturnType<typeof useSchemaHelpers>['getSchema'],
) {
  // Use WeakMap to avoid memory leaks
  // KeyId will be cleaned up automatically when the corresponding map entry in the form data is removed
  const store = new WeakMap<KeyId, string>()

  function createEntry(name: string = ''): KeyId {
    const id = Symbol(useId()) as KeyId
    store.set(id, name)
    return id
  }

  function getName(id: KeyId) {
    return store.get(id)
  }

  function updateName(id: KeyId, name: string) {
    if (store.has(id)) {
      store.set(id, name)
    }
  }

  function deleteEntry(id: KeyId) {
    store.delete(id)
  }

  function serialize<T extends Data = Data>(data: T) {
    return serializeData(data, getSchema, createEntry)
  }

  function deserialize<T extends Data = Data>(data: T) {
    return deserializeData(data, getSchema, getName)
  }

  ; (window as any).kvStore = store

  return {
    createEntry,
    getName,
    updateName,
    deleteEntry,
    serialize,
    deserialize,
  }
}

export function serializeData<T extends Data>(
  data: T,
  getSchema: ReturnType<typeof useSchemaHelpers>['getSchema'],
  createEntry: (name: string) => KeyId,
) {
  const traverse = (value: any, path?: string): any => {
    if (value == null || typeof value !== 'object') {
      return value
    }

    if (Array.isArray(value)) {
      return value.map((item, index) => {
        const itemPath = path ? utils.resolve(path, `${index}`) : `${index}`
        return traverse(item, itemPath)
      })
    }

    const schema = path ? getSchema(path) : getSchema()

    if (schema?.type === 'map') {
      const mapValue = value as Record<PropertyKey, any>
      const nextValue: Record<KeyId, any> = {}

      Object.keys(mapValue).forEach((key) => {
        const entryId = createEntry(key)
        const childValue = mapValue[key]
        const childPath = path ? utils.resolve(path, key) : key

        nextValue[entryId] = traverse(childValue, childPath)
      })

      Object.getOwnPropertySymbols(mapValue).forEach((key) => {
        nextValue[key as KeyId] = mapValue[key]
      })

      return nextValue
    }

    const nextValue: Record<string, any> = {}
    Object.keys(value).forEach((key) => {
      const childPath = path ? utils.resolve(path, key) : key
      nextValue[key] = traverse(value[key], childPath)
    })

    return nextValue
  }

  return traverse(data)
}

export function deserializeData<T extends Data>(
  data: T,
  getSchema: ReturnType<typeof useSchemaHelpers>['getSchema'],
  getName: (id: KeyId) => string | undefined,
) {
  const traverse = (value: any, path?: string): any => {
    if (value == null || typeof value !== 'object') {
      return value
    }

    if (Array.isArray(value)) {
      return value.map((item, index) => {
        const itemPath = path ? utils.resolve(path, `${index}`) : `${index}`
        return traverse(item, itemPath)
      })
    }

    const schema = path ? getSchema(path) : getSchema()

    if (schema?.type === 'map') {
      const mapValue = value as Record<KeyId, unknown>
      const nextValue: Record<PropertyKey, any> = {}

      Object.getOwnPropertySymbols(mapValue).forEach((key) => {
        const childValue = mapValue[key as KeyId]
        const keyId = key as KeyId
        const name = getName(keyId)

        if (name == null) {
          throw new Error(`Missing name for key ID: ${String(keyId)}`)
        }

        const childPath = path ? utils.resolve(path, name) : name

        nextValue[name] = traverse(childValue, childPath)
      })

      return nextValue
    }

    const nextValue: Record<string, any> = {}
    Object.keys(value).forEach((key) => {
      const childPath = path ? utils.resolve(path, key) : key
      nextValue[key] = traverse(value[key], childPath)
    })

    return nextValue
  }

  return traverse(data)
}
