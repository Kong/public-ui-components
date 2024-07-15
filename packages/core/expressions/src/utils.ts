import { v4 as uuidv4 } from 'uuid'
import {
  DEFAULT_PROTOCOL_PORTS, HTTP_PROTOCOLS, SECURED_PROTOCOLS, SUPPORTED_PROTOCOLS, type Request,
} from './definitions'

export const validateRequest = (request: Request) => {
  if (!SUPPORTED_PROTOCOLS.has(request.protocol)) throw new Error(`Unsupported protocol: ${request.protocol}. (Supported protocols: ${Array.from(SUPPORTED_PROTOCOLS.values()).join(', ')})`)
}

/**
 * Transforms and checks if the request is valid
 * @param request
 * @returns
 */
export const transformCheckRequest = (request: Partial<Request>): string | undefined => {
  if (request.id === undefined) {
    request.id = uuidv4()
  }

  if (!request.protocol) {
    return 'Protocol is required'
  }

  if (!SUPPORTED_PROTOCOLS.has(request.protocol)) {
    return `Protocol is unsupported (Supported protocols: ${Array.from(SUPPORTED_PROTOCOLS).join(', ')})`
  }

  if (!request.port) {
    request.port = (DEFAULT_PROTOCOL_PORTS as any)[request.protocol]
  }

  if (!request.host) {
    return 'Host is required'
  }

  if (!request.path) {
    return 'Path is required'
  }

  if (!SECURED_PROTOCOLS.has(request.protocol) && request.sni) {
    return `SNI is not available for "${request.protocol}" protocol`
  }

  if (HTTP_PROTOCOLS.has(request.protocol)) {
    if (Array.isArray(request.method)) {
      request.method = request.method[0]
    }

    if (!request.method) {
      return `Method is required for "${request.protocol}" protocol`
    }

    if (!/^[A-Z]+$/g.test(request.method)) {
      return 'Method should be all capitalized'
    }
  }
}
