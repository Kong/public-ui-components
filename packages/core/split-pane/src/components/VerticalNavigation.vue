<template>
  <div class="kong-ui-public-split-pane-vertical-nav">
    <nav class="kong-ui-public-split-pane-vertical-nav-items">
      <div class="top">
        <KTooltip
          v-for="item in topNavItems"
          :key="item.tooltip"
          :kpop-attributes="{ offset: '10px' }"
          :label="item.tooltip"
          placement="right"
        >
          <KButton
            appearance="none"
            :aria-label="item.tooltip"
            class="kong-ui-public-split-pane-vertical-nav-items-item"
            :class="{ 'active': item.active }"
            :data-testid="`kong-ui-public-split-pane-vertical-nav-${item.testid}-button`"
            icon
            size="large"
            :to="item.to"
            @click.capture.prevent="onNavItemClick(item)"
          >
            <component
              :is="item.icon"
              decorative
            />
          </KButton>
        </KTooltip>
      </div>
      <div class="bottom">
        <div
          class="toggle-left-panel-control"
          :class="{ 'expanded': showLeftPane, 'disable-animation': preventLeftPanelControlAnimation }"
        >
          <KTooltip
            :key="String(showLeftPane)"
            :label="showLeftPane ? 'Collapse' : 'Expand'"
            :placement="showLeftPane ? 'left' : 'right'"
          >
            <KButton
              appearance="none"
              aria-controls="studio-modal-pane-left"
              :aria-expanded="showLeftPane"
              :aria-label="showLeftPane ? 'Collapse' : 'Expand'"
              class="kong-ui-public-split-pane-vertical-nav-items-item toggle-left-panel"
              data-testid="kong-ui-public-split-pane-vertical-nav-toggle-left-panel-button"
              icon
              size="large"
              @click="showLeftPane = !showLeftPane"
            >
              <component
                :is="showLeftPane ? ChevronDoubleLeftIcon : ChevronDoubleRightIcon"
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
import { ArrowLeftIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@kong/icons'
import { ref, computed, onMounted } from 'vue'
import { KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import useI18n from '../composable/useI18n'
import { useRouter } from 'vue-router'

const {
  leftPaneWidth = 0,
} = defineProps<{
  leftPaneWidth?: number
}>()

const showLeftPane = defineModel<boolean>('left-pane')

const { i18n } = useI18n()
const router = useRouter()

// Allow temporarily hiding the toggle panel tooltip during the expand/collapse animation
const paneLeftExpanded = ref<boolean>(false)

const topNavItems = computed((): any => {
  return [
    {
      to: '/test',
      tooltip: i18n.t('actions.return'),
      icon: ArrowLeftIcon,
      active: false, // This item is never active
      testid: 'return',
    },
  ]
})

// Subtract 8px for the scrollbar
const toggleLeftPanelOffset = computed((): string => `${leftPaneWidth - 8}px`)

const onNavItemClick = (item: any): void => {
  if (!paneLeftExpanded.value) {
    paneLeftExpanded.value = true
  }

  // Prevent navigating if the item is already active
  if (!item.active) {
    router.push(item.to)
  }
}

const preventLeftPanelControlAnimation = ref<boolean>(true)

onMounted(async () => {
  // for the initial mount, prevent the animation
  setTimeout(() => {
    preventLeftPanelControlAnimation.value = false
  }, 1000)
})
</script>

<style lang="scss" scoped>
.kong-ui-public-split-pane-vertical-nav {
  box-sizing: border-box;
  color: $kui-navigation-color-text;
  display: flex;
  height: 100%;
  justify-content: center;
  padding: $kui-space-40;
  position: relative;
  width: 52px;
  z-index: 1; // Keep overtop of the panes

  &-items {
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

  // TODO: disable animation when dragging panes
  &:not(.disable-animation) {
    transition: left 0.2s ease-out; // .1s slower than the panel transition
  }

  &.expanded {
    left: v-bind('toggleLeftPanelOffset');
  }
}
</style>
