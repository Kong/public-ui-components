
import type { TranslationKey } from '../composables/useI18n'
import { type SpanAttributeSchema, type SpanEventAttributeSchema } from '../types'

export const SPAN_ZERO_ID = '0000000000000000'
export const SPAN_ATTRIBUTE_VALUE_UNKNOWN = 'unknown'

// Internally used here only
const SPAN_ATTR_KEY_KONG_PREFIX = 'proxy.kong'

export enum SpanAttributeKeys {
  _INTERNAL_END_TIME = '$$ui_internal.end_time',
  _INTERNAL_START_TIME = '$$ui_internal.start_time',
  CLIENT_ADDRESS = 'client.address',
  CLIENT_PORT = 'client.port',
  DB_STATEMENT = 'db.statement',
  DB_SYSTEM = 'db.system',
  DESTINATION_ADDRESS = 'destination.address',
  HTTP_REQUEST_METHOD = 'http.request.method',
  HTTP_RESPONSE_STATUS_CODE = 'http.response.status_code',
  HTTP_ROUTE = 'http.route',
  KONG_CONSUMER_ID = `${SPAN_ATTR_KEY_KONG_PREFIX}.consumer.id`,
  KONG_LATENCY_TOTAL_MS = `${SPAN_ATTR_KEY_KONG_PREFIX}.latency_total_ms`,
  KONG_PLUGIN_ID = `${SPAN_ATTR_KEY_KONG_PREFIX}.plugin.id`,
  KONG_REDIS_TOTAL_IO_MS = `${SPAN_ATTR_KEY_KONG_PREFIX}.redis.total_io_ms`,
  KONG_REQUEST_ID = `${SPAN_ATTR_KEY_KONG_PREFIX}.request.id`,
  KONG_ROUTE_ID = `${SPAN_ATTR_KEY_KONG_PREFIX}.route.id`,
  KONG_SAMPLING_RULE = `${SPAN_ATTR_KEY_KONG_PREFIX}.sampling_rule`,
  KONG_SERVICE_ID = `${SPAN_ATTR_KEY_KONG_PREFIX}.service.id`,
  KONG_TARGET_ID = `${SPAN_ATTR_KEY_KONG_PREFIX}.target.id`,
  KONG_TCPSOCK_TOTAL_IO_MS = `${SPAN_ATTR_KEY_KONG_PREFIX}.tcpsock.total_io_ms`,
  KONG_UPSTREAM_ADDR = `${SPAN_ATTR_KEY_KONG_PREFIX}.upstream.addr`,
  KONG_UPSTREAM_CONNECT_DURATION_MS = `${SPAN_ATTR_KEY_KONG_PREFIX}.upstream.connect_duration_ms`,
  KONG_UPSTREAM_HOST = `${SPAN_ATTR_KEY_KONG_PREFIX}.upstream.host`,
  KONG_UPSTREAM_ID = `${SPAN_ATTR_KEY_KONG_PREFIX}.upstream.id`,
  KONG_UPSTREAM_LB_ALGORITHM = `${SPAN_ATTR_KEY_KONG_PREFIX}.upstream.lb_algorithm`,
  KONG_UPSTREAM_READ_RESPONSE_DURATION_MS = `${SPAN_ATTR_KEY_KONG_PREFIX}.upstream.read_response_duration_ms`,
  KONG_UPSTREAM_RESPONSE_DURATION_MS = `${SPAN_ATTR_KEY_KONG_PREFIX}.upstream.response_duration_ms`,
  KONG_UPSTREAM_STATUS_CODE = `${SPAN_ATTR_KEY_KONG_PREFIX}.upstream.status_code`,
  KONG_UPSTREAM_TTFB_MS = `${SPAN_ATTR_KEY_KONG_PREFIX}.upstream.ttfb_ms`,
  NETWORK_PEER_ADDRESS = 'network.peer.address',
  NETWORK_PEER_NAME = 'network.peer.name',
  NETWORK_PEER_PORT = 'network.peer.port',
  NETWORK_PROTOCOL_NAME = 'network.protocol.name',
  NETWORK_PROTOCOL_VERSION = 'network.protocol.version',
  NETWORK_TRANSPORT = 'network.transport',
  SERVER_ADDRESS = 'server.address',
  SERVER_PORT = 'server.port',
  URL_FULL = 'url.full',
  URL_QUERY = 'url.query',
  URL_SCHEME = 'url.scheme',
}

/**
 * These definitions are exported from Gateway's codebase.
 * They are subject to change in the future.
 */
