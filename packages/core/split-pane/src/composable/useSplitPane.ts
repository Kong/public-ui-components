import { ref, onUnmounted } from 'vue'
import { clamp } from '../utils'
import type { PaneConfig, UseSplitPaneOptions } from '../types'

export function useSplitPane(options: UseSplitPaneOptions = {
  horizontal: false,
  storageKey: undefined,
  pushOtherPanes: false,
}) {

  const containerRef = ref<HTMLElement | null>(null)

  const panes = ref<PaneConfig[]>([])
  const indexedPanes = ref<Record<number, PaneConfig>>({})
  const isDragging = ref(false)
  const touch = ref({
    activeSplitter: null as number | null,
    mouseDown: false,
    dragging: false,
  })

  let startMousePos = 0
  let startLeftSize = 0
  let startRightSize = 0

  const handleDragStart = (dividerIndex: number) => {
    isDragging.value = true
    touch.value.activeSplitter = dividerIndex
    touch.value.dragging = true
    startMousePos = 0 // Will be set on first mousemove

    // Capture the current sizes
    if (panes.value[dividerIndex] && panes.value[dividerIndex + 1]) {
      startLeftSize = panes.value[dividerIndex].size
      startRightSize = panes.value[dividerIndex + 1].size
    }

    // Prevent text selection
    document.body.style.userSelect = 'none'
    document.body.style.cursor = options.horizontal ? 'row-resize' : 'col-resize'
  }

  const getCurrentDragPercentage = (currentPos: number): number => {
    if (!containerRef.value) return 0
    const rect = containerRef.value.getBoundingClientRect()
    const containerSize = options.horizontal
      ? containerRef.value.offsetHeight
      : containerRef.value.offsetWidth
    const offset = options.horizontal ? rect.top : rect.left
    const drag = currentPos - offset
    return (drag * 100) / containerSize
  }

  const handleDrag = (dividerIndex: number, currentPos: number) => {
    if (!isDragging.value || touch.value.activeSplitter !== dividerIndex) return

    const leftPane = panes.value[dividerIndex]
    const rightPane = panes.value[dividerIndex + 1]

    if (!leftPane || !rightPane) return

    // Set initial position on first move
    if (startMousePos === 0) {
      startMousePos = currentPos
      return
    }

    const dragPercentage = getCurrentDragPercentage(currentPos)
    const startDragPercentage = getCurrentDragPercentage(startMousePos)
    const delta = dragPercentage - startDragPercentage

    // Calculate new sizes based on original sizes + delta
    let newLeftSize = startLeftSize + delta
    let newRightSize = startRightSize - delta

    // Apply left pane constraints
    if (newLeftSize < leftPane.min) {
      const diff = leftPane.min - newLeftSize
      newLeftSize = leftPane.min
      newRightSize -= diff
    }
    if (newLeftSize > leftPane.max) {
      const diff = newLeftSize - leftPane.max
      newLeftSize = leftPane.max
      newRightSize += diff
    }

    // Apply right pane constraints
    if (newRightSize < rightPane.min) {
      const diff = rightPane.min - newRightSize
      newRightSize = rightPane.min
      newLeftSize -= diff
    }
    if (newRightSize > rightPane.max) {
      const diff = newRightSize - rightPane.max
      newRightSize = rightPane.max
      newLeftSize += diff
    }

    // Final check: ensure both panes respect their constraints
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

    // Update the pane sizes
    panes.value[dividerIndex].size = newLeftSize
    panes.value[dividerIndex + 1].size = newRightSize
  }

  const endDrag = () => {
    isDragging.value = false
    touch.value.activeSplitter = null
    touch.value.dragging = false
    startMousePos = 0
    document.body.style.userSelect = ''
    document.body.style.cursor = ''

    // Save sizes to localStorage
    savePaneSizes()
  }

  const setContainerRef = (el: HTMLElement | null) => {
    containerRef.value = el
  }

  // Called by Pane component to register itself
  const registerPane = (pane: Omit<PaneConfig, 'index'>) => {
    // Find the index based on DOM position
    let index = -1
    if (containerRef.value) {
      Array.from(containerRef.value.children).some((el, i) => {
        if (el.classList.contains('split-pane-pane')) index++
        return el.isSameNode(pane.el)
      })
    }

    const newPane: PaneConfig = {
      ...pane,
      index,
    }

    // Insert pane at the correct index
    if (index >= 0 && index < panes.value.length) {
      panes.value.splice(index, 0, newPane)
    } else {
      panes.value.push(newPane)
    }

    // Reindex all panes
    panes.value.forEach((p, i) => {
      p.index = i
    })

    // Update indexed panes
    indexedPanes.value = panes.value.reduce((obj, p) => {
      obj[p.id] = p
      return obj
    }, {} as Record<number, PaneConfig>)

    // Recalculate sizes
    resetPaneSizes()
  }

  // Called by Pane component to unregister itself
  const unregisterPane = (paneId: number) => {
    const index = panes.value.findIndex(p => p.id === paneId)
    if (index !== -1) {
      panes.value.splice(index, 1)
      // Reindex all panes
      panes.value.forEach((p, i) => {
        p.index = i
      })
      // Update indexed panes
      indexedPanes.value = panes.value.reduce((obj, p) => {
        obj[p.id] = p
        return obj
      }, {} as Record<number, PaneConfig>)
      // Recalculate sizes
      resetPaneSizes()
    }
  }

  // Called by Pane component when props change
  // const requestUpdate = ({ id, ...args }: ) => {
  //   const pane = indexedPanes.value[id]
  //   if (pane) {
  //     for (const [key, value] of Object.entries(args)) {
  //       ;(pane as any)[key] = value
  //     }
  //   }
  // }
  const updatePane = (id: number, patch: Partial<PaneConfig>) => {
    const pane = indexedPanes.value[id]
    if (pane) Object.assign(pane, patch)
  }

  const loadPaneSizes = (): Record<number, number> | null => {
    if (!options.storageKey) return null

    try {
      const saved = localStorage.getItem(`split-pane-${options.storageKey}`)
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
      localStorage.setItem(`split-pane-${options.storageKey}`, JSON.stringify(sizes))
    } catch (error) {
      console.warn('Failed to save pane sizes to localStorage:', error)
    }
  }

  const resetPaneSizes = () => {
    // Try to load saved sizes from localStorage
    const savedSizes = loadPaneSizes()

    let leftToAllocate = 100

    panes.value.forEach((pane) => {
      // First priority: saved size from localStorage
      if (savedSizes && savedSizes[pane.id] !== undefined) {
        pane.size = clamp(savedSizes[pane.id], pane.min, pane.max)
      } else if (pane.givenSize !== null) { // Second priority: given size
        pane.size = clamp(pane.givenSize, pane.min, pane.max)
      } else {
        pane.size = 0 // Will be set later
      }
      leftToAllocate -= pane.size
    })

    // If panes don't have given sizes or saved sizes, distribute equally
    const panesWithoutSize = panes.value.filter((pane) =>
      (!savedSizes || savedSizes[pane.id] === undefined) && pane.givenSize === null,
    )
    if (panesWithoutSize.length > 0) {
      const equalSize = 100 / panes.value.length
      panes.value.forEach((pane) => {
        if ((!savedSizes || savedSizes[pane.id] === undefined) && pane.givenSize === null) {
          pane.size = Math.min(Math.max(equalSize, pane.min), pane.max)
        }
      })
    }

    // Normalize sizes to ensure they sum to 100%
    const totalSize = panes.value.reduce((sum, pane) => sum + pane.size, 0)
    if (totalSize !== 100 && panes.value.length > 0) {
      const factor = 100 / totalSize
      panes.value.forEach(pane => {
        pane.size = pane.size * factor
      })
    }
  }

  onUnmounted(() => endDrag())

  return {
    panes,
    indexedPanes,
    isDragging,
    containerRef,
    isHorizontal: options.horizontal,
    setContainerRef,
    handleDragStart,
    handleDrag,
    endDrag,
    registerPane,
    unregisterPane,
    updatePane,
    resetPaneSizes,
  }
}
