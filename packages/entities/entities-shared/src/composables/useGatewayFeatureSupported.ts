import { compare, validate } from 'compare-versions'
import type { KongManagerConfig } from '../types/app-config'

interface Param {
  gatewayInfo?: KongManagerConfig['gatewayInfo']
  supportedRange: {
    // The supported range for each edition, if not provided, the feature is not supported for this edition
    enterprise?: [string?, string?] // [minimum supported version, maximum supported version]
    community?: [string?, string?] // [minimum supported version, maximum supported version]
  }
}

// This function is used to check if a feature is supported in the current gateway instance
export default function useGatewayFeatureSupported(param: Param) {
  const { gatewayInfo, supportedRange } = param

  // If gatewayInfo is not provided, assume the feature is supported
  if (!gatewayInfo) {
    return true
  }

  const { edition, version: gatewayVersion } = gatewayInfo

  if (!validate(gatewayVersion)) {
    console.error('Invalid version')
    return false
  }

  const supportedRangeForEdition = supportedRange[edition as ('enterprise' | 'community')]
  // If supportedRange[edition] is not provided, then the feature is not supported for this edition
  if (!supportedRangeForEdition) {
    return false
  }

  const [min, max] = supportedRangeForEdition

  // When the minimum supported version is provided, check if the current version is less than it
  // If so, the feature is not supported
  if (min && compare(gatewayVersion, min, '<')) {
    return false
  }

  // When the maximum supported version is provided, check if the current version is greater than it
  // If so, the feature is not supported
  if (max && compare(gatewayVersion, max, '>')) {
    return false
  }

  return true
}
