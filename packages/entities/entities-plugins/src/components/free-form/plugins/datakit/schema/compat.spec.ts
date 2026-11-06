import { describe, expect, it } from 'vitest'
import { DatakitConfigSchema, omitBackendFilledFields } from './compat'
import { DATAKIT_PLUGIN_SCHEMA } from '../test-utils/schema'

/**
 * The compat schema decides whether a config can be opened in the flow editor.
 * It is NOT a save gate: rejected configs can still be saved from the code editor.
 */
function issuesOf(config: unknown): string[] {
  const { error } = DatakitConfigSchema.safeParse(config)
  return error?.issues.map(({ message }) => message) ?? []
}

describe('Datakit compat schema', () => {
  describe('accepts configs the flow editor can represent', () => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['an empty config', {}],
      ['an empty node list', { nodes: [] }],
    ])('%s (new plugin)', (_, config) => {
      expect(issuesOf(config)).toEqual([])
    })

    it('incomplete nodes that are still being edited', () => {
      expect(issuesOf({
        nodes: [
          { type: 'call', name: 'CALL' },
          { type: 'jq', name: 'JQ', input: 'CALL.body' },
        ],
      })).toEqual([])
    })

    it('numeric fields written as strings', () => {
      expect(issuesOf({
        nodes: [{ type: 'exit', name: 'EXIT', status: '200' }],
      })).toEqual([])
    })

    it('connections to implicit nodes', () => {
      expect(issuesOf({
        nodes: [{ type: 'jq', name: 'JQ', input: 'request.body', output: 'response.body' }],
      })).toEqual([])
    })

    it('resources without memory or redis settings', () => {
      expect(issuesOf({
        nodes: [{ type: 'jq', name: 'JQ' }],
        resources: { cache: { strategy: 'memory' }, vault: { token: '{vault://env/token}' } },
      })).toEqual([])
    })
  })

  describe('rejects configs the flow editor cannot represent', () => {
    it('unknown node type', () => {
      expect(issuesOf({ nodes: [{ type: 'foo', name: 'FOO' }] }))
        .toContainEqual(expect.stringContaining('unknown node type "foo"'))
    })

    it.each([
      ['containing a dot', 'A.B', 'Invalid node name'],
      ['being empty', '', 'Invalid node name'],
      ['shadowing an implicit node', 'request', 'Node name conflicts with reserved implicit node'],
    ])('node name %s', (_, name, message) => {
      expect(issuesOf({ nodes: [{ type: 'jq', name }] })).toContain(message)
    })

    it('duplicate node names', () => {
      expect(issuesOf({
        nodes: [{ type: 'jq', name: 'JQ' }, { type: 'jq', name: 'JQ' }],
      })).toContain('Duplicate node name: "JQ"')
    })

    it('connection to an unknown node', () => {
      expect(issuesOf({
        nodes: [{ type: 'jq', name: 'JQ', input: 'MISSING.body' }],
      })).toContain('Unknown node "MISSING" in connection "MISSING.body"')
    })

    it('connection declared on both sides', () => {
      expect(issuesOf({
        nodes: [
          { type: 'jq', name: 'A', output: 'B' },
          { type: 'jq', name: 'B', input: 'A' },
        ],
      })).toContainEqual(expect.stringContaining('Connection specified on both sides'))
    })

    it('both input and inputs', () => {
      expect(issuesOf({
        nodes: [{ type: 'call', name: 'CALL', input: 'request.body', inputs: { body: 'request.body' } }],
      })).toContain('A node cannot use both "input" and "inputs". Use one or the other.')
    })

    it('both output and outputs', () => {
      expect(issuesOf({
        nodes: [{ type: 'call', name: 'CALL', output: 'response.body', outputs: { body: 'response.body' } }],
      })).toContain('A node cannot use both "output" and "outputs". Use one or the other.')
    })

    it('input fields the flow editor does not support', () => {
      expect(issuesOf({
        nodes: [{ type: 'call', name: 'CALL', inputs: { url: 'request.body' } }],
      })).toContain('Unrecognized key: "url"')
    })

    it('unknown node field', () => {
      expect(issuesOf({ nodes: [{ type: 'jq', name: 'JQ', foo: 1 }] }))
        .toContain('Unrecognized key: "foo"')
    })

    it('unknown top-level field', () => {
      expect(issuesOf({ nodes: [], foo: 1 })).toContain('Unrecognized key: "foo"')
    })

    it('connection to a field name containing dots', () => {
      expect(issuesOf({
        nodes: [
          { type: 'static', name: 'S', values: { 'a.b': 1 } },
          { type: 'jq', name: 'JQ', input: 'S.a.b' },
        ],
      })).toContain('Invalid connection')
    })

    it('malformed connection', () => {
      expect(issuesOf({ nodes: [{ type: 'jq', name: 'JQ', input: 'request.' }] }))
        .toContain('Invalid connection')
    })
  })
})

