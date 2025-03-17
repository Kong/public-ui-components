import { RoutingRulesEntities, type Destinations, type ExpressionsRouteRulesFields, type HeaderFields, type MethodsFields, type SharedRouteRulesFields, type Sources, type TraditionalRouteRulesFields } from './types'

export const INITIAL_TRADITIONAL_ROUTE_RULES_VALUES = {
  [RoutingRulesEntities.PATHS]: [''] as string[],
  [RoutingRulesEntities.SNIS]: [''] as string[],
  [RoutingRulesEntities.HOSTS]: [''] as string[],
  [RoutingRulesEntities.METHODS]: {
    GET: false,
    PUT: false,
    POST: false,
    PATCH: false,
    DELETE: false,
    OPTIONS: false,
    HEAD: false,
    CONNECT: false,
    TRACE: false,
    CUSTOM: false,
  } as MethodsFields,
  [RoutingRulesEntities.HEADERS]: [{ header: '', values: '' }] as HeaderFields[],
  [RoutingRulesEntities.SOURCES]: [{ ip: '', port: null }] as unknown as Sources[],
  [RoutingRulesEntities.DESTINATIONS]: [{ ip: '', port: null }] as unknown as Destinations[],
}

export const PROTOCOLS_TO_ROUTE_RULES = {
  http: [RoutingRulesEntities.HOSTS, RoutingRulesEntities.METHODS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS],
  https: [RoutingRulesEntities.HOSTS, RoutingRulesEntities.METHODS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  'http,https': [RoutingRulesEntities.HOSTS, RoutingRulesEntities.METHODS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  'https,http': [RoutingRulesEntities.HOSTS, RoutingRulesEntities.METHODS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  grpc: [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS],
  grpcs: [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  'grpc,grpcs': [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  'grpcs,grpc': [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
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
  ws: [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS],
  wss: [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  'ws,wss': [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
  'wss,ws': [RoutingRulesEntities.HOSTS, RoutingRulesEntities.PATHS, RoutingRulesEntities.HEADERS, RoutingRulesEntities.SNIS],
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
