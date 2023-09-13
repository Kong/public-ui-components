import { describe } from 'vitest'

const supportsUtc = Intl.DateTimeFormat().resolvedOptions().timeZone === 'UTC'

// Squash type errors; we don't actually export this file from the package, so it's fine that the type depends on Vitest.
export const runUtcTest: any = supportsUtc ? describe : describe.skip

export const runNonUtcTest: any = supportsUtc ? describe.skip : describe
