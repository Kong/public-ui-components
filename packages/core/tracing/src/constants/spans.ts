
import type { TranslationKey } from '../composables/useI18n'
import { type SpanSamplerAttribute } from '../types'

export const SPAN_ZERO_ID = '0000000000000000'
export const SPAN_ATTRIBUTE_VALUE_UNKNOWN = 'unknown'

export const SPAN_ATTR_KEY_KONG_PREFIX = 'proxy.kong.'
export const SPAN_ATTR_KEY_KONG_LATENCY_PREFIX = `${SPAN_ATTR_KEY_KONG_PREFIX}latency.`
export const SPAN_ATTR_KEY_KONG_LATENCY_3P_PREFIX = `${SPAN_ATTR_KEY_KONG_LATENCY_PREFIX}3p.`

/**
 * These are known span names for ease of access.
 * Why not using enums? --Because we don't want to make the list here exhaustive.
 */
export const SPAN_NAMES = {
  CLIENT_HEADERS: 'kong.read_client_http_headers',
  FIND_UPSTREAM: 'kong.find_upstream',
  FLUSH_TO_DOWNSTREAM: 'kong.wait_for_client_read',

  /**
   * Previously known as:
   * - `kong.upstream.read_response`
   * - {@link SPAN_NAMES.KONG_READ_RESPONSE_FROM_UPSTREAM}
   */
  KONG_READ_BODY_FROM_UPSTREAM: 'kong.read_body_from_upstream',

  /**
   * Previously known as:
   * - `kong.upstream.ttfb`
   * - {@link SPAN_NAMES.KONG_WAITING_FOR_UPSTREAM}
   */
  KONG_READ_HEADERS_FROM_UPSTREAM: 'kong.read_headers_from_upstream',

  /**
   * @deprecated Use {@link SPAN_NAMES.KONG_READ_BODY_FROM_UPSTREAM} instead
   *
   * Previously known as:
   * - `kong.upstream.read_response`
   */
  KONG_READ_RESPONSE_FROM_UPSTREAM: 'kong.read_response_from_upstream',
  KONG_SEND_REQUEST_TO_UPSTREAM: 'kong.send_request_to_upstream',
  KONG_UPSTREAM_SELECTION: 'kong.upstream.selection',

  /**
   * @deprecated Use {@link SPAN_NAMES.KONG_READ_HEADERS_FROM_UPSTREAM} instead
   *
   * Previously known as:
   * - `kong.upstream.ttfb`
   */
  KONG_WAITING_FOR_UPSTREAM: 'kong.waiting_for_upstream',
  READ_BODY: 'kong.read_client_http_body',
}

/**
 * These are known attributes that will appear in the spans for ease of access.
 * Why not using enums? --Because we don't want to make the list here exhaustive.
 */
