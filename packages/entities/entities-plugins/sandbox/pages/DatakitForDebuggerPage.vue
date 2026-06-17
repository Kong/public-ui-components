<template>
  <div class="datakit-debugger-sandbox">
    <h2>Datakit Debugger (Read-Only Canvas)</h2>

    <div class="sandbox-controls">
      <div class="controls-row">
        <KSelect
          v-model="selectedFixtureId"
          :items="fixtureSelectItems"
          label="Fixture (JSON)"
          width="320"
        />

        <KSelect
          v-model="selectedExampleId"
          :disabled="!!selectedFixtureId"
          :items="exampleSelectItems"
          label="Example (YAML)"
          width="320"
        />
      </div>

      <div class="controls-row">
        <KSegmentedControl
          v-model="phase"
          :options="phaseOptions"
          style="min-width: 240px"
        />
      </div>
    </div>

    <div class="canvas-container">
      <FlowCanvas
        :key="`${selectedFixtureId || selectedExampleId}-${phase}`"
        :flow-id="flowId"
        mode="inspect"
        :phase="phase"
        @node-click="onNodeClick"
      >
        <template #node-actions>
          <span class="node-actions">&#x2713; ok</span>
        </template>
        <template #node-latency>
          <span class="node-latency">12 ms</span>
        </template>
      </FlowCanvas>
    </div>

    <div
      v-if="clickedNode"
      class="node-detail"
    >
      <div class="node-detail-header">
        <NodeBadge
          icon-only
          :type="clickedNode.type"
        />
        <h3>{{ clickedNode.name }}</h3>
      </div>
      <KCodeBlock
        :code="JSON.stringify(clickedNode, null, 2)"
        language="json"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import yaml, { JSON_SCHEMA } from 'js-yaml'
import { KCodeBlock, KSegmentedControl, KSelect } from '@kong/kongponents'
import NodeBadge from '../../src/components/free-form/plugins/datakit/flow-editor/node/NodeBadge.vue'
import { FlowCanvas, provideEditorStore, useEditorStore } from '../../src'
import examples from '../../src/components/free-form/plugins/datakit/examples'
import type { DatakitPluginData, NodeInstance, NodePhase } from '../../src/components/free-form/plugins/datakit/types'

// --- Fixtures (individually imported JSON files from sandbox/fixtures/) ---
import datakitConfig1 from '../fixtures/datakit-config-1.json'
import datakitConfigWithResponse from '../fixtures/datakit-confog-with-response.json'

const fixtures: Array<{ id: string, data: DatakitPluginData }> = [
  { id: 'datakit-config-1', data: datakitConfig1 as unknown as DatakitPluginData },
  { id: 'datakit-config-with-response', data: datakitConfigWithResponse as unknown as DatakitPluginData },
]

const fixtureSelectItems = [
  { label: 'None', value: '' },
  ...fixtures.map(f => ({ label: f.id, value: f.id })),
]

// --- Examples (YAML) ---
const exampleSelectItems = examples.map(e => ({ label: e.id, value: e.id }))

const phaseOptions = [
  { label: 'Request', value: 'request' },
  { label: 'Response', value: 'response' },
]

const phase = ref<NodePhase>('request')
const selectedFixtureId = ref('datakit-config-with-response')
const selectedExampleId = ref(examples[0]?.id ?? '')
const clickedNode = ref<NodeInstance | null>(null)

const selectedFixture = computed(() => fixtures.find(f => f.id === selectedFixtureId.value))
const selectedExample = computed(() => examples.find(e => e.id === selectedExampleId.value) ?? examples[0])

const pluginData = computed(() => {
  if (selectedFixture.value) {
    // Fixture is the full plugin data object (has config + __ui_data)
    return selectedFixture.value.data
  }
  const config = yaml.load(selectedExample.value.code, { schema: JSON_SCHEMA }) as Record<string, unknown>
  return { config } as unknown as DatakitPluginData
})

provideEditorStore(pluginData.value)

const { load } = useEditorStore()

const flowId = useId()

watch(pluginData, (data) => {
  clickedNode.value = null
  load(data)
})

function onNodeClick(node: NodeInstance) {
  clickedNode.value = node
}
</script>

<style lang="scss" scoped>
.datakit-debugger-sandbox {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;

  * {
    box-sizing: border-box;
  }

  .sandbox-controls {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .controls-row {
      align-items: center;
      display: flex;
      flex-direction: row;
      gap: 16px;
      width: fit-content;

      :deep(.k-input-switch label) {
        white-space: nowrap;
      }
    }
  }

  .canvas-container {
    border: solid var(--kui-border-width-10, 1px) var(--kui-color-border, #e0e4ea);
    border-radius: var(--kui-border-radius-20, 4px);
    height: 560px;
    overflow: hidden;
    width: 100%;
  }

  .node-detail-header {
    align-items: center;
    display: flex;
    gap: 8px;

    h3 {
      margin: 0;
    }
  }

  .node-actions {
    color: var(--kui-color-text-success, #08742b);
    font-size: var(--kui-font-size-20, 11px);
  }

  .node-latency {
    color: var(--kui-color-text-neutral, #6c7489);
    font-size: var(--kui-font-size-20, 11px);
  }
}
</style>
