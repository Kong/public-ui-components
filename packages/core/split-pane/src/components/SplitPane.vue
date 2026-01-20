<template>
  <div
    class="kong-ui-public-split-pane"
    :class="{ 'has-navigation': showNavigation }"
    data-testid="split-pane"
  >
    <div class="split-pane-container">
      <VerticalNavigation
        v-if="showNavigation"
        ref="verticalNavRef"
        :items="navigationItems"
        :pane-left-visible="paneLeft.visible !== false"
        :pane-left-width="paneLeftWidth"
      />
      <div class="split-pane-container-inner">
        <div class="panes">
          <!-- left pane -->
          <div
            ref="paneLeftRef"
            :aria-hidden="showPaneLeft ? undefined : 'true'"
            class="split-pane-left"
            :class="[{ 'expanded': paneLeftExpanded, 'show-resize-border': paneLeftDividerIsHovered }, { 'is-dragging-pane-left': isDraggingPaneLeft }, { 'is-dragging-pane': isDraggingPaneLeft || isDraggingInnerPanes }]"
            data-testid="split-pane-left"
            :tabindex="showPaneLeft ? 0 : -1"
          >
            <slot name="pane-left" />
          </div>

          <!-- left pane resize divider -->
          <div
            v-if="showPaneLeft"
            ref="paneLeftDivider"
            class="split-pane-resize-divider left"
            data-testid="split-pane-resize-divider-left"
            tabindex="0"
            :title="i18n.t('actions.drag_to_resize')"
            @mousedown="startDraggingPaneLeft"
          >
            <div class="split-pane-drag-handle" />
          </div>

          <!-- inner panes -->
          <div class="split-pane-container-inner-content">
            <div
              v-if="!!slots.toolbar"
              class="split-pane-toolbar-container"
              :class="{ 'has-resize-divider-left': showPaneLeft }"
              data-testid="split-pane-toolbar"
            >
              <slot name="toolbar" />
            </div>

            <div
              ref="innerPanesContainerRef"
              class="split-pane-inner-panes"
            >
              <!-- center pane -->
              <div
                v-show="showPaneCenter"
                ref="paneCenterRef"
                :aria-hidden="showPaneCenter ? undefined : 'true'"
                class="split-pane-center"
                :class="[{ 'has-resize-divider-left': showPaneLeft }, { 'has-resize-divider-right': showInnerPanesResizeDivider }, { 'is-dragging-pane': isDraggingPaneLeft || isDraggingInnerPanes }]"
                data-testid="split-pane-center"
                :tabindex="showPaneCenter ? 0 : -1"
              >
                <slot name="pane-center" />
              </div>

              <!-- inner panes resize divider -->
              <div
                v-if="showInnerPanesResizeDivider"
                ref="innerPanesDivider"
                class="split-pane-resize-divider right"
                data-testid="split-pane-resize-divider-right"
                tabindex="0"
                :title="i18n.t('actions.drag_to_resize')"
                @mousedown="startDraggingInnerPanes"
              >
                <div class="split-pane-drag-handle" />
              </div>

              <!-- right pane -->
              <div
                v-show="showPaneRight"
                ref="paneRightRef"
                :aria-hidden="showPaneRight ? undefined : 'true'"
                class="split-pane-right"
                :class="[
                  { 'has-toolbar': !!slots.toolbar },
                  { 'show-resize-border': innerPanesDividerIsHovered },
                  { 'is-dragging-inner-panes': isDraggingInnerPanes },
                  { 'is-dragging-pane': isDraggingPaneLeft || isDraggingInnerPanes },
                ]"
                data-testid="split-pane-right"
                :tabindex="showPaneRight ? 0 : -1"
              >
                <slot name="pane-right" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useTemplateRef, watch, nextTick } from 'vue'
import { PANE_LEFT_MAX_WIDTH, PANE_CENTER_DEFAULT_MAX_WIDTH, PANE_RIGHT_DEFAULT_MAX_WIDTH } from '../constants/split-pane'
import { useElementSize, useElementHover } from '@vueuse/core'
import VerticalNavigation from './VerticalNavigation.vue'
import useSplitPane from '../composable/useSplitPane'
import useI18n from '../composable/useI18n'
import type { SplitPaneProps } from '../types'

