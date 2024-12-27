
import type { TranslationKey } from '../composables/useI18n'
import { type SpanSamplerAttribute } from '../types'
import samplerAttributes from './sampler-attributes.json'

export const SPAN_ZERO_ID = '0000000000000000'
export const SPAN_ATTRIBUTE_VALUE_UNKNOWN = 'unknown'

export const SPAN_SAMPLER_ATTRIBUTES: Record<keyof typeof samplerAttributes, SpanSamplerAttribute> =
  samplerAttributes satisfies Record<string, SpanSamplerAttribute>

export const SPAN_ATTR_KEY_KONG_PREFIX = 'proxy.kong.'
export const SPAN_ATTR_KEY_KONG_LATENCY_PREFIX = `${SPAN_ATTR_KEY_KONG_PREFIX}latency.`
export const SPAN_ATTR_KEY_KONG_LATENCY_3P_PREFIX = `${SPAN_ATTR_KEY_KONG_LATENCY_PREFIX}3p.`

/**
 * These are known span names for ease of access.
 * Why not using enums? --Because we don't want to make the list here exhaustive.
 */
export const SPAN_NAMES = {
  READ_BODY: 'kong.read_client_http_body',
  CLIENT_HEADERS: 'kong.read_client_http_headers',
  FLUSH_TO_DOWNSTREAM: 'kong.wait_for_client_read',
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
  KONG_LATENCY_UPSTREAM: `${SPAN_ATTR_KEY_KONG_LATENCY_PREFIX}upstream`,
  KONG_PLUGIN_ID: `${SPAN_ATTR_KEY_KONG_PREFIX}plugin.id`,
  KONG_ROUTE_ID: `${SPAN_ATTR_KEY_KONG_PREFIX}route.id`,
  KONG_SERVICE_ID: `${SPAN_ATTR_KEY_KONG_PREFIX}service.id`,
  KONG_TARGET_ID: `${SPAN_ATTR_KEY_KONG_PREFIX}target.id`,
  KONG_UPSTREAM_ID: `${SPAN_ATTR_KEY_KONG_PREFIX}upstream.id`,
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
