import { describe, expect, it } from 'vitest'
import {
  generateNodeName,
  makeGroupId,
  makeGroupName,
  mergeFlowChange,
  parseGroupId,
  parseGroupName,
  parseNameConnection,
} from './helpers'

import type { ConfigNode, DatakitPluginData, GroupId, GroupName, NodeId, NodeName } from '../../types'

describe('store helpers', () => {
  describe('generateNodeName', () => {
    const names = (...values: string[]) => new Set(values as NodeName[])

    it('uses the upper-cased node type as the prefix', () => {
      expect(generateNodeName('jq', names())).toBe('JQ_1')
      expect(generateNodeName('xml_to_json', names())).toBe('XML_TO_JSON_1')
    })

    it('picks the first free number', () => {
      expect(generateNodeName('jq', names('JQ_1', 'JQ_3'))).toBe('JQ_2')
    })

    it('reuses the prefix of a numbered name (duplicating)', () => {
      expect(generateNodeName('FETCH_2', names('FETCH_1', 'FETCH_2'))).toBe('FETCH_3')
      expect(generateNodeName('FETCH', names('FETCH'))).toBe('FETCH_1')
    })
  })

  describe('parseNameConnection', () => {
    it.each([
      ['CALL', { nodeName: 'CALL', fieldName: undefined }],
      ['CALL.body', { nodeName: 'CALL', fieldName: 'body' }],
    ])('%s', (connection, expected) => {
      expect(parseNameConnection(connection as never)).toEqual(expected)
    })
  })

  describe('group ids and names', () => {
    it('round-trips ids and names, even when they contain colons', () => {
      expect(parseGroupId(makeGroupId('node:1' as NodeId, 'then'))).toEqual({ nodeId: 'node:1', branch: 'then' })
      expect(parseGroupName(makeGroupName('BRANCH' as NodeName, 'else'))).toEqual({ nodeName: 'BRANCH', branch: 'else' })
    })

    it('rejects malformed values', () => {
      expect(() => parseGroupId('node' as GroupId)).toThrow()
      expect(() => parseGroupName('BRANCH' as GroupName)).toThrow()
    })
  })

  describe('mergeFlowChange', () => {
    const nodes = [{ name: 'JQ', type: 'jq', jq: '.' }] as ConfigNode[]
    const uiData = { nodes: [], groups: [] }

    it('keeps config fields and form data not managed by the flow editor', () => {
      const formData = {
        config: { nodes: [], debug: true, ca_certificates: ['a'] },
        enabled: false,
      } as unknown as DatakitPluginData

      expect(mergeFlowChange(formData, nodes, uiData, undefined)).toEqual({
        config: { nodes, debug: true, ca_certificates: ['a'] },
        __ui_data: uiData,
        enabled: false,
      })
    })

    it('replaces the resources', () => {
      const formData = { config: { nodes: [], resources: { cache: { strategy: 'memory' } } } } as unknown as DatakitPluginData
      const resources = { vault: { token: '{vault://env/token}' } }

      expect(mergeFlowChange(formData, nodes, uiData, resources).config!.resources).toEqual(resources)
    })

    it('clears existing resources with null so the plugin form does not merge them back', () => {
      const formData = { config: { nodes: [], resources: { cache: { strategy: 'memory' } } } } as unknown as DatakitPluginData
      expect(mergeFlowChange(formData, nodes, uiData, undefined).config!.resources).toBeNull()
    })

    it('does not add resources when there were none', () => {
      const formData = { config: { nodes: [] } } as unknown as DatakitPluginData
      expect(mergeFlowChange(formData, nodes, uiData, undefined).config).not.toHaveProperty('resources')
    })

    it('sets the cache partial', () => {
      const formData = { config: { nodes: [] } } as unknown as DatakitPluginData
      expect(mergeFlowChange(formData, nodes, uiData, undefined, 'partial-1').partials).toEqual([{ id: 'partial-1' }])
    })

    it('clears an existing partial with null so the plugin form does not merge it back', () => {
      const formData = { config: { nodes: [] }, partials: [{ id: 'partial-1' }] } as unknown as DatakitPluginData
      expect(mergeFlowChange(formData, nodes, uiData, undefined).partials).toBeNull()
    })
  })
})
