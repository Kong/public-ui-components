<template>
  <div class="kong-ui-public-split-pane-vertical-navigation">
    <nav class="split-pane-nav">
      <div class="top">
        <KTooltip
          v-for="item in items"
          :key="item.tooltip"
          :kpop-attributes="{ offset: '10px' }"
          :label="item.tooltip"
          placement="right"
        >
          <KButton
            appearance="none"
            :aria-label="item.tooltip"
            class="split-pane-nav-item"
            :class="{ 'active': item.active }"
            :data-testid="`kong-ui-public-split-pane-vertical-navigation-nav-item-${item.testid}`"
            icon
            size="large"
            :style="{ cursor: 'pointer' }"
            :to="item.to"
            @click.capture.prevent="onNavItemClick(item)"
          >
            <component
              :is="item.icon"
              decorative
              :size="KUI_ICON_SIZE_40"
            />
          </KButton>
        </KTooltip>
      </div>
      <div class="bottom">
        <div
          v-if="paneLeftVisible"
          class="toggle-left-panel-control"
          :class="{
            'expanded': paneLeftExpanded,
            'disable-animation': !hasMounted || isDraggingPaneLeft || isDraggingInnerPanes,
          }"
          @transitionend.self="sidePanelToggling = false"
          @transitionstart.self="sidePanelToggling = true"
        >
          <KTooltip
            :key="String(paneLeftExpanded)"
            :kpop-attributes="paneLeftExpanded ? undefined : { offset: '10px' }"
            :label="hideTogglePanelTooltip ? undefined : (paneLeftExpanded ? i18n.t('actions.collapse_panel') : i18n.t('actions.expand_panel'))"
            :placement="paneLeftExpanded ? 'left' : 'right'"
          >
            <KButton
              appearance="none"
              aria-controls="left-pane"
              :aria-expanded="paneLeftExpanded"
              :aria-label="paneLeftExpanded ? i18n.t('actions.collapse_panel') : i18n.t('actions.expand_panel')"
              class="split-pane-nav-item toggle-left-panel"
              data-testid="kong-ui-public-split-pane-toggle-left-panel-button"
              icon
              size="large"
              @click="togglePaneLeft"
            >
              <component
                :is="paneLeftExpanded ? ChevronDoubleLeftIcon : ChevronDoubleRightIcon"
                decorative
                :size="KUI_ICON_SIZE_40"
              />
            </KButton>
          </KTooltip>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@kong/icons'
import { KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import useSplitPane from '../composable/useSplitPane'
import { useRouter } from 'vue-router'
import useI18n from '../composable/useI18n'
import type { VerticalNavigationItem } from '../types'

const {
  items = [],
  paneLeftWidth = 0,
  paneLeftVisible = true,
} = defineProps<{
  paneLeftWidth?: number
  paneLeftVisible?: boolean
  items?: VerticalNavigationItem[]
}>()

const { i18n } = useI18n()
const router = useRouter()

const { paneLeftExpanded, togglePaneLeft, isDraggingPaneLeft, isDraggingInnerPanes } = useSplitPane()

// To manage tooltip visibility during pane toggling and dragging
const sidePanelToggling = ref<boolean>(false)
// To avoid layout shift on initial render
const hasMounted = ref<boolean>(false)


// Hide tooltip when the pane is being toggled or dragged
const hideTogglePanelTooltip = computed<boolean>(() => sidePanelToggling.value || isDraggingPaneLeft.value || isDraggingInnerPanes.value)

// Subtract 8px for the scrollbar
// TODO: calculate the scrollbar width on runtime
const toggleLeftPanelOffset = computed<string>(() => `${paneLeftWidth - 8}px`)

const onNavItemClick = (item: VerticalNavigationItem): void => {
  if (!paneLeftExpanded.value) {
    togglePaneLeft()
  }

  // Prevent navigating if the item is already active
  if (!item.active && item.to) {
    router.push(item.to)
  }
}

onMounted(async () => {
  // await 1 second tick to avoid toggle animation on initial render
  await nextTick()
  // await new Promise((resolve) => setTimeout(resolve, 500))
  hasMounted.value = true
})
</script>

<style lang="scss" scoped>
.kong-ui-public-split-pane-vertical-navigation {
  color: var(--kui-navigation-color-text, $kui-navigation-color-text);
  display: flex;
  height: 100%;
  justify-content: center;
  padding: var(--kui-space-40, $kui-space-40);
  position: relative;
  width: 52px;
  z-index: 1; // Keep overtop of the panes

  .split-pane-nav {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-50, $kui-space-50);
    justify-content: space-between;
    width: 100%;

    .top,
    .bottom {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      gap: var(--kui-space-50, $kui-space-50);
      position: relative;
      width: 100%;
    }

    .top {
      align-items: center;
      justify-content: flex-start;
    }

    .bottom {
      align-items: center;
      justify-content: flex-end;
    }

    &:deep(.k-popover) {
      .popover {
        pointer-events: none;
      }
    }

    &-item {
      align-items: center;
      background-color: var(--kui-navigation-color-background, $kui-navigation-color-background);
      border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border-transparent, $kui-color-border-transparent);
      border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
      color: var(--kui-navigation-color-text, $kui-navigation-color-text);
      cursor: pointer;
      display: flex;
      justify-content: center;
      justify-content: space-between;
      text-decoration: none;
      transition: color .2s ease;
      white-space: nowrap;

      &:hover,
      &:focus-visible {
        color: var(--kui-navigation-color-text-hover, $kui-navigation-color-text-hover);

        :deep(svg) {
          color: var(--kui-navigation-color-text-hover, $kui-navigation-color-text-hover);
        }
      }

      &:focus-visible {
        box-shadow: var(--kui-navigation-shadow-focus, $kui-navigation-shadow-focus);
        outline: none;
      }

      :deep(svg) {
        path {
          color: currentColor;
          fill: currentColor;
          transition: all .2s ease-out;
        }
      }

      &.active {
        background-color: var(--kui-navigation-color-background-selected, $kui-navigation-color-background-selected);
        border-color: var(--kui-navigation-color-border, $kui-navigation-color-border);
        color: var(--kui-navigation-color-text-selected, $kui-navigation-color-text-selected);

        &:hover,
        &:focus-visible {
          color: var(--kui-navigation-color-text-selected, $kui-navigation-color-text-selected) !important;

          :deep(svg) {
            color: var(--kui-navigation-color-text-selected, $kui-navigation-color-text-selected);
          }
        }
      }

      &.toggle-left-panel {
        border-color: var(--kui-navigation-color-border, $kui-navigation-color-border);
      }
    }
  }
}


// Position the toggle left panel button according to the expanded state
.toggle-left-panel-control {
  left: 0;
  position: absolute;
  z-index: 1;

  &:not(.disable-animation) {
    transition: left 0.2s ease-out; // .1s slower than the panel transition
  }

  &.expanded {
    left: v-bind('toggleLeftPanelOffset');
  }
}
</style>
