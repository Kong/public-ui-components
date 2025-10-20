/**
 * Branch group helpers
 *
 * Manages logical groups of nodes organized under branch nodes (e.g., "then", "else").
 * Responsibilities include:
 * - Validating membership (phase compatibility, cycle detection, type checking)
 * - Synchronizing node config with group state
 * - Managing group lifecycle (create, update, delete)
 * - Providing query APIs for membership lookup
 *
 * Groups are stored in two places:
 * 1. Node config: `node.config[branchName]` contains NodeId[]
 * 2. State groups: `state.groups` contains GroupInstance[] with layout info
 */

import { computed } from 'vue'
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
import { getBranchesFromMeta, makeGroupId, setsEqual, toGroupInstance } from './helpers'
import type { TaggedHistory } from './history'
import { buildAdjacency, getCombinedEdges } from './graph'

export interface CommitOptions {
  /** Whether to commit the change to history. Defaults to true. */
  commit?: boolean
  /** Optional tag for the history commit. */
  tag?: string
}

interface CreateBranchGroupsContext {
  state: Ref<EditorState>
  groupMapById: ComputedRef<Map<GroupId, GroupInstance>>
  getNodeById: (id: NodeId) => NodeInstance | undefined
  history: TaggedHistory<EditorState>
}

/**
 * Reads member node IDs from a branch config field.
 * Returns empty array if the branch field is missing or malformed.
 */
function readMembers(node: NodeInstance, branch: BranchName): NodeId[] {
  const config = node.config as Record<string, unknown> | undefined
  if (!config) return []
  const raw = config[branch]
  if (!Array.isArray(raw)) return []

  return (raw as unknown[]).filter((value): value is NodeId => typeof value === 'string' && isNodeId(value))
}

/**
 * Creates helpers for branch group operations.
 * Provides computed lookups, lifecycle helpers, and validation utilities.
 */
