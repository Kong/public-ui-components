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
            'disable-animation': isDraggingPaneLeft || isDraggingInnerPanes,
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

const sidePanelToggling = ref<boolean>(false)


const hideTogglePanelTooltip = computed<boolean>(() => sidePanelToggling.value || isDraggingPaneLeft.value || isDraggingInnerPanes.value)

// Subtract 8px for the scrollbar
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

const hasMounted = ref(false)

onMounted(async () => {
  await nextTick()
  // next tick ensures initial layout is complete
  requestAnimationFrame(() => {
    hasMounted.value = true
  })
})
</script>

<style lang="scss" scoped>
.kong-ui-public-split-pane-vertical-navigation {
  color: $kui-navigation-color-text;
  display: flex;
  height: 100%;
  justify-content: center;
  padding: $kui-space-40;
  position: relative;
  width: 52px;
  z-index: 1; // Keep overtop of the panes

  .split-pane-nav {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: $kui-space-50;
    justify-content: space-between;
    width: 100%;

    .top,
    .bottom {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      gap: $kui-space-50;
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
      background-color: $kui-navigation-color-background;
      border: $kui-border-width-10 solid $kui-color-border-transparent;
      border-radius: $kui-border-radius-30;
      color: $kui-navigation-color-text;
      cursor: pointer;
      display: flex;
      justify-content: center;
      justify-content: space-between;
      text-decoration: none;
      transition: color .2s ease;
      white-space: nowrap;

      &:hover,
      &:focus-visible {
        color: $kui-navigation-color-text-hover;

        :deep(svg) {
          color: $kui-navigation-color-text-hover;
        }
      }

      &:focus-visible {
        box-shadow: $kui-navigation-shadow-focus;
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
        background-color: $kui-navigation-color-background-selected;
        border-color: $kui-navigation-color-border;
        color: $kui-navigation-color-text-selected;

        &:hover,
        &:focus-visible {
          color: $kui-navigation-color-text-selected !important;

          :deep(svg) {
            color: $kui-navigation-color-text-selected;
          }
        }
      }

      &.toggle-left-panel {
        border-color: $kui-navigation-color-border;
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
