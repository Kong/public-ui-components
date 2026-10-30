import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mergeFlowChange } from './helpers'
import { goldenFixtures } from '../../test-utils/fixtures'
import {
  configNodesByName,
  createTestStore,
  expectConsistent,
  fieldIdOf,
  nodeIdOf,
  toPluginData,
} from '../../test-utils/store'

import type { DatakitPluginData, FieldName, NodeName } from '../../types'

const url = 'https://example.com'

/** request.headers -> CALL, CALL.body -> JQ -> response.body */
function basePluginData(): DatakitPluginData {
  return {
    config: {
      nodes: [
        { name: 'CALL', type: 'call', url, inputs: { headers: 'request.headers' } },
        { name: 'JQ', type: 'jq', jq: '.', input: 'CALL.body', output: 'response.body' },
      ],
    },
  } as DatakitPluginData
}

function setup(pluginData: DatakitPluginData = basePluginData()) {
  return createTestStore(pluginData)
}

beforeEach(() => {
  // Rejected operations are reported with console.warn
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('editor store', () => {
  describe('nodes', () => {
    it('adds a node with a generated unique name', () => {
      const { store } = setup()

      store.addNode({ type: 'jq' })
      store.addNode({ type: 'jq' })

      expect(configNodesByName(store)).toMatchObject({
        JQ_1: { type: 'jq' },
        JQ_2: { type: 'jq' },
      })
      expectConsistent(store)
    })

    it('adds a node with the given name, phase and config', () => {
      const { store } = setup()

      const id = store.addNode({ type: 'jq', name: 'TRANSFORM' as never, phase: 'response', config: { jq: '.a' } })

      expect(store.getNodeById(id!)).toMatchObject({ name: 'TRANSFORM', phase: 'response' })
      expect(configNodesByName(store).TRANSFORM).toEqual({ name: 'TRANSFORM', type: 'jq', jq: '.a' })
      expectConsistent(store)
    })

    it('refuses to create implicit nodes', () => {
      const { store } = setup()
      expect(() => store.addNode({ type: 'request' as never })).toThrow()
    })

    it('duplicates a node with its config but without its connections', () => {
      const { store } = setup()

      const id = store.duplicateNode(nodeIdOf(store, 'JQ'))

      expect(store.getNodeById(id!)!.name).toBe('JQ_1')
      expect(configNodesByName(store).JQ_1).toEqual({ name: 'JQ_1', type: 'jq', jq: '.' })
      expect(store.getEdgesByNodeId(id!)).toEqual([])
      expectConsistent(store)
    })

    it('does not duplicate implicit nodes', () => {
      const { store } = setup()
      expect(store.duplicateNode(nodeIdOf(store, 'request'))).toBeUndefined()
    })

    it('removes a node together with its connections', () => {
      const { store } = setup()

      store.removeNode(nodeIdOf(store, 'CALL'))

      expect(store.getNodeByName('CALL' as NodeName)).toBeUndefined()
      // JQ no longer reads from CALL
      expect(configNodesByName(store)).toEqual({
        JQ: { name: 'JQ', type: 'jq', jq: '.', output: 'response.body' },
      })
      expectConsistent(store)
    })

    it('clears the selection when the selected node is removed', () => {
      const { store } = setup()
      const id = nodeIdOf(store, 'JQ')

      store.selectNode(id)
      store.removeNode(id)

      expect(store.selection.value).toBeUndefined()
    })

    it('renames a node and updates every connection referring to it', () => {
      const { store } = setup()

      store.renameNode(nodeIdOf(store, 'CALL'), 'FETCH' as NodeName)

      expect(configNodesByName(store)).toMatchObject({
        FETCH: { type: 'call', inputs: { headers: 'request.headers' } },
        JQ: { input: 'FETCH.body' },
      })
      expectConsistent(store)
    })

    it('does not rename implicit nodes', () => {
      const { store } = setup()
      const id = nodeIdOf(store, 'request')

      store.renameNode(id, 'REQ' as NodeName)

      expect(store.getNodeById(id)!.name).toBe('request')
    })

    it('replaces the node config but keeps its name, type and connections', () => {
      const { store } = setup()

      store.replaceConfig(nodeIdOf(store, 'JQ'), { jq: '.data' })

      expect(configNodesByName(store).JQ).toEqual({
        name: 'JQ',
        type: 'jq',
        jq: '.data',
        input: 'CALL.body',
        output: 'response.body',
      })
    })

    it('stores positions and expansion in UI data only', () => {
      const { store } = setup()
      const id = nodeIdOf(store, 'JQ')
      const before = store.toConfigNodes()

      store.moveNode(id, { x: 123, y: 456 })
      store.toggleExpanded(id, 'input', true)

      expect(store.toConfigNodes()).toEqual(before)
      expect(store.toUINodes().find(({ name }) => name === 'JQ')).toMatchObject({
        position: { x: 123, y: 456 },
        expanded: { input: true },
      })
    })
  })

  describe('fields', () => {
    it('serializes a connected input field under `inputs`', () => {
      const { store } = setup()
      const jq = nodeIdOf(store, 'JQ')
      store.disconnectInEdges(jq)

      store.addField(jq, 'input', 'payload' as FieldName)
      store.connectEdge({
        source: nodeIdOf(store, 'CALL'),
        sourceField: fieldIdOf(store, 'CALL', 'output', 'body'),
        target: jq,
        targetField: fieldIdOf(store, 'JQ', 'input', 'payload'),
      })

      expect(configNodesByName(store).JQ).toMatchObject({ inputs: { payload: 'CALL.body' } })
      expect(configNodesByName(store).JQ).not.toHaveProperty('input')
      expectConsistent(store)
    })

    it('rejects a duplicate field name', () => {
      const { store } = setup()
      const jq = nodeIdOf(store, 'JQ')

      store.addField(jq, 'input', 'payload' as FieldName)
      store.addField(jq, 'input', 'payload' as FieldName)

      expect(store.getNodeById(jq)!.fields.input.map(({ name }) => name)).toEqual(['payload'])
    })

    it('renames a connected input field', () => {
      const { store } = setup()
      const call = nodeIdOf(store, 'CALL')

      store.renameField(call, fieldIdOf(store, 'CALL', 'input', 'headers'), 'query' as FieldName)

      expect(configNodesByName(store).CALL).toMatchObject({ inputs: { query: 'request.headers' } })
    })

    it('renames a connected output field and updates downstream connections', () => {
      const { store } = setup()
      const call = nodeIdOf(store, 'CALL')

      store.renameField(call, fieldIdOf(store, 'CALL', 'output', 'body'), 'status' as FieldName)

      expect(configNodesByName(store).JQ).toMatchObject({ input: 'CALL.status' })
    })

    it('removes a configurable field together with its connections', () => {
      const { store } = setup()
      const jq = nodeIdOf(store, 'JQ')
      store.disconnectInEdges(jq)
      store.addField(jq, 'input', 'payload' as FieldName)
      store.connectEdge({
        source: nodeIdOf(store, 'CALL'),
        sourceField: fieldIdOf(store, 'CALL', 'output', 'body'),
        target: jq,
        targetField: fieldIdOf(store, 'JQ', 'input', 'payload'),
      })

      store.removeField(jq, fieldIdOf(store, 'JQ', 'input', 'payload'))

      expect(configNodesByName(store).JQ).not.toHaveProperty('inputs')
      expect(store.getInEdgesByNodeId(jq)).toEqual([])
      expectConsistent(store)
    })
  })

  describe('connections', () => {
    it('serializes a whole-node connection as `input`', () => {
      const { store } = setup()
      store.addNode({ type: 'jq', name: 'NEXT' as never })

      store.connectEdge({ source: nodeIdOf(store, 'JQ'), target: nodeIdOf(store, 'NEXT') })

      expect(configNodesByName(store).NEXT).toMatchObject({ input: 'JQ' })
      expectConsistent(store)
    })

    it('serializes a connection to an implicit node on the source side', () => {
      const { store } = setup()

      store.connectEdge({
        source: nodeIdOf(store, 'CALL'),
        sourceField: fieldIdOf(store, 'CALL', 'output', 'headers'),
        target: nodeIdOf(store, 'response'),
        targetField: fieldIdOf(store, 'response', 'input', 'headers'),
      })

      expect(configNodesByName(store).CALL).toMatchObject({ outputs: { headers: 'response.headers' } })
      expectConsistent(store)
    })

    it('swaps the ends when dragging from an input to an output', () => {
      const { store } = setup()
      store.addNode({ type: 'jq', name: 'NEXT' as never })

      store.connectEdge({
        source: nodeIdOf(store, 'CALL'),
        sourceField: fieldIdOf(store, 'CALL', 'input', 'body'),
        target: nodeIdOf(store, 'NEXT'),
      })

      expect(configNodesByName(store).CALL).toMatchObject({ inputs: { body: 'NEXT' } })
    })

    it.each([
      ['a self-loop', (s: ReturnType<typeof setup>['store']) => ({ source: nodeIdOf(s, 'JQ'), target: nodeIdOf(s, 'JQ') })],
      ['a cycle', (s: ReturnType<typeof setup>['store']) => ({
        source: nodeIdOf(s, 'JQ'),
        target: nodeIdOf(s, 'CALL'),
        targetField: fieldIdOf(s, 'CALL', 'input', 'body'),
      })],
      ['a connection into `request`', (s: ReturnType<typeof setup>['store']) => ({ source: nodeIdOf(s, 'JQ'), target: nodeIdOf(s, 'request') })],
      ['a connection out of `response`', (s: ReturnType<typeof setup>['store']) => ({ source: nodeIdOf(s, 'response'), target: nodeIdOf(s, 'CALL') })],
      ['a second source for a connected input field', (s: ReturnType<typeof setup>['store']) => ({
        source: nodeIdOf(s, 'request'),
        sourceField: fieldIdOf(s, 'request', 'output', 'body'),
        target: nodeIdOf(s, 'CALL'),
        targetField: fieldIdOf(s, 'CALL', 'input', 'headers'),
      })],
      ['a second whole-node input', (s: ReturnType<typeof setup>['store']) => ({ source: nodeIdOf(s, 'request'), target: nodeIdOf(s, 'JQ') })],
      ['a whole-node input on a node with field inputs', (s: ReturnType<typeof setup>['store']) => ({ source: nodeIdOf(s, 'request'), target: nodeIdOf(s, 'CALL') })],
    ])('rejects %s', (_, makeEdge) => {
      const { store } = setup()
      const edge = makeEdge(store)
      const before = toPluginData(store, basePluginData())

      expect(store.isValidConnection(edge)).toBe(false)
      expect(store.connectEdge(edge)).toBeUndefined()
      expect(toPluginData(store, basePluginData())).toEqual(before)
    })

    it('replaces a connection', () => {
      const { store } = setup()
      const [edge] = store.getInEdgesByNodeId(nodeIdOf(store, 'JQ'))

      store.replaceConnection(edge.id, {
        source: nodeIdOf(store, 'CALL'),
        sourceField: fieldIdOf(store, 'CALL', 'output', 'headers'),
        target: nodeIdOf(store, 'JQ'),
      })

      expect(configNodesByName(store).JQ).toMatchObject({ input: 'CALL.headers' })
      expectConsistent(store)
    })

    it('disconnects incoming and outgoing connections', () => {
      const { store } = setup()
      const call = nodeIdOf(store, 'CALL')

      store.disconnectInEdges(call)
      store.disconnectOutEdges(call)

      expect(configNodesByName(store)).toEqual({
        CALL: { name: 'CALL', type: 'call', url },
        JQ: { name: 'JQ', type: 'jq', jq: '.', output: 'response.body' },
      })
      expectConsistent(store)
    })
  })

  describe('resources', () => {
    it('serializes vault secrets and the cache resource', () => {
      const vault = goldenFixtures.find(({ id }) => id === 'authenticate-with-vault-secret')!.pluginData
      const cache = goldenFixtures.find(({ id }) => id === 'conditionally-store-cached-items')!.pluginData

      expect(setup(vault).store.toResources()).toEqual(vault.config!.resources)
      expect(setup(cache).store.toResources()).toMatchObject(cache.config!.resources!)
    })

    it('clears the resources from the form data when the cache is removed', () => {
      const { pluginData } = goldenFixtures.find(({ id }) => id === 'conditionally-store-cached-items')!
      const { store, changes } = setup(pluginData)

      // What the resources panel does when the cache is removed
      store.state.value.cacheConfig = undefined
      store.commit()

      const { configNodes, uiData, resources, partialId } = changes.at(-1)!
      const formData = mergeFlowChange(pluginData, configNodes, uiData, resources, partialId)
      expect(formData.config!.resources ?? null).toBeNull()
    })
  })
})
