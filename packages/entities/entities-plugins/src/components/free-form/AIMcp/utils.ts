// Splits comma-separated string values in an object into arrays, mutating the object in place.
export const splitMapValues = (input?: Record<string, any> | null) => {
  if (!input || typeof input !== 'object') {
    return
  }

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      input[key] = value.split(/\s*,\s*/).filter(Boolean)
    }
  }
}

// Joins array values in an object into a comma-separated string, mutating the object in place.
export const joinMapValues = (input?: Record<string, any> | null) => {
  if (!input || typeof input !== 'object') {
    return
  }

  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      input[key] = value.join(', ')
    }
  }
}
