<template>
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
      <div class="panel">
        <KSegmentedControl
          v-model="selectedOption"
          :options="[{
            label: t('plugins.free-form.datakit.flow_editor.panel_segments.nodes'),
            value: 'nodes',
          }, {
            label: t('plugins.free-form.datakit.flow_editor.panel_segments.resources.title'),
            value: 'resources',
          }]"
        />

        <NodePanel
          v-if="selectedOption === 'nodes'"
          hide-title
        />

        <ResourcesPanel v-if="selectedOption === 'resources'" />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../../../locales/en.json'
import { usePreferences, useEditorStore } from '../../composables'
import NodePanel from './NodePanel.vue'
import ResourcesPanel from './ResourcesPanel.vue'

const { t } = createI18n<typeof english>('en-us', english)

const { sidePanelExpanded } = usePreferences()
const { propertiesPanelOpen, selectedNode } = useEditorStore()

const selectedOption = ref<'nodes' | 'resources'>('nodes')

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
.side-panel {
  border-right: 1px solid var(--kui-color-border, $kui-color-border);
  display: flex;
  flex-direction: column;
  /* stylelint-disable-next-line custom-property-pattern */
  margin-left: calc(var(--dk-side-panel-width) * -1);
  /* stylelint-disable-next-line custom-property-pattern */
  width: var(--dk-side-panel-width);

  &.inited {
    transition: margin-left var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;
  }

  &.expanded {
    margin-left: 0;
  }

  .header {
    align-items: center;
    border-bottom: 1px solid var(--kui-color-border, $kui-color-border);
    display: flex;
    flex: 0 0 auto;
    /* stylelint-disable-next-line custom-property-pattern */
    height: var(--dk-header-height);
    padding: 0 var(--kui-space-40, $kui-space-40);
  }

  .title {
    color: var(--kui-color-text, $kui-color-text);
    font-size: var(--kui-font-size-40, $kui-font-size-40);
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
    /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
    left: var(--kui-space-40, $kui-space-40);
    margin: 0;
    position: absolute;
  }

  .body {
    overflow: auto;
    padding-bottom: calc(36px + calc(var(--kui-space-40, $kui-space-40) * 2)); // Leave space for the toggle button in case it covers the content
  }

  .panel {
    padding: var(--kui-space-60, $kui-space-60) var(--kui-space-40, $kui-space-40);
  }
}
</style>
