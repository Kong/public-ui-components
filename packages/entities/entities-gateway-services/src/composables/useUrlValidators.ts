import composables from '.'
import type { SelectItem } from '@kong/kongponents'

// originally from
// https://github.com/kong-konnect/koko-private/blob/7ab99d8e4b/internal/gen/jsonschema/schemas/service.json#L54
// but has been enhanced by removing the underscore character from the allowed characters in the domain name,
// as it is not a valid character in hostnames according to RFC 952/1123
const domainRegex = /^[a-zA-Z0-9]([-a-zA-Z0-9]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([-a-zA-Z0-9]*[a-zA-Z0-9])?)*(\.)?$/
const ipv4Regex = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/

const looksLikeIPv6 = (host: string): boolean => {
  // safe to assume if at least a colon is provided, as colons are not valid in
  // both domain names and IPv4 addresses, and are required in IPv6 addresses
  return /^[0-9A-Fa-f:.]+$/.test(host) && host.includes(':')
}

export default function useUrlValidators() {
  const { i18n: { t } } = composables.useI18n()

  const validateHost = (host: string): string => {
    // check if host is empty
    if (!host || host.trim() === '') return t('gateway_services.form.errors.host.empty')

    try {
      if (looksLikeIPv6(host)) {
        new URL('/', `https://[${host}]`)
        return ''
      } else if (domainRegex.test(host) || ipv4Regex.test(host)) {
        new URL('/', `https://${host}`)
        return ''
      }
    } catch {
      // do nothing
    }

    return t('gateway_services.form.errors.host.invalid')
  }

  const validatePort = (port: number | string | null | undefined): string => {
    // Port is not required, so return empty string if not provided
    if (port === null || port === undefined || port === '') {
      return ''
    }

    // Convert to number if it's a string
    const portNum = typeof port === 'string' ? parseInt(port, 10) : port

    // Check if port is a valid number
    if (isNaN(portNum)) {
      return t('gateway_services.form.errors.port.type')
    }

    // Check if port is in valid range (0-65535)
    if (portNum < 0 || portNum > 65535) {
      return t('gateway_services.form.errors.port.invalid')
    }

    // Valid port
    return ''
  }

  const validatePath = (path: string | null | undefined): string => {
    // Path is not required, so return empty string if not provided
    if (!path || path === '') {
      return ''
    }

    // If path exists, it should start with '/'
    if (!path.startsWith('/')) {
      return t('gateway_services.form.errors.path.prefix')
    }

    // This regex matches any character that is NOT allowed by RFC 3986
    const invalidCharsRegex = /[^A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]/

    if (invalidCharsRegex.test(path)) {
      return t('gateway_services.form.errors.path.invalid')
    }

    // Valid path according to RFC 3986
    return ''
  }

  const validateProtocol = (protocol: string, ProtocolItems: SelectItem[] ): string => {
    // check if protocol is empty
    if (!protocol || protocol.trim() === '') return t('gateway_services.form.errors.protocol.empty')
    // strip out the : from protocol
    protocol = protocol.slice(0, -1)
    // check if protocol is valid
    const selectedProtocol = ProtocolItems.find((item) => {
      if (item.value === protocol) return item
      else return undefined
    })

    if (selectedProtocol === undefined) return t('gateway_services.form.errors.protocol.invalid')

    return ''
  }

  return {
    validateHost,
    validateProtocol,
    validatePath,
    validatePort,
  }
}
