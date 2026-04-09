export type CpgRedisAlertFlags = {
  useKonnectManagedRedisUi: boolean
  isControlPlaneGroup?: boolean
  isControlPlaneGroupMember?: boolean
}

export function shouldShowCpgRedisAlert(flags: CpgRedisAlertFlags): boolean {
  if (!flags.useKonnectManagedRedisUi) {
    return false
  }

  if (flags.isControlPlaneGroup) {
    return true
  }

  if (flags.isControlPlaneGroupMember) {
    return true
  }

  return false
}

export type CpgRedisAlertMessageKey = 'cpg_redis.alert' | 'cpg_redis.member_alert'

export function getCpgRedisAlertMessageKey(isControlPlaneGroupMember?: boolean): CpgRedisAlertMessageKey {
  return isControlPlaneGroupMember ? 'cpg_redis.member_alert' : 'cpg_redis.alert'
}
