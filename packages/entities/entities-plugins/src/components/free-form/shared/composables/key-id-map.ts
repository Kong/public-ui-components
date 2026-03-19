import type { useSchemaHelpers } from './schema'
import { resolve, mapSymbol } from '../utils'

export type KeyId = `kid:${number}`
type Data = Record<string, any>

let idCounter = 0
function useId(): KeyId {
  return `kid:${++idCounter}`
}

export function useKeyIdMap(
  getSchema: ReturnType<typeof useSchemaHelpers>['getSchema'],
) {
  const store = new Map<KeyId, string>()

  function createKey(name: string = ''): KeyId {
    const id = useId()
    store.set(id, name)
    return id
  }

  function getKey(id: KeyId) {
    return store.get(id)
  }

  function updateKey(id: KeyId, key: string) {
    if (store.has(id)) {
      store.set(id, key)
    }
  }

  function deleteKey(id: KeyId) {
    store.delete(id)
  }

  function serialize<T extends Data = Data>(data: T) {
    return serializeData(data, getSchema, createKey)
  }

  function deserialize<T extends Data = Data>(data: T) {
    return deserializeData(data, getSchema, getKey)
  }

  ; (window as any).keyIdMap = store

  return {
    createKey,
    getKey,
    updateKey,
    deleteKey,
    serialize,
    deserialize,
  }
}

export function serializeData<T extends Data>(
  data: T,
  getSchema: ReturnType<typeof useSchemaHelpers>['getSchema'],
  createKeyId: (name: string) => KeyId,
) {
  const traverse = (value: any, path?: string): any => {
    if (value == null || typeof value !== 'object') {
      return value
    }

    if (Array.isArray(value)) {
      return value.map((item, index) => {
        const itemPath = path ? resolve(path, `${index}`) : `${index}`
        return traverse(item, itemPath)
      })
    }

    const schema = path ? getSchema(path) : getSchema()

    if (schema?.type === 'map') {
      const mapValue = value as Record<PropertyKey, any>
      const nextValue: Record<KeyId, any> = {}

      Object.keys(mapValue).forEach((key) => {
        const entryId = createKeyId(key)
        const childValue = mapValue[key]
        const childPath = path ? resolve(path, key) : key

        nextValue[entryId] = traverse(childValue, childPath)
      })

      return nextValue
    }

    const nextValue: Record<string, any> = {}
    Object.keys(value).forEach((key) => {
      const childPath = path ? resolve(path, key) : key
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
        const itemPath = path ? resolve(path, `${index}`) : `${index}`
        return traverse(item, itemPath)
      })
    }

    const schema = path ? getSchema(path) : getSchema()
    // console.log('deserializing path', path, 'schema', schema)

    if (schema?.type === 'map') {
      const mapValue = value as Record<KeyId, unknown>
      const nextValue: Record<PropertyKey, any> = {}

      Object.keys(mapValue).forEach((key) => {
        const keyId = key as KeyId
        const childValue = mapValue[keyId]
        const name = getName(keyId)

        if (name == null) {
          throw new Error(`Missing name for key ID: ${String(keyId)}`)
        }

        const nameOrSymbol = name || mapSymbol

        const childPath = path ? resolve(path, nameOrSymbol) : nameOrSymbol

        nextValue[name] = traverse(childValue, childPath)
      })

      return nextValue
    }

    const nextValue: Record<string, any> = {}
    Object.keys(value).forEach((key) => {
      const childPath = path ? resolve(path, key) : key
      nextValue[key] = traverse(value[key], childPath)
    })

    return nextValue
  }

  return traverse(data)
}
