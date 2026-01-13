import { reactive, computed } from 'vue'
import type { PaneConfig } from '../types'

interface DragSession {
  index: number
  startPos: number
  leftSize: number
  rightSize: number
}

interface SplitPaneInstance {
  horizontal: boolean
  container: HTMLElement | null
  panes: PaneConfig[]
  indexed: Record<number, PaneConfig>
  isDragging: boolean
  dragSession: DragSession | null
}

const instances = reactive<Record<string, SplitPaneInstance>>({})

function getInstance(id: string): SplitPaneInstance {
  if (!instances[id]) {
    instances[id] = {
      horizontal: false,
      container: null,
      panes: [],
      indexed: {},
      isDragging: false,
      dragSession: null,
    }
  }
  return instances[id]
}

export const splitPaneStore = {
  /** -------- public readonly state -------- */
  isDragging: (id: string) =>
    computed(() => getInstance(id).isDragging),

  panes: (id: string) =>
    computed(() => getInstance(id).panes),

  /** -------- lifecycle -------- */
  registerInstance(id: string, horizontal: boolean) {
    const inst = getInstance(id)
    inst.horizontal = horizontal
  },

  setContainer(id: string, el: HTMLElement | null) {
    getInstance(id).container = el
  },

  destroyInstance(id: string) {
    delete instances[id]
  },

  /** -------- pane management -------- */
  registerPane(id: string, pane: PaneConfig) {
    const inst = getInstance(id)
    inst.panes.push(pane)
    this.reindex(id)
  },

  unregisterPane(id: string, paneId: number) {
    const inst = getInstance(id)
    inst.panes = inst.panes.filter(p => p.id !== paneId)
    this.reindex(id)
  },

  updatePane(id: string, paneId: number, patch: Partial<PaneConfig>) {
    Object.assign(getInstance(id).indexed[paneId], patch)
  },

  reindex(id: string) {
    const inst = getInstance(id)
    inst.indexed = {}
    inst.panes.forEach((p, i) => {
      p.index = i
      inst.indexed[p.id] = p
    })
  },

  /** -------- dragging -------- */
  startDrag(id: string, index: number, startPos: number) {
    const inst = getInstance(id)
    const left = inst.panes[index]
    const right = inst.panes[index + 1]
    if (!left || !right) return

    inst.dragSession = {
      index,
      startPos,
      leftSize: left.size,
      rightSize: right.size,
    }
    inst.isDragging = true
  },

  drag(id: string, pos: number) {
    const inst = getInstance(id)
    const s = inst.dragSession
    if (!s || !inst.container) return

    const size = inst.horizontal
      ? inst.container.offsetHeight
      : inst.container.offsetWidth

    const delta = ((pos - s.startPos) * 100) / size

    const left = inst.panes[s.index]
    const right = inst.panes[s.index + 1]

    left.size = Math.min(Math.max(s.leftSize + delta, left.min), left.max)
    right.size = Math.min(Math.max(s.rightSize - delta, right.min), right.max)
  },

  endDrag(id: string) {
    const inst = getInstance(id)
    inst.dragSession = null
    inst.isDragging = false
  },
}