export const SPAN_ATTRIBUTE_KEYS = {
  HTTP_REQUEST_METHOD: 'http.request.method',
  HTTP_RESPONSE_STATUS_CODE: 'http.response.status_code',
  HTTP_ROUTE: 'http.route',
  KONG_CONSUMER_ID: `${SPAN_ATTR_KEY_KONG_PREFIX}consumer.id`,
  KONG_LATENCY_3P_DNS_TOTAL_IO: `${SPAN_ATTR_KEY_KONG_LATENCY_3P_PREFIX}dns.total_io`,
  KONG_LATENCY_3P_HTTP_CLIENT_TOTAL_IO: `${SPAN_ATTR_KEY_KONG_LATENCY_3P_PREFIX}http_client.total_io`,
  KONG_LATENCY_3P_REDIS_TOTAL_IO: `${SPAN_ATTR_KEY_KONG_LATENCY_3P_PREFIX}redis.total_io`,
  KONG_LATENCY_3P_TCPSOCK_TOTAL_IO: `${SPAN_ATTR_KEY_KONG_LATENCY_3P_PREFIX}tcpsock.total_io`,
  KONG_LATENCY_3P_TOTAL_IO: `${SPAN_ATTR_KEY_KONG_LATENCY_3P_PREFIX}total_io`,
  KONG_LATENCY_CLIENT: `${SPAN_ATTR_KEY_KONG_LATENCY_PREFIX}client`,
  KONG_LATENCY_INTERNAL: `${SPAN_ATTR_KEY_KONG_LATENCY_PREFIX}internal`,
  KONG_LATENCY_TOTAL: `${SPAN_ATTR_KEY_KONG_LATENCY_PREFIX}total`,
  KONG_LATENCY_TOTAL_MS_LEGACY: `${SPAN_ATTR_KEY_KONG_PREFIX}latency_total_ms`, // This super legacy for old 3.9 DPs
  KONG_LATENCY_UPSTREAM: `${SPAN_ATTR_KEY_KONG_LATENCY_PREFIX}upstream`,
  KONG_PLUGIN_ID: `${SPAN_ATTR_KEY_KONG_PREFIX}plugin.id`,
  KONG_ROUTE_ID: `${SPAN_ATTR_KEY_KONG_PREFIX}route.id`,
  KONG_SERVICE_ID: `${SPAN_ATTR_KEY_KONG_PREFIX}service.id`,
  KONG_TARGET_ID: `${SPAN_ATTR_KEY_KONG_PREFIX}target.id`,
  KONG_UPSTREAM_ID: `${SPAN_ATTR_KEY_KONG_PREFIX}upstream.id`,
  KONG_UPSTREAM_STATUS_CODE: `${SPAN_ATTR_KEY_KONG_PREFIX}upstream.status_code`,
  URL_FULL: 'url.full',
} satisfies Record<string, string>

export const SPAN_LATENCY_ATTR_LABEL_KEYS: Record<string, TranslationKey> = {
  [SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_3P_DNS_TOTAL_IO]: 'trace_viewer.latency.labels.3p_dns',
  [SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_3P_HTTP_CLIENT_TOTAL_IO]: 'trace_viewer.latency.labels.3p_http_client',
  [SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_3P_REDIS_TOTAL_IO]: 'trace_viewer.latency.labels.3p_redis',
  [SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_3P_TCPSOCK_TOTAL_IO]: 'trace_viewer.latency.labels.3p_tcpsock',
  [SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_3P_TOTAL_IO]: 'trace_viewer.latency.labels.3p',
  [SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_CLIENT]: 'trace_viewer.latency.labels.client',
  [SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_INTERNAL]: 'trace_viewer.latency.labels.internal',
  [SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_TOTAL]: 'trace_viewer.latency.labels.total',
  [SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_TOTAL_MS_LEGACY]: 'trace_viewer.latency.labels.total',
  [SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_UPSTREAM]: 'trace_viewer.latency.labels.upstream',
}

/**
 * These are known attributes that will appear in the span events for ease of access.
 * Why not using enums? --Because we don't want to make the list here exhaustive.
 */
export const SPAN_EVENT_ATTRIBUTE_KEYS = {
  MESSAGE: 'message',
  EXCEPTION_MESSAGE: 'exception.message',
} satisfies Record<string, string>