const {
  resizable = true,
  showResizeHandle = true,
  showNavigation = true,
  navigationItems = [],
  paneLeft = {
    /** Pass false to hide the panel even if it contains slot content */
    visible: true,
    maxWidth: PANE_LEFT_MAX_WIDTH,
  },
  paneCenter = {
    /** Pass false to hide the panel even if it contains slot content */
    visible: true,
    maxWidth: PANE_CENTER_DEFAULT_MAX_WIDTH,
  },
  paneRight = {
    /** Pass false to hide the panel even if it contains slot content */
    visible: true,
    maxWidth: PANE_RIGHT_DEFAULT_MAX_WIDTH,
  },
} = defineProps<SplitPaneProps>()

const slots = defineSlots<{
  toolbar?: () => any
  'pane-left'?: () => any
  'pane-center'?: () => any
  'pane-right'?: () => any
}>()

/**
 * Calculate the maximum width for a given pane
 * When resizable is true, center and right panes have no max-width constraint
 * @param pane - The pane identifier (left, center, or right)
 * @returns The calculated max-width CSS value
 */
const getResizableMaxWidth = (pane: 'left' | 'center' | 'right'): string => {
  if (pane === 'left') {
    return paneLeft.maxWidth !== undefined ? paneLeft.maxWidth : PANE_LEFT_MAX_WIDTH
  }
  if (pane === 'center') {
    return resizable ? 'none' : paneCenter.maxWidth !== undefined ? paneCenter.maxWidth : PANE_CENTER_DEFAULT_MAX_WIDTH
  }
  if (pane === 'right') {
    return resizable ? 'none' : paneRight.maxWidth !== undefined ? paneRight.maxWidth : PANE_RIGHT_DEFAULT_MAX_WIDTH
  }

  return 'none'
}

// Computed max-width values for each pane
const leftMaxWidth = computed((): string => getResizableMaxWidth('left'))
const centerMaxWidth = computed((): string => getResizableMaxWidth('center'))
const rightMaxWidth = computed((): string => getResizableMaxWidth('right'))

// Template refs for pane elements
const verticalNavRef = useTemplateRef('verticalNavRef')
const innerPanesContainerRef = useTemplateRef('innerPanesContainerRef')
const paneLeftRef = useTemplateRef('paneLeftRef')
const paneCenterRef = useTemplateRef('paneCenterRef')
const paneRightRef = useTemplateRef('paneRightRef')

// Template refs for resize divider elements
const paneLeftDivider = useTemplateRef('paneLeftDivider')
const innerPanesDivider = useTemplateRef('innerPanesDivider')

// Initialize split pane composable for drag-to-resize functionality
const { startDraggingInnerPanes, startDraggingPaneLeft, refreshInnerPaneSizes, paneLeftExpanded, isDraggingPaneLeft, isDraggingInnerPanes } = useSplitPane({
  verticalNavRef: verticalNavRef,
  innerPanesContainerRef: innerPanesContainerRef,
  paneLeftRef: paneLeftRef,
  paneCenterRef: paneCenterRef,
  paneRightRef: paneRightRef,
})

const { i18n } = useI18n()

// Computed properties to determine if each pane should be displayed
// A pane is shown if it has slot content, is marked as visible, and (for left pane) is expanded
const showPaneLeft = computed<boolean>(() => !!slots['pane-left'] && paneLeft.visible !== false && paneLeftExpanded.value)
const showPaneCenter = computed<boolean>(() => !!slots['pane-center'] && paneCenter.visible !== false)
const showPaneRight = computed<boolean>(() => !!slots['pane-right'] && paneRight.visible !== false)

// Show the resize divider between center and right panes only when both panes are visible and resizing is enabled
const showInnerPanesResizeDivider = computed<boolean>(() => resizable && showResizeHandle && !!slots['pane-center'] && paneCenter.visible !== false && !!slots['pane-right'] && paneRight.visible !== false)

// Track hover state of resize dividers for visual feedback
const paneLeftDividerIsHovered = useElementHover(paneLeftDivider)
const innerPanesDividerIsHovered = useElementHover(innerPanesDivider)

// Track the width of the left pane for vertical navigation
const { width: paneLeftWidth } = useElementSize(paneLeftRef)

// Watch for changes to right pane visibility and refresh inner pane sizes
// This ensures proper layout recalculation when the right pane is shown/hidden
watch(() => paneRight.visible, async () => {
  if (resizable) {
    refreshInnerPaneSizes()
  }
}, { flush: 'post' })
</script>

<style lang="scss" scoped>
// Important to ensure elements respect their parent boundaries
*,
:deep(*) {
  box-sizing: border-box;
}

