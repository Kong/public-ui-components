<template>
  <header class="kong-ui-app-navbar">
    <div class="header-content">
      <div
        v-if="hasLogo"
        class="app-navbar-logo"
      >
        <slot name="logo" />
      </div>
      <div class="mobile-header-left">
        <slot name="mobile-sidebar-toggle" />
        <slot name="mobile-logo" />
      </div>
      <slot name="default" />
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

  @media (min-width: $viewport-md) {
    left: v-bind('headerStyles.left');
  }

  .header-content {
    align-items: center;
    display: flex;
    gap: $header-item-gap;
    height: $navbar-height;
    justify-content: space-between;
    padding: 0 16px; // should match the padding of `.sidebar-header` in the sidebar
  }

  .app-navbar-logo {
    display: flex;
    height: 100%;
    align-items: center;
    justify-content: flex-start;
    margin-right: v-bind('appLogoStyles.marginRight');
    width: v-bind('appLogoStyles.width');
  }

  .mobile-header-left {
    display: inline-flex;
    gap: $header-item-gap;

    @media (min-width: $viewport-md) {
      display: none;
    }
  }

  .app-navbar-links,
  :deep(.app-navbar-links),
  :slotted(.app-navbar-links) {
    display: flex;
    align-items: center;
    height: 100%;
    margin-right: auto;

    a {
      color: var(--white, #fff);
      border-bottom: 4px solid transparent;
      display: flex;
      align-items: center;
      align-self: stretch;

      padding: 0 16px;
      text-decoration: none;
      font-size: 16px;
      font-weight: 500;
      transition: all .2s ease-in-out;

      &.router-link-active,
      &.active {
        font-weight: 600 !important;
        border-color: var(--green-300, #84E5AE);
      }
    }
  }
}
</style>
