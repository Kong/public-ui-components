<template>
  <nav
    aria-haspopup="true"
    aria-label="Profile Menu"
    class="sidebar-footer"
  >
    <div class="sidebar-profile-link">
      <div class="sidebar-item-icon">
        <ProfileIcon />
      </div>
      <div class="sidebar-profile-item-container">
        <div class="sidebar-profile-dropdown-container">
          <div
            v-if="!hasProfileItems"
            class="sidebar-profile-name"
          >
            {{ name }}
          </div>
          <KDropdownMenu
            v-else
            :kpop-attributes="{ placement: 'right', popoverClasses: 'ml-5 sidebar-profile-menu-popover', target: '.sidebar-footer' }"
            width="240"
          >
            <a
              aria-label="Open Profile Menu"
              class="profile-dropdown-trigger"
              role="button"
              tabindex="0"
              @click.prevent
            >
              <span class="sidebar-profile-name">{{ name }}</span>
            </a>
            <template #items>
              <slot name="default" />
            </template>
          </KDropdownMenu>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProfileIcon from './ProfileIcon.vue'
import { KDropdownMenu } from '@kong/kongponents'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  itemCount: {
    type: Number,
    required: true,
    default: 0,
  },
})

const hasProfileItems = computed((): boolean => props.itemCount > 0)
</script>

<style lang="scss" scoped>
@import "../../styles/variables";

.sidebar-item-icon {
  display: flex;
  padding-right: 14px;
  line-height: 0; // to align icon with the text baseline
}

.sidebar-profile-link {
  display: flex;
  align-items: center;
  height: $sidebar-item-profile-height !important;
  padding-left: 14px;
  color: var(--steel-300, #A3B6D9);
  background-color: var(--blue-700, #0A2B66);
  text-decoration: none;
  white-space: nowrap;
}

.sidebar-profile-item-container,
.sidebar-profile-dropdown-container {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
}

.sidebar-profile-dropdown-container {
  width: 100%;
  padding-right: 16px;

  :deep(.k-dropdown) {
    width: 100%;
    height: 100%;

    > * {
      width: 100%;
      height: 100%;

      .k-dropdown-trigger {
        display: flex;
        align-items: center;
        width: 100%;
        height: 100%;
        font-size: $sidebar-item-font-size;
      }
    }
  }
}

.profile-dropdown-trigger {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  color: var(--steel-300, #A3B6D9);
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition: color .2s ease-out;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: var(--white, #fff);
  }

  &:focus-visible {
    outline: none;
    span {
      outline: 1px solid var(--steel-300, #A3B6D9);
    }
  }
}

.sidebar-profile-name {
  line-height: 1.3;
  max-width: $profile-name-max-width;
  padding-right: 1ch;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-user-select: none;
  user-select: none;
}

:deep(.sidebar-profile-menu-popover.k-popover) {
  --KPopPaddingX: 0 !important;
  --KPopPaddingY: 0 !important;
  margin-top: 0 !important;
  left: -2px !important;

  // Prevent animation classes from being applied by container app
  &.fade-enter-active,
  &.fade-enter-to,
  &.fade-leave-active,
  &.fade-leave-to {
    animation: none !important;
  }

  .k-dropdown-list {
    margin: var(--spacing-sm) 0;
    padding-left: 0;
  }

  .k-dropdown-item-trigger {
    &:focus {
      outline: none;
      box-shadow: none;
    }
    &:focus-visible {
      outline: 1px solid var(--steel-300, #A3B6D9);
    }
  }
}
</style>
