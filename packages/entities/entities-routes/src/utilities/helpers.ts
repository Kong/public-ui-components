import { INITIAL_ROUTE_RULES_FIELDS } from '../constants'
import { RoutingRulesEntities } from '../types'

export const isRoutePayloadValid = (val: any): boolean => {
  return 'service' in val && 'tags' in val && 'regex_priority' in val && 'path_handling' in val && 'protocols' in val
}

export const isDefinedByBasic = (data: Record<string, any>): boolean => {
  if (typeof data.expression === 'string' && data.expression.length > 0) {
    return false
  }

  if ((data.protocols || []).sort().join(',') !== 'http,https') {
    return false
  }

  if (
    data[RoutingRulesEntities.PATHS]?.length > 1 ||
    data[RoutingRulesEntities.HOSTS]?.length > 1 ||
    data[RoutingRulesEntities.HEADERS]?.length > 0 ||
    data[RoutingRulesEntities.SNIS]?.length > 0 ||
    data[RoutingRulesEntities.SOURCES]?.length > 0 ||
    data[RoutingRulesEntities.DESTINATIONS]?.length > 0
  ) {
    return false
  }

  const fields: Array<keyof typeof INITIAL_ROUTE_RULES_FIELDS> = [
    'path_handling',
    'regex_priority',
    'https_redirect_status_code',
    'preserve_host',
    'request_buffering',
    'response_buffering',
  ]
  if (fields.some((key) => data[key] !== INITIAL_ROUTE_RULES_FIELDS[key])) {
    return false
  }

  return true
}
