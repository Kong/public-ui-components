import { ref, onUnmounted } from 'vue'
import { clamp } from '../utils'
import type { PaneConfig, UseSplitPaneOptions } from '../types'

/**
 * Composable for managing split pane functionality including drag operations,
 * pane registration, and size persistence.
 *
 * @param options - Configuration options for the split pane behavior
 * @returns Object containing pane state, refs, and control functions
 */
export function useSplitPane(options: UseSplitPaneOptions = {
  horizontal: false,
  storageKey: undefined,
}) {

  /** Reference to the container DOM element */
  const containerRef = ref<HTMLElement | null>(null)

  /** Array of all registered panes */
  const panes = ref<PaneConfig[]>([])
  /** Map of panes indexed by their ID for fast lookup */
  const indexedPanes = ref<Record<number, PaneConfig>>({})
  /** Whether a drag operation is currently active */
  const isDragging = ref(false)

  /** Internal state for tracking drag operations */
  const touch = ref({
    activeSplitter: null as number | null,
    mouseDown: false,
    dragging: false,
  })

  // Store initial drag state
  let startMousePos = 0
  let startLeftSize = 0
  let startRightSize = 0

  /**
   * Sets the container HTML element reference
   * @param el - The container HTML element
   * @return void
   */
  const setContainerRef = (el: HTMLElement | null): void => {
    containerRef.value = el
  }

  /**
   * Rebuild the pane index mapping after panes are added or removed.
   * Updates each pane's index property and recreates the indexedPanes map.
   */
  const rebuildIndex = (): void => {
    panes.value.forEach((p, i) => (p.index = i))
    indexedPanes.value = Object.fromEntries(panes.value.map(p => [p.id, p]))
  }

  // panes
  const registerPane = (pane: Omit<PaneConfig, 'index'>): void => {
    panes.value.push({ ...pane, index: 0 })
    rebuildIndex()
    resetPaneSizes()
  }

  const unregisterPane = (id: number): void => {
    panes.value = panes.value.filter(p => p.id !== id)
    rebuildIndex()
    resetPaneSizes()
  }

  const updatePane = (id: number, patch: Partial<PaneConfig>): void => {
    const pane = indexedPanes.value[id]
    if (!pane) return

    const allowedKeys: Array<keyof PaneConfig> = ['id', 'index', 'size', 'min', 'max', 'givenSize', 'el']

    for (const key of allowedKeys) {
      if (key in patch) {
        pane[key] = patch[key] as any
      }
    }
  }

  /**
   * Convert pixel position to percentage based on container size.
   * @param currentPos - The current mouse/touch position in pixels
   * @returns The position as a percentage of the container size
   */
  const getDragPercentage = (currentPos: number): number => {
    if (!containerRef.value) return 0
    const rect = containerRef.value.getBoundingClientRect()
    const containerSize = options.horizontal ? containerRef.value.offsetHeight : containerRef.value.offsetWidth
    const offset = options.horizontal ? rect.top : rect.left
    return ((currentPos - offset) * 100) / containerSize
  }

  const startDrag = (index: number): void => {
    const left = panes.value[index]
    const right = panes.value[index + 1]
    if (!left || !right) return


    isDragging.value = true
    touch.value.activeSplitter = index
    touch.value.dragging = true
    startMousePos = 0 // Will be set on first mousemove

    // Capture the current sizes
    startLeftSize = left.size
    startRightSize = right.size
  }

  const drag = (dividerIndex: number, currentPos: number): void => {
    if (!isDragging.value || touch.value.activeSplitter !== dividerIndex) return

    const leftPane = panes.value[dividerIndex]
    const rightPane = panes.value[dividerIndex + 1]

    if (!leftPane || !rightPane) return

    // Set initial position on first move
    if (startMousePos === 0) {
      startMousePos = currentPos
      return
    }

    const delta = getDragPercentage(currentPos) - getDragPercentage(startMousePos)

    // Calculate new sizes based on original sizes + delta
    let newLeftSize = startLeftSize + delta
    let newRightSize = startRightSize - delta

    // Apply left pane constraints and adjust right pane accordingly
    if (newLeftSize < leftPane.min) {
      const diff = leftPane.min - newLeftSize
      newLeftSize = leftPane.min
      newRightSize -= diff // Take from right pane to satisfy left min
    }
    if (newLeftSize > leftPane.max) {
      const diff = newLeftSize - leftPane.max
      newLeftSize = leftPane.max
      newRightSize += diff // Give to right pane when left hits max
    }

    // Apply right pane constraints and adjust left pane accordingly
    if (newRightSize < rightPane.min) {
      const diff = rightPane.min - newRightSize
      newRightSize = rightPane.min
      newLeftSize -= diff // Take from left pane to satisfy right min
    }
    if (newRightSize > rightPane.max) {
      const diff = newRightSize - rightPane.max
      newRightSize = rightPane.max
      newLeftSize += diff // Give to left pane when right hits max
    }

    // Final safety check: ensure both panes respect their constraints
    // This handles edge cases where adjustments conflict
    if (newLeftSize < leftPane.min) {
      newLeftSize = leftPane.min
    }
    if (newLeftSize > leftPane.max) {
      newLeftSize = leftPane.max
    }
    if (newRightSize < rightPane.min) {
      newRightSize = rightPane.min
    }
    if (newRightSize > rightPane.max) {
      newRightSize = rightPane.max
    }

    // Apply the calculated sizes to the panes
    panes.value[dividerIndex].size = newLeftSize
    panes.value[dividerIndex + 1].size = newRightSize
  }

  const endDrag = () => {
    isDragging.value = false
    touch.value.activeSplitter = null
    touch.value.dragging = false
    startMousePos = 0

    // Save sizes to localStorage
    savePaneSizes()
  }

  const loadPaneSizes = (): Record<number, number> | null => {
    if (!options.storageKey) return null

    try {
      const saved = localStorage.getItem(`kong-ui-public-split-pane-${options.storageKey}`)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load pane sizes from localStorage:', error)
    }
    return null
  }

  const savePaneSizes = () => {
    if (!options.storageKey) return

    try {
      const sizes: Record<number, number> = {}
      panes.value.forEach(pane => sizes[pane.id] = pane.size)
      localStorage.setItem(`kong-ui-public-split-pane-${options.storageKey}`, JSON.stringify(sizes))
    } catch (error) {
      console.warn('Failed to save pane sizes to localStorage:', error)
    }
  }

  /**
   * Reset and recalculate pane sizes based on saved values, given sizes, or equal distribution.
   * Priority order: saved sizes from storage > explicitly given sizes > equal distribution.
   * Ensures all sizes are clamped to min/max constraints and total to 100%.
   */
  const resetPaneSizes = () => {
    const saved = loadPaneSizes()
    let remaining = 100

    // First pass: apply saved or given sizes
    panes.value.forEach(p => {
      if (saved?.[p.id] != null) {
        p.size = clamp(saved[p.id], p.min, p.max)
      } else if (p.givenSize != null) {
        p.size = clamp(p.givenSize, p.min, p.max)
      } else {
        p.size = 0 // Mark as unset for equal distribution
      }
      remaining -= p.size
    })

    // Second pass: distribute remaining space to unset panes
    const unset = panes.value.filter(p => p.size === 0)
    if (unset.length) {
      const share = remaining / unset.length
      unset.forEach(p => (p.size = clamp(share, p.min, p.max)))
    }

    // Normalize all sizes to ensure they sum to exactly 100%
    const total = panes.value.reduce((s, p) => s + p.size, 0)
    panes.value.forEach(p => (p.size = (p.size / total) * 100))
  }

  onUnmounted(() => endDrag())

  return {
    panes,
    indexedPanes,
    isDragging,
    containerRef,
    setContainerRef,
    // pane
    registerPane,
    unregisterPane,
    updatePane,
    resetPaneSizes,
    // drag
    startDrag,
    drag,
    endDrag,
  }
}
