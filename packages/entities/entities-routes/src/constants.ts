import {
  RoutingRulesEntities,
  type Destinations,
  type ExpressionsRouteRulesFields,
  type HeaderFields,
  type Method,
  type SharedRouteRulesFields,
  type Sources,
  type TraditionalRouteRulesFields,
} from './types'

export const INITIAL_TRADITIONAL_ROUTE_RULES_VALUES = {
  [RoutingRulesEntities.PATHS]: [''] as string[],
  [RoutingRulesEntities.SNIS]: [''] as string[],
  [RoutingRulesEntities.HOSTS]: [''] as string[],
  [RoutingRulesEntities.METHODS]: [] as Method[],
  [RoutingRulesEntities.HEADERS]: [{ header: '', values: '' }] as HeaderFields[],
  [RoutingRulesEntities.SOURCES]: [{ ip: '', port: null }] as unknown as Sources[],
  [RoutingRulesEntities.DESTINATIONS]: [{ ip: '', port: null }] as unknown as Destinations[],
}

export const PROTOCOLS_TO_ROUTE_RULES = {
  http: [RoutingRulesEntities.PATHS, RoutingRulesEntities.METHODS, RoutingRulesEntities.HOSTS, RoutingRulesEntities.HEADERS],
  https: [RoutingRulesEntities.PATHS, RoutingRulesEntities.METHODS, RoutingRulesEntities.HOSTS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  'http,https': [RoutingRulesEntities.PATHS, RoutingRulesEntities.METHODS, RoutingRulesEntities.HOSTS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  'https,http': [RoutingRulesEntities.PATHS, RoutingRulesEntities.METHODS, RoutingRulesEntities.HOSTS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  grpc: [RoutingRulesEntities.PATHS, RoutingRulesEntities.HOSTS, RoutingRulesEntities.HEADERS],
  grpcs: [RoutingRulesEntities.PATHS, RoutingRulesEntities.HOSTS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  'grpc,grpcs': [RoutingRulesEntities.PATHS, RoutingRulesEntities.HOSTS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  'grpcs,grpc': [RoutingRulesEntities.PATHS, RoutingRulesEntities.HOSTS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  udp: [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS],
  tls: [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS, RoutingRulesEntities.SNIS],
  tcp: [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS],
  'tls,udp': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS, RoutingRulesEntities.SNIS],
  'udp,tls': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS, RoutingRulesEntities.SNIS],
  'tcp,udp': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS],
  'udp,tcp': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS],
  'tcp,tls': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS, RoutingRulesEntities.SNIS],
  'tls,tcp': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS, RoutingRulesEntities.SNIS],
  'tcp,tls,udp': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS, RoutingRulesEntities.SNIS],
  'tls,udp,tcp': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS, RoutingRulesEntities.SNIS],
  'udp,tcp,tls': [RoutingRulesEntities.SOURCES, RoutingRulesEntities.DESTINATIONS, RoutingRulesEntities.SNIS],
  tls_passthrough: [RoutingRulesEntities.SNIS],
  ws: [RoutingRulesEntities.PATHS, RoutingRulesEntities.HOSTS, RoutingRulesEntities.HEADERS],
  wss: [RoutingRulesEntities.PATHS, RoutingRulesEntities.HOSTS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  'ws,wss': [RoutingRulesEntities.PATHS, RoutingRulesEntities.HOSTS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  'wss,ws': [RoutingRulesEntities.PATHS, RoutingRulesEntities.HOSTS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
} satisfies Record<string, string[]>

export const HTTP_REDIRECT_STATUS_CODES = [
  { label: '426', value: 426 },
  { label: '301', value: 301 },
  { label: '302', value: 302 },
  { label: '307', value: 307 },
  { label: '308', value: 308 },
]

export const PATH_HANDLING_OPTIONS = [
  { label: 'v0', value: 'v0' },
  { label: 'v1', value: 'v1' },
]

export const INITIAL_SHARED_ROUTE_RULES_FIELDS = {
  https_redirect_status_code: 426,
  strip_path: true,
  preserve_host: false,
  request_buffering: true,
  response_buffering: true,
} satisfies SharedRouteRulesFields

export const INITIAL_ROUTE_RULES_FIELDS = {
  ...INITIAL_SHARED_ROUTE_RULES_FIELDS,
  ...{
    paths: [''],
    regex_priority: 0,
    path_handling: 'v0',
  } satisfies Omit<TraditionalRouteRulesFields, keyof SharedRouteRulesFields>,
  ...{
    expression: '',
    priority: 0,
  } satisfies Omit<ExpressionsRouteRulesFields, keyof SharedRouteRulesFields>,
}

export const DEFAULT_PROTOCOL = 'https'
