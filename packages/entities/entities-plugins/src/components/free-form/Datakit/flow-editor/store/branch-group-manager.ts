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

export function createBranchGroupManager({ state, groupMapById, getNodeById, history }: BranchGroupManagerContext) {
  function ensureGroup(node: NodeInstance, branch: BranchName, members: NodeId[]) {
    const groupId = makeGroupId(node.id, branch)
    const existing = groupMapById.value.get(groupId)

    if (members.length) {
      if (!existing) {
        state.value.groups.push(toGroupInstance(node.id, branch))
      }
    } else if (existing) {
      const index = state.value.groups.findIndex((group) => group.id === groupId)
      if (index !== -1) {
        state.value.groups.splice(index, 1)
      }
    }
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

  function addMember(ownerId: NodeId, branch: BranchName, memberId: NodeId, options: CommitOptions = {}) {
    const owner = getNodeById(ownerId)
    const member = getNodeById(memberId)
    if (!owner || !member) return false
    if (ownerId === memberId) return false
    if (isImplicitType(member.type)) return false
    if (owner.phase !== member.phase) return false

    const branchNames = getBranchesFromMeta(owner.type)
    if (!branchNames.includes(branch)) return false

    const config = (owner.config ??= {}) as Record<string, unknown>
    const members = readMembers(owner, branch)

    if (members.includes(memberId)) return false

    config[branch] = [...members, memberId]
    sync(ownerId)

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
    if (remaining.length) {
      owner.config[branch] = remaining
    } else {
      delete owner.config[branch]
    }

    sync(ownerId)

    if (options.commit ?? true) {
      history.commit(options.tag ?? `branch:remove:${branch}`)
    }

    return true
  }

  function dropTarget(targetId: NodeId) {
    const touched = new Set<NodeId>()

    for (const node of state.value.nodes) {
      const branchKeys = getBranchesFromMeta(node.type)
      if (!branchKeys.length) continue

      const config = node.config as Record<string, unknown> | undefined
      if (!config) continue

      for (const branch of branchKeys) {
        const members = readMembers(node, branch)
        if (!members.length) continue

        const filtered = members.filter(id => id !== targetId)
        if (filtered.length === members.length) {
          continue
        }

        if (filtered.length) {
          config[branch] = filtered
        } else {
          delete config[branch]
        }

        touched.add(node.id)
      }
    }

    touched.forEach(sync)
  }

  return {
    sync,
    addMember,
    removeMember,
    dropTarget,
    clear,
  }
}

export type BranchGroupManager = ReturnType<typeof createBranchGroupManager>
