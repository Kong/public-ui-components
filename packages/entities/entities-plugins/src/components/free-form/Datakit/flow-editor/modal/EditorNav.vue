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
          icon
          :to="to"
          @click="onClick"
        >
          <component
            :is="icon"
            decorative
            :size="KUI_ICON_SIZE_40"
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
            icon
            size="large"
            @click="handlePanelToggle"
          >
            <ChevronDoubleLeftIcon
              v-if="sidePanelExpanded"
              decorative
              :size="KUI_ICON_SIZE_40"
            />
            <ChevronDoubleRightIcon
              v-else
              decorative
              :size="KUI_ICON_SIZE_40"
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
import english from '../../../../../locales/en.json'
import { usePreferences } from '../../composables'

import type { EditorModalNavItem } from '../../types'
import { computed, ref } from 'vue'

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
/* stylelint-disable @kong/design-tokens/token-var-usage */
.dk-editor-nav {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: $kui-space-50;
  justify-content: space-between;
  padding: 0 $kui-space-40 $kui-space-40;

  .top,
  .bottom {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: $kui-space-50;
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
    align-items: center;
    background-color: $kui-navigation-color-background;
    border: $kui-border-width-10 solid $kui-color-border-transparent;
    border-radius: $kui-border-radius-30;
    color: $kui-navigation-color-text;
    cursor: pointer;
    display: flex;
    height: 36px;
    justify-content: center;
    text-decoration: none;
    transition: color $kui-animation-duration-20 ease-in-out;
    white-space: nowrap;
    width: 36px;

    &:hover,
    &:focus-visible {
      color: $kui-navigation-color-text-hover;

      :deep(svg) {
        color: $kui-navigation-color-text-hover;
      }
    }

    &:focus-visible {
      box-shadow: $kui-navigation-shadow-focus;
      outline: none;
    }

    :deep(svg) {
      path {
        color: currentColor;
        fill: currentColor;
        transition: all $kui-animation-duration-20 ease-in-out;
      }
    }

    &-toggle {
      border-color: $kui-navigation-color-border;
    }
  }

  .side-panel-toggle {
    left: 0;
    position: absolute;
    transition: left $kui-animation-duration-20 ease-in-out;
    z-index: 1;

    &.expanded {
      /* stylelint-disable-next-line custom-property-pattern */
      left: calc(var(--dk-side-panel-width) - 8px); // Leave space for the scrollbar
    }
  }
}
</style>
