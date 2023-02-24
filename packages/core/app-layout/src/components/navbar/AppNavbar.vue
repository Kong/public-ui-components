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
@import "../../styles/variables";

.kong-ui-app-navbar {
  background: var(--kong-ui-app-navbar-background, transparent);
  left: 0;
  position: fixed;
  right: 0;
  top: v-bind('headerStyles.top');
  z-index: v-bind('headerStyles.zIndex');

  @media (min-width: $viewport-lg) {
    left: v-bind('headerStyles.left');
  }

  .header-content {
    align-items: center;
    display: flex;
    height: $navbar-height;
    justify-content: space-between;
    padding: 0 16px; // should match the padding of `.sidebar-header` in the sidebar
  }

  .app-navbar-logo {
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: flex-start;
    margin-right: v-bind('appLogoStyles.marginRight');
    max-width: v-bind('appLogoStyles.width');
    min-width: v-bind('appLogoStyles.width');
  }

  .mobile-header-left {
    display: inline-flex;
    gap: $header-item-gap;

    @media (min-width: $viewport-lg) {
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
      color: var(--white, #fff);
      display: flex;
      font-size: 14px;
      font-weight: 500;
      padding: 0 8px;
      text-decoration: none;
      transition: all .2s ease-in-out;
      white-space: nowrap;

      @media (min-width: $viewport-md) {
        font-size: 16px;
        padding: 0 16px;
      }

      &.router-link-active,
      &.active {
        border-color: var(--green-300, #84E5AE);
        font-weight: 600 !important;
      }
    }
  }

  .navbar-content {
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: 8px;
    height: 100%;
    justify-content: space-between;
    width: 100%;

    @media (min-width: $viewport-md) {
      gap: 16px;
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
