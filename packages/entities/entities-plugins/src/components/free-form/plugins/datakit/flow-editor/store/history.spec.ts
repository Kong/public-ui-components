import { describe, expect, it } from 'vitest'
import { configNodesByName, createTestStore, nodeIdOf } from '../../test-utils/store'

import type { DatakitPluginData, NodeName } from '../../types'

function setup() {
  return createTestStore({
    config: { nodes: [{ name: 'JQ', type: 'jq', jq: '.', input: 'request.body' }] },
  } as DatakitPluginData)
}

const names = (store: ReturnType<typeof setup>['store']) => Object.keys(configNodesByName(store))

describe('editor history', () => {
  it('reports every committed change to the form', () => {
    const { store, changes } = setup()
    const before = changes.length

    store.addNode({ type: 'jq' })
    store.renameNode(nodeIdOf(store, 'JQ_1'), 'NEXT' as NodeName)

    expect(changes.length - before).toBe(2)
    expect(changes.at(-1)!.configNodes.map(({ name }) => name)).toEqual(['JQ', 'NEXT'])
  })

  it('undoes and redoes changes', () => {
    const { store, changes } = setup()
    store.addNode({ type: 'jq' })
    store.renameNode(nodeIdOf(store, 'JQ_1'), 'NEXT' as NodeName)

    store.undo()
    expect(names(store)).toEqual(['JQ', 'JQ_1'])
    store.undo()
    expect(names(store)).toEqual(['JQ'])
    expect(store.canUndo.value).toBe(false)
    // undo is reported to the form as well
    expect(changes.at(-1)!.configNodes.map(({ name }) => name)).toEqual(['JQ'])

    store.redo()
    store.redo()
    expect(names(store)).toEqual(['JQ', 'NEXT'])
    expect(store.canRedo.value).toBe(false)
  })

  it('drops the redo stack after a new change', () => {
    const { store } = setup()
    store.addNode({ type: 'jq' })
    store.undo()

    store.addNode({ type: 'exit' })

    expect(store.canRedo.value).toBe(false)
    expect(names(store)).toEqual(['JQ', 'EXIT_1'])
  })

  it('merges consecutive commits with the same tag into one undo step', () => {
    const { store } = setup()
    const id = nodeIdOf(store, 'JQ')

    store.renameNode(id, 'J' as NodeName, true, 'rename')
    store.renameNode(id, 'JQ2' as NodeName, true, 'rename')

    store.undo()
    expect(names(store)).toEqual(['JQ'])
  })

  it('updates the last snapshot without a new undo step for the `*` tag', () => {
    const { store } = setup()
    store.addNode({ type: 'jq' })

    store.moveNode(nodeIdOf(store, 'JQ'), { x: 10, y: 10 }, false)
    store.commit('*')

    store.undo()
    expect(names(store)).toEqual(['JQ'])
  })

  it('reverts uncommitted changes to the last commit', () => {
    const { store } = setup()
    store.addNode({ type: 'jq' })
    store.renameNode(nodeIdOf(store, 'JQ_1'), 'DRAFT' as NodeName, false)

    store.reset()

    expect(names(store)).toEqual(['JQ', 'JQ_1'])
  })

  it('reverts the last commit without allowing redo', () => {
    const { store } = setup()
    store.addNode({ type: 'jq' })

    store.revert()

    expect(names(store)).toEqual(['JQ'])
    expect(store.canRedo.value).toBe(false)
  })

  it('clears the history without reporting a change', () => {
    const { store, changes } = setup()
    store.addNode({ type: 'jq' })
    const before = changes.length

    store.clear()

    expect(store.canUndo.value).toBe(false)
    expect(changes.length).toBe(before)
    expect(names(store)).toEqual(['JQ', 'JQ_1'])
  })

  it('replaces the state on load and clears the history', () => {
    const { store } = setup()
    store.addNode({ type: 'jq' })

    store.load({ config: { nodes: [{ name: 'OTHER', type: 'jq', jq: '.' }] } } as DatakitPluginData)

    expect(names(store)).toEqual(['OTHER'])
    expect(store.canUndo.value).toBe(false)
  })

  it('can undo a load that keeps the history (inserting an example)', () => {
    const { store } = setup()
    store.addNode({ type: 'jq' })

    store.load({ config: { nodes: [{ name: 'EXAMPLE', type: 'jq', jq: '.' }] } } as DatakitPluginData, true)
    expect(names(store)).toEqual(['EXAMPLE'])

    store.undo()
    expect(names(store)).toEqual(['JQ', 'JQ_1'])
  })
})
