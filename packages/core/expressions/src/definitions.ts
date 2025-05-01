export type Request = {
  id: string
  protocol: string
  host: string
  port: number
  path: string
  method?: string
  headers?: { [k: string]: string | string[] }
  sni?: string
}

export const DEFAULT_PROTOCOL_PORTS = {
  http: 80,
  https: 443,
  grpc: 80,
  grpcs: 443,
  ws: 80,
  wss: 443,
}

export const HTTP_PROTOCOLS = new Set(['http', 'https'])

export const SECURED_PROTOCOLS = new Set(['https', 'grpcs', 'wss'])

export const SUPPORTED_PROTOCOLS = new Set(Object.keys(DEFAULT_PROTOCOL_PORTS))
