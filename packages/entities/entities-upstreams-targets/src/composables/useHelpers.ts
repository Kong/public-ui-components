import { UpstreamFormFields, UpstreamResponse } from '../types'
import {
  ActiveHealthyHttpStatuses,
  ActiveUnhealthyHttpStatuses,
  PassiveHealthyHttpStatuses,
  PassiveUnhealthyHttpStatuses,
} from '../constants'

export default function useHelpers() {
  const isInteger = (val: string): boolean => {
    const regex = /^\d+$/

    return regex.test(val)
  }

  const inRange = (val: string, min: number, max: number): boolean => {
    if (isInteger(val)) {
      const _num = Number(val)
      return _num >= min && _num <= max
    } else {
      return false
    }
  }

  const stringToNumberArray = (arr: string[]): number[] => {
    return arr.map(el => Number(el))
  }

  const numberToStringArray = (arr: number[]): string[] => {
    return arr.map(el => el.toString())
  }

  const getDefaultUpstreamFields = (): UpstreamFormFields => ({
    name: '',
    hostHeader: '',
    clientCertificate: '',
    tags: '',
    algorithm: 'round-robin',
    slots: '10000',
    hashOn: 'none',
    hashFallback: 'none',
    hashOnHeader: '',
    hashOnCookie: '',
    hashOnCookiePath: '/',
    hashOnQueryArgument: '',
    hashOnUriCapture: '',
    hashFallbackHeader: '',
    hashFallbackQueryArgument: '',
    hashFallbackUriCapture: '',
    activeHealthSwitch: false,
    passiveHealthSwitch: false,
    healthchecksThreshold: '0',
    activeHealthCheck: {
      type: 'http',
      httpPath: '/',
      timeout: '1',
      concurrency: '10',
      httpsSni: '',
      verifySsl: false,
      headers: [{ key: '', values: '' }],
      interval: '0',
      successes: '5',
      httpStatuses: ActiveHealthyHttpStatuses,
      unhealthyInterval: '0',
      httpFailures: '5',
      tcpFailures: '5',
      unhealthyHttpStatuses: ActiveUnhealthyHttpStatuses,
      unhealthyTimeouts: '0',
    },
    passiveHealthCheck: {
      type: 'http',
      successes: '0',
      httpStatuses: PassiveHealthyHttpStatuses,
      timeouts: '0',
      httpFailures: '5',
      unhealthyHttpStatuses: PassiveUnhealthyHttpStatuses,
      tcpFailures: '5',
    },
  })

  const upstreamsResponseToFields = (payload: UpstreamResponse): UpstreamFormFields => {
    const result: UpstreamFormFields = getDefaultUpstreamFields()

    result.name = payload.name || ''
    result.algorithm = payload.algorithm || 'round-robin'
    result.hostHeader = payload.host_header || ''
    result.clientCertificate = payload.client_certificate ? payload.client_certificate?.id : ''
    result.tags = payload.tags?.join(', ') || ''
    result.slots = (payload.slots !== null && payload.slots !== undefined) ? payload.slots.toString() : '10000'
    result.hashOn = payload.hash_on || 'none'
    result.hashFallback = payload.hash_fallback || 'none'
    result.hashOnHeader = payload.hash_on_header || ''
    result.hashOnCookie = payload.hash_on_cookie || ''
    result.hashOnCookiePath = payload.hash_on_cookie_path || '/'
    result.hashOnQueryArgument = payload.hash_on_query_arg || ''
    result.hashOnUriCapture = payload.hash_on_uri_capture || ''
    result.hashFallbackHeader = payload.hash_fallback_header || ''
    result.hashFallbackQueryArgument = payload.hash_fallback_query_arg || ''
    result.hashFallbackUriCapture = payload.hash_fallback_uri_capture || ''
    result.healthchecksThreshold = (payload.healthchecks.threshold !== null && payload.healthchecks.threshold !== undefined)
      ? payload.healthchecks.threshold.toString()
      : ''
    result.activeHealthSwitch = payload.healthchecks.active?.healthy?.interval !== 0 ||
      payload.healthchecks.active?.unhealthy?.interval !== 0
    result.activeHealthCheck.type = payload.healthchecks.active?.type || 'http'
    result.activeHealthCheck.httpPath = payload.healthchecks.active?.http_path || '/'
    result.activeHealthCheck.timeout = (payload.healthchecks.active?.timeout !== null && payload.healthchecks.active?.timeout !== undefined)
      ? payload.healthchecks.active?.timeout?.toString()
      : ''
    result.activeHealthCheck.concurrency = (payload.healthchecks.active?.concurrency !== null && payload.healthchecks.active?.concurrency !== undefined)
      ? payload.healthchecks.active?.concurrency?.toString()
      : ''
    result.activeHealthCheck.httpsSni = payload.healthchecks.active?.https_sni || ''
    result.activeHealthCheck.verifySsl = payload.healthchecks.active?.https_verify_certificate || false
    result.activeHealthCheck.headers = (payload.healthchecks.active?.headers && Object.entries(payload.healthchecks.active?.headers).length > 0)
      ? Object.entries(payload.healthchecks.active?.headers)
        .map(([key, val]) => ({ key, values: val?.join(', ') }))
      : [{ key: '', values: '' }]
    result.activeHealthCheck.interval = (payload.healthchecks.active?.healthy?.interval !== null &&
      payload.healthchecks.active?.healthy?.interval !== undefined)
      ? payload.healthchecks.active?.healthy?.interval?.toString()
      : '0'
    result.activeHealthCheck.interval = (payload.healthchecks.active?.healthy?.interval !== null &&
      payload.healthchecks.active?.healthy?.interval !== undefined)
      ? payload.healthchecks.active?.healthy?.interval?.toString()
      : '0'
    result.activeHealthCheck.successes = (payload.healthchecks.active?.healthy?.successes !== null &&
      payload.healthchecks.active?.healthy?.successes !== undefined)
      ? payload.healthchecks.active?.healthy?.successes?.toString()
      : '0'
    result.activeHealthCheck.httpStatuses = payload.healthchecks.active?.healthy?.http_statuses
      ? numberToStringArray(payload.healthchecks.active?.healthy?.http_statuses || [])
      : ActiveHealthyHttpStatuses
    result.activeHealthCheck.unhealthyInterval = (payload.healthchecks.active?.unhealthy?.interval !== null &&
      payload.healthchecks.active?.unhealthy?.interval !== undefined)
      ? payload.healthchecks.active?.unhealthy?.interval?.toString()
      : '0'
    result.activeHealthCheck.httpFailures = (payload.healthchecks.active?.unhealthy?.http_failures !== null &&
      payload.healthchecks.active?.unhealthy?.http_failures !== undefined)
      ? payload.healthchecks.active?.unhealthy?.http_failures?.toString()
      : '0'
    result.activeHealthCheck.unhealthyTimeouts = (payload.healthchecks.active?.unhealthy?.timeouts !== null &&
      payload.healthchecks.active?.unhealthy?.timeouts !== undefined)
      ? payload.healthchecks.active?.unhealthy?.timeouts?.toString()
      : '0'
    result.activeHealthCheck.unhealthyHttpStatuses = payload.healthchecks.active?.unhealthy?.http_statuses
      ? numberToStringArray(payload.healthchecks.active?.unhealthy?.http_statuses || [])
      : ActiveUnhealthyHttpStatuses
    result.passiveHealthSwitch = payload.healthchecks.passive?.healthy?.successes !== 0 ||
      payload.healthchecks.passive?.unhealthy?.timeouts !== 0 ||
      payload.healthchecks.passive?.unhealthy?.tcp_failures !== 0 ||
      payload.healthchecks.passive?.unhealthy?.http_failures !== 0
    result.passiveHealthCheck.type = payload.healthchecks.passive?.type || 'http'
    result.passiveHealthCheck.successes = (payload.healthchecks.passive?.healthy?.successes !== null &&
      payload.healthchecks.passive?.healthy?.successes !== undefined)
      ? payload.healthchecks.passive?.healthy?.successes?.toString()
      : '0'
    result.passiveHealthCheck.httpStatuses = payload.healthchecks.passive?.healthy?.http_statuses
      ? numberToStringArray(payload.healthchecks.passive?.healthy?.http_statuses || [])
      : PassiveHealthyHttpStatuses
    result.passiveHealthCheck.timeouts = (payload.healthchecks.passive?.unhealthy?.timeouts !== null &&
      payload.healthchecks.passive?.unhealthy?.timeouts !== undefined)
      ? payload.healthchecks.passive?.unhealthy?.timeouts?.toString()
      : '0'
    result.passiveHealthCheck.tcpFailures = (payload.healthchecks.passive?.unhealthy?.tcp_failures !== null &&
      payload.healthchecks.passive?.unhealthy?.tcp_failures !== undefined)
      ? payload.healthchecks.passive?.unhealthy?.tcp_failures?.toString()
      : ''
    result.passiveHealthCheck.unhealthyHttpStatuses = payload.healthchecks.passive?.unhealthy?.http_statuses
      ? numberToStringArray(payload.healthchecks.passive?.unhealthy?.http_statuses || [])
      : PassiveUnhealthyHttpStatuses

    return result
  }

  const objectsAreEqual = (a: Record<string, any>, b: Record<string, any>): boolean => {
    try {
      return JSON.stringify(a) === JSON.stringify(b)
    } catch (e) {
      return false
    }
  }

  const cloneDeep = (val: Record<string, any>):Record<string, any> => {
    return JSON.parse(JSON.stringify(val))
  }

  return {
    isInteger,
    inRange,
    stringToNumberArray,
    numberToStringArray,
    upstreamsResponseToFields,
    getDefaultUpstreamFields,
    objectsAreEqual,
    cloneDeep,
  }
}
