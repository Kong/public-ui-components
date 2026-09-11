type Mergeable = Record<PropertyKey, any>

const isPlainObject = (value: unknown): value is Mergeable => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

/**
 * Deep-merge chart option objects. Nested plain objects are merged
 * recursively; any other value type (including arrays) in `overrides`
 * replaces the value in `base`. `null`/`undefined` overrides are ignored.
 */
export const deepMerge = <T extends Mergeable>(base: T, ...overrides: Array<Mergeable | null | undefined>): T => {
  const result: Mergeable = { ...base }

  for (const override of overrides) {
    if (!override) {
      continue
    }

    for (const [key, value] of Object.entries(override)) {
      if (value === undefined) {
        continue
      }

      const existing = result[key]

      result[key] = isPlainObject(existing) && isPlainObject(value)
        ? deepMerge(existing, value)
        : value
    }
  }

  return result as T
}