export function createBranchGroups({ state, groupMapById, getNodeById, history }: CreateBranchGroupsContext) {
  /**
   * Cached membership index for O(1) lookups.
   * Automatically recomputes when groups change.
   * Maps member node ID to its owner and branch.
   */
  const membershipIndex = computed(() => {
    const index = new Map<NodeId, { ownerId: NodeId, branch: BranchName }>()
    for (const group of state.value.groups) {
      for (const memberId of group.memberIds) {
        index.set(memberId, { ownerId: group.ownerId, branch: group.branch })
      }
    }
    return index
  })

  const memberGroupMap = computed(() => {
    const map = new Map<NodeId, GroupInstance>()
    for (const group of state.value.groups) {
      for (const memberId of group.memberIds) {
        map.set(memberId, group)
      }
    }
    return map
  })

  const groupsByOwner = computed(() => {
    const map = new Map<NodeId, GroupInstance[]>()
    for (const group of state.value.groups) {
      if (!map.has(group.ownerId)) {
        map.set(group.ownerId, [])
      }
      map.get(group.ownerId)!.push(group)
    }
    return map
  })

  const combinedEdges = computed(() => getCombinedEdges(state.value.edges, state.value.groups))
  const combinedAdjacency = computed(() => buildAdjacency(combinedEdges.value))

  /**
   * Type guard: checks if a node supports a specific branch.
   */
  function supportsBranch(owner: NodeInstance | undefined, branch: BranchName): owner is NodeInstance {
    if (!owner) return false
    return getBranchesFromMeta(owner.type).includes(branch)
  }

  /**
   * Validates if a node can be a member of an owner's branch group.
   */
  function isValidMember(owner: NodeInstance, memberId: NodeId): boolean {
    if (memberId === owner.id) return false
    const member = getNodeById(memberId)
    if (!member) return false
    if (isImplicitType(member.type)) return false
    if (member.phase !== owner.phase) return false
    return true
  }

  /**
   * Normalizes a list of member IDs by:
   * - Removing duplicates (preserving first occurrence)
   * - Filtering out invalid nodes
   */
  function normalizeMembers(owner: NodeInstance, members: readonly NodeId[]): NodeId[] {
    const unique: NodeId[] = []
    const seen = new Set<NodeId>()

    for (const memberId of members) {
      if (seen.has(memberId)) continue
      seen.add(memberId)

      if (isValidMember(owner, memberId)) {
        unique.push(memberId)
      }
    }

    return unique
  }

  /**
   * Prepares member list for a given owner and branch.
   * Returns normalized members if owner supports the branch, empty array otherwise.
   */
  function prepareMembers(ownerId: NodeId, branch: BranchName, candidates: readonly NodeId[]): NodeId[] {
    const owner = getNodeById(ownerId)
    return supportsBranch(owner, branch) ? normalizeMembers(owner, candidates) : []
  }

  /**
   * Ensures a group exists if it has members, or removes it if empty.
   * Updates existing groups in-place to avoid unnecessary reactivity triggers.
   */
  function ensureGroup(node: NodeInstance, branch: BranchName, members: NodeId[]) {
    const groupId = makeGroupId(node.id, branch)
    const existing = groupMapById.value.get(groupId)

    if (members.length > 0) {
      if (!existing) {
        // Create new group
        state.value.groups.push(toGroupInstance(node.id, branch, node.phase, members))
      } else {
        // Update existing group in-place (avoids unnecessary Vue reactivity)
        if (existing.phase !== node.phase) {
          existing.phase = node.phase
        }
        // Use setsEqual because [A, B] and [B, A] are the same membership
        if (!setsEqual(existing.memberIds, members)) {
          existing.memberIds = [...members]
        }
      }
    } else if (existing) {
      // Remove empty group
      state.value.groups = state.value.groups.filter((g) => g.id !== groupId)
    }
  }

  /**
   * Sets the member list for a branch, updating both node config and group state.
   *
   * @returns true if members were changed, false otherwise
   */
  function setMembers(
    ownerId: NodeId,
    branch: BranchName,
    members: readonly NodeId[],
    options: CommitOptions = {},
  ): boolean {
    const owner = getNodeById(ownerId)
    if (!supportsBranch(owner, branch)) return false

    const normalized = normalizeMembers(owner, members)
    const previous = readMembers(owner, branch)
    // Use setsEqual: [A, B] and [B, A] represent the same membership
    if (setsEqual(previous, normalized)) return false

    const config = (owner.config ??= {}) as Record<string, unknown>

    if (normalized.length > 0) {
      config[branch] = [...normalized]
    } else {
      // Clean up: remove empty branch field
      delete config[branch]
      // Clean up: remove empty config object entirely
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

  /**
   * Removes all groups owned by a node.
   * Called when a node is deleted.
   */
  function clear(ownerId: NodeId) {
    state.value.groups = state.value.groups.filter(group => group.ownerId !== ownerId)
  }

  /**
   * Gets the current member list for a branch.
   * Checks group state first for performance, falls back to config.
   */
  function getMembers(ownerId: NodeId, branch: BranchName): NodeId[] {
    const group = groupMapById.value.get(makeGroupId(ownerId, branch))
    if (group) {
      return [...group.memberIds]
    }

    const owner = getNodeById(ownerId)
    if (!owner) return []
    return readMembers(owner, branch)
  }

  /**
   * Finds which group a node belongs to, if any.
   * Returns undefined if the node is not a member of any group.
   * Uses cached membership index for O(1) lookup.
   */
  function findMembership(memberId: NodeId): { ownerId: NodeId, branch: BranchName } | undefined {
    return membershipIndex.value.get(memberId)
  }

  /**
   * Detects whether adding a member to a branch would create a cycle.
   * Uses depth-first search to traverse the branch graph.
   *
   * @returns true if a cycle would be created
   */
  function wouldCreateCycle(ownerId: NodeId, memberId: NodeId): boolean {
    if (ownerId === memberId) return true

    const visited = new Set<NodeId>()
    const stack: NodeId[] = [memberId]

    while (stack.length > 0) {
      const currentId = stack.pop()!
      if (visited.has(currentId)) continue
      visited.add(currentId)

      if (currentId === ownerId) return true

      const neighbors = combinedAdjacency.value.get(currentId)
      if (!neighbors) continue

      for (const nextId of neighbors) {
        if (!visited.has(nextId)) {
          stack.push(nextId)
        }
      }
    }

    return false
  }

  /**
   * Adds a member to a branch group with validation.
   * Performs the following checks:
   * - Owner exists and supports the branch
   * - Member is valid (via isValidMember)
   * - Adding member would not create a cycle
   * - Member is not already in the list
   *
   * If the member is already in another group, it's removed from that group first.
   *
   * @returns true if member was added, false otherwise
   */
  function addMember(ownerId: NodeId, branch: BranchName, memberId: NodeId, options: CommitOptions = {}): boolean {
    const owner = getNodeById(ownerId)
    if (!owner) return false
    if (!supportsBranch(owner, branch)) return false
    if (!isValidMember(owner, memberId)) return false
    if (wouldCreateCycle(ownerId, memberId)) return false

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

  /**
   * Removes a node from its current group membership, if any.
   * Used internally when moving nodes between groups.
   */
  function dropTarget(targetId: NodeId) {
    const membership = findMembership(targetId)
    if (!membership) return

    const members = getMembers(membership.ownerId, membership.branch)
    const nextMembers = members.filter(id => id !== targetId)
    setMembers(membership.ownerId, membership.branch, nextMembers, { commit: false })
  }

  function getNodeDepth(nodeId: NodeId): number {
    let depth = 0
    const visited = new Set<GroupId>()
    let currentGroup = memberGroupMap.value.get(nodeId)
    while (currentGroup && !visited.has(currentGroup.id)) {
      depth += 1
      visited.add(currentGroup.id)
      currentGroup = memberGroupMap.value.get(currentGroup.ownerId)
    }
    return depth
  }

  function getGroupDepth(groupId: GroupId): number {
    const group = groupMapById.value.get(groupId)
    if (!group) return 0
    return getNodeDepth(group.ownerId)
  }

  function isGroupId(id?: string): id is GroupId {
    if (!id) return false
    return groupMapById.value.has(id as GroupId)
  }

  return {
    memberGroupMap,
    groupsByOwner,
    findMembership,
    getMembers,
    wouldCreateCycle,
    setMembers,
    prepareMembers,
    addMember,
    dropTarget,
    clear,
    getNodeDepth,
    getGroupDepth,
    isGroupId,
  }
}
