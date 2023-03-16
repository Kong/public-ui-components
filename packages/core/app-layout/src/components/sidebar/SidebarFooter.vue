<template>
  <nav
    aria-haspopup="true"
    aria-label="Profile Menu"
    class="sidebar-footer-nav"
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
            :kpop-attributes="{ placement: 'right', popoverClasses: 'ml-5 sidebar-profile-menu-popover', target: '.sidebar-footer-nav' }"
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

.sidebar-footer-nav {
  width: 100%;
}

.sidebar-item-icon {
  display: flex;
  line-height: 0; // to align icon with the text baseline
  padding-right: 14px;
}

.sidebar-profile-link {
  align-items: center;
  background-color: var(--blue-700, #0A2B66);
  color: var(--steel-300, #A3B6D9);
  display: flex;
  height: $sidebar-item-profile-height !important;
  padding-left: 14px;
  text-decoration: none;
  white-space: nowrap;
}

.sidebar-profile-item-container,
.sidebar-profile-dropdown-container {
  align-items: center;
  display: flex;
  height: 100%;
  width: 100%;
}

.sidebar-profile-dropdown-container {
  padding-right: 16px;
  width: 100%;

  :deep(.k-dropdown) {
    height: 100%;
    width: 100%;

    > * {
      height: 100%;
      width: 100%;

      .k-dropdown-trigger {
        align-items: center;
        display: flex;
        font-size: $sidebar-item-font-size;
        height: 100%;
        width: 100%;
      }
    }
  }
}

.profile-dropdown-trigger {
  align-items: center;
  color: var(--steel-300, #A3B6D9);
  cursor: pointer;
  display: flex;
  font-weight: 500;
  height: 100%;
  text-decoration: none;
  transition: color .2s ease-out;
  white-space: nowrap;
  width: 100%;

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
  overflow: hidden;
  padding-right: 1ch;
  text-overflow: ellipsis;
  -webkit-user-select: none;
  user-select: none;
}

:deep(.sidebar-profile-menu-popover.k-popover) {
  --KPopPaddingX: 0 !important;
  --KPopPaddingY: 0 !important;
  left: -2px !important;
  margin-top: 0 !important;

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
      box-shadow: none;
      outline: none;
    }
    &:focus-visible {
      outline: 1px solid var(--steel-300, #A3B6D9);
    }
  }
}
</style>
