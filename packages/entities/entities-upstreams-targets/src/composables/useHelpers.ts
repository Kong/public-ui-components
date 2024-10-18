import type { UpstreamFormFields, UpstreamResponse } from '../types'
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

  // Internal implementation
  const internalCombineUpstreamFields = (response?: UpstreamResponse): UpstreamFormFields => {
    const result: UpstreamFormFields = {
      name: response?.name || '',
      hostHeader: response?.host_header || '',
      clientCertificate: response?.client_certificate?.id || '',
      tags: response?.tags?.join(', ') || '',
      algorithm: response?.algorithm || 'round-robin',
      slots: response?.slots?.toString() || '10000',
      hashOn: response?.hash_on || 'none',
      hashFallback: response?.hash_fallback || 'none',
      hashOnHeader: response?.hash_on_header || '',
      hashOnCookie: response?.hash_on_cookie || '',
      hashOnCookiePath: response?.hash_on_cookie_path || '/',
      hashOnQueryArgument: response?.hash_on_query_arg || '',
      hashOnUriCapture: response?.hash_on_uri_capture || '',
      hashFallbackHeader: response?.hash_fallback_header || '',
      hashFallbackQueryArgument: response?.hash_fallback_query_arg || '',
      hashFallbackUriCapture: response?.hash_fallback_uri_capture || '',
      activeHealthSwitch: response
        ? response.healthchecks.active?.healthy?.interval !== 0 || response.healthchecks.active?.unhealthy?.interval !== 0
        : false,
      passiveHealthSwitch: response
        ? response.healthchecks.passive?.healthy?.successes !== 0 ||
          response.healthchecks.passive?.unhealthy?.timeouts !== 0 ||
          response.healthchecks.passive?.unhealthy?.tcp_failures !== 0 ||
          response.healthchecks.passive?.unhealthy?.http_failures !== 0
        : false,
      healthchecksThreshold: response?.healthchecks.threshold?.toString() || '0',
      activeHealthCheck: {
        type: response?.healthchecks.active?.type || 'http',
        httpPath: response?.healthchecks.active?.http_path || '/',
        timeout: response?.healthchecks.active?.timeout?.toString() || '1',
        concurrency: response?.healthchecks.active?.concurrency?.toString() || '10',
        httpsSni: response?.healthchecks.active?.https_sni || '',
        verifySsl: response?.healthchecks.active?.https_verify_certificate || false,
        headers: (response?.healthchecks.active?.headers && Object.entries(response.healthchecks.active.headers).length > 0)
          ? Object.entries(response.healthchecks.active.headers)
            .map(([key, val]) => ({ key, values: val?.join(', ') }))
          : [{ key: '', values: '' }],
        interval: response?.healthchecks.active?.healthy?.interval?.toString() || '0',
        successes: response?.healthchecks.active?.healthy?.successes?.toString() || '5',
        httpStatuses: response?.healthchecks.active?.healthy?.http_statuses
          ? numberToStringArray(response.healthchecks.active.healthy.http_statuses)
          : ActiveHealthyHttpStatuses,
        unhealthyInterval: response?.healthchecks.active?.unhealthy?.interval?.toString() || '0',
        httpFailures: response?.healthchecks.active?.unhealthy?.http_failures?.toString() || '5',
        tcpFailures: response?.healthchecks.active?.unhealthy?.tcp_failures?.toString() || '5',
        unhealthyHttpStatuses: response?.healthchecks.active?.unhealthy?.http_statuses
          ? numberToStringArray(response.healthchecks.active.unhealthy.http_statuses)
          : ActiveUnhealthyHttpStatuses,
        unhealthyTimeouts: response?.healthchecks.active?.unhealthy?.timeouts?.toString() || '0',
      },
      passiveHealthCheck: {
        type: response?.healthchecks.passive?.type || 'http',
        successes: response?.healthchecks.passive?.healthy?.successes?.toString() || '0',
        httpStatuses: response?.healthchecks.passive?.healthy?.http_statuses
          ? numberToStringArray(response.healthchecks.passive.healthy.http_statuses)
          : PassiveHealthyHttpStatuses,
        timeouts: response?.healthchecks.passive?.unhealthy?.timeouts?.toString() || '0',
        httpFailures: response?.healthchecks.passive?.unhealthy?.http_failures?.toString() || '5',
        tcpFailures: response?.healthchecks.passive?.unhealthy?.tcp_failures?.toString() || '5',
        unhealthyHttpStatuses: response?.healthchecks.passive?.unhealthy?.http_statuses
          ? numberToStringArray(response.healthchecks.passive.unhealthy.http_statuses)
          : PassiveUnhealthyHttpStatuses,
      },
    }

    return result
  }

  // Public functions
  const getDefaultUpstreamFields = (): UpstreamFormFields => {
    return internalCombineUpstreamFields()
  }

  const upstreamsResponseToFields = (response: UpstreamResponse): UpstreamFormFields => {
    return internalCombineUpstreamFields(response)
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
