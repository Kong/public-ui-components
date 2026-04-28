import { describe, it, expect } from 'vitest'
import { getCpgRedisAlertMessageKey, shouldShowCpgRedisAlert } from './cpgRedisAlert'

describe('shouldShowCpgRedisAlert', () => {
  it('returns false when Konnect Konnect managed Redis is disabled', () => {
    expect(shouldShowCpgRedisAlert({
      useKonnectManagedRedisUi: false,
      isControlPlaneGroup: true,
    })).toBe(false)

    expect(shouldShowCpgRedisAlert({
      useKonnectManagedRedisUi: false,
      isControlPlaneGroupMember: true,
    })).toBe(false)
  })

  it('returns true for a CPGp when Konnect managed Redis UI is enabled', () => {
    expect(shouldShowCpgRedisAlert({
      useKonnectManagedRedisUi: true,
      isControlPlaneGroup: true,
      isControlPlaneGroupMember: false,
    })).toBe(true)
  })

  it('returns true for a CP that is only a group member when Konnect managed Redis is enabled', () => {
    expect(shouldShowCpgRedisAlert({
      useKonnectManagedRedisUi: true,
      isControlPlaneGroup: false,
      isControlPlaneGroupMember: true,
    })).toBe(true)
  })

  it('returns false for a standalone CP (neither group nor member)', () => {
    expect(shouldShowCpgRedisAlert({
      useKonnectManagedRedisUi: true,
      isControlPlaneGroup: false,
      isControlPlaneGroupMember: false,
    })).toBe(false)
  })
})

describe('getCpgRedisAlertMessageKey', () => {
  it('uses member copy when CP is a group member', () => {
    expect(getCpgRedisAlertMessageKey(true)).toBe('cpg_redis.member_alert')
  })

  it('uses group-level copy when CP is not a member', () => {
    expect(getCpgRedisAlertMessageKey(false)).toBe('cpg_redis.alert')
    expect(getCpgRedisAlertMessageKey(undefined)).toBe('cpg_redis.alert')
  })
})
