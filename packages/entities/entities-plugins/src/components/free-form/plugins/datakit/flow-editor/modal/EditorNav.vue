<template>
  <nav class="dk-editor-nav">
    <div class="top">
      <KTooltip
        v-for="({ label, to, icon, onClick }) in navItems"
        :key="label"
        :kpop-attributes="{ offset: '10px' }"
        :label="label"
        placement="right"
      >
        <KButton
          :key="label"
          appearance="none"
          class="nav-item"
          :class="{ 'datakit-new-look': datakitNewLook }"
          icon
          :to="to"
          @click="onClick"
        >
          <component
            :is="icon"
            decorative
            :size="`var(--kui-icon-size-40, ${KUI_ICON_SIZE_40})`"
          />
        </KButton>
      </KTooltip>
    </div>
    <div class="bottom">
      <div
        class="side-panel-toggle"
        :class="{ expanded: sidePanelExpanded }"
        @transitionend.self="sidePanelToggling = false"
        @transitionstart.self="sidePanelToggling = true"
      >
        <KTooltip
          :label="sidePanelToggling ? undefined : toggleLabel"
          :placement="sidePanelExpanded ? 'left' : 'right'"
        >
          <KButton
            appearance="none"
            class="nav-item nav-item-toggle"
            :class="{ 'datakit-new-look': datakitNewLook }"
            icon
            size="large"
            @click="handlePanelToggle"
          >
            <ChevronDoubleLeftIcon
              v-if="sidePanelExpanded"
              decorative
              :size="`var(--kui-icon-size-40, ${KUI_ICON_SIZE_40})`"
            />
            <ChevronDoubleRightIcon
              v-else
              decorative
              :size="`var(--kui-icon-size-40, ${KUI_ICON_SIZE_40})`"
            />
          </KButton>
        </KTooltip>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { KButton, KTooltip } from '@kong/kongponents'
import { ArrowLeftIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@kong/icons'
import { KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../../../../locales/en.json'
import { usePreferences } from '../../composables'
import { DATAKIT_NEW_LOOK } from '../constants'

import type { EditorModalNavItem } from '../../types'
import { computed, inject, ref } from 'vue'

const datakitNewLook = inject<boolean>(DATAKIT_NEW_LOOK)

const { t } = createI18n<typeof english>('en-us', english)

const emit = defineEmits<{
  back: []
}>()

const navItems: EditorModalNavItem[] = [
  {
    label: t('plugins.free-form.datakit.flow_editor.return_to_config'),
    icon: ArrowLeftIcon,
    onClick: () => emit('back'),
  },
]

const { sidePanelExpanded } = usePreferences()

const toggleLabel = computed(() => {
  return sidePanelExpanded.value
    ? t('plugins.free-form.datakit.flow_editor.collapse_panel')
    : t('plugins.free-form.datakit.flow_editor.expand_panel')
})

const sidePanelToggling = ref(false)

function handlePanelToggle() {
  sidePanelExpanded.value = !sidePanelExpanded.value
}
</script>

<style lang="scss" scoped>
.dk-editor-nav {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-50, $kui-space-50);
  justify-content: space-between;
  padding: 0 var(--kui-space-40, $kui-space-40) var(--kui-space-40, $kui-space-40);

  .top,
  .bottom {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: var(--kui-space-50, $kui-space-50);
    position: relative;
    width: 100%;
  }

  .top {
    align-items: center;
    justify-content: flex-start;
  }

  .bottom {
    align-items: center;
    justify-content: flex-end;
  }

  &:deep(.k-popover) {
    .popover {
      pointer-events: none;
    }
  }

  .nav-item {
    &:not(.datakit-new-look) {
      align-items: center;
      background-color: var(--kui-navigation-color-background, $kui-navigation-color-background);
      border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border-transparent, $kui-color-border-transparent);
      border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
      color: var(--kui-navigation-color-text, $kui-navigation-color-text);
      cursor: pointer;
      display: flex;
      height: 36px;
      justify-content: center;
      text-decoration: none;
      transition: color var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;
      white-space: nowrap;
      width: 36px;

      &:hover,
      &:focus-visible {
        color: var(--kui-navigation-color-text-hover, $kui-navigation-color-text-hover);

        :deep(svg) {
          color: var(--kui-navigation-color-text-hover, $kui-navigation-color-text-hover);
        }
      }

      &:focus-visible {
        box-shadow: var(--kui-navigation-shadow-focus, $kui-navigation-shadow-focus);
        outline: none;
      }

      :deep(svg) {
        path {
          color: currentColor;
          fill: currentColor;
          transition: all var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;
        }
      }

    }

    &-toggle:not(.datakit-new-look) {
      border-color: var(--kui-navigation-color-border, $kui-navigation-color-border);
    }

    &.datakit-new-look {
      align-items: center;
      background-color: var(--kui-color-background, $kui-color-background);
      border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border-transparent, $kui-color-border-transparent);
      border-radius: var(--kui-border-radius-30, $kui-border-radius-30) !important;
      color: var(--kui-color-text-neutral, $kui-color-text-neutral);
      cursor: pointer;
      display: flex;
      justify-content: center;
      text-decoration: none;
      transition: background-color var(--kui-animation-duration-20, $kui-animation-duration-20) ease, color var(--kui-animation-duration-20, $kui-animation-duration-20) ease;
      white-space: nowrap;

      &:hover,
      &:focus-visible {
        background-color: var(--kui-color-background-primary-weaker, $kui-color-background-primary-weaker);
        color: var(--kui-color-text-neutral-strongest, $kui-color-text-neutral-strongest);
      }
    }
  }

  .side-panel-toggle {
    left: 0;
    position: absolute;
    transition: left var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;
    z-index: 1;

    &.expanded {
      /* stylelint-disable-next-line custom-property-pattern */
      left: calc(var(--dk-side-panel-width) - 8px); // Leave space for the scrollbar
    }
  }
}
</style>
