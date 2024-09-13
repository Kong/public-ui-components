
import { type SpanAttributeSchema, type SpanEventAttributeSchema } from '../types'

export const SPAN_ZERO_ID = '0000000000000000'
export const SPAN_ATTRIBUTE_VALUE_UNKNOWN = 'unknown'

// Internally used here only
const SPAN_ATTR_KEY_KONG_PREFIX = 'proxy.kong'

/**
 * These definitions are exported from Gateway's codebase.
 * They are subject to change in the future.
 */
export const SPAN_ATTRIBUTES = {
  CLIENT_ADDRESS: {
    name: 'client.address',
    alias: 'net.src.ip',
    type: 'IpAddr',
    useForSampling: true,
  },
  CLIENT_PORT: {
    name: 'client.port',
    alias: 'net.src.port',
    type: 'Int',
    useForSampling: true,
  },
  DESTINATION_ADDRESS: {
    name: 'destination.address',
    type: 'IpAddr',
    useForSampling: true,
  },
  SERVER_ADDRESS: {
    name: 'server.address',
    alias: 'net.dst.ip',
    type: 'IpAddr',
    useForSampling: true,
  },
  SERVER_PORT: {
    name: 'server.port',
    alias: 'net.dst.port',
    type: 'Int',
    useForSampling: true,
  },
  NETWORK_PROTOCOL: {
    name: 'network.protocol.name',
    alias: 'net.protocol',
    type: 'String',
    useForSampling: true,
  },
  NETWORK_PROTOCOL_VERSION: {
    name: 'network.protocol.version',
    type: 'String',
    useForSampling: true,
  },
  NETWORK_TRANSPORT: {
    name: 'network.transport',
    type: 'String',
    useForSampling: true,
  },
  URL_SCHEME: {
    name: 'url.scheme',
    alias: 'net.protocol',
    type: 'String',
    useForSampling: true,
  },
  REQUEST_METHOD: {
    name: 'http.request.method',
    alias: 'http.method',
    type: 'String',
    useForSampling: true,
  },
  URL_PATH: {
    name: 'http.route',
    alias: 'http.path',
    type: 'String',
    useForSampling: true,
  },
  URL_FULL: {
    name: 'url.full',
    type: 'String',
    useForSampling: true,
  },
  URL_QUERY: {
    name: 'url.query',
    type: 'String',
  },
  HTTP_RESPONSE_STATUS_CODE: {
    name: 'http.response.status_code',
    type: 'Int',
    useForSampling: true,
  },
  NETWORK_PEER_ADDRESS: {
    name: 'network.peer.address',
    type: 'IpAddr',
    useForSampling: true,
  },
  /**
   * This is non-standard but it's available to us via the balancer
   */
  NETWORK_PEER_NAME: {
    name: 'network.peer.name',
    type: 'String',
    useForSampling: true,
  },
  NETWORK_PEER_PORT: {
    name: 'network.peer.port',
    type: 'Int',
    useForSampling: true,
  },
  /**
   * Deprecated in OTEL, replaced by "server.address"
   * https://opentelemetry.io/docs/specs/semconv/attributes-registry/tls/#tls-deprecated-attributes
   */
  TLS_SERVER_NAME_INDICATION: {
    name: 'server.address',
    alias: 'tls.sni',
    type: 'String',
    useForSampling: true,
  },
  KONG_SERVICE_ID: {
    name: `${SPAN_ATTR_KEY_KONG_PREFIX}.service.id`,
    type: 'String',
    useForSampling: true,
  },
  KONG_ROUTE_ID: {
    name: `${SPAN_ATTR_KEY_KONG_PREFIX}.route.id`,
    type: 'String',
    useForSampling: true,
  },
  KONG_CONSUMER_ID: {
    name: `${SPAN_ATTR_KEY_KONG_PREFIX}.consumer.id`,
    type: 'String',
    useForSampling: true,
  },
  KONG_UPSTREAM_ID: {
    name: `${SPAN_ATTR_KEY_KONG_PREFIX}.upstream.id`,
    type: 'String',
    useForSampling: true,
  },
  KONG_UPSTREAM_STATUS_CODE: {
    name: `${SPAN_ATTR_KEY_KONG_PREFIX}.upstream.status_code`,
    type: 'Int',
    useForSampling: true,
  },
  KONG_UPSTREAM_ADDR: {
    name: `${SPAN_ATTR_KEY_KONG_PREFIX}.upstream.addr`,
    type: 'IpAddr',
    useForSampling: true,
  },
  KONG_UPSTREAM_HOST: {
    name: `${SPAN_ATTR_KEY_KONG_PREFIX}.upstream.host`,
    type: 'String',
    useForSampling: true,
  },
  KONG_UPSTREAM_LB_ALGORITHM: {
    name: `${SPAN_ATTR_KEY_KONG_PREFIX}.upstream.lb_algorithm`,
    type: 'String',
  },
  KONG_TARGET_ID: {
    name: `${SPAN_ATTR_KEY_KONG_PREFIX}.target.id`,
    type: 'String',
    useForSampling: true,
  },
  KONG_PLUGIN_ID: {
    name: `${SPAN_ATTR_KEY_KONG_PREFIX}.plugin.id`,
    type: 'String',
  },
  KONG_SAMPLING_RULE: {
    name: `${SPAN_ATTR_KEY_KONG_PREFIX}.sampling_rule`,
    type: 'String',
  },
  KONG_REQUEST_ID: {
    name: `${SPAN_ATTR_KEY_KONG_PREFIX}.request.id`,
    type: 'String',
  },
  KONG_UPSTREAM_TTFB_MS: {
    name: `${SPAN_ATTR_KEY_KONG_PREFIX}.upstream.ttfb_ms`,
    type: 'Int',
    useForSampling: true,
  },
  KONG_UPSTREAM_READ_RESPONSE_DURATION_MS: {
    name: `${SPAN_ATTR_KEY_KONG_PREFIX}.upstream.read_response_duration_ms`,
    type: 'Int',
    useForSampling: true,
  },
  KONG_UPSTREAM_CONNECT_DURATION_MS: {
    name: `${SPAN_ATTR_KEY_KONG_PREFIX}.upstream.connect_duration_ms`,
    type: 'Int',
  },
  KONG_UPSTREAM_RESPONSE_DURATION_MS: {
    name: `${SPAN_ATTR_KEY_KONG_PREFIX}.upstream.response_duration_ms`,
    type: 'Int',
  },
  KONG_LATENCY_TOTAL_MS: {
    name: `${SPAN_ATTR_KEY_KONG_PREFIX}.latency_total_ms`,
    type: 'Int',
    useForSampling: true,
  },
  KONG_TOTAL_IO_REDIS_MS: {
    name: `${SPAN_ATTR_KEY_KONG_PREFIX}.redis.total_io_ms`,
    type: 'Int',
    useForSampling: true,
  },
  KONG_TOTAL_IO_TCPSOCKET_MS: {
    name: `${SPAN_ATTR_KEY_KONG_PREFIX}.tcpsock.total_io_ms`,
    type: 'Int',
    useForSampling: true,
  },
  DB_SYSTEM: {
    name: 'db.system',
    type: 'String',
  },
  DB_STATEMENT: {
    name: 'db.statement',
    type: 'String',
  },
} satisfies Record<string, SpanAttributeSchema>

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
