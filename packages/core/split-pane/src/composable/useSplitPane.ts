import { computed, ref, toRef, onMounted, nextTick } from 'vue'
import { useEventListener } from '@vueuse/core'
import { PANE_LEFT_MIN_WIDTH, PANE_LEFT_MAX_WIDTH } from '../constants/split-pane'
import type { useSplitPaneParams } from '../types'

/** Create singletons to track the state */
const isDraggingPaneLeft = ref<boolean>(false)
const isDraggingInnerPanes = ref<boolean>(false)
// Allow the left pane to be collapsed and expanded; initialize as true
const paneLeftExpanded = ref<boolean>(true)

// The width of the center pane
const centerPaneWidth = ref<number>(0)

export default function useSplitPane(params?: useSplitPaneParams) {
  // Template refs
  const _verticalNavRef = params?.verticalNavRef || ref(null)
  const _innerPanesContainerRef = params?.innerPanesContainerRef || ref(null)
  const _paneLeftRef = params?.paneLeftRef || ref(null)
  const _paneCenterRef = params?.paneCenterRef || ref(null)
  const _paneRightRef = params?.paneRightRef || ref(null)

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

  /** Set the width on the pane center HTML element */
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

  const refreshInnerPaneSizes = (): void => {
    // If center pane showing and right pane is hidden
    if (_paneCenterRef.value && _paneRightRef.value?.style.display === 'none') {
      // Force the width on the HTML element
      setCenterPaneWidth(100)
    } else {
      setCenterPaneWidth()
    }
  }

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

  /** The event to bind to the draggable element's `@mousedown` event */
  const startDraggingInnerPanes = (e: MouseEvent): void => {
    // Make sure panel exists and only respond to left-click
    if (!_paneCenterRef.value || e.button !== 0) return

    isDraggingInnerPanes.value = true
    startX.value = e.clientX
    startWidth.value = _paneCenterRef.value.offsetWidth || 0

    // Prevent text selection while dragging
    document.body.style.userSelect = 'none'
  }

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

  const stopDraggingInnerPanes = (): void => {
    isDraggingInnerPanes.value = false
    document.body.style.userSelect = ''
  }

  const startDraggingPaneLeft = (e: MouseEvent): void => {
    // Make sure panel exists and is expanded, and only respond to left-click
    if (!_paneLeftRef.value || !paneLeftExpanded.value || e.button !== 0) return

    isDraggingPaneLeft.value = true

    startXPaneLeft.value = e.clientX
    startWidthPaneLeft.value = _paneLeftRef.value.offsetWidth || 0

    document.body.style.userSelect = 'none'
  }

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

  const stopDraggingPaneLeft = (): void => {
    isDraggingPaneLeft.value = false
    document.body.style.userSelect = ''
  }

  const handleResize = (): void => {
    if (!isDraggingInnerPanes.value) {
      updateCenterPaneWidth()
    }
  }

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
    isDraggingPaneLeft: computed(() => isDraggingPaneLeft.value), // readonly
    isDraggingInnerPanes: computed(() => isDraggingInnerPanes.value), // readonly
    startDraggingInnerPanes,
    refreshInnerPaneSizes,
    // Toggle the left pane
    paneLeftExpanded: computed(() => paneLeftExpanded.value), // readonly
    togglePaneLeft,
    startDraggingPaneLeft,
    centerPaneWidth,
  }
}
