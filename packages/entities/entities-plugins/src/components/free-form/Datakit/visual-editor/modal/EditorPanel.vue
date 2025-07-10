<template>
  <div class="dk-editor-panel">
    <aside
      class="sidebar"
      :class="{ expanded: sidebarExpanded }"
    >
      <header class="header">
        <h2 class="title">
          {{ t('plugins.free-form.datakit.visual_editor.name') }}
        </h2>
      </header>
      <div class="body">
        <div class="node-selection-panel">
          TBD: Node selection panel
        </div>
      </div>
    </aside>
    <div class="main">
      <EditorMain />
    </div>
  </div>
</template>

<script setup lang="ts">
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../../../locales/en.json'
import { usePreferences } from '../composables'
import EditorMain from './EditorMain.vue'

const { t } = createI18n<typeof english>('en-us', english)

const { sidebarExpanded } = usePreferences()
</script>

<style lang="scss" scoped>
.dk-editor-panel {
  background-color: $kui-color-background-neutral-weakest;
  border-top-left-radius: $kui-border-radius-30;
  display: flex;
  overflow: hidden;
  position: relative;

  .sidebar {
    border-right: 1px solid $kui-color-border;
    display: flex;
    flex-direction: column;
    /* stylelint-disable-next-line custom-property-pattern */
    margin-left: calc(var(--dk-sidebar-width) * -1);
    transition: margin-left 0.2s ease-in-out;
    /* stylelint-disable-next-line custom-property-pattern */
    width: var(--dk-sidebar-width);

    &.expanded {
      margin-left: 0;
    }

    .header {
      align-items: center;
      border-bottom: 1px solid $kui-color-border;
      display: flex;
      flex: 0 0 auto;
      /* stylelint-disable-next-line custom-property-pattern */
      height: var(--dk-header-height);
      padding: 0 $kui-space-40;
    }

    .title {
      color: $kui-color-text;
      font-size: $kui-font-size-40;
      font-weight: $kui-font-weight-bold;
      /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
      left: $kui-space-40;
      margin: 0;
      position: absolute;
    }

    .body {
      overflow: auto;
      padding-bottom: 36px + $kui-space-40 * 2; // Leave space for the toggle button in case it covers the content
      scrollbar-width: thin;
    }
  }

  .main {
    flex: 1 1 auto;
  }
}
</style>
