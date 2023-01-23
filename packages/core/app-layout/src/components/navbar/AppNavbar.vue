<template>
  <header class="kong-ui-app-navbar">
    <div class="header-content">
      <div class="mobile-header-left">
        <slot name="mobile-sidebar-toggle" />
        <slot name="mobile-logo" />
      </div>
      <slot name="default" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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

const headerStyles = computed(() => ({
  top: props.topOffset ? `${props.topOffset}px` : '0',
  left: props.leftOffset ? `${props.leftOffset}px` : '0',
  zIndex: props.zIndex,
}))
</script>

<style lang="scss" scoped>
@import "../../styles/variables";

.kong-ui-app-navbar {
  position: fixed;
  top: v-bind('headerStyles.top');
  left: 0;
  right: 0;
  background-color: var(--kong-ui-app-navbar-background-color, #fff);
  border-bottom: $navbar-border;
  z-index: v-bind('headerStyles.zIndex');

  @media (min-width: $viewport-md) {
    left: v-bind('headerStyles.left');
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $header-item-gap;
    height: $navbar-height;
    padding: 0 16px;
  }

  .mobile-header-left {
    display: inline-flex;
    gap: $header-item-gap;

    @media (min-width: $viewport-md) {
      display: none;
    }
  }
}
</style>
