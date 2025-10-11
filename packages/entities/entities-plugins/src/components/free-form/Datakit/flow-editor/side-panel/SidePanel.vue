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
        <template v-if="enableDatakitM2">
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
        </template>
        <NodePanel v-else />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, inject } from 'vue'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../../../locales/en.json'
import { usePreferences, useEditorStore } from '../../composables'
import NodePanel from './NodePanel.vue'
import ResourcesPanel from './ResourcesPanel.vue'
import { FEATURE_FLAGS } from '../../../../../constants'

const { t } = createI18n<typeof english>('en-us', english)

const { sidePanelExpanded } = usePreferences()
const { propertiesPanelOpen, selectedNode } = useEditorStore()
const enableDatakitM2 = inject<boolean>(FEATURE_FLAGS.DATAKIT_M2, false)

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

  .panel {
    padding: $kui-space-60 $kui-space-40;
  }
}
</style>
