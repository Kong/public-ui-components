<template>
  <div class="dk-node-panel">
    <h3 class="title">
      <KLabel
        class="label"
        :info="t('plugins.free-form.datakit.flow_editor.node_panel.description')"
      >
        {{ t('plugins.free-form.datakit.flow_editor.node_panel.title') }}
      </KLabel>
    </h3>
    <div class="node-list">
      <NodePanelItem
        v-for="nodeType in (Object.keys(CONFIG_NODE_META_MAP) as Array<ConfigNodeType>)"
        :key="nodeType"
        :type="nodeType"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../../../locales/en.json'
import { CONFIG_NODE_META_MAP } from './node'
import NodePanelItem from './NodePanelItem.vue'

import type { ConfigNodeType } from '../../types'

const { t } = createI18n<typeof english>('en-us', english)
</script>

<style lang="scss" scoped>
.dk-node-panel {
  padding: $kui-space-60 $kui-space-30;

  .title {
    color: $kui-color-text;
    display: flex;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-bold;
    gap: $kui-space-40;
    line-height: $kui-line-height-30;
    margin: 0;
  }

  .label {
    margin: 0;
  }

  .node-list {
    display: flex;
    flex-direction: column;
    gap: $kui-space-40;
    margin-top: $kui-space-40;
  }
}
</style>
