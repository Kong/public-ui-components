import type { ComputedRef, Ref } from 'vue'
import type {
  BranchName,
  EditorState,
  GroupId,
  GroupInstance,
  NodeId,
  NodeInstance,
} from '../../types'
import { isImplicitType, isNodeId } from '../node/node'
import { getBranchesFromMeta, makeGroupId, toGroupInstance } from './helpers'
import type { TaggedHistory } from './history'

type CommitOptions = {
  commit?: boolean
  tag?: string
}

type BranchGroupManagerContext = {
  state: Ref<EditorState>
  groupMapById: ComputedRef<Map<GroupId, GroupInstance>>
  getNodeById: (id: NodeId) => NodeInstance | undefined
  history: Pick<TaggedHistory<EditorState>, 'commit'>
}

function readMembers(node: NodeInstance, branch: BranchName): NodeId[] {
  const config = node.config as Record<string, unknown> | undefined
  if (!config) return []
  const raw = config[branch]
  if (!Array.isArray(raw)) return []

  return (raw as unknown[]).filter((value): value is NodeId => typeof value === 'string' && isNodeId(value))
}

function membersChanged(prev: readonly NodeId[] | undefined, next: readonly NodeId[]): boolean {
  if (!prev) return true
  if (prev.length !== next.length) return true
  for (let i = 0; i < prev.length; i++) {
    if (prev[i] !== next[i]) return true
  }
  return false
}

export function createBranchGroupManager({ state, groupMapById, getNodeById, history }: BranchGroupManagerContext) {
  function normalizeMembers(owner: NodeInstance, members: readonly NodeId[]): NodeId[] {
    const unique: NodeId[] = []
    const seen = new Set<NodeId>()

    for (const memberId of members) {
      if (seen.has(memberId)) continue
      seen.add(memberId)

      const member = getNodeById(memberId)
      if (!member) continue
      if (member.id === owner.id) continue
      if (isImplicitType(member.type)) continue
      if (member.phase !== owner.phase) continue

      unique.push(memberId)
    }

    return unique
  }

  function ensureGroup(node: NodeInstance, branch: BranchName, members: NodeId[]) {
    const groupId = makeGroupId(node.id, branch)
    const existing = groupMapById.value.get(groupId)

    if (members.length) {
      if (!existing) {
        state.value.groups.push(toGroupInstance(node.id, branch, node.phase, members))
      } else {
        if (existing.phase !== node.phase) {
          existing.phase = node.phase
        }
        if (membersChanged(existing.memberIds, members)) {
          existing.memberIds = [...members]
        }
      }
    } else if (existing) {
      const index = state.value.groups.findIndex((group) => group.id === groupId)
      if (index !== -1) {
        state.value.groups.splice(index, 1)
      }
    }
  }

  function setMembers(
    ownerId: NodeId,
    branch: BranchName,
    members: readonly NodeId[],
    options: CommitOptions = {},
  ) {
    const owner = getNodeById(ownerId)
    if (!owner) return false

    const branchNames = getBranchesFromMeta(owner.type)
    if (!branchNames.includes(branch)) return false

    const normalized = normalizeMembers(owner, members)
    const previous = readMembers(owner, branch)
    if (!membersChanged(previous, normalized)) return false

    const config = (owner.config ??= {}) as Record<string, unknown>

    if (normalized.length) {
      config[branch] = [...normalized]
    } else {
      delete config[branch]
      if (Object.keys(config).length === 0) {
        delete owner.config
      }
    }

    ensureGroup(owner, branch, normalized)

    if (options.commit ?? true) {
      history.commit(options.tag ?? `branch:set:${branch}`)
    }

    return true
  }

  function sync(ownerId: NodeId) {
    const owner = getNodeById(ownerId)
    if (!owner) return

    const branchKeys = getBranchesFromMeta(owner.type)
    if (!branchKeys.length) return

    for (const branch of branchKeys) {
      const members = readMembers(owner, branch)
      ensureGroup(owner, branch, members)
    }
  }

  function clear(ownerId: NodeId) {
    state.value.groups = state.value.groups.filter(group => group.ownerId !== ownerId)
  }

  function getMembers(ownerId: NodeId, branch: BranchName): NodeId[] {
    const group = groupMapById.value.get(makeGroupId(ownerId, branch))
    if (group) {
      return [...group.memberIds]
    }

    const owner = getNodeById(ownerId)
    if (!owner) return []
    return readMembers(owner, branch)
  }

  function findMembership(memberId: NodeId): { ownerId: NodeId, branch: BranchName } | undefined {
    for (const group of state.value.groups) {
      if (group.memberIds.includes(memberId)) {
        return { ownerId: group.ownerId, branch: group.branch }
      }
    }
    return undefined
  }

  function wouldCreateCycle(ownerId: NodeId, memberId: NodeId): boolean {
    if (ownerId === memberId) return true

    const visited = new Set<NodeId>()
    const stack: NodeId[] = [memberId]

    while (stack.length) {
      const currentId = stack.pop()!
      if (visited.has(currentId)) continue
      visited.add(currentId)

      if (currentId === ownerId) return true

      const node = getNodeById(currentId)
      if (!node) continue

      const branchKeys = getBranchesFromMeta(node.type)
      if (!branchKeys.length) continue

      for (const branch of branchKeys) {
        const members = readMembers(node, branch)
        for (const nextId of members) {
          stack.push(nextId)
        }
      }
    }

    return false
  }

  function addMember(ownerId: NodeId, branch: BranchName, memberId: NodeId, options: CommitOptions = {}) {
    const owner = getNodeById(ownerId)
    const member = getNodeById(memberId)
    if (!owner || !member) return false
    if (ownerId === memberId) return false
    if (isImplicitType(member.type)) return false
    if (owner.phase !== member.phase) return false
    if (wouldCreateCycle(ownerId, memberId)) return false

    const branchNames = getBranchesFromMeta(owner.type)
    if (!branchNames.includes(branch)) return false

    const existingMembers = readMembers(owner, branch)
    if (existingMembers.includes(memberId)) return false

    dropTarget(memberId)

    const nextMembers = [...existingMembers, memberId]
    const changed = setMembers(ownerId, branch, nextMembers, { commit: false })
    if (!changed) return false

    if (options.commit ?? true) {
      history.commit(options.tag ?? `branch:add:${branch}`)
    }

    return true
  }

  function removeMember(ownerId: NodeId, branch: BranchName, memberId: NodeId, options: CommitOptions = {}) {
    const owner = getNodeById(ownerId)
    if (!owner?.config) return false

    const members = readMembers(owner, branch)
    if (!members.includes(memberId)) return false

    const remaining = members.filter(id => id !== memberId)
    const changed = setMembers(ownerId, branch, remaining, { commit: false })
    if (!changed) return false

    if (options.commit ?? true) {
      history.commit(options.tag ?? `branch:remove:${branch}`)
    }

    return true
  }

  function dropTarget(targetId: NodeId) {
    const membership = findMembership(targetId)
    if (!membership) return

    const members = getMembers(membership.ownerId, membership.branch)
    const nextMembers = members.filter(id => id !== targetId)
    setMembers(membership.ownerId, membership.branch, nextMembers, { commit: false })
  }

  return {
    sync,
    setMembers,
    addMember,
    removeMember,
    dropTarget,
    clear,
    getMembers,
    findMembership,
    wouldCreateCycle,
  }
}

export type BranchGroupManager = ReturnType<typeof createBranchGroupManager>
