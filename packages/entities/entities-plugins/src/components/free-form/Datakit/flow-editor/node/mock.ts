import type { FormSchema } from '../../../../../types/plugins/form-schema'
import type { ConfigNode, UINode } from '../../types'

export const CallNodeSchema: FormSchema = { 'fields': [{ 'name': { 'type': 'string', 'required': true } }, { 'method': { 'default': 'GET', 'description': 'A string representing an HTTP method, such as GET, POST, PUT, or DELETE. The string must contain only uppercase letters.', 'len_max': 32, 'len_min': 1, 'match': '^%u+$', 'type': 'string' } }, { 'ssl_server_name': { 'description': 'A string representing an SNI (server name indication) value for TLS.', 'type': 'string' } }, { 'timeout': { 'between': [0, 2147483646], 'description': 'An integer representing a timeout in milliseconds. Must be between 0 and 2^31-2.', 'type': 'integer' } }, { 'url': { 'description': 'A string representing a URL, such as https://example.com/path/to/resource?q=search.', 'required': true, 'type': 'string' } }, { 'input': { 'description': 'call node input', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }, { 'inputs': { 'description': 'call node inputs', 'fields': [{ 'body': { 'description': 'HTTP request body', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }, { 'headers': { 'description': 'HTTP request headers', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }, { 'query': { 'description': 'HTTP request query', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }], 'required': false, 'type': 'record' } }, { 'output': { 'description': 'call node output', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }, { 'outputs': { 'description': 'call node outputs', 'fields': [{ 'body': { 'description': 'HTTP response body', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }, { 'headers': { 'description': 'HTTP response headers', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }, { 'status': { 'description': 'HTTP response status code', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }], 'required': false, 'type': 'record' } }], 'type': 'record' }

export const ExitNodeSchema: FormSchema = { 'fields': [{ 'name': { 'type': 'string', 'required': true } }, { 'status': { 'between': [200, 599], 'default': 200, 'description': 'HTTP status code', 'required': false, 'type': 'integer' } }, { 'warn_headers_sent': { 'required': false, 'type': 'boolean' } }, { 'input': { 'description': 'exit node input', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }, { 'inputs': { 'description': 'exit node inputs', 'fields': [{ 'body': { 'description': 'HTTP response body', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }, { 'headers': { 'description': 'HTTP response headers', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }], 'required': false, 'type': 'record' } }], 'type': 'record' }

export const JqNodeSchema: FormSchema = { 'fields': [{ 'name': { 'type': 'string', 'required': true } }, { 'jq': { 'description': 'The jq filter text. Refer to https://jqlang.org/manual/ for full documentation.', 'len_max': 10240, 'len_min': 1, 'required': true, 'type': 'string' } }, { 'input': { 'description': 'filter input(s)', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }, { 'inputs': { 'description': 'filter input(s)', 'keys': { 'len_max': 255, 'len_min': 1, 'type': 'string' }, 'required': false, 'type': 'map', 'values': { 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'type': 'string' } } }, { 'output': { 'description': 'filter output(s)', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }], 'type': 'record' }

export const PropertyNodeSchema: FormSchema = { 'fields': [{ 'name': { 'type': 'string', 'required': true } }, { 'content_type': { 'description': 'The expected mime type of the property value. When set to `application/json`, SET operations will JSON-encode input data before writing it, and GET operations will JSON-decode output data after reading it. Otherwise, this setting has no effect.', 'one_of': ['application/json', 'text/plain', 'application/octet-stream'], 'required': false, 'type': 'string' } }, { 'property': { 'description': 'The property name to get/set', 'len_max': 255, 'len_min': 1, 'required': true, 'type': 'string' } }, { 'input': { 'description': 'Property input source. When connected, this node operates in SET mode and writes input data to the property. Otherwise, the node operates in GET mode and reads the property.', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }, { 'output': { 'description': 'Property output. This can be connected regardless of whether the node is operating in GET mode or SET mode.', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }], 'type': 'record' }

export const StaticNodeSchema: FormSchema = { 'fields': [{ 'name': { 'type': 'string', 'required': true } }, { 'values': { 'description': 'An object with string keys and freeform values', 'json_schema': { 'inline': { 'type': 'object' } }, 'required': true, 'type': 'json' } }, { 'output': { 'description': 'The entire `.values` map', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }, { 'outputs': { 'description': 'Individual items from `.values`, referenced by key', 'keys': { 'len_max': 255, 'len_min': 1, 'type': 'string' }, 'required': false, 'type': 'map', 'values': { 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'type': 'string' } } }], 'type': 'record' }

export const ServiceRequestSchema: FormSchema = {
  fields: [
    { 'input': { 'description': 'filter input(s)', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } },
    { 'inputs': { 'description': 'call node inputs', 'fields': [{ 'body': { 'description': 'HTTP request body', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }, { 'headers': { 'description': 'HTTP request headers', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }, { 'query': { 'description': 'HTTP request query', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }], 'required': false, 'type': 'record' } },
  ],
  type: 'record',
}

export const ResponseSchema: FormSchema = {
  fields: [
    { 'input': { 'description': 'filter input(s)', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } },
    { 'inputs': { 'description': 'call node inputs', 'fields': [{ 'body': { 'description': 'HTTP request body', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }, { 'headers': { 'description': 'HTTP request headers', 'len_max': 255, 'len_min': 1, 'match_any': { 'err': 'must be one of NODE_NAME or NODE_NAME.FIELD', 'patterns': ['^[A-Za-z_][A-Za-z0-9_-]*$', '^[A-Za-z_][A-Za-z0-9_-]*%..+$'] }, 'required': false, 'type': 'string' } }], 'required': false, 'type': 'record' } },
  ],
  type: 'record',
}

export const MockData: {
  configNodes: ConfigNode[]
  uiNodes: UINode[]
} = {
  configNodes: [
    {
      type: 'call',
      name: 'MY_CALL',
      url: 'https://example.com',
      method: 'GET',
      timeout: 5000,
      ssl_server_name: 'example.com',
      inputs: {
        headers: 'request.headers',
        body: 'request.body',
        query: 'request.query',
      },
    },
    {
      type: 'call',
      name: 'MY_CALL_1',
      url: 'https://example.com',
      method: 'GET',
      timeout: 5000,
      ssl_server_name: 'example.com',
      input: 'MY_CALL',
    },
    {
      type: 'property',
      name: 'PROP',
      property: 'kong.ctx.plugin.foo',
    },
    {
      type: 'exit',
      name: 'EXIT',
      status: 200,
      warn_headers_sent: true,
      input: 'MY_CALL_1',
    },
  ] as ConfigNode[],
  uiNodes: [
    {
      name: 'MY_CALL',
      phase: 'request',
      position: { x: 100, y: 100 },
      fields: {
        input: ['headers', 'body', 'query'],
        output: ['body', 'headers', 'status'],
      },
      expanded: {
        input: true,
        output: true,
      },
    },
    {
      name: 'MY_CALL_1',
      phase: 'request',
      position: { x: 300, y: 100 },
      fields: {
        input: ['headers', 'body', 'query'],
        output: ['body', 'headers', 'status'],
      },
      expanded: {
        input: true,
        output: true,
      },
    },
    {
      name: 'PROP',
      phase: 'request',
      position: { x: 500, y: 100 },
    },
    {
      name: 'EXIT',
      phase: 'request',
      position: { x: 700, y: 100 },
      fields: {
        input: ['body', 'headers'],
      },
      expanded: {
        input: true,
        output: true,
      },
    },
  ] as UINode[],
}
