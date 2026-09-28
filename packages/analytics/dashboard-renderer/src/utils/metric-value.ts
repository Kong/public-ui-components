/** Coerces a raw explore/request value into a finite number */
export const toMetricValue = (rawValue: unknown): number | undefined => {
  if (rawValue === null || rawValue === undefined || (typeof rawValue === 'string' && rawValue.trim() === '')) {
    return undefined
  }

  const value = Number(rawValue)

  return Number.isFinite(value) ? value : undefined
}
