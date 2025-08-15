import composables from '.'
import type { SelectItem } from '@kong/kongponents'

export default function useUrlValidators() {
  const { i18n: { t } } = composables.useI18n()

  const validateHost = (host: string): string => {
    // check if host is empty
    if (!host || host.trim() === '') return t('gateway_services.form.errors.host.empty')

    // check if a valid host (domain or ip address)
    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?))*)(\.[a-zA-Z]{1,63})?$/
    const ipRegex = /^((25[0-5]|2[0-4][0-9]|[0-1]?[0-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|[0-1]?[0-9]?[0-9])$/

    if (ipRegex.test(host) || domainRegex.test(host)) return ''

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
