import { v4 as uuidv4 } from 'uuid'
import {
  DEFAULT_PROTOCOL_PORTS, HTTP_PROTOCOLS, SECURED_PROTOCOLS, SUPPORTED_PROTOCOLS, type Request,
} from './definitions'
import composables from './composables'

export const validateRequest = (request: Request) => {
  if (!SUPPORTED_PROTOCOLS.has(request.protocol)) throw new Error(`Unsupported protocol: ${request.protocol}. (Supported protocols: ${Array.from(SUPPORTED_PROTOCOLS.values()).join(', ')})`)
}

/**
 * Transforms and checks if the request is valid
 * @param request
 * @returns
 */
export const transformCheckRequest = (request: Partial<Request>): string | undefined => {
  const { i18n } = composables.useI18n()

  if (request.id === undefined) {
    request.id = uuidv4()
  }

  if (!request.protocol) {
    return i18n.t('errors.requiredProtocol')
  }

  if (!SUPPORTED_PROTOCOLS.has(request.protocol)) {
    return i18n.t('errors.unsupportedProtocols', {
      protocols: Array.from(SUPPORTED_PROTOCOLS).join(i18n.t('comma')),
    })
  }

  if (!request.port) {
    request.port = (DEFAULT_PROTOCOL_PORTS as any)[request.protocol]
  }

  if (!request.host) {
    return i18n.t('errors.requiredHost')
  }

  if (!request.path) {
    return i18n.t('errors.requiredPath')
  }

  if (!SECURED_PROTOCOLS.has(request.protocol) && request.sni) {
    return i18n.t('errors.sniNotAvailable', { protocol: request.protocol })
  }

  if (HTTP_PROTOCOLS.has(request.protocol)) {
    if (Array.isArray(request.method)) {
      request.method = request.method[0]
    }

    if (!request.method) {
      return i18n.t('errors.requiredMethod', { protocol: request.protocol })
    }

    if (!/^[A-Z]+$/g.test(request.method)) {
      return i18n.t('errors.methodShouldCapitalized')
    }
  }
}