export const SPAN_SAMPLER_ATTRIBUTES: Record<string, SpanSamplerAttribute> = {
  // Start of the span sampler attributes exported from the latest Gateway >>>
  'proxy.kong.latency.3p.redis.total_io': {
    name: 'proxy.kong.latency.3p.redis.total_io',
    type: 'Int',
  },
  'proxy.kong.upstream.id': { name: 'proxy.kong.upstream.id', type: 'String' },
  'network.protocol.name': {
    type: 'String',
    name: 'network.protocol.name',
    aliases: [{ name: 'net.protocol' }],
  },
  'network.peer.address': { name: 'network.peer.address', type: 'IpAddr' },
  'http.response.status_code': {
    name: 'http.response.status_code',
    type: 'Int',
  },
  'proxy.kong.upstream.status_code': {
    name: 'proxy.kong.upstream.status_code',
    type: 'Int',
  },
  'network.peer.name': { name: 'network.peer.name', type: 'String' },
  'proxy.kong.target.id': { name: 'proxy.kong.target.id', type: 'String' },
  'network.peer.port': { name: 'network.peer.port', type: 'Int' },
  'proxy.kong.latency.upstream.read_response_duration': {
    name: 'proxy.kong.latency.upstream.read_response_duration',
    type: 'Int',
  },
  'proxy.kong.upstream.host': {
    name: 'proxy.kong.upstream.host',
    type: 'String',
  },
  'proxy.kong.latency.total': { name: 'proxy.kong.latency.total', type: 'Int' },
  'proxy.kong.latency.upstream': {
    name: 'proxy.kong.latency.upstream',
    type: 'Int',
  },
  'client.port': {
    type: 'Int',
    name: 'client.port',
    aliases: [{ name: 'net.src.port' }],
  },
  'http.route': {
    type: 'String',
    name: 'http.route',
    aliases: [{ name: 'http.path' }],
  },
  'http.request.method': {
    type: 'String',
    name: 'http.request.method',
    aliases: [{ name: 'http.method' }],
  },
  'network.protocol.version': {
    name: 'network.protocol.version',
    type: 'String',
  },
  'proxy.kong.latency.3p.total_io': {
    name: 'proxy.kong.latency.3p.total_io',
    type: 'Int',
  },
  'proxy.kong.upstream.addr': {
    name: 'proxy.kong.upstream.addr',
    type: 'IpAddr',
  },
  'server.port': {
    type: 'Int',
    name: 'server.port',
    aliases: [{ name: 'net.dst.port' }],
  },
  'proxy.kong.latency.3p.tcpsock.total_io': {
    name: 'proxy.kong.latency.3p.tcpsock.total_io',
    type: 'Int',
  },
  'network.transport': { name: 'network.transport', type: 'String' },
  'proxy.kong.latency.client': {
    name: 'proxy.kong.latency.client',
    type: 'Int',
  },
  'proxy.kong.latency.3p.dns.total_io': {
    name: 'proxy.kong.latency.3p.dns.total_io',
    type: 'Int',
  },
  'url.scheme': {
    type: 'String',
    name: 'url.scheme',
    aliases: [{ name: 'net.protocol' }],
  },
  'server.address': {
    type: 'String',
    name: 'server.address',
    aliases: [{ name: 'tls.sni' }, { name: 'net.dst.ip', type: 'IpAddr' }],
  },
  'proxy.kong.route.id': { name: 'proxy.kong.route.id', type: 'String' },
  'proxy.kong.latency.3p.http_client.total_io': {
    name: 'proxy.kong.latency.3p.http_client.total_io',
    type: 'Int',
  },
  'http.request.size': { name: 'http.request.size', type: 'Int' },
  'http.request.header.host': {
    type: 'String',
    name: 'http.request.header.host',
    aliases: [{ name: 'http.host' }],
  },
  'proxy.kong.latency.upstream.ttfb': {
    name: 'proxy.kong.latency.upstream.ttfb',
    type: 'Int',
  },
  'client.address': {
    type: 'IpAddr',
    name: 'client.address',
    aliases: [{ name: 'net.src.ip' }],
  },
  'proxy.kong.consumer.id': { name: 'proxy.kong.consumer.id', type: 'String' },
  'destination.address': { name: 'destination.address', type: 'IpAddr' },
  'proxy.kong.service.id': { name: 'proxy.kong.service.id', type: 'String' },
  'proxy.kong.latency.internal': {
    name: 'proxy.kong.latency.internal',
    type: 'Int',
  },
  'url.full': { name: 'url.full', type: 'String' },
  // <<< End of the span sampler attributes exported from the latest Gateway
  // Legacy for old 3.9 DPs
  [SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_TOTAL_MS_LEGACY]: {
    name: SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_TOTAL_MS_LEGACY,
    type: 'Int',
  },
}
