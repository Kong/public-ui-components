<template>
  <div
    class="kong-ui-public-page-layout"
    :class="{ 'new-appearance': newAppearance }"
    data-testid="kong-ui-public-page-layout"
  >
    <div
      v-if="!hasNestedPageLayout"
      ref="page-layout-header"
      class="page-layout-header"
      data-testid="page-layout-header"
    >
      <div class="page-header-container">
        <div class="page-header-start">
          <KBreadcrumbs
            v-if="breadcrumbs && breadcrumbs.length"
            class="header-breadcrumbs"
            data-testid="page-layout-breadcrumbs"
            item-max-width="25ch"
            :items="breadcrumbs"
          >
            <template
              v-if="newAppearance"
              #divider
            >
              <ChevronRightIcon
                decorative
                :size="`var(--kui-icon-size-30, ${KUI_ICON_SIZE_30})`"
              />
            </template>
          </KBreadcrumbs>
          <div class="title-container">
            <component
              :is="isBackToString ? 'a' : 'router-link'"
              v-if="backTo && !newAppearance"
              v-bind="isBackToString ? { href: backTo } : { to: backTo }"
              :aria-label="t('back_button')"
              class="navigate-back"
              data-testid="page-layout-navigate-back"
              tabindex="0"
              @click.prevent="navigateBack"
              @keydown.enter.prevent="navigateBack"
            >
              <ArrowTopLeftIcon
                decorative
                :size="`var(--kui-icon-size-30, ${KUI_ICON_SIZE_30})`"
              />
            </component>
            <span
              v-if="title || $slots.title"
              class="page-layout-title-wrapper"
            >
              <slot name="title">
                <h1
                  class="page-layout-title"
                  data-testid="page-layout-title"
                >
                  {{ title }}
                </h1>
              </slot>
            </span>
            <div
              v-if="showFavoriteButton"
              :key="favoriteButtonKey"
              class="favorite-button-container"
            >
              <KTooltip
                placement="right"
                :text="isFavorite ? t('favorite_button.remove_shortcut') : t('favorite_button.save_shortcut')"
              >
                <button
                  :aria-label="isFavorite ? t('favorite_button.remove_shortcut') : t('favorite_button.save_shortcut')"
                  class="favorite-button"
                  :class="{ 'active': isFavorite }"
                  data-testid="page-layout-favorite-button"
                  type="button"
                  @click="onFavoriteButtonClick"
                >
                  <component
                    :is="isFavorite ? StarFillIcon : StarIcon"
                    decorative
                    :size="`var(--kui-icon-size-30, ${KUI_ICON_SIZE_30})`"
                  />
                </button>
              </KTooltip>
            </div>
            <div
              v-if="$slots['title-after']"
              class="title-after-container"
            >
              <slot name="title-after" />
            </div>
          </div>
        </div>

        <PageLayoutAnchorNavigation
          v-if="hasAnchorNavigation"
          :anchors="anchors"
        />

        <div class="page-header-actions-container">
          <slot name="actions" />
          <div data-teleport-target="ask-kai" />
        </div>
      </div>
      <PageLayoutTabs
        v-if="hasTabs"
        :tabs="tabs"
      >
        <template
          v-for="tab in tabs"
          #[`tab-${tab.key}`]="slotProps"
        >
          <slot
            :name="`tab-${tab.key}`"
            v-bind="slotProps"
          />
        </template>
      </PageLayoutTabs>
    </div>

    <div
      class="page-layout-content-container"
      :class="{ 'has-nested-page-layout': hasNestedPageLayout }"
    >
      <div
        v-if="newAppearance && $slots.aside"
        class="page-layout-aside-container"
        data-testid="page-layout-aside"
      >
        <slot name="aside" />
      </div>

      <div class="page-layout-content">
        <router-view v-if="hasTabs" />
        <slot
          v-else
          name="default"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, provide, inject, onUnmounted, toValue, useTemplateRef, watch } from 'vue'
import type { DeepReadonly, MaybeRefOrGetter, Reactive } from 'vue'
import type { PageLayoutProps, PageLayoutSlots, PageShortcutData } from '../types'
import PageLayoutTabs from './PageLayoutTabs.vue'
import PageLayoutAnchorNavigation from './PageLayoutAnchorNavigation.vue'
import { NEW_APPEARANCE_INJECTION_KEY, nestedPageLayoutInjectionKey } from '../symbols'
import { ArrowTopLeftIcon, StarIcon, StarFillIcon, ChevronRightIcon } from '@kong/icons'
import { KUI_ICON_SIZE_30, KUI_SPACE_60 } from '@kong/design-tokens'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn, useElementSize } from '@vueuse/core'
import composables from '../composables'

