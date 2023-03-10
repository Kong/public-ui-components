<template>
  <li
    :class="[!subnavItem ? 'sidebar-item-primary' : 'sidebar-item-secondary', { 'expanded': (item as SidebarPrimaryItem).expanded }, { 'active': item.active }]"
    :data-testid="item.testId ? `sidebar-item-${item.testId}` : undefined"
  >
    <component
      :is="!useAnchorTag ? 'router-link' : 'div'"
      v-slot="slotProps"
      :custom="!useAnchorTag ? true : undefined"
      :to="!useAnchorTag && !openInNewWindow ? item.to : undefined"
    >
      <a
        :aria-controls="(item as SidebarPrimaryItem).items?.length && (item as SidebarPrimaryItem).expanded ? `subnav-${(item as SidebarPrimaryItem).key}` : undefined"
        :aria-expanded="(item as SidebarPrimaryItem).items?.length && (item as SidebarPrimaryItem).expanded ? true : undefined"
        class="sidebar-item-link"
        :class="{ 'sidebar-item-external-link': openInNewWindow, 'router-link': !useAnchorTag }"
        :href="useAnchorTag ? String(item.to || '#') : slotProps?.href"
        :target="openInNewWindow ? '_blank' : undefined"
        @click="navigate($event, item, slotProps?.navigate)"
        @keypress.enter="navigate($event, item, slotProps?.navigate)"
      >
        <div
          class="sidebar-item-display"
          :class="{ 'has-label': !!(item as SidebarPrimaryItem).label && (item as SidebarPrimaryItem).expanded, 'has-badge': itemHasBadge }"
        >
          <div
            v-if="(item as SidebarPrimaryItem).icon"
            class="sidebar-item-icon"
          >
            <KIcon
              :color="item.active || (item as SidebarPrimaryItem).expanded ? 'var(--white, #fff)' : '#B5BECD'"
              :icon="String((item as SidebarPrimaryItem).icon)"
              size="20"
            />
          </div>
          <div class="sidebar-item-name-container">
            <div
              v-if="subnavItem ? item.name.length < 25 : item.name.length < 18"
              class="sidebar-item-name truncate-text"
              :class="[subnavItem ? 'has-badge-max-width truncate-24' : 'truncate-17']"
            >
              {{ item.name }}
            </div>
            <KTooltip
              v-else
              class="sidebar-item-tooltip"
              :label="item.name"
              placement="right"
              position-fixed
            >
              <div class="sidebar-item-name has-tooltip">
                <span
                  class="truncate-text"
                  :class="[subnavItem ? 'truncate-20' : 'truncate-17', { 'has-badge-max-width': itemHasBadge }]"
                >{{ item.name }}</span>
              </div>
            </KTooltip>
            <div
              v-if="(item as SidebarPrimaryItem).label && (item as SidebarPrimaryItem).expanded"
              class="sidebar-item-label truncate-text truncate-20"
            >
              {{ (item as SidebarPrimaryItem).label }}
            </div>
          </div>
          <ItemBadge
            v-if="itemHasBadge"
            :count="(item as SidebarSecondaryItem).badgeCount"
          />
        </div>
      </a>
    </component>
    <ul
      v-if="(item as SidebarPrimaryItem).items?.length && (item as SidebarPrimaryItem).expanded"
      :id="`subnav-${(item as SidebarPrimaryItem).key}`"
      class="level-secondary"
    >
      <SidebarItem
        v-for="childItem in (item as SidebarPrimaryItem).items"
        :key="childItem.name"
        :item="childItem"
        :subnav-item="true"
        @click="itemClick(childItem)"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { PropType, computed } from 'vue'
import type { SidebarPrimaryItem, SidebarSecondaryItem } from '../../types'
import ItemBadge from './ItemBadge.vue'

const emit = defineEmits(['click'])

const props = defineProps({
  item: {
    type: Object as PropType<SidebarPrimaryItem | SidebarSecondaryItem>,
    required: true,
  },
  subnavItem: {
    type: Boolean,
    default: false,
  },
})

// Force anchor tag if `item.newWindow` is true, or `item.to` starts with `http`
const useAnchorTag = computed((): boolean => {
  if (typeof props.item.to !== 'string') {
    return false
  }

  return !!props.item.newWindow || !!props.item.external || props.item.to.startsWith('http')
})

// Should component use an anchor tag and open the link in a new window
const openInNewWindow = computed((): boolean => {
  if (!props.item.to || typeof props.item.to !== 'string' || !props.item.newWindow) {
    return false
  }

  return props.item.newWindow && (props.item.to.startsWith('http') || props.item.to.startsWith('/'))
})

const itemHasBadge = computed(() => props.subnavItem && (props.item as SidebarSecondaryItem).badgeCount !== undefined)

const itemClick = (item: SidebarPrimaryItem | SidebarSecondaryItem): void => {
  emit('click', item)
}

