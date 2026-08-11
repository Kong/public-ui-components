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
    if (typeof value === 'object' && value !== null) {
      // Handle objects and arrays with JSON.stringify
      formValues[key] = JSON.stringify(value)
    } else {
      // Handle primitive values with String():
      // - String(true) -> 'true'
      // - String(null) -> 'null'
      // - String(123) -> '123'
      // - String('abc') -> 'abc'
      formValues[key] = String(value)
    }
  }
  return formValues
}

export function fieldValueToStoreValue(values: FieldValue): StoreValue {
  const storeValues: StoreValue = {}

  for (const [key, value] of Object.entries(values)) {
    if (value == null) {
      // Ignore undefined and null values
      continue
    }

    // Default to the string value itself
    storeValues[key] = value

    // Handle special cases that need conversion
    try {
      // Special handling for 'null'
      if (value === 'null') {
        storeValues[key] = null
      } else if (
        value === 'true' || value === 'false' // boolean strings
        || /^-?\d+(\.\d+)?$/.test(value) // number strings
        || (value.startsWith('{') && value.endsWith('}')) // object strings
        || (value.startsWith('[') && value.endsWith(']')) // array strings
      ) {
        // Try to parse known JSON formats
        storeValues[key] = JSON.parse(value)
      }
      // For plain strings, we already set the default value above
    } catch {
      // no op
    }
  }

  return storeValues
}

export function renameKeyAndKeepOrder<T extends StoreValue | FieldValue>(values: T, oldKey: string, newKey: string): T {
  const newObj: T = {} as T
  for (const key of Object.keys(values)) {
    if (key === oldKey) {
      newObj[newKey] = values[oldKey]
    } else {
      newObj[key] = values[key]
    }
  }
  return newObj
}
