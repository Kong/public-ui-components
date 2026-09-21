export const percentileOfSorted = (sorted: number[], percentile: number): number => {
  if (!sorted.length) {
    return NaN
  }

  // Force percentile to be within 0 to 100
  const clamped = Math.min(100, Math.max(0, percentile))

  // Ranks the array by index; e.g. p50 of 5 values lands exactly on index 2.
  const rank = (clamped / 100) * (sorted.length - 1)

  const low = Math.floor(rank)
  const high = Math.ceil(rank)

  // Nothing to interpolate here, so just return the low value
  if (low === high) {
    return sorted[low]
  }

  // This is linear interpolation between the low and high values,
  // same as NumPy's `np.percentile`
  return sorted[low] + (sorted[high] - sorted[low]) * (rank - low)
}

export const computePercentiles = (values: number[], percentiles: number[]): Map<number, number> => {
  const sorted = values.filter(v => Number.isFinite(v)).sort((a, b) => a - b)

  return new Map(percentiles.map(p => [p, percentileOfSorted(sorted, p)]))
}
