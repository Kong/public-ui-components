export default ({
  bucketCount,
  minStamp,
  maxStamp,
  timestamps,
}: {
  bucketCount: number
  minStamp: number
  maxStamp: number
  timestamps: number[]
}): Array<[number, number]> => {
  const sorted = [...timestamps]
    .filter((timestamp) => timestamp >= minStamp && timestamp <= maxStamp)
    .sort((a, b) => a - b)

  const bucketCounts: Array<[number, number]> = []
  if ((maxStamp - minStamp) < (bucketCount - 2)) {
    return []
  }
  const bucketSizeMs = (maxStamp - minStamp) / bucketCount

  let checkIndex = 0
  for (let bucket = 0; bucket < bucketCount; bucket++) {
    const bucketMin = minStamp + (bucket * bucketSizeMs)
    const bucketMax = minStamp + ((bucket + 1) * bucketSizeMs)
    let count = 0
    while (checkIndex < sorted.length
           && sorted[checkIndex] >= bucketMin
           && sorted[checkIndex] <= bucketMax) {
      count++
      checkIndex++
    }
    bucketCounts.push([Math.ceil(bucketMin), count])
  }

  return bucketCounts
}
