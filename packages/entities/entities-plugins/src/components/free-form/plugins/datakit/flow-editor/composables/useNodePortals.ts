import { useVueFlow } from '@vue-flow/core'
import { useEventListener } from '@vueuse/core'

import { useEditorStore } from '../store/store'

import type { EdgeChange, NodeChange } from '@vue-flow/core'

type UseNodePortalsOptions = {
  readonly?: boolean
  flowId?: string
}

export function useNodePortals(options: UseNodePortalsOptions) {
  const { readonly, flowId } = options
  const vueFlowStore = useVueFlow(flowId)
  const { onNodesChange, onEdgesChange, onPaneClick, findEdge } = vueFlowStore

  const { disconnectEdge, commit, portalSelection, selectPortalEdge } = useEditorStore()

  onNodesChange((changes: NodeChange[]) => {
    if (changes.some(change => change.type === 'select' && 'selected' in change && change.selected)) {
      selectPortalEdge(undefined)
    }
  })

  onEdgesChange((changes: EdgeChange[]) => {
    const hasSelectionChange = changes.some(change => change.type === 'select' && 'selected' in change && change.selected)
    const removedSelectedPortal = portalSelection.value
      ? changes.some(change => change.type === 'remove' && change.id === portalSelection.value)
      : false

    if (hasSelectionChange || removedSelectedPortal) {
      selectPortalEdge(undefined)
    }
  })

  onPaneClick(() => selectPortalEdge(undefined))

  useEventListener(
    'keydown',
    (event: KeyboardEvent) => {
      if (readonly) return
      if (event.key !== 'Delete' && event.key !== 'Backspace') return

      const portalEdgeId = portalSelection.value
      if (!portalEdgeId) return

      const graphEdge = findEdge(portalEdgeId)
      if (graphEdge) return

      event.preventDefault()
      disconnectEdge(portalEdgeId, false)
      selectPortalEdge(undefined)
      commit()
    },
  )
}
