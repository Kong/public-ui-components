<template>
  <div class="dk-editor-content">
    <aside
      class="side-panel"
      :class="{ expanded: sidePanelExpanded, inited }"
    >
      <header class="header">
        <h2 class="title">
          {{ t('plugins.free-form.datakit.flow_editor.name') }}
        </h2>
      </header>
      <div class="body">
        <div class="node-selection-panel">
          <NodePanel />
        </div>
      </div>
    </aside>
    <div class="main">
      <EditorMain />
    </div>

    <NodePropertiesPanel
      :node-id="selectedNode?.id"
      :visible="propertiesPanelOpen"
      @close="handleClose"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../../../locales/en.json'
import { usePreferences, useEditorStore } from '../../composables'
import EditorMain from './EditorMain.vue'
import NodePanel from '../node/NodePanel.vue'
import NodePropertiesPanel from '../node/NodePropertiesPanel.vue'

const { t } = createI18n<typeof english>('en-us', english)

const { sidePanelExpanded } = usePreferences()
const { propertiesPanelOpen, selectedNode } = useEditorStore()

function handleClose() {
  propertiesPanelOpen.value = false
}

watch(selectedNode, (node) => {
  if (!node) {
    handleClose()
  }
})

// A workaround to prevent startup transition when the side panel
// is collapsed per user preference.
const inited = ref(false)
onMounted(() => {
  inited.value = true
})
</script>

<style lang="scss" scoped>
.dk-editor-content {
  background-color: $kui-color-background;
  border-top-left-radius: $kui-border-radius-30;
  display: flex;
  overflow: hidden;
  position: relative;

  .side-panel {
    border-right: 1px solid $kui-color-border;
    display: flex;
    flex-direction: column;
    /* stylelint-disable-next-line custom-property-pattern */
    margin-left: calc(var(--dk-side-panel-width) * -1);
    /* stylelint-disable-next-line custom-property-pattern */
    width: var(--dk-side-panel-width);

    &.inited {
      transition: margin-left $kui-animation-duration-20 ease-in-out;
    }

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
    }
  }

  .main {
    flex: 1 1 auto;
  }
}
</style>
