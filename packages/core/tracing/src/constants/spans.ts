
import type { TranslationKey } from '../composables/useI18n'
import { type SpanSamplerAttribute } from '../types'
import samplerAttributes from './sampler-attributes.json'

export const SPAN_ZERO_ID = '0000000000000000'
export const SPAN_ATTRIBUTE_VALUE_UNKNOWN = 'unknown'

export const SPAN_SAMPLER_ATTRIBUTES: Record<keyof typeof samplerAttributes, SpanSamplerAttribute> =
  samplerAttributes satisfies Record<string, SpanSamplerAttribute>

export const SPAN_LATENCY_ATTRIBUTES: Record<string, TranslationKey> = {
  'proxy.kong.latency.total': 'trace_viewer.latency.labels.total',
  'proxy.kong.latency.internal': 'trace_viewer.latency.labels.internal',
  'proxy.kong.latency.upstream': 'trace_viewer.latency.labels.upstream',
  'proxy.kong.latency.3p.total_io': 'trace_viewer.latency.labels.3p',
  'proxy.kong.latency.client': 'trace_viewer.latency.labels.client',
}

export const SPAN_ATTR_KEY_KONG_PREFIX = 'proxy.kong.'
export const SPAN_ATTR_KEY_KONG_LATENCY_PREFIX = 'proxy.kong.latency.'

/**
 * These are known attributes that will appear in the spans for ease of access.
 * Why not using enums? --Because we don't want to make the list here exhaustive.
 */
export const SPAN_ATTRIBUTE_KEYS = {
  HTTP_REQUEST_METHOD: 'http.request.method',
  HTTP_RESPONSE_STATUS_CODE: 'http.response.status_code',
  HTTP_ROUTE: 'http.route',
  KONG_CONSUMER_ID: `${SPAN_ATTR_KEY_KONG_PREFIX}consumer.id`,
  KONG_PLUGIN_ID: `${SPAN_ATTR_KEY_KONG_PREFIX}plugin.id`,
  KONG_ROUTE_ID: `${SPAN_ATTR_KEY_KONG_PREFIX}route.id`,
  KONG_SERVICE_ID: `${SPAN_ATTR_KEY_KONG_PREFIX}service.id`,
  KONG_TARGET_ID: `${SPAN_ATTR_KEY_KONG_PREFIX}target.id`,
  KONG_UPSTREAM_ID: `${SPAN_ATTR_KEY_KONG_PREFIX}upstream.id`,
  URL_FULL: 'url.full',
} satisfies Record<string, string>

/**
 * These are known attributes that will appear in the span events for ease of access.
 * Why not using enums? --Because we don't want to make the list here exhaustive.
 */
export const SPAN_EVENT_ATTRIBUTE_KEYS = {
  MESSAGE: 'message',
  EXCEPTION_MESSAGE: 'exception.message',
} satisfies Record<string, string>
