import { computed } from 'vue'
import { useEditorStore } from '../../composables'
import type { BranchName, NodeId, NodeName } from '../../types'
import { isImplicitType, isNodeId } from '../node/node'
import { setsEqual } from '../store/helpers'
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
   * Updates branch members for the current node.
   * Handles:
   * - Cycle detection (prevents circular branch dependencies)
   * - Conflict resolution (member already in another branch)
   * - User confirmation for conflicts
   *
   * @param branch - The branch name (e.g., 'then', 'else')
   * @param value - New member IDs (string, array, or null)
   * @returns Promise<boolean> - true if update succeeded, false if cancelled/failed
   */
  async function updateBranchMembers(branch: BranchName, value: string | string[] | null): Promise<boolean> {
    const owner = base.currentNode.value

    // Normalize input to array of NodeIds
    const candidateIds = (value == null
      ? []
      : Array.isArray(value)
        ? value
        : [value]
    ).filter((id): id is NodeId => isNodeId(id))

    // Validate and sanitize members (removes invalid nodes)
    const sanitizedMembers = branchGroups.prepareMembers(owner.id, branch, candidateIds)

    // Check if anything actually changed (order-insensitive)
    const currentMembers = branchGroups.getMembers(owner.id, branch)
    if (setsEqual(currentMembers, sanitizedMembers)) {
      return true
    }

    // Find newly added members (for cycle detection and conflict checking)
    const toAdd = sanitizedMembers.filter(id => !currentMembers.includes(id))

    const addedAssignments: ConnectionString[] = []
    const removedAssignments: ConnectionString[] = []
    const conflictUpdates: Array<{ ownerId: NodeId, branch: BranchName, members: NodeId[] }> = []

    // Check each new member for cycles and conflicts
    for (const memberId of toAdd) {
      // Prevent cycles: member cannot have owner in its branch tree
      if (branchGroups.wouldCreateCycle(owner.id, memberId)) {
        toaster({
          message: t('plugins.free-form.datakit.flow_editor.error.branch_cycle'),
          appearance: 'danger',
        })
        return false
      }

      // Check if member is already in another branch
      const existing = branchGroups.findMembership(memberId)
      if (existing && !(existing.ownerId === owner.id && existing.branch === branch)) {
        // Prepare to remove member from old branch
        const remaining = branchGroups
          .getMembers(existing.ownerId, existing.branch)
          .filter(id => id !== memberId)

        conflictUpdates.push({
          ownerId: existing.ownerId,
          branch: existing.branch,
          members: remaining,
        })

        addedAssignments.push(createBranchAssignmentString(owner.id, branch, memberId))
        removedAssignments.push(createBranchAssignmentString(existing.ownerId, existing.branch, memberId))
      }
    }

    // Ask user to confirm if there are conflicts
    if (conflictUpdates.length) {
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

    // Apply all changes atomically
    let mutated = false

    // Remove member from old branches first
    for (const conflict of conflictUpdates) {
      mutated = branchGroups.setMembers(conflict.ownerId, conflict.branch, conflict.members, { commit: false }) || mutated
    }

    // Add member to new branch
    mutated = branchGroups.setMembers(owner.id, branch, sanitizedMembers, { commit: false }) || mutated

    if (!mutated) {
      return true
    }

    commit()
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
      .filter(node => node.id !== nodeId)
      .filter(node => !isImplicitType(node.type))
      .filter(node => node.phase === owner.phase)
      .filter(node => !branchGroups.wouldCreateCycle(owner.id, node.id))
      .map(node => ({ value: node.id, label: node.name }))
  })

  return {
    ...base,
    branchOptions,
    updateBranchMembers,
  }
}
