<template>
  <div class="kong-ui-sandbox-layout">
    <header class="header">
      <div class="header-left">
        <div class="mobile-nav-container">
          <KToggle v-slot="{ isToggled: mobileNavIsToggled, toggle: toggleMobileNav }">
            <div>
              <div class="toggle-mobile-nav">
                <MenuIcon
                  role="button"
                  :size="KUI_ICON_SIZE_50"
                  title="Toggle menu"
                  @click="toggleMobileNav"
                />
              </div>
              <KSlideout
                close-button-alignment="end"
                :is-visible="mobileNavIsToggled.value"
                title="Main Menu"
                @close="toggleMobileNav"
              >
                <SandboxNavigation @router-link-click="toggleMobileNav" />
              </KSlideout>
            </div>
          </KToggle>
          <h1
            v-if="title"
            class="mobile-title"
          >
            <router-link
              class="home-link"
              :to="{ name: 'home'}"
            >
              {{ title }}
            </router-link>
          </h1>
        </div>
      </div>
      <div class="header-right">
        <div
          v-if="!!$slots.controls"
          class="mobile-controls-container"
        >
          <KToggle v-slot="{ isToggled: controlsAreToggled, toggle: toggleControls }">
            <div>
              <div class="toggle-mobile-controls">
                <CogIcon
                  role="button"
                  :size="KUI_ICON_SIZE_50"
                  title="Toggle controls"
                  @click="toggleControls"
                />
              </div>
              <KSlideout
                close-button-alignment="end"
                :is-visible="controlsAreToggled.value"
                title="Controls"
                @close="toggleControls"
              >
                <slot name="controls" />
              </KSlideout>
            </div>
          </KToggle>
        </div>
      </div>
    </header>
    <div class="layout">
      <div class="desktop-nav-container">
        <SandboxNavigation />
      </div>
      <div class="sandbox-container">
        <h1 v-if="title">
          {{ title }}
        </h1>
        <slot name="default" />
      </div>
      <div
        v-if="!!$slots.controls"
        class="sandbox-controls"
      >
        <slot name="controls" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SandboxNavigation from '../components/SandboxNavigation.vue'
import { provide, computed } from 'vue'
import { CogIcon, MenuIcon } from '@kong/icons'
import { KUI_ICON_SIZE_50 } from '@kong/design-tokens'
import type { PropType } from 'vue'
import type { SandboxNavigationItem } from '../types'
import { KONG_UI_SANDBOX_LAYOUT_LINKS_INJECTION_KEY } from '../constants'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  links: {
    type: Array as PropType<SandboxNavigationItem[]>,
    required: false,
    default: () => [],
  },
  controlsMinWidth: {
    type: Number,
    default: 240,
  },
})

provide(KONG_UI_SANDBOX_LAYOUT_LINKS_INJECTION_KEY, props.links)

const controlsWidth = computed((): string => `${props.controlsMinWidth}px`)
</script>

<style lang="scss" scoped>
.kong-ui-sandbox-layout {
  .header {
    align-items: center;
    border-bottom: $kui-border-width-10 solid $kui-color-border;
    display: flex;
    justify-content: space-between;
    width: 100%;

    @media (min-width: $kui-breakpoint-laptop) {
      display: none;
    }

    .header-left,
    .header-right {
      align-items: center;
      display: flex;
      gap: $kui-space-70;
      padding: $kui-space-70;
      width: 100%;
    }

    .header-right {
      justify-content: flex-end;
    }

    h1 {
      font-size: $kui-font-size-50;
      margin: $kui-space-0;
      white-space: nowrap;

      @media (min-width: $kui-breakpoint-phablet) {
        font-size: $kui-font-size-70;
      }
    }
  }

  .layout {
    display: flex;
    gap: $kui-space-70;
    padding: $kui-space-70;
  }

  .mobile-nav-container {
    align-items: center;
    display: flex;
    gap: $kui-space-70;
  }

  .mobile-nav-container,
  .mobile-controls-container,
  .mobile-title {
    @media (min-width: $kui-breakpoint-laptop) {
      display: none;
    }
  }

  .sandbox-controls,
  .desktop-nav-container {
    display: none;

    // Always show nav and controls on desktop
    @media (min-width: $kui-breakpoint-laptop) {
      display: block;
    }
  }

  .desktop-nav-container {
    min-width: 240px;
  }

  .sandbox-container {
    min-height: 50vh;
    width: 100%;

    @media (min-width: $kui-breakpoint-laptop) {
      border: $kui-border-width-10 solid $kui-color-border;
      border-radius: $kui-border-radius-30;
      padding: $kui-space-70;
    }

    h1 {
      margin: $kui-space-0 $kui-space-0 $kui-space-70
    }
  }

  .sandbox-controls {
    min-width: v-bind('controlsWidth');

    @media (min-width: $kui-breakpoint-laptop) {
      border: $kui-border-width-10 solid $kui-color-border;
      border-radius: $kui-border-radius-30;
      padding: $kui-space-70;
    }
  }

  .home-link {
    &,
    &:visited {
      color: $kui-color-text-primary;
      text-decoration: none;
    }
  }

  .toggle-mobile-nav,
  .toggle-mobile-controls {
    color: $kui-color-text-primary;
    cursor: pointer;
    transition: color $kui-animation-duration-20 ease-in-out;

    &:hover {
      color: $kui-color-text-primary-strong;
    }
  }

  :deep(.k-slideout),
  :deep(.k-card-body) {
    font-size: $kui-font-size-40;
  }
}
</style>