// We size the resize divider to allow for a larger click/hover target,
// but must then adjust the center pane's margins to prevent a gap.
$resize-divider-width: 3px;
$toolbar-height: 44px;
$toolbar-adjusted-height: $toolbar-height - 1px; // 43px for calc
$pane-left-min-width: 260px; // PANE_LEFT_MIN_WIDTH
$inner-panes-min-width: 300px; // INNER_PANES_MIN_WIDTH

.kong-ui-public-split-pane {
  height: 100%;

  &.has-navigation {
    background-color: var(--kui-navigation-color-background, $kui-navigation-color-background);
    bottom: 0;
    left: 0;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 2000;

    .split-pane-container {
      &-inner {
        padding-top: var(--kui-space-30, $kui-space-30);
      }
    }
  }

  .split-pane-container {
    display: flex;
    flex-direction: row;
    height: 100%;
    width: 100%;

    &-inner {
      display: flex;
      flex-direction: column;
      width: 100%;

      &-content {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        height: 100%;
        max-height: calc(100vh - 6px); // Subtract 6px to prevent a scrollbar from appearing
        min-width: 0;
        position: relative;
        width: 100%;
      }
    }
  }

  .split-pane-inner-panes {
    display: flex;
    height: 100%;
    width: 100%;
  }

  .panes {
    align-items: stretch;
    background-color: var(--kui-color-background, $kui-color-background);
    border-top-left-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    display: flex;
    flex: 1 1 auto;
    flex-direction: row;
    overflow: hidden;
    z-index: 0;
  }

  .split-pane-left,
  .split-pane-center,
  .split-pane-right {
    overflow-x: hidden;
    overflow-y: auto;
    position: relative;
    scrollbar-width: thin;

    &.has-toolbar {
      max-height: calc(100vh - $toolbar-height); // 44px for the toolbar height
    }

    &.is-dragging-pane {
      // !Important: Disable pointer events when resizing a panel
      pointer-events: none;
      transition: none;
      user-select: none;
    }
  }

  // The resizable min and max widths are also enforced in the `useSplitPane` composable.
  .split-pane-left {
    border-right: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border-transparent, $kui-color-border-transparent);
    border-top-left-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    flex: 0 0 auto;
    max-height: none !important; // Reset max-height for the left pane
    max-width: 0; // When not expanded, the max-width is 0
    overflow: hidden;
    pointer-events: none; // Disallow interaction when not expanded
    position: relative;
    transition: border-color 0.1s ease-in-out, max-width 0.1s ease-in-out;
    width: $pane-left-min-width; // Default width
    will-change: border-color, max-width, min-width;
    z-index: 5; // Keep tooltips above center pane

    &.expanded {
      border-right-color: var(--kui-color-border, $kui-color-border);
      max-width: v-bind('leftMaxWidth');
      pointer-events: auto; // Allow interaction when expanded
    }

    &.is-dragging-pane-left,
    &.expanded.show-resize-border,
    &.show-resize-border {
      border-right-color: var(--kui-color-border-primary, $kui-color-border-primary);
    }
  }

  .split-pane-center {
    max-width: v-bind('centerMaxWidth');
    min-width: $inner-panes-min-width; // Do not allow resizing below the minimum
    width: $inner-panes-min-width;

    &.has-resize-divider-left {
      margin-left: calc($resize-divider-width * -1);
    }

    &.has-resize-divider-right {
      margin-right: calc($resize-divider-width * -1);
    }
  }

  .split-pane-right {
    border-left: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    flex: 1;
    max-width: v-bind('rightMaxWidth');
    min-width: $inner-panes-min-width; // Do not allow resizing below the minimum
    transition: border-color 0.1s ease-in-out;

    &.is-dragging-inner-panes,
    &.show-resize-border {
      border-left-color: var(--kui-color-border-primary, $kui-color-border-primary);
    }
  }

  .split-pane-toolbar-container {
    &.has-resize-divider-left {
      margin-left: calc($resize-divider-width * -1);
    }
  }

  .split-pane-resize-divider {
    align-self: flex-end;
    // The pane-right element has a border, so we don't need a background color here
    background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
    cursor: col-resize;
    height: calc(100% - #{$toolbar-adjusted-height});
    position: relative;
    transition: all 0.1s ease-in-out;
    width: $resize-divider-width;
    z-index: 4; // Keep above the panes but below popovers and tooltips

    &.left {
      margin-left: 0;
    }

    &.right {
      right: calc($resize-divider-width * -1);
    }
  }
}
</style>
