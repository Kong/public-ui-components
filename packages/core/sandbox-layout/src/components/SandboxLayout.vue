<template>
  <div class="kong-ui-sandbox-layout">
    <header :class="['header', { 'no-title': !title }]">
      <div class="header-left">
        <h1 v-if="title">
          <router-link
            class="home-link"
            :to="{ name: 'home'}"
          >
            {{ title }}
          </router-link>
        </h1>
      </div>
      <div class="header-right">
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
                :is-visible="mobileNavIsToggled.value"
                @close="toggleMobileNav"
              >
                <SandboxNavigation @router-link-click="toggleMobileNav" />
              </KSlideout>
            </div>
          </KToggle>
        </div>
        <div class="mobile-controls-container">
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
                :is-visible="controlsAreToggled.value"
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
        <slot name="default" />
      </div>
      <div class="sandbox-controls">
        <slot name="controls" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SandboxNavigation from '../components/SandboxNavigation.vue'
import { provide } from 'vue'
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
})

provide(KONG_UI_SANDBOX_LAYOUT_LINKS_INJECTION_KEY, props.links)
</script>

<style lang="scss" scoped>
.kong-ui-sandbox-layout {
  .header {
    align-items: center;
    border-bottom: $kui-border-width-10 solid $kui-color-border;
    display: flex;
    justify-content: space-between;
    width: 100%;

    &.no-title {
      display: none;

      // Always show the header on mobile layout
      @media (max-width: ($kui-breakpoint-laptop - 1px)) {
        display: flex;
      }
    }

    @media (min-width: $kui-breakpoint-laptop) {
      border: none;
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

  .mobile-nav-container,
  .mobile-controls-container {
    @media (min-width: $kui-breakpoint-laptop) {
      display: none;
    }
  }

  .sandbox-controls,
  .desktop-nav-container {
    display: none;
    min-width: 240px;

    // Always show nav and controls on desktop
    @media (min-width: $kui-breakpoint-laptop) {
      display: block;
    }
  }

  .sandbox-container {
    min-height: 50vh;
    width: 100%;

    @media (min-width: $kui-breakpoint-laptop) {
      border: $kui-border-width-10 solid $kui-color-border;
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
}
</style>
