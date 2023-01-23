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
const toggle = () => {
  isActive.value = !isActive.value
  emit('toggle', isActive.value)
}

watch(() => props.active, (active) => {
  isActive.value = active
})
</script>

<style lang="scss" scoped>
@import "../../styles/variables";

.sidebar-menu-toggle {
  position: relative;
  padding: 0 4px;
  border-radius: 3px;
  transition: all 0.3s ease-in-out;

  &:focus-visible {
    outline: 1px solid var(--kong-ui-app-sidebar-mobile-icon-color, var(--blue-500, #1155cb));
  }

  @media (min-width: $viewport-md) {
    display: none;
  }

  .line {
    display: block;
    width: 24px;
    height: 2px;
    border-radius: $sidebar-item-border-radius;
    background-color: var(--kong-ui-app-sidebar-mobile-icon-color, var(--blue-500, #1155cb));
    margin: 6px auto;
    transition: all 0.3s ease-in-out;
  }

  &.active {
    .line {
      &:nth-child(2) {
        opacity: 0;
      }

      &:nth-child(1) {
        transform: translateY(8px) rotate(45deg);
      }

      &:nth-child(3){
        transform: translateY(-8px) rotate(-45deg);
      }
    }
  }
}
</style>