const {
  breadcrumbs = [],
  title,
  backTo,
  tabs = [],
  anchors = [],
  pageShortcutData,
} = defineProps<PageLayoutProps>()

defineSlots<PageLayoutSlots>()

const navigateTo = inject<((to: string) => Promise<void>) | null>('app:navigateTo', null)
// The host application opts whole sections of its UI into the new appearance, so this is
// injected rather than set per page.
const newAppearanceInjection = inject<MaybeRefOrGetter<boolean> | null>(NEW_APPEARANCE_INJECTION_KEY, null)
const pageShortcutsContext = inject<DeepReadonly<Reactive<unknown>> | null>('app:pageShortcutsContext', null)

const { i18n: { t } } = composables.useI18n()

const router = useRouter()
const route = useRoute()

const hasTabs = computed((): boolean => !!(tabs && tabs.length))

const isBackToString = computed((): boolean => typeof backTo === 'string')

// `toValue` lets the host provide a plain boolean, a ref or a getter
const newAppearance = computed((): boolean => toValue(newAppearanceInjection) === true)

// The header carries either tabs or an anchor navigation bar, never both: tabs own the row they
// render, and a page that declares both is treated as a tabbed page. The bar is part of the new
// appearance's single-row header, so it is not rendered in the default appearance at all.
const hasAnchorNavigation = computed((): boolean => newAppearance.value && !hasTabs.value && !!(anchors && anchors.length))

// The sticky aside must clear the sticky header, whose height changes with the tab row.
// The extra space keeps the gap the content container's padding gives it at rest.
const headerRef = useTemplateRef<HTMLElement>('page-layout-header')
const { height: headerHeight } = useElementSize(headerRef, undefined, { box: 'border-box' })
const asideStickyTop = computed((): string => `calc(${headerHeight.value}px + var(--kui-space-60, ${KUI_SPACE_60}))`)

const isEntityPage = computed((): boolean => !!pageShortcutData && !!pageShortcutData.entityType && !!pageShortcutData.label)
const showFavoriteButton = computed((): boolean => isEntityPage.value && !!pageShortcutsContext && 'onFavoriteToggle' in pageShortcutsContext && typeof pageShortcutsContext.onFavoriteToggle === 'function')
const favoriteButtonKey = ref<number>(0)
const isFavorite = computed((): boolean =>
  !!pageShortcutsContext &&
  (('isFavorite' in pageShortcutsContext &&
  typeof pageShortcutsContext.isFavorite === 'function' &&
  pageShortcutsContext.isFavorite(pageShortcutData) === true)))

/** Handle navigation back via the backTo prop */
const navigateBack = async () => {
  if (!backTo) {
    return
  }

  // If backTo is a RouteLocationRaw
  if (typeof backTo === 'object') {
    router.push(backTo)
    return
  }

  // backTo is a string
  // If navigateTo is undefined
  if (typeof navigateTo !== 'function') {
    window.location.href = backTo
    return
  }

  await navigateTo(backTo)
}

/**
 * PageLayout supports nesting: when a child PageLayout is rendered inside a parent,
 * the parent hides its own header/tabs and acts as a transparent wrapper so only
 * the child's header is shown. This is achieved via provide/inject:
 *
 * 1. Every PageLayout provides a registration callback under this key.
 * 2. On mount, each PageLayout tries to inject the callback from its nearest ancestor.
 *    If found, it calls it — telling the parent "I exist, hide your header."
 * 3. The registration callback returns an unregister function. On unmount, the child
 *    calls it so the parent restores its own header (e.g. when navigating back via
 *    router-view and the child PageLayout is destroyed). A ref-counted approach
 *    (nestedCount) is used so the parent only restores its header when all nested
 *    children have unmounted, not just the first one.
 */
const nestedCount = ref<number>(0)
const hasNestedPageLayout = computed((): boolean => nestedCount.value > 0)
provide(nestedPageLayoutInjectionKey, (): (() => void) => {
  nestedCount.value++

  // Unregister function returned on callback to be called on unmount
  return () => {
    nestedCount.value--
  }
})

