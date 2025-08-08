export type JsonValue = JsonPrimitive | JsonObject | JsonArray

export type JsonPrimitive = string | number | boolean | null

export type JsonObject = {
  [key: string]: JsonValue
}

export type JsonArray = JsonValue[]

export type FieldValue = Record<string, string>

export type StoreValue = JsonObject

export function storeValueToFieldValue(values: StoreValue): FieldValue {
  const formValues: FieldValue = {}
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'string' || typeof value === 'number') {
      formValues[key] = String(value)
    } else if (typeof value === 'boolean') {
      formValues[key] = value ? 'true' : 'false'
    } else if (value === null) {
      formValues[key] = 'null'
    } else {
      formValues[key] = JSON.stringify(value)
    }
  }
  return formValues
}

export function renameKeyAndKeepOrder(values: StoreValue, oldKey: string, newKey: string): StoreValue {
  const newObj: StoreValue = {}
  for (const key of Object.keys(values)) {
    if (key === oldKey) {
      newObj[newKey] = values[oldKey]
    } else {
      newObj[key] = values[key]
    }
  }
  return newObj
}
