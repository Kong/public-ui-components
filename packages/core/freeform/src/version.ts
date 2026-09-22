import { compare, validate } from 'compare-versions'

/**
 * Whether `minRequiredVersion` is satisfied by `runtimeVersion`. Fails open
 * (returns `true`) whenever either version is missing or unparsable, so a
 * host that hasn't wired up version info yet never disables anything.
 */
export function isVersionSupported(runtimeVersion: string | undefined, minRequiredVersion: string | undefined): boolean {
  if (!runtimeVersion || !minRequiredVersion) {
    return true
  }
  if (!validate(runtimeVersion) || !validate(minRequiredVersion)) {
    return true
  }
  return compare(runtimeVersion, minRequiredVersion, '>=')
}
