import { describe, expect, it } from 'vitest'
import { DatakitConfigSchema } from './compat'

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

    it('malformed connection', () => {
      expect(issuesOf({ nodes: [{ type: 'jq', name: 'JQ', input: 'request.' }] }))
        .toContain('Invalid connection')
    })
  })
})
