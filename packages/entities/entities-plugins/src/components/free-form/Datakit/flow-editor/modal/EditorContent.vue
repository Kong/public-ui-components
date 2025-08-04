<template>
  <div class="dk-editor-content">
    <aside
      class="side-panel"
      :class="{ expanded: sidePanelExpanded }"
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
      <EditorMain
        @click:backdrop="closeProperties"
        @click:node="selectNodeAndOpenProperties"
      />
    </div>

    <NodePropertiesPanel
      :visible="propertiesPanelVisible"
      @close="closeProperties"
    />
  </div>
</template>

<script setup lang="ts">
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../../../locales/en.json'
import { useEditorStore, usePreferences } from '../../composables'
import EditorMain from './EditorMain.vue'
import NodePanel from '../node/NodePanel.vue'
import NodePropertiesPanel from '../node/NodePropertiesPanel.vue'
import { ref, watch } from 'vue'
import type { NodeInstance } from '../../types'
import { useDebounce } from '@kong-ui-public/core'

const { t } = createI18n<typeof english>('en-us', english)

const { sidePanelExpanded } = usePreferences()
const { selectNode, selectedNode } = useEditorStore()!
const { debounce } = useDebounce()

const propertiesPanelVisible = ref(false)

const setVisibility = debounce((visible: boolean) => {
  propertiesPanelVisible.value = visible
}, 0)

const selectNodeAndOpenProperties = (node: NodeInstance) => {
  selectNode(node.id)
  setVisibility(true)
}

const closeProperties = () => {
  setVisibility(false)
}

watch(selectedNode, node => {
  if (!node) {
    setVisibility(false)
  }
})

</script>

<style lang="scss" scoped>
.dk-editor-content {
  background-color: $kui-color-background-neutral-weakest;
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
    transition: margin-left 0.2s ease-in-out;
    /* stylelint-disable-next-line custom-property-pattern */
    width: var(--dk-side-panel-width);

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
