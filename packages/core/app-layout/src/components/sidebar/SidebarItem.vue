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
        :aria-current="item.active ? 'page' : undefined"
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
            v-if="$slots[`sidebar-icon-${(item as SidebarPrimaryItem).key}`]"
            class="sidebar-item-icon"
          >
            <slot
              v-if="!subnavItem"
              :name="`sidebar-icon-${(item as SidebarPrimaryItem).key}`"
            />
          </div>
          <div class="sidebar-item-name-container">
            <div
              v-if="subnavItem && !itemHasBadge ? item.name.length < 25 : item.name.length < 18"
              class="sidebar-item-name truncate-text"
              :class="[subnavItem ? 'has-badge-max-width truncate-24' : 'truncate-17']"
            >
              {{ item.name }}
            </div>
            <KTooltip
              v-else
              class="sidebar-item-tooltip"
              placement="right"
              position-fixed
              :text="item.name"
            >
              <div class="sidebar-item-name has-tooltip">
                <span
                  class="truncate-text"
                  :class="[subnavItem ? 'truncate-18' : 'truncate-17', { 'has-badge-max-width': itemHasBadge }]"
                >{{ item.name }}</span>
              </div>
            </KTooltip>
            <div
              v-if="(item as SidebarPrimaryItem).label && (item as SidebarPrimaryItem).expanded"
              class="sidebar-item-label truncate-text truncate-18"
            >
              {{ (item as SidebarPrimaryItem).label }}
            </div>
          </div>
          <div
            v-if="itemHasBadge"
            class="sidebar-item-after"
          >
            <slot :name="`sidebar-after-${(item as SidebarPrimaryItem).key}`">
              <ItemBadge :count="(item as SidebarSecondaryItem).badgeCount" />
            </slot>
          </div>
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
import type { PropType } from 'vue'
import { computed, useSlots } from 'vue'
import type { SidebarPrimaryItem, SidebarSecondaryItem } from '../../types'
import ItemBadge from './ItemBadge.vue'

const emit = defineEmits(['click'])

const props = defineProps({
  item: {
    type: Object as PropType<SidebarPrimaryItem | SidebarSecondaryItem>,
    required: true,
  },
  /** True if the item is not an L1 primary sidebar item */
  subnavItem: {
    type: Boolean,
    default: false,
  },
})

const slots = useSlots()

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

const itemHasBadge = computed((): boolean => props.subnavItem &&
  // item has non-zero badgeCount OR
  ((props.item as SidebarSecondaryItem).badgeCount !== undefined && (props.item as SidebarSecondaryItem).badgeCount !== 0) ||
  // slot content for the badge
  !!slots[`sidebar-after-${(props.item as SidebarPrimaryItem).key}`],
)

const itemClick = (item: SidebarPrimaryItem | SidebarSecondaryItem): void => {
  emit('click', item)
}

const navigate = (event: Event, item: SidebarPrimaryItem | SidebarSecondaryItem, routerNavigate?: () => void): void => {
  itemClick(item)
  if (typeof routerNavigate === 'function') {
    event.preventDefault()
    routerNavigate()
  }
}
</script>

<style lang="scss">
@use "../../styles/variables" as *;

// Scope with wrapper class intead of using `scoped` so these styles will apply to child components
.kong-ui-app-sidebar {
  // Shared styles for the primary and secondary elements
  .sidebar-item-primary,
  .sidebar-item-secondary {
    cursor: pointer;
    display: flex;
    flex-direction: column;
    position: relative;
    white-space: nowrap;

    &:last-of-type {
      margin-bottom: $kui-space-0;
    }

    a.sidebar-item-link {
      align-items: center;
      color: $kui-navigation-color-text;
      cursor: pointer;
      display: flex;
      font-size: $sidebar-item-font-size;
      font-weight: $kui-font-weight-medium;
      justify-content: space-between;
      line-height: $kui-line-height-30;
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

      &:hover,
      &:focus-visible {
        // !important to also handle the L2 items
        color: $kui-navigation-color-text-hover !important;

        svg {
          color: $kui-navigation-color-text-hover;
        }
      }

      &:focus-visible {
        box-shadow: $kui-navigation-shadow-focus;
        outline: none;
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
      color: $kui-navigation-color-text-selected;

      &.sidebar-item-link,
      &.sidebar-item-link:hover {
        color: $kui-navigation-color-text-selected !important;

        svg {
          color: $kui-navigation-color-text-selected;
        }
      }

      .sidebar-item-name {
        font-weight: $kui-font-weight-medium !important;
      }
    }

    ul.level-secondary {
      padding: $kui-space-0;
      position: relative;

      // Add a top border to the ul element, offset from the left and right to prevent overlap
      &:before {
        /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
        background-color: $kui-navigation-color-border;
        content: '';
        height: 1px;
        left: 1px;
        position: absolute;
        right: 1px;
        top: 0;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
@use "../../styles/variables" as *;

// Primary-level nav item
.sidebar-item-primary {
  overflow: hidden; // ensure box-shadow doesn't extend beyond container

  &.active,
  &.expanded {
    background-color: $kui-navigation-color-background-selected;
    border-radius: $sidebar-item-border-radius;
    box-shadow: $kui-navigation-shadow-border;
  }

  > a,
  > div > a {
    border-radius: $sidebar-item-border-radius;

    > .sidebar-item-display {
      &.has-label {
        padding-bottom: $kui-space-50;
        padding-top: $kui-space-50;
      }

      &.has-badge {
        justify-content: space-between; // for badges

        .has-badge-max-width {
          max-width: 134px !important;
        }
      }
    }
  }
}

// Secondary-level nav item
.sidebar-item-secondary {
  margin-bottom: $kui-space-20;

  &:last-of-type {
    margin-bottom: $kui-space-0;

    a {
      border-bottom-right-radius: $sidebar-item-border-radius;
    }
  }

  a {
    background-color: $kui-color-background-transparent;
    color: $kui-navigation-color-text !important;
    font-size: $sidebar-item-font-size;
    line-height: $kui-line-height-30;
    // Override the min-height for the secondary items
    min-height: 40px !important;
    transition: all .1s ease-in-out !important;

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
    box-shadow: $kui-navigation-shadow-border-child;
    color: $kui-navigation-color-text-selected !important;
    font-weight: $kui-font-weight-medium !important;

    &:focus-visible {
      box-shadow: $kui-navigation-shadow-border-child, $kui-navigation-shadow-focus;
    }
  }
}

.sidebar-item-display {
  align-items: center;
  display: flex;
  gap: $kui-space-40;
  height: 100%;
  padding: $kui-space-0 $kui-space-60;
  width: 100%;

  .sidebar-item-name-container {
    line-height: $kui-line-height-20;
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

        &-18 {
          max-width: 18ch;
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
    color: $kui-navigation-color-text;
    font-size: $kui-font-size-20;
    margin-top: $kui-space-20;
  }

  .sidebar-item-icon {
    align-items: center;
    display: flex;
    line-height: 0; // to align icon with the text baseline
  }

  .sidebar-item-after {
    display: flex;
    margin-left: auto;
  }
}
</style>
