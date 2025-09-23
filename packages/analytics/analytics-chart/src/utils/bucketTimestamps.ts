export default ({
  groupSizeMs,
  minStamp,
  maxStamp,
  timestamps,
}: {
  groupSizeMs: number
  minStamp: number
  maxStamp: number
  timestamps: number[]
}): Array<[number, number]> => {
  const sorted = [...timestamps].sort((a, b) => a - b)
  const groupCounts: Array<[number, number]> = []

  let checkIndex = 0
  let bucket = minStamp
  while (bucket <= maxStamp && minStamp < maxStamp) {
    const nextBucket = bucket + groupSizeMs

    let count = 0
    for (let i = checkIndex; i < sorted.length; i++) {
      if (sorted[i] >= bucket && sorted[i] < nextBucket) {
        count++
        checkIndex = i + 1
      } else {
        break
      }
    }

    groupCounts.push([
      bucket,
      count,
    ])

    bucket = nextBucket
  }

  return groupCounts
}
