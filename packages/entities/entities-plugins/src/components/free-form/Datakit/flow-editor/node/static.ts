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

export function fieldValueToStoreValue(values: FieldValue): StoreValue {
  const storeValues: StoreValue = {}

  for (const [key, value] of Object.entries(values)) {
    if (!value && value !== '') {
      // Ignore undefined and null values
      continue
    }

    if (value === 'null') {
      storeValues[key] = null
    } else if (value === 'true') {
      storeValues[key] = true
    } else if (value === 'false') {
      storeValues[key] = false
    } else if (/^-?\d+$/.test(value)) {
      // Integer
      storeValues[key] = parseInt(value, 10)
    } else if (/^-?\d+\.\d+$/.test(value)) {
      // Float
      storeValues[key] = parseFloat(value)
    } else {
      try {
        // Try to parse JSON objects or arrays
        if ((value.startsWith('{') && value.endsWith('}')) ||
            (value.startsWith('[') && value.endsWith(']'))) {
          storeValues[key] = JSON.parse(value)
        } else {
          // Plain string
          storeValues[key] = value
        }
      } catch (e) {
        // If JSON parsing fails, treat as plain string
        storeValues[key] = value
      }
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
