import { Schema as AtcSchema, type AstType } from '@kong/atc-router'

export type SchemaDefinition = {
  [K in AstType]?: string[]
}

export interface Schema {
  name: string
  definition: SchemaDefinition
  documentation?: Record<string, string>
}

export const createSchema = (definition: SchemaDefinition) => {
  const schema = new AtcSchema()

  for (const [type, fields] of Object.entries(definition)) {
    for (const field of fields) {
      schema.addField(field, type as AstType)
    }
  }

  return schema
}

export const HTTP_SCHEMA_DEFINITION: SchemaDefinition = {
  String: [
    'net.protocol',
    'tls.sni',
    'http.method',
    'http.host',
    'http.path',
    'http.path.segments.*',
    'http.headers.*',
    'http.queries.*',
  ],
  Int: ['net.src.port', 'net.dst.port', 'http.path.segments.len'],
  IpAddr: ['net.src.ip', 'net.dst.ip'],
}

export const STREAM_SCHEMA_DEFINITION: SchemaDefinition = {
  String: ['net.protocol', 'tls.sni'],
  Int: ['net.src.port', 'net.dst.port'],
  IpAddr: ['net.src.ip', 'net.dst.ip'],
}

export const HTTP_BASED_PROTOCOLS = ['http', 'https', 'grpc', 'grpcs', 'ws', 'wss']
export const STREAM_BASED_PROTOCOLS = ['tcp', 'udp', 'tls', 'tls_passthrough']

export const PROTOCOL_TO_SCHEMA = (() => {
  const s: Record<string, Schema> = {}

  for (const protocol of HTTP_BASED_PROTOCOLS) {
    s[protocol] = { name: protocol, definition: HTTP_SCHEMA_DEFINITION }
  }

  for (const protocol of STREAM_BASED_PROTOCOLS) {
    s[protocol] = { name: protocol, definition: STREAM_SCHEMA_DEFINITION }
  }

  return s
})()
