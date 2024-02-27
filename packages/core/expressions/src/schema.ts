import { Schema, type AstType } from '@kong/atc-router'

export type SchemaDefinition = {
  [K in AstType]?: string[];
};

export interface NamedSchemaDefinition {
  name: string;
  definition: SchemaDefinition;
}

export const createSchema = (definition: SchemaDefinition) => {
  const schema = new Schema()

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

export const PROTOCOL_TO_SCHEMA_DEFINITION = {
  http: HTTP_SCHEMA_DEFINITION,
  https: HTTP_SCHEMA_DEFINITION,
  grpc: HTTP_SCHEMA_DEFINITION,
  grpcs: HTTP_SCHEMA_DEFINITION,

  tcp: STREAM_SCHEMA_DEFINITION,
  udp: STREAM_SCHEMA_DEFINITION,
  tls: STREAM_SCHEMA_DEFINITION,

  tls_passthrough: STREAM_SCHEMA_DEFINITION,
}