// If this instance is itself nested inside another PageLayout, notify the parent.
const registerNestedPageLayout = inject<(() => (() => void)) | null>(nestedPageLayoutInjectionKey, null)
const unregisterNestedPageLayout = ref<(() => void) | null>(null)
if (typeof registerNestedPageLayout === 'function') {
  unregisterNestedPageLayout.value = registerNestedPageLayout()
}

const onFavoriteButtonClick = () => {
  // Cast to the expected type -- we already checked for the function in the computed property
  (pageShortcutsContext as { onFavoriteToggle: (pageShortcutData: PageShortcutData) => void }).onFavoriteToggle({ ...pageShortcutData!, path: pageShortcutData?.path || route.fullPath })
}

onUnmounted(() => {
  unregisterNestedPageLayout.value?.()
})

const debouncedEntityPageVisit = useDebounceFn(() => {
  if (!hasNestedPageLayout.value && isEntityPage.value && pageShortcutsContext && 'onEntityPageVisit' in pageShortcutsContext && typeof pageShortcutsContext.onEntityPageVisit === 'function') {
    pageShortcutsContext.onEntityPageVisit({ ...pageShortcutData, path: pageShortcutData?.path || route?.fullPath })
    favoriteButtonKey.value++
  }
}, 500)

/**
 * The reason why it has to be a watcher vs onMounted is because sometimes it takes time for the host app router to update the route and set the path properly.
 * Same applies to label and parentLabel which are often sourced from a store.
 */
watch([() => pageShortcutData, () => route?.fullPath], () => {
  debouncedEntityPageVisit()
}, { immediate: true, deep: true })
</script>

<style lang="scss" scoped>
// Roughly 1.6x the 25ch cap already applied to each breadcrumb item, so a long title
// stays the most prominent item in the row without swallowing it.
$page-layout-title-max-width: 40ch;
// Height of the new appearance's single-row header. Only applied when there are no tabs.
$page-layout-header-height: 44px;