const unnamedSpanAttributes: Record<SpanAttributeKeys, Omit<SpanAttributeSchema, 'name'>> = {
  [SpanAttributeKeys.CLIENT_ADDRESS]: {
    type: 'IpAddr',
    sampling: {
      aliases: ['net.src.ip'],
    },
  },
  [SpanAttributeKeys.CLIENT_PORT]: {
    type: 'Int',
    sampling: {
      aliases: ['net.src.port'],
    },
  },
  [SpanAttributeKeys.DESTINATION_ADDRESS]: {
    type: 'IpAddr',
    sampling: true,
  },
  [SpanAttributeKeys.SERVER_ADDRESS]: {
    type: 'String',
    sampling: {
      aliases: [
        'tls.sni',
        { name: 'net.dst.ip', type: 'IpAddr' },
      ],
    },
  },
  [SpanAttributeKeys.SERVER_PORT]: {
    type: 'Int',
    sampling: {
      aliases: ['net.dst.port'],
    },
  },
  [SpanAttributeKeys.NETWORK_PROTOCOL_NAME]: {
    type: 'String',
    sampling: {
      aliases: ['net.protocol'],
    },
  },
  [SpanAttributeKeys.NETWORK_PROTOCOL_VERSION]: {
    type: 'String',
    sampling: true,
  },
  [SpanAttributeKeys.NETWORK_TRANSPORT]: {
    type: 'String',
    sampling: true,
  },
  [SpanAttributeKeys.URL_SCHEME]: {
    type: 'String',
    sampling: {
      aliases: ['net.protocol'],
    },
  },
  [SpanAttributeKeys.HTTP_REQUEST_METHOD]: {
    type: 'String',
    sampling: {
      aliases: ['http.method'],
    },
  },
  [SpanAttributeKeys.HTTP_ROUTE]: {
    type: 'String',
    sampling: {
      aliases: ['http.path'],
    },
  },
  [SpanAttributeKeys.URL_FULL]: {
    type: 'String',
    sampling: true,
  },
  [SpanAttributeKeys.URL_QUERY]: {
    type: 'String',
    sampling: true,
  },
  [SpanAttributeKeys.HTTP_RESPONSE_STATUS_CODE]: {
    type: 'Int',
    sampling: true,
  },
  [SpanAttributeKeys.NETWORK_PEER_ADDRESS]: {
    type: 'IpAddr',
    sampling: true,
  },
  /**
   * This is non-standard but it's available to us via the balancer
   */
  [SpanAttributeKeys.NETWORK_PEER_NAME]: {
    type: 'String',
    sampling: true,
  },
  [SpanAttributeKeys.NETWORK_PEER_PORT]: {
    type: 'Int',
    sampling: true,
  },
  [SpanAttributeKeys.KONG_SERVICE_ID]: {
    type: 'String',
    sampling: true,
  },
  [SpanAttributeKeys.KONG_ROUTE_ID]: {
    type: 'String',
    sampling: true,
  },
  [SpanAttributeKeys.KONG_CONSUMER_ID]: {
    type: 'String',
    sampling: true,
  },
  [SpanAttributeKeys.KONG_UPSTREAM_ID]: {
    type: 'String',
    sampling: true,
  },
  [SpanAttributeKeys.KONG_UPSTREAM_STATUS_CODE]: {
    type: 'Int',
    sampling: true,
  },
  [SpanAttributeKeys.KONG_UPSTREAM_ADDR]: {
    type: 'IpAddr',
    sampling: true,
  },
  [SpanAttributeKeys.KONG_UPSTREAM_HOST]: {
    type: 'String',
    sampling: true,
  },
  [SpanAttributeKeys.KONG_UPSTREAM_LB_ALGORITHM]: {
    type: 'String',
  },
  [SpanAttributeKeys.KONG_TARGET_ID]: {
    type: 'String',
    sampling: true,
  },
  [SpanAttributeKeys.KONG_PLUGIN_ID]: {
    type: 'String',
  },
  [SpanAttributeKeys.KONG_SAMPLING_RULE]: {
    type: 'String',
  },
  [SpanAttributeKeys.KONG_REQUEST_ID]: {
    type: 'String',
  },
  [SpanAttributeKeys.KONG_UPSTREAM_TTFB_MS]: {
    type: 'Int',
    sampling: true,
  },
  [SpanAttributeKeys.KONG_UPSTREAM_READ_RESPONSE_DURATION_MS]: {
    type: 'Int',
    sampling: true,
  },
  [SpanAttributeKeys.KONG_UPSTREAM_CONNECT_DURATION_MS]: {
    type: 'Int',
  },
  [SpanAttributeKeys.KONG_UPSTREAM_RESPONSE_DURATION_MS]: {
    type: 'Int',
  },
  [SpanAttributeKeys.KONG_LATENCY_TOTAL_MS]: {
    type: 'Int',
    sampling: true,
  },
  [SpanAttributeKeys.KONG_REDIS_TOTAL_IO_MS]: {
    type: 'Int',
    sampling: true,
  },
  [SpanAttributeKeys.KONG_TCPSOCK_TOTAL_IO_MS]: {
    type: 'Int',
    sampling: true,
  },
  [SpanAttributeKeys.DB_SYSTEM]: {
    type: 'String',
  },
  [SpanAttributeKeys.DB_STATEMENT]: {
    type: 'String',
  },
  [SpanAttributeKeys._INTERNAL_START_TIME]: {
    type: 'String',
    internal: true,
  },
  [SpanAttributeKeys._INTERNAL_END_TIME]: {
    type: 'String',
    internal: true,
  },
} satisfies Record<SpanAttributeKeys, Omit<SpanAttributeSchema, 'name'>>
//^^^^^^^^^ `satisfies` helps us to identify missing enums

export const SPAN_ATTRIBUTES =
  Object.fromEntries(Object.entries(unnamedSpanAttributes)
    .map(([key, value]) => ([key, { name: key, ...value } as SpanAttributeSchema]))) as Record<SpanAttributeKeys, SpanAttributeSchema>

export const SPAN_EVENT_ATTRIBUTES = {
  MESSAGE: {
    name: 'message',
    type: 'String',
  },
  EXCEPTION_MESSAGE: {
    name: 'exception.message',
    type: 'String',
  },
} satisfies Record<string, SpanEventAttributeSchema>

export const SPAN_LATENCY_ATTRIBUTES: Record<string, TranslationKey> = {
  'proxy.kong.latency.total': 'trace_viewer.latency.labels.total',
  'proxy.kong.latency.internal': 'trace_viewer.latency.labels.internal',
  'proxy.kong.latency.upstream': 'trace_viewer.latency.labels.upstream',
  'proxy.kong.latency.3p.total_io': 'trace_viewer.latency.labels.3p',
  'proxy.kong.latency.client': 'trace_viewer.latency.labels.client',
}
