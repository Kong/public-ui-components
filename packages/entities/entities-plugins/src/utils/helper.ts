export function lcsRecursive(a: string, b: string): string {
  const arrA = a.split('')
  const arrB = b.split('')
  const m = arrA.length
  const n = arrB.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  // Build DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arrA[i - 1] === arrB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to get LCS string
  let lcs = ''
  let i = m, j = n
  while (i > 0 && j > 0) {
    if (arrA[i - 1] === arrB[j - 1]) {
      lcs = arrA[i - 1] + lcs
      i--
      j--
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }
  return lcs
}

export function within16Weeks(targetTs: number) {
  const nowTs = Date.now()
  const SIXTEEN_WEEKS_MS = 16 * 7 * 24 * 60 * 60 * 1000
  return Math.abs(nowTs - targetTs) <= SIXTEEN_WEEKS_MS
}
