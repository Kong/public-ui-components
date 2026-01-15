import { ref, onMounted, nextTick, readonly } from 'vue'
import { useEventListener } from '@vueuse/core'
import { PANE_LEFT_MIN_WIDTH, PANE_LEFT_MAX_WIDTH } from '../constants/split-pane'
import type { useSplitPaneParams } from '../types'

/** Create singletons to track the state */

/** Tracks whether the left pane is currently being dragged/resized */
const isDraggingPaneLeft = ref<boolean>(false)

/** Tracks whether the inner panes (center/right) are currently being dragged/resized */
const isDraggingInnerPanes = ref<boolean>(false)

/** Controls whether the left pane is expanded or collapsed; initialized as true (expanded) */
const paneLeftExpanded = ref<boolean>(true)

/** The current width of the center pane in pixels */
const centerPaneWidth = ref<number>(0)

/**
 * Composable for managing split pane layout with resizable panels
 * @param {useSplitPaneParams} [params]
 * @returns {Object} Object containing pane state and control functions
 */
export default function useSplitPane(params?: useSplitPaneParams) {
  // Template refs
  const _verticalNavRef = params?.verticalNavRef || ref(null)
  const _innerPanesContainerRef = params?.innerPanesContainerRef || ref(null)
  const _paneLeftRef = params?.paneLeftRef || ref(null)
  const _paneCenterRef = params?.paneCenterRef || ref(null)
  const _paneRightRef = params?.paneRightRef || ref(null)

  /**
   * Gets the current width of a specified pane element
   * @param {string} el - The pane element identifier
   * @returns {number} The width of the element in pixels, or 0 if not found
   */
  const getPaneElementWidth = (el: 'verticalNav' | 'innerPanesContainer' | 'paneLeft' | 'paneCenter' | 'paneRight'): number => {
    switch (el) {
      case 'verticalNav':
        return _verticalNavRef.value?.offsetWidth || 0
      case 'innerPanesContainer':
        return _innerPanesContainerRef.value?.offsetWidth || 0
      case 'paneLeft':
        return _paneLeftRef.value?.offsetWidth || 0
      case 'paneCenter':
        return _paneCenterRef.value?.offsetWidth || 0
      case 'paneRight':
        return _paneRightRef.value?.offsetWidth || 0
      default:
        return 0
    }
  }

  // Initial resizable pane percentage width
  const resizablePercentageWidth = ref<number>(50)
  const startX = ref<number>(0)
  const startWidth = ref<number>(0)
  const startXPaneLeft = ref<number>(0)
  const startWidthPaneLeft = ref<number>(0)

  /**
   * Sets the width on the center pane HTML element
   * @param {number} [forceWidth] - Optional width percentage to force on the center pane
   */
  const setCenterPaneWidth = (forceWidth?: number): void => {
    if (_paneCenterRef.value) {
      if (forceWidth) {
        // Force and return
        _paneCenterRef.value.style.width = `${forceWidth}%`
        // Update the center pane width
        centerPaneWidth.value = getPaneElementWidth('paneCenter')
        return
      } else if (typeof resizablePercentageWidth.value !== 'number' || !isFinite(resizablePercentageWidth.value)) {
        // Set to approximately the correct default width
        resizablePercentageWidth.value = 38
        // don't exit
      }

      // Always call
      _paneCenterRef.value.style.width = `${resizablePercentageWidth.value}%`

      // Update the center pane width
      centerPaneWidth.value = getPaneElementWidth('paneCenter')
    }
  }

  /**
   * Refreshes the sizes of the inner panes (center and right)
   * If right pane is hidden, forces the center pane to take full width
   */
  const refreshInnerPaneSizes = (): void => {
    // If center pane showing and right pane is hidden
    if (_paneCenterRef.value && _paneRightRef.value?.style.display === 'none') {
      // Force the width on the HTML element
      setCenterPaneWidth(100)
    } else {
      setCenterPaneWidth()
    }
  }

  /**
   * Updates the center pane width ensuring it stays within min/max bounds
   * Recalculates the percentage width based on container dimensions
   */
  const updateCenterPaneWidth = (): void => {
    if (!_innerPanesContainerRef.value || !_paneCenterRef.value) return

    const minWidth = 100
    const maxWidth = (getPaneElementWidth('innerPanesContainer') - getPaneElementWidth('verticalNav') - getPaneElementWidth('paneLeft')) - minWidth
    const currentWidth = (resizablePercentageWidth.value / 100) * getPaneElementWidth('innerPanesContainer')

    // Ensure width stays within bounds
    if (currentWidth < minWidth) {
      resizablePercentageWidth.value = (minWidth / getPaneElementWidth('innerPanesContainer')) * 100
    } else if (currentWidth > maxWidth) {
      resizablePercentageWidth.value = (maxWidth / getPaneElementWidth('innerPanesContainer')) * 100
    }

    // If center pane showing and right pane is hidden
    if (_paneCenterRef.value && _paneRightRef.value && _paneRightRef.value?.style.display === 'none') {
      // Force the width on the HTML element
      setCenterPaneWidth(100)
      return
    }

    // Update the width on the HTML element
    setCenterPaneWidth()
  }

  /**
   * Starts the drag operation for resizing inner panes (center/right)
   * Binds to the draggable element's mousedown event
   * @param {MouseEvent} e - The mouse event from the mousedown trigger
   */
  const startDraggingInnerPanes = (e: MouseEvent): void => {
    // Make sure panel exists and only respond to left-click
    if (!_paneCenterRef.value || e.button !== 0) return

    isDraggingInnerPanes.value = true
    startX.value = e.clientX
    startWidth.value = _paneCenterRef.value.offsetWidth || 0
  }

  /**
   * Handles the drag operation for inner panes during mouse move
   * Calculates new width percentage and applies constraints
   * @param {MouseEvent} e - The mouse event from the mousemove trigger
   */
  const onDraggingInnerPanes = (e: MouseEvent): void => {
    if (!isDraggingInnerPanes.value || !_innerPanesContainerRef.value || !_paneCenterRef.value) return

    const containerWidth = _innerPanesContainerRef.value.offsetWidth
    const deltaX = e.clientX - startX.value
    const newWidth = startWidth.value + deltaX

    // Calculate percentage directly from new width
    const newPercentage = (newWidth / containerWidth) * 100

    // Apply constraints as percentages
    const minPercentage = (100 / containerWidth) * 100
    const maxPercentage = ((containerWidth - 100) / containerWidth) * 100

    resizablePercentageWidth.value = Math.min(Math.max(minPercentage, newPercentage), maxPercentage)
    // Update the width on the HTML element
    setCenterPaneWidth()
  }

  /**
   * Stops the drag operation for inner panes
   * Resets dragging state and restores text selection
   */
  const stopDraggingInnerPanes = (): void => {
    isDraggingInnerPanes.value = false
  }

  /**
   * Starts the drag operation for resizing the left pane
   * Only works when the left pane is expanded and on left-click
   * @param {MouseEvent} e - The mouse event from the mousedown trigger
   */
  const startDraggingPaneLeft = (e: MouseEvent): void => {
    // Make sure panel exists and is expanded, and only respond to left-click
    if (!_paneLeftRef.value || !paneLeftExpanded.value || e.button !== 0) return

    isDraggingPaneLeft.value = true

    startXPaneLeft.value = e.clientX
    startWidthPaneLeft.value = _paneLeftRef.value.offsetWidth || 0
  }

  /**
   * Handles the drag operation for the left pane during mouse move
   * Clamps the width between min and max values defined in constants
   * @param {MouseEvent} e - The mouse event from the mousemove trigger
   */
  const onDraggingPaneLeft = (e: MouseEvent): void => {
    if (!isDraggingPaneLeft.value || !_paneLeftRef.value) return

    let newWidth = startWidthPaneLeft.value + (e.clientX - startXPaneLeft.value)

    const min = Number(PANE_LEFT_MIN_WIDTH.replace(/px$/i, ''))
    const max = Number(PANE_LEFT_MAX_WIDTH.replace(/px$/i, ''))

    // Clamp the new width between the min and max
    if (newWidth < min) newWidth = min
    if (newWidth > max) newWidth = max

    _paneLeftRef.value.style.width = `${newWidth}px`

    startXPaneLeft.value = e.clientX
    startWidthPaneLeft.value = newWidth

    // Update the center pane width
    centerPaneWidth.value = getPaneElementWidth('paneCenter')
  }

  /**
   * Stops the drag operation for the left pane
   * Resets dragging state and restores text selection
   */
  const stopDraggingPaneLeft = (): void => {
    isDraggingPaneLeft.value = false
  }

  /**
   * Handles window resize events
   * Updates center pane width if not currently dragging
   */
  const handleResize = (): void => {
    if (!isDraggingInnerPanes.value) {
      updateCenterPaneWidth()
    }
  }

  /**
   * Toggles the left pane between expanded and collapsed states
   * @returns {Promise<void>} Resolves when the toggle is complete
   */
  const togglePaneLeft = async (): Promise<void> => {
    paneLeftExpanded.value = !paneLeftExpanded.value
  }

  useEventListener(window, 'resize', handleResize)

  onMounted(async () => {
    await nextTick()
    if (_paneCenterRef.value) {
      updateCenterPaneWidth()
      await nextTick()
      // Update the width on the HTML element
      setCenterPaneWidth()

      requestAnimationFrame(() => {
        centerPaneWidth.value = getPaneElementWidth('paneCenter')
      })
    }
  })

  useEventListener(document, 'mousemove', (e: MouseEvent) => {
    if (isDraggingInnerPanes.value) {
      onDraggingInnerPanes(e)
    }
    if (isDraggingPaneLeft.value) {
      onDraggingPaneLeft(e)
    }
  })

  useEventListener(document, 'mouseup', () => {
    if (isDraggingInnerPanes.value) {
      stopDraggingInnerPanes()
    }
    if (isDraggingPaneLeft.value) {
      stopDraggingPaneLeft()
    }
  })

  return {
    isDraggingPaneLeft: readonly(isDraggingPaneLeft),
    isDraggingInnerPanes: readonly(isDraggingInnerPanes),
    startDraggingInnerPanes,
    refreshInnerPaneSizes,
    // Toggle the left pane
    paneLeftExpanded: readonly(paneLeftExpanded),
    togglePaneLeft,
    startDraggingPaneLeft,
    centerPaneWidth,
  }
}
