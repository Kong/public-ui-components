<template>
  <header class="kong-ui-app-navbar">
    <div class="header-content">
      <div class="mobile-header-left">
        <slot name="mobile-sidebar-toggle" />
        <slot name="mobile-logo" />
      </div>
      <div
        v-if="hasLogo"
        class="app-navbar-logo"
      >
        <slot name="logo" />
      </div>
      <div class="navbar-content">
        <div class="navbar-content-left">
          <slot name="left" />
        </div>
        <div class="navbar-content-center">
          <slot name="center" />
        </div>
        <div class="navbar-content-right">
          <slot name="right" />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, reactive, useSlots, onMounted } from 'vue'

const props = defineProps({
  topOffset: {
    type: Number,
    default: 0,
  },
  leftOffset: {
    type: Number,
    default: 240, // Defaults to the width of AppSidebar.vue
  },
  zIndex: {
    type: Number,
    default: 3,
  },
})

const slots = useSlots()
const hasLogo = computed(() => !!slots.logo)
const appLogoStyles = reactive({
  marginRight: '0',
  width: '0',
})

onMounted(() => {
  // If the sidebar width or sidebar-header widths change, this logic will need to be updated
  if (document?.querySelector('.kong-ui-app-navbar .app-navbar-logo')?.children?.length) {
    appLogoStyles.marginRight = '32px'
    appLogoStyles.width = 'calc(240px - 32px)'
  } else {
    appLogoStyles.marginRight = '0'
    appLogoStyles.width = '0'
  }
})

const headerStyles = computed(() => ({
  top: props.topOffset ? `${props.topOffset}px` : '0',
  left: props.leftOffset ? `${props.leftOffset}px` : '0',
  zIndex: props.zIndex,
}))
</script>

<style lang="scss" scoped>
@use "../../styles/variables" as *;

.kong-ui-app-navbar {
  background: var(--kui-color-background-inverse, $kui-color-background-inverse);
  left: 0;
  position: fixed;
  right: 0;
  top: v-bind('headerStyles.top');
  z-index: v-bind('headerStyles.zIndex');

  @media (min-width: $kui-breakpoint-tablet) {
    left: v-bind('headerStyles.left');
  }

  .header-content {
    align-items: center;
    display: flex;
    height: $navbar-height;
    justify-content: space-between;
    padding: var(--kui-space-0, $kui-space-0) var(--kui-space-60, $kui-space-60); // should match the padding of `.sidebar-header` in the sidebar
  }

  .app-navbar-logo {
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: flex-start;
    margin-right: v-bind('appLogoStyles.marginRight');
    max-width: v-bind('appLogoStyles.width');
    min-width: v-bind('appLogoStyles.width');
    padding-left: var(--kui-space-60, $kui-space-60);
  }

  .mobile-header-left {
    display: inline-flex;
    gap: $header-item-gap;

    @media (min-width: $kui-breakpoint-tablet) {
      display: none;
    }
  }

  .app-navbar-links,
  :deep(.app-navbar-links),
  :slotted(.app-navbar-links) {
    align-items: center;
    display: flex;
    height: 100%;

    a {
      align-items: center;
      align-self: stretch;
      border-bottom: 4px solid transparent;
      color: var(--kui-color-text-inverse, $kui-color-text-inverse);
      display: flex;
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
      padding: var(--kui-space-0, $kui-space-0) var(--kui-space-40, $kui-space-40);
      text-decoration: none;
      transition: all .2s ease-in-out;
      white-space: nowrap;

      @media (min-width: $kui-breakpoint-phablet) {
        font-size: var(--kui-font-size-40, $kui-font-size-40);
        padding: var(--kui-space-0, $kui-space-0) var(--kui-space-60, $kui-space-60);
      }

      &.router-link-active,
      &.active {
        border-color: #84E5AE;
        font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold) !important;
      }
    }
  }

  .navbar-content {
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: var(--kui-space-40, $kui-space-40);
    height: 100%;
    justify-content: space-between;
    width: 100%;

    @media (min-width: $kui-breakpoint-phablet) {
      gap: var(--kui-space-60, $kui-space-60);
    }

    &-left,
    &-center,
    &-right {
      align-items: center;
      display: flex;
      flex: 1;
      gap: $header-item-gap;
      height: 100%;
    }

    &-left {
      justify-content: flex-start;
    }

    &-center {
      justify-content: center;
    }

    &-right {
      justify-content: flex-end;
    }
  }
}
</style>