describe('omitBackendFilledFields', () => {
  // A call node as the gateway returns it (AMV-57): optional inputs the flow editor
  // doesn't support are filled with null
  const backendCallNode = {
    name: 'CALL',
    type: 'call',
    method: 'POST',
    url: 'http://localhost:8000/chat',
    input: null,
    inputs: {
      body: 'request.body',
      headers: null,
      http_proxy: null,
      https_proxy: null,
      proxy_auth_password: null,
      proxy_auth_username: null,
      query: null,
      url: null,
    },
    output: null,
    outputs: null,
    ssl_server_name: null,
    ssl_verify: true,
    timeout: null,
  }

  // A schema with a field the flow editor doesn't support yet
  const pluginSchema = {
    fields: [{
      config: {
        type: 'record',
        fields: [{
          nodes: {
            type: 'array',
            elements: {
              type: 'record',
              fields: [{ name: { type: 'string' } }, { type: { type: 'string' } }],
              subschema_definitions: {
                call: { fields: [{ future_flag: { type: 'boolean', default: false } }] },
              },
            },
          },
        }],
      },
    }],
  }

  it('lets the flow editor open configs with null fields filled in by the gateway', () => {
    const config = { debug: false, ca_certificates: null, resources: null, nodes: [backendCallNode] }

    expect(issuesOf(config)).toContainEqual(expect.stringContaining('Unrecognized keys'))
    expect(issuesOf(omitBackendFilledFields(config, DATAKIT_PLUGIN_SCHEMA))).toEqual([])
  })

  it('drops only unrecognized fields that are null or hold the schema default', () => {
    const config = {
      nodes: [{ ...backendCallNode, future_flag: false, unknown_null: null }],
    }

    const result = omitBackendFilledFields(config, pluginSchema) as typeof config
    expect(result.nodes[0]).not.toHaveProperty('future_flag')
    expect(result.nodes[0]).not.toHaveProperty('unknown_null')
    expect(result.nodes[0].inputs).toEqual({ body: 'request.body', headers: null, query: null })
    // recognized fields are kept, even when null
    expect(result.nodes[0]).toMatchObject({ input: null, outputs: null, timeout: null })
  })

  it('keeps unrecognized fields with a real value, so the config stays out of the flow editor', () => {
    const config = {
      nodes: [{ ...backendCallNode, future_flag: true, inputs: { body: 'request.body', url: 'request.body' } }],
    }

    expect(issuesOf(omitBackendFilledFields(config, pluginSchema)).sort()).toEqual([
      'Unrecognized key: "future_flag"',
      'Unrecognized key: "url"',
    ])
  })

  it('does not change the given config', () => {
    const config = { nodes: [backendCallNode] }
    const copy = structuredClone(config)

    omitBackendFilledFields(config, DATAKIT_PLUGIN_SCHEMA)
    expect(config).toEqual(copy)
  })
})