.kong-ui-public-page-layout {
  box-sizing: border-box;
  // Expose the layout's own width as a query container so the content/aside split reacts
  // to the space the layout actually has (the app shell's side nav, drawers, etc. all eat
  // into it) rather than to the viewport width. A nested layout registers its own
  // container, and `@container page-layout` always resolves to the nearest one.
  container-name: page-layout;
  container-type: inline-size;
  font-family: var(--kui-font-family-text, $kui-font-family-text);

  .page-layout-header {
    background-color: var(--kui-color-background, $kui-color-background);
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-40, $kui-space-40);

    .page-header-container {
      align-items: flex-end;
      display: flex;
      gap: var(--kui-space-30, $kui-space-30);
      justify-content: space-between;
      padding: var(--kui-space-60, $kui-space-60) var(--kui-space-60, $kui-space-60) var(--kui-space-0, $kui-space-0) var(--kui-space-60, $kui-space-60);

      .page-header-start {
        // Allow this flex item to shrink below its content size so the title can truncate
        min-width: 0;

        .header-breadcrumbs {
          &:deep(.breadcrumbs-item-container) {
            // Override first breadcrumb padding left
            &:first-child {
              .breadcrumbs-item {
                padding-left: var(--kui-space-0, $kui-space-0);
              }
            }

            // Override active (last) breadcrumb color
            .breadcrumbs-item.active .breadcrumbs-text {
              color: var(--kui-color-text-neutral, $kui-color-text-neutral);
            }
          }
        }

        .title-container {
          align-items: flex-end;
          display: flex;
          gap: var(--kui-space-20, $kui-space-20);

          .navigate-back,
          .favorite-button {
            background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
            border: none;
            border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
            color: var(--kui-color-text-neutral, $kui-color-text-neutral);
            cursor: pointer;
            outline: none;
            padding: var(--kui-space-20, $kui-space-20);
            transition: background-color 0.2s ease-in, color 0.2s ease-in;

            &:hover {
              color: var(--kui-color-text, $kui-color-text);
            }

            &:focus-visible {
              box-shadow: var(--kui-shadow-focus, $kui-shadow-focus);
            }
          }

          .page-layout-title-wrapper {
            // Allow this flex item to shrink so its child title can truncate with an ellipsis
            min-width: 0;
            overflow: hidden;

            > * {
              color: var(--kui-color-text, $kui-color-text);
              font-size: var(--kui-font-size-50, $kui-font-size-50);
              font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
              line-height: var(--kui-line-height-40, $kui-line-height-40);
              margin: var(--kui-space-0, $kui-space-0);
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }

          .favorite-button-container {
            align-self: center;
            display: flex;
            margin-left: var(--kui-space-20, $kui-space-20);

            .favorite-button {
              color: var(--kui-color-text-neutral-weak, $kui-color-text-neutral-weak);
              padding: var(--kui-space-0, $kui-space-0);

              &:hover {
                color: var(--kui-color-text-neutral, $kui-color-text-neutral);
              }

              &.active {
                color: var(--kui-color-text-warning-weak, $kui-color-text-warning-weak);
              }
            }
          }

          .title-after-container {
            align-items: flex-end;
            display: flex;
            gap: var(--kui-space-30, $kui-space-30);
            margin-left: var(--kui-space-20, $kui-space-20);
          }
        }
      }

      .page-header-actions-container {
        align-items: center;
        display: flex;
        gap: var(--kui-space-30, $kui-space-30);
      }
    }

    // When there are no tabs, add a border and padding to the bottom of the breadcrumbs container
    &:not(:has(.page-layout-tabs)) {
      .page-header-container {
        border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
        padding: var(--kui-space-60, $kui-space-60);
      }
    }
  }

  // New appearance: the title moves up into the breadcrumb row, sitting after the caret
  // that KBreadcrumbs renders following the last crumb.
  &.new-appearance {
    // Keep the header (and its tab row) in view while the page content scrolls beneath
    // it. The header already paints its own background, so content does not show through.
    .page-layout-header {
      position: sticky;
      top: 0;
      z-index: 3;
    }

    // Selectors mirror the default appearance's nesting depth so these rules win on
    // specificity rather than relying on source order.
    .page-layout-header .page-header-container {
      align-items: center;
      padding: var(--kui-space-40, $kui-space-40) var(--kui-space-60, $kui-space-60) var(--kui-space-0, $kui-space-0) var(--kui-space-60, $kui-space-60);

      .page-header-start {
        align-items: center;
        display: flex;
        // Mirrors the spacing Kongponents puts between a divider and the crumb that
        // follows it, so the title keeps the row's rhythm. Only applies when there are
        // breadcrumbs to sit next to.
        gap: var(--kui-space-20, $kui-space-20);

        .title-container {
          align-items: center;
          // As a flex item the title container defaults to `min-width: auto`, which
          // refuses to shrink below its content. Without this a long title pushes the
          // header wider than its container and runs under the page actions instead of
          // truncating.
          min-width: 0;

          // The title reads as the last item in the breadcrumb row: same size as the
          // crumbs (whose scale comes from Kongponents), just heavier and darker.
          .page-layout-title-wrapper {
            // The `> *` rule below covers both the default `<h1>` and any element slotted
            // into `#title`, but a slot holding a bare text node has no element to match.
            // Repeating the scale, cap and truncation here keeps raw text in parity, and
            // also makes the `ch` cap resolve against the same font size either way.
            color: var(--kui-color-text, $kui-color-text);
            font-size: var(--kui-font-size-20, $kui-font-size-20);
            font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
            line-height: var(--kui-line-height-20, $kui-line-height-20);
            max-width: $page-layout-title-max-width;
            text-overflow: ellipsis;
            white-space: nowrap;

            > * {
              font-size: var(--kui-font-size-20, $kui-font-size-20);
              line-height: var(--kui-line-height-20, $kui-line-height-20);
              // Cap the title so it cannot crowd out the breadcrumbs on a wide viewport.
              // Below this it truncates to whatever space the row leaves it; the ellipsis
              // itself comes from the default appearance's rules.
              max-width: $page-layout-title-max-width;
            }
          }
        }

        // Keep the breadcrumbs and any title-after content intact; the title is the
        // element that gives up space when the row runs out of room.
        .header-breadcrumbs,
        .title-after-container {
          flex-shrink: 0;
        }
      }
    }

    // Without tabs the header is a single row, fixed to the height of the top bar it
    // mirrors so it stays consistent whatever the row holds. With tabs it has to grow to
    // fit the tab row, so no height is set there.
    // Mirrors the default appearance's own `:not(:has())` rule so this wins on specificity.
    .page-layout-header:not(:has(.page-layout-tabs)) {
      // Set on the container rather than the header: the container is what carries the
      // bottom border and the padding in this case, so sizing the header alone would
      // just let the container overflow it.
      .page-header-container {
        // Border-box so this is the rendered height, bottom border included
        box-sizing: border-box;
        height: $page-layout-header-height;
        padding: var(--kui-space-40, $kui-space-40) var(--kui-space-60, $kui-space-60);
      }
    }

    .page-layout-content-container {
      background-color: var(--kui-color-background, $kui-color-background);
    }
  }

  .page-layout-content-container {
    background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
    display: flex;
    // Aside is first in the DOM so its heading (usually AboutCard's) ranks early in the
    // outline; reversing puts it back after the content visually — below it at this width.
    flex-direction: column-reverse;
    gap: var(--kui-space-50, $kui-space-50);
    padding: var(--kui-space-60, $kui-space-60);

    &.has-nested-page-layout {
      padding: var(--kui-space-0, $kui-space-0);
    }

    @container page-layout (min-width: #{$kui-breakpoint-tablet}) {
      // Same source-order trick, one axis over: the DOM-first aside renders to the right.
      flex-direction: row-reverse;
      gap: var(--kui-space-40, $kui-space-40);
    }

    .page-layout-content {
      display: flex;
      flex-direction: column;
      gap: var(--kui-space-50, $kui-space-50);
      // Flex items default to `min-width: auto`, so wide content (code blocks, tables)
      // would overflow the row — leftward, under the sidebar, since the row is reversed.
      min-width: 0;
      width: 100%;
    }

    .page-layout-aside-container {
      display: flex;
      flex-direction: column;
      gap: var(--kui-space-40, $kui-space-40);

      @container page-layout (min-width: #{$kui-breakpoint-tablet}) {
        // The content's `width: 100%` overflows the row on its own, so without this the
        // aside gives up part of its 400px to absorb the overflow instead of the content
        // Stick the container, not each child: sibling offsets would need their heights.
        // `align-self` stops the row stretching the aside, which leaves it no room to stick.
        align-self: flex-start;
        flex-shrink: 0;
        position: sticky;
        top: v-bind(asideStickyTop);
        width: 400px;
      }
    }
  }

  // The section the anchor navigation bar has just scrolled to draws the eye once: a brand ring
  // swells from its edge and fades. `:deep()` because the section is the host's own slot content,
  // which a scoped selector cannot reach otherwise. The ring replaces any box-shadow of its own
  // for the length of the run.
  :deep([data-anchor-attention]) {
    animation: anchor-attention calc(var(--kui-animation-duration-20, #{$kui-animation-duration-20}) * 5) cubic-bezier(0.2, 0, 0, 1) both;

    // Reduced motion keeps the ring, but holds it still and fades it out rather than swelling it
    @media (prefers-reduced-motion: reduce) {
      animation-name: anchor-attention-still;
    }
  }
}

@keyframes anchor-attention {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--kui-color-brand, #{$kui-color-brand}) 80%, transparent);
  }

  18% {
    box-shadow: 0 0 0 var(--kui-border-width-30, $kui-border-width-30) color-mix(in srgb, var(--kui-color-brand, #{$kui-color-brand}) 70%, transparent);
  }

  55% {
    box-shadow: 0 0 0 calc(var(--kui-border-width-30, #{$kui-border-width-30}) * 2) color-mix(in srgb, var(--kui-color-brand, #{$kui-color-brand}) 28%, transparent);
  }

  100% {
    box-shadow: 0 0 0 calc(var(--kui-border-width-30, #{$kui-border-width-30}) * 3) color-mix(in srgb, var(--kui-color-brand, #{$kui-color-brand}) 0%, transparent);
  }
}

@keyframes anchor-attention-still {
  0%,
  45% {
    box-shadow: 0 0 0 var(--kui-border-width-20, $kui-border-width-20) color-mix(in srgb, var(--kui-color-brand, #{$kui-color-brand}) 70%, transparent);
  }

  100% {
    box-shadow: 0 0 0 var(--kui-border-width-20, $kui-border-width-20) color-mix(in srgb, var(--kui-color-brand, #{$kui-color-brand}) 0%, transparent);
  }
}
</style>