const navigate = (event: Event, item: SidebarPrimaryItem | SidebarSecondaryItem, routerNavigate?: Function): void => {
  itemClick(item)
  if (typeof routerNavigate === 'function') {
    event.preventDefault()
    routerNavigate()
  }
}
</script>

<style lang="scss">
@import "../../styles/variables";

// Scope with wrapper class intead of using `scoped` so these styles will apply to child components
.kong-ui-app-sidebar {
  // Shared styles for the primary and secondary elements
  .sidebar-item-primary,
  .sidebar-item-secondary {
    display: flex;
    flex-direction: column;
    position: relative;
    white-space: nowrap;

    &:last-of-type {
      margin-bottom: 0;
    }

    a.sidebar-item-link {
      align-items: center;
      color: var(--steel-300, #A3B6D9);
      cursor: pointer;
      display: flex;
      font-size: $sidebar-item-font-size;
      font-weight: 500;
      justify-content: space-between;
      min-height: 48px;
      text-decoration: none;
      transition: color .2s ease-out;

      // SVG color transition (initial values)
      svg {
        &:not(.profile-icon) path {
          color: currentColor;
          fill: currentColor;
          transition: all .2s ease-out;
        }
      }

      // specific SVG stroke color on hover
      .kong-icon {
        &.kong-icon-brain svg path[stroke-width="2"] {
          stroke: currentColor;
        }
      }

      &:hover,
      &:focus-visible {
        color: var(--green-300, #84E5AE);

        svg {
          color: var(--green-300, #84E5AE);
        }

        // specific SVG stroke color on hover
        .kong-icon {
          &.kong-icon-brain svg path[stroke-width="2"] {
            stroke: var(--green-300, #84E5AE);
          }
        }
      }

      &:focus-visible {
        outline: 1px solid var(--steel-300, #A3B6D9);
      }

      .sidebar-item-tooltip {
        align-items: center;
        display: flex;
        height: 100%;
      }
    }

    &.active > a,
    &.active > div > a,
    &.expanded > a,
    &.expanded > div > a {
      color: var(--green-300, #84E5AE);

      .sidebar-item-name {
        font-weight: 700 !important;
      }
    }

    ul.level-secondary {
      border-top: 1px solid var(--black-10, rgba(#000, 0.1));
      padding: 4px 0 12px;
    }
  }
}
</style>

<style lang="scss" scoped>
@import "../../styles/variables";

// Primary-level nav item
.sidebar-item-primary {
  border: 1px solid transparent;

  &.active,
  &.expanded {
    background-color: rgba(#fff, .1);
    border-color: rgba(#fff, .1);
    border-radius: $sidebar-item-border-radius;
  }

  > a,
  > div > a {
    border-radius: $sidebar-item-border-radius;

    > .sidebar-item-display {

      &.has-label {
        padding-bottom: 12px;
        padding-top: 12px;
      }
    }
  }
}

// Secondary-level nav item
.sidebar-item-secondary {
  margin-bottom: 4px;

  &:last-of-type {
    margin-bottom: 0;
  }

  a {
    background-color: transparent;
    // Add a left border by default so the item doesn't "shift" to the right when active
    border-left: 4px solid transparent;
    color: var(--steel-200, #DAE3F2) !important;
    font-size: $sidebar-item-font-size;
    // Override the min-height for the secondary items
    min-height: 40px !important;
    transition: all .1s ease-in-out !important;

    &:hover,
    &:focus-visible {
      background-color: rgba(#fff, 0.05);
    }

    > .sidebar-item-display {
      &.has-badge {
        justify-content: space-between; // for badges

        .has-badge-max-width {
          max-width: 134px !important;
        }
      }
    }
  }

  &.active > a {
    background-color: rgba(#fff, 0.1);
    border-left: 4px solid var(--green-300, #84E5AE);
    color: var(--white, #fff) !important;
    font-weight: 600 !important;
  }
}

.sidebar-item-display {
  align-items: center;
  display: flex;
  height: 100%;
  padding: 0 16px;
  width: 100%;

  .sidebar-item-name-container {
    line-height: 1.3;
    -webkit-user-select: none;
    user-select: none;

    .truncate-text {
      height: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &.truncate {
        &-17 {
          max-width: 17ch;
        }
        &-20 {
          max-width: 20ch;
        }
        &-24 {
          max-width: 24ch;
        }
      }
    }

    .sidebar-item-name {
      align-items: center;
      display: flex;

      &.has-tooltip {
        height: 100%;

        span {
          height: auto;
          min-width: 0; // Important: must be present to truncate the text
        }
      }
    }
  }

  .sidebar-item-label {
    color: var(--steel-300, #A3B6D9);
    font-size: 12px;
    margin-top: 4px;
  }

  .sidebar-item-icon {
    align-items: center;
    display: flex;
    line-height: 0; // to align icon with the text baseline
    padding-right: 14px;
  }
}
</style>
