import { computed } from 'vue'
import { useEditorStore } from '../../composables'
import type { BranchName, NodeId, NodeName } from '../../types'
import { isImplicitType, isNodeId } from '../node/node'
import { setsEqual, getBranchesFromMeta } from '../store/helpers'
import { useConfirm } from './useConflictConfirm'
import useI18n from '../../../../../composables/useI18n'
import { useToaster } from '../../../../../composables/useToaster'
import type { ConnectionString } from '../modal/ConflictModal.vue'
import { useNodeForm, type BaseFormData } from './useNodeForm'

export type BranchOption = {
  value: NodeId
  label: NodeName
}

/**
 * Branch-specific form composable that extends useNodeForm with branch node functionality.
 * This composable handles:
 * - Branch member management (add/remove nodes from branches)
 * - Branch option filtering (valid candidates for branch membership)
 * - Branch conflict resolution
 * - Branch cycle detection
 */
export function useBranchNodeForm<T extends BaseFormData = BaseFormData>(
  nodeId: NodeId,
  getFormInnerData?: () => any,
) {
  const base = useNodeForm<T>(nodeId, getFormInnerData)

  const {
    state,
    getNodeById,
    branchGroups,
    commit,
  } = useEditorStore()

  const { i18n: { t } } = useI18n()
  const confirm = useConfirm()
  const toaster = useToaster()

  // Ensure branch fields are initialized as arrays (prevents KMultiselect crash)
  // Only fills in missing fields - doesn't override existing data
  const formData = computed<T>(() => {
    const data = { ...base.formData.value } as any
    const branchNames = getBranchesFromMeta(base.currentNode.value?.type || 'branch')

    for (const branchName of branchNames) {
      if (!(branchName in data) || data[branchName] == null) {
        data[branchName] = []
      }
    }

    return data as T
  })

  /**
   * Creates a human-readable string representation of a branch assignment.
   * Format: ["owner.branch", "member"]
   */
  function createBranchAssignmentString(ownerId: NodeId, branch: BranchName, memberId: NodeId): ConnectionString {
    const owner = getNodeById(ownerId)
    const member = getNodeById(memberId)
    const ownerLabel = owner ? `${owner.name}.${branch}` : `${ownerId}.${branch}`
    const memberLabel = member ? member.name : memberId
    return [ownerLabel, memberLabel]
  }

  /**
   * Normalizes input value to array of NodeIds.
   */
  function normalizeInput(value: string | string[] | null): NodeId[] {
    return (value == null
      ? []
      : Array.isArray(value)
        ? value
        : [value]
    ).filter((id): id is NodeId => isNodeId(id))
  }

  /**
   * Checks if adding a member would create a cycle.
   * Shows error toast if cycle detected.
   * @returns true if cycle would be created
   */
  function checkForCycle(ownerId: NodeId, memberId: NodeId): boolean {
    if (branchGroups.wouldCreateCycle(ownerId, memberId)) {
      toaster({
        message: t('plugins.free-form.datakit.flow_editor.error.branch_cycle'),
        appearance: 'danger',
      })
      return true
    }
    return false
  }

  /**
   * Detects conflicts when adding new members to a branch.
   * A conflict occurs when a member is already assigned to a different branch.
   * @returns Object containing conflict updates and assignment strings for confirmation dialog
   */
  function detectConflicts(ownerId: NodeId, branch: BranchName, newMemberIds: NodeId[]) {
    const addedAssignments: ConnectionString[] = []
    const removedAssignments: ConnectionString[] = []
    const conflictUpdates: Array<{ ownerId: NodeId, branch: BranchName, members: NodeId[] }> = []

    for (const memberId of newMemberIds) {
      const existing = branchGroups.findMembership(memberId)

      // Skip if not a conflict (member is free or already in this exact branch)
      if (!existing || (existing.ownerId === ownerId && existing.branch === branch)) {
        continue
      }

      // Remove member from old branch
      const remaining = branchGroups
        .getMembers(existing.ownerId, existing.branch)
        .filter(id => id !== memberId)

      conflictUpdates.push({
        ownerId: existing.ownerId,
        branch: existing.branch,
        members: remaining,
      })

      addedAssignments.push(createBranchAssignmentString(ownerId, branch, memberId))
      removedAssignments.push(createBranchAssignmentString(existing.ownerId, existing.branch, memberId))
    }

    return { conflictUpdates, addedAssignments, removedAssignments }
  }

  /**
   * Applies branch membership changes atomically.
   * First removes members from old branches, then adds to new branch.
   * @returns true if any changes were made
   */
  function applyMembershipChanges(
    ownerId: NodeId,
    branch: BranchName,
    members: NodeId[],
    conflictUpdates: Array<{ ownerId: NodeId, branch: BranchName, members: NodeId[] }>,
  ): boolean {
    let mutated = false

    // Remove members from old branches first
    for (const conflict of conflictUpdates) {
      mutated = branchGroups.setMembers(conflict.ownerId, conflict.branch, conflict.members, { commit: false }) || mutated
    }

    // Add members to new branch
    mutated = branchGroups.setMembers(ownerId, branch, members, { commit: false }) || mutated

    return mutated
  }

  /**
   * Updates branch members for the current node.
   * Handles cycle detection, conflict resolution, and user confirmation.
   *
   * @param branch - The branch name (e.g., 'then', 'else')
   * @param value - New member IDs (string, array, or null)
   * @returns Promise<boolean> - true if update succeeded, false if cancelled/failed
   */
  async function updateBranchMembers(branch: BranchName, value: string | string[] | null): Promise<boolean> {
    const owner = base.currentNode.value

    // Normalize and validate input
    const candidateIds = normalizeInput(value)
    const sanitizedMembers = branchGroups.prepareMembers(owner.id, branch, candidateIds)

    // Early return if nothing changed (order-insensitive comparison)
    const currentMembers = branchGroups.getMembers(owner.id, branch)
    if (setsEqual(currentMembers, sanitizedMembers)) {
      return true
    }

    // Check newly added members for cycles
    const newMembers = sanitizedMembers.filter(id => !currentMembers.includes(id))
    for (const memberId of newMembers) {
      if (checkForCycle(owner.id, memberId)) {
        return false
      }
    }

    // Detect conflicts with existing branch assignments
    const { conflictUpdates, addedAssignments, removedAssignments } = detectConflicts(
      owner.id,
      branch,
      newMembers,
    )

    // Ask user to confirm if there are conflicts
    if (conflictUpdates.length > 0) {
      if (!confirm) {
        throw new Error('Expected confirmation handler for branch conflict resolution')
      }

      const confirmed = await confirm(
        t('plugins.free-form.datakit.flow_editor.confirm.message.branch_replace'),
        addedAssignments,
        removedAssignments,
      )

      if (!confirmed) {
        return false
      }
    }

    // Apply all changes atomically (commit: false delays history commit)
    const mutated = applyMembershipChanges(owner.id, branch, sanitizedMembers, conflictUpdates)

    if (mutated) {
      commit() // Single history entry for all changes
    }

    return true
  }

  /**
   * Computed list of valid candidate nodes that can be added to branches.
   * Filters out:
   * - Current node itself
   * - Implicit nodes (request, response, etc.)
   * - Nodes in different phase
   * - Nodes that would create cycles
   */
  const branchOptions = computed<BranchOption[]>(() => {
    const owner = base.currentNode.value
    if (!owner || !branchGroups) {
      return []
    }

    return state.value.nodes
      .filter(node =>
        node.id !== nodeId &&
        !isImplicitType(node.type) &&
        node.phase === owner.phase &&
        !branchGroups.wouldCreateCycle(owner.id, node.id),
      )
      .map(node => ({ value: node.id, label: node.name }))
  })

  return {
    ...base,
    formData,
    branchOptions,
    updateBranchMembers,
  }
}
