<template>
  <a
    aria-haspopup="true"
    :aria-label="isActive ? 'Close Main Menu' : 'Open Main Menu'"
    class="sidebar-menu-toggle"
    :class="{ 'active': isActive }"
    href="#"
    role="button"
    @click.prevent="toggle"
  >
    <span class="line" />
    <span class="line" />
    <span class="line" />
  </a>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const emit = defineEmits(['toggle'])
const props = defineProps({
  active: {
    type: Boolean,
    default: false,
  },
})

const isActive = ref<boolean>(props.active || false)
const toggle = (e: Event) => {
  e.preventDefault()
  isActive.value = !isActive.value
  emit('toggle', isActive.value)
}

watch(() => props.active, (active) => {
  isActive.value = active
})
</script>

<style lang="scss" scoped>
/* stylelint-disable @kong/design-tokens/token-var-usage */
@use "../../styles/variables" as *;

.sidebar-menu-toggle {
  border-radius: $kui-border-radius-20;
  padding: $kui-space-0 $kui-space-20;
  position: relative;
  transition: all 0.3s ease-in-out;

  &:focus-visible {
    outline: 1px solid var(--kong-ui-app-sidebar-mobile-icon-color, #0044f4);
  }

  @media (min-width: $kui-breakpoint-tablet) {
    display: none;
  }

  .line {
    background-color: var(--kong-ui-app-sidebar-mobile-icon-color, $kui-color-background);
    border-radius: $sidebar-item-border-radius;
    display: block;
    height: 2px;
    margin: $kui-space-30 $kui-space-auto;
    transition: all 0.3s ease-in-out;
    width: 24px;
  }

  &.active {
    .line {
      &:nth-child(2) {
        opacity: 0;
      }

      &:nth-child(1) {
        transform: translateY(8px) rotate(45deg);
      }

      &:nth-child(3) {
        transform: translateY(-8px) rotate(-45deg);
      }
    }
  }
}
</style>
