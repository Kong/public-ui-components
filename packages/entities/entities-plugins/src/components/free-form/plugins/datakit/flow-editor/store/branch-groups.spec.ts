import { beforeEach, describe, expect, it, vi } from 'vitest'
import { configNodesByName, createTestStore, expectConsistent, nodeIdOf } from '../../test-utils/store'

import type { DatakitPluginData } from '../../types'

/** CHECK -> BRANCH, with A, B and C free to be assigned to its branches */
function basePluginData(): DatakitPluginData {
  return {
    config: {
      nodes: [
        { name: 'CHECK', type: 'jq', jq: '.ok', input: 'request.body' },
        { name: 'BRANCH', type: 'branch', input: 'CHECK' },
        { name: 'A', type: 'jq', jq: '.' },
        { name: 'B', type: 'jq', jq: '.' },
        { name: 'C', type: 'jq', jq: '.' },
      ],
    },
  } as DatakitPluginData
}

function setup(pluginData: DatakitPluginData = basePluginData()) {
  const { store } = createTestStore(pluginData)
  return { store, groups: store.branchGroups, id: (name: string) => nodeIdOf(store, name) }
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('branch groups', () => {
  it('loads branch members from the config', () => {
    const { store, groups, id } = setup({
      config: {
        nodes: [
          ...basePluginData().config!.nodes!.slice(0, 1),
          { name: 'BRANCH', type: 'branch', input: 'CHECK', then: ['A'], else: ['B'] },
          ...basePluginData().config!.nodes!.slice(2),
        ],
      },
    } as DatakitPluginData)

    expect(groups.getMembers(id('BRANCH'), 'then')).toEqual([id('A')])
    expect(groups.getMembers(id('BRANCH'), 'else')).toEqual([id('B')])
    expect(groups.findMembership(id('A'))).toEqual({ ownerId: id('BRANCH'), branch: 'then' })
    expectConsistent(store)
  })

  it('adds members and serializes them by name', () => {
    const { store, groups, id } = setup()

    expect(groups.addMember(id('BRANCH'), 'then', id('A'))).toBe(true)
    expect(groups.addMember(id('BRANCH'), 'then', id('B'))).toBe(true)
    expect(groups.addMember(id('BRANCH'), 'else', id('C'))).toBe(true)

    expect(configNodesByName(store).BRANCH).toMatchObject({ then: ['A', 'B'], else: ['C'] })
    expect(store.state.value.groups.map(({ branch, memberIds }) => ({ branch, memberIds }))).toEqual([
      { branch: 'then', memberIds: [id('A'), id('B')] },
      { branch: 'else', memberIds: [id('C')] },
    ])
    expectConsistent(store)
  })

  it('moves a member from one branch to another', () => {
    const { store, groups, id } = setup()
    groups.addMember(id('BRANCH'), 'then', id('A'))

    groups.addMember(id('BRANCH'), 'else', id('A'))

    expect(configNodesByName(store).BRANCH).toMatchObject({ else: ['A'] })
    expect(configNodesByName(store).BRANCH).not.toHaveProperty('then')
  })

  it.each([
    ['the owner itself', 'BRANCH'],
    ['an implicit node', 'request'],
    ['an upstream node (cycle)', 'CHECK'],
  ])('rejects %s as a member', (_, memberName) => {
    const { store, groups, id } = setup()

    expect(groups.canAddMember(id('BRANCH'), 'then', id(memberName))).toBe(false)
    expect(groups.addMember(id('BRANCH'), 'then', id(memberName))).toBe(false)
    expect(configNodesByName(store).BRANCH).not.toHaveProperty('then')
  })

  it('rejects a member from another phase', () => {
    const { store, groups, id } = setup()
    store.addNode({ type: 'jq', name: 'LATE' as never, phase: 'response' })

    expect(groups.addMember(id('BRANCH'), 'then', id('LATE'))).toBe(false)
  })

  it('rejects branches the owner does not have', () => {
    const { groups, id } = setup()
    expect(groups.addMember(id('CHECK'), 'then', id('A'))).toBe(false)
  })

  it('supports nested branches', () => {
    const { store, groups, id } = setup()
    store.addNode({ type: 'branch', name: 'INNER' as never })

    groups.addMember(id('BRANCH'), 'then', id('INNER'))
    groups.addMember(id('INNER'), 'else', id('A'))

    expect(configNodesByName(store)).toMatchObject({
      BRANCH: { then: ['INNER'] },
      INNER: { else: ['A'] },
    })
    expect(groups.getNodeDepth(id('A'))).toBeGreaterThan(groups.getNodeDepth(id('INNER')))
    // the outer owner cannot become a member of its own descendant
    expect(groups.canAddMember(id('INNER'), 'then', id('BRANCH'))).toBe(false)
    expectConsistent(store)
  })

  it('removes a member and drops the empty branch', () => {
    const { store, groups, id } = setup()
    groups.addMember(id('BRANCH'), 'then', id('A'))

    expect(groups.removeMember(id('A'))).toBe(true)

    expect(configNodesByName(store).BRANCH).not.toHaveProperty('then')
    expect(store.state.value.groups).toEqual([])
  })

  it('drops a removed node from its branch', () => {
    const { store, groups, id } = setup()
    groups.addMember(id('BRANCH'), 'then', id('A'))
    groups.addMember(id('BRANCH'), 'then', id('B'))

    store.removeNode(id('A'))

    expect(configNodesByName(store).BRANCH).toMatchObject({ then: ['B'] })
    expectConsistent(store)
  })

  it('keeps members as plain nodes when the owner is removed', () => {
    const { store, groups, id } = setup()
    groups.addMember(id('BRANCH'), 'then', id('A'))

    store.removeNode(id('BRANCH'))

    expect(store.state.value.groups).toEqual([])
    expect(configNodesByName(store).A).toEqual({ name: 'A', type: 'jq', jq: '.' })
    expectConsistent(store)
  })

  it('serializes renamed members under their new name', () => {
    const { store, groups, id } = setup()
    groups.addMember(id('BRANCH'), 'then', id('A'))

    store.renameNode(id('A'), 'RENAMED' as never)

    expect(configNodesByName(store).BRANCH).toMatchObject({ then: ['RENAMED'] })
  })

  it('does not copy members when duplicating a branch node', () => {
    const { store, groups, id } = setup()
    groups.addMember(id('BRANCH'), 'then', id('A'))

    const copyId = store.duplicateNode(id('BRANCH'))!

    expect(groups.getMembers(copyId, 'then')).toEqual([])
    expect(groups.findMembership(id('A'))).toEqual({ ownerId: id('BRANCH'), branch: 'then' })
    expectConsistent(store)
  })
})
