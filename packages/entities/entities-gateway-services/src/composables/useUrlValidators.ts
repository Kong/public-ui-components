export default function useUrlValidators() {
  const validateHost = (host: string): string => {
  // check if host is empty
    if (!host || host.trim() === '') return 'host cannot be empty'

    // check if a valid host (domain or ip address)
    const hostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$|^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/
    if (!hostnameRegex.test(host)) return 'invalid host'
    return ''
  }

  const validatePort = (port: number | null | undefined | string): string => {
  // Port is not required, so return empty string if not provided
    if (port === null || port === undefined || port === '') {
      return ''
    }

    // Convert to number if it's a string
    const portNum = typeof port === 'string' ? parseInt(port, 10) : port

    // Check if port is a valid number
    if (isNaN(portNum)) {
      return 'Port must be a number'
    }

    // Check if port is in valid range (0-65535)
    if (portNum < 0 || portNum > 65535) {
      return 'Port must be between 0 and 65535'
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
      return 'Path must begin with /'
    }

    // This regex matches any character that is NOT allowed by RFC 3986
    const invalidCharsRegex = /[^A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]/

    if (invalidCharsRegex.test(path)) {
      return 'Path should not include characters outside of the reserved list of RFC 3986'
    }

    // Valid path according to RFC 3986
    return ''
  }

  const validateProtocol = (protocol: string) => {
  // check if protocol is empty
    if (!protocol || protocol.trim() === '') return 'protocol cannot be empty'
    // strip out the : from protocol
    protocol = protocol.slice(0,-1)
    // check if protocol is valid
    const selectedProtocol = gatewayServiceProtocolItems.find((item)=>{
      if (item.value === protocol) return item
      else return undefined
    })

    if (selectedProtocol === undefined) return 'protocol - value must be one of "http", "https", "grpc", "grpcs", "tcp", "udp", "tls", "tls_passthrough", "ws", "wss"'

    return ''
  }

  return {
    validateHost,
    validatePath,
    validatePort,
  }
}
