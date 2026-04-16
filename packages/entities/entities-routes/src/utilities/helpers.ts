import { INITIAL_ROUTE_RULES_FIELDS, DEFAULT_PROTOCOL } from '../constants'
import { RoutingRulesEntities } from '../types'

export const isDefinedByBasic = (data: Record<string, any>): boolean => {
  if (typeof data.expression === 'string' && data.expression.length > 0) {
    return false
  }

  if ((data.protocols || []).sort().join(',') !== DEFAULT_PROTOCOL) {
    return false
  }

  if (
    data[RoutingRulesEntities.PATHS]?.length > 1 ||
    data[RoutingRulesEntities.HOSTS]?.length > 1 ||
    (data[RoutingRulesEntities.HEADERS] && typeof data[RoutingRulesEntities.HEADERS] === 'object') ||
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
