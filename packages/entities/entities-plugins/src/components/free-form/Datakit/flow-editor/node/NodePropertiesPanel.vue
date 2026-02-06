<template>
  <!-- eslint-disable vue/no-v-html -->
  <KSlideout
    class="dk-node-properties-panel"
    :close-on-blur="false"
    :has-overlay="false"
    :max-width="maxWidth"
    :offset-top="offsetTop"
    :visible="visible"
    :z-index="DK_NODE_PROPERTIES_PANEL_Z_INDEX"
    @close="$emit('close')"
  >
    <template
      v-if="currentNode"
      #title
    >
      <NodeBadge :type="currentNode.type" />
    </template>

    <div
      v-if="currentNode"
      class="dk-node-properties-panel-desc"
      v-html="getNodeTypeDescription(currentNode.type)"
    />

    <div
      v-if="branchMembership"
      class="branch-note"
    >
      <span class="branch-label">
        <ArrowSplitIcon
          :color="KUI_COLOR_TEXT_NEUTRAL"
          :size="KUI_ICON_SIZE_40"
        />
        <span class="branch-text">
          {{ branchMembershipLabel }}
        </span>
      </span>
      <KTooltip
        placement="top"
        :text="t('plugins.free-form.datakit.flow_editor.actions.remove_from_branch')"
      >
        <KButton
          appearance="none"
          :aria-label="t('plugins.free-form.datakit.flow_editor.actions.remove_from_branch')"
          class="remove-branch"
          icon
          size="small"
          @click="removeFromBranch"
        >
          <TrashIcon />
        </KButton>
      </KTooltip>
    </div>

    <Form
      v-if="Form"
      :key="nodeId"
      class="dk-node-properties-panel-form"
      :node-id="nodeId!"
    />
  </KSlideout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { KUI_COLOR_TEXT_NEUTRAL, KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import { KButton, KSlideout, KTooltip } from '@kong/kongponents'
import { ArrowSplitIcon, TrashIcon } from '@kong/icons'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../../../locales/en.json'
import { DK_NODE_PROPERTIES_PANEL_OFFSET_TOP, DK_NODE_PROPERTIES_PANEL_WIDTH, DK_NODE_PROPERTIES_PANEL_Z_INDEX } from '../constants'
import { useEditorStore } from '../../composables'
import NodeFormCall from '../node-forms/NodeFormCall.vue'
import NodeFormServiceRequest from '../node-forms/NodeFormServiceRequest.vue'
import NodeFormResponse from '../node-forms/NodeFormResponse.vue'
import NodeFormJq from '../node-forms/NodeFormJq.vue'
import NodeFormStatic from '../node-forms/NodeFormStatic.vue'
import NodeFormProperty from '../node-forms/NodeFormProperty.vue'
import NodeFormExit from '../node-forms/NodeFormExit.vue'
import NodeFormBranch from '../node-forms/NodeFormBranch.vue'
import NodeFormCache from '../node-forms/NodeFormCache.vue'
import NodeFormXmlToJson from '../node-forms/NodeFormXmlToJson.vue'
import NodeFormJsonToXml from '../node-forms/NodeFormJsonToXml.vue'
import { getNodeTypeDescription } from './node'
import NodeBadge from './NodeBadge.vue'

import type { NodeId } from '../../types'

const { t } = createI18n<typeof english>('en-us', english)

const { getNodeById, branchGroups } = useEditorStore()
const currentNode = computed(() => nodeId && getNodeById(nodeId))

// Check if the current node belongs to a branch group
const branchMembership = computed(() => {
  if (!nodeId) return undefined
  return branchGroups.findMembership(nodeId)
})

// Generate the label for branch membership: ${nodeName}.${branchName}
const branchMembershipLabel = computed(() => {
  if (!branchMembership.value) return ''
  const ownerNode = getNodeById(branchMembership.value.ownerId)
  if (!ownerNode) return ''
  return `${ownerNode.name}.${branchMembership.value.branch}`
})

function removeFromBranch() {
  if (!nodeId) return
  branchGroups.removeMember(nodeId)
}

const {
  maxWidth = `${DK_NODE_PROPERTIES_PANEL_WIDTH}px`,
  offsetTop = `${DK_NODE_PROPERTIES_PANEL_OFFSET_TOP}px`,
  visible,
  nodeId,
} = defineProps<{
  maxWidth?: string
  offsetTop?: string
  visible?: boolean
  nodeId?: NodeId
}>()

defineEmits<{
  close: []
}>()

const Form = computed(() => {
  switch (currentNode.value?.type) {
    case 'call':
      return NodeFormCall
    case 'service_request':
      return NodeFormServiceRequest
    case 'response':
      return NodeFormResponse
    case 'jq':
      return NodeFormJq
    case 'static':
      return NodeFormStatic
    case 'property':
      return NodeFormProperty
    case 'exit':
      return NodeFormExit
    case 'branch':
      return NodeFormBranch
    case 'cache':
      return NodeFormCache
    case 'xml_to_json':
      return NodeFormXmlToJson
    case 'json_to_xml':
      return NodeFormJsonToXml
    default:
      return null
  }
})
</script>

<style lang="scss" scoped>
/* stylelint-disable @kong/design-tokens/token-var-usage */
.dk-node-properties-panel {
  :deep(.slideout-container) {
    box-shadow: none;
    gap: $kui-space-60;
    padding-left: 0;
  }

  :deep(.slideout-header),
  :deep(.slideout-content) {
    padding-left: var(--kui-space-70, $kui-space-70);
  }

  .branch-note {
    align-items: center;
    border: 1px solid $kui-color-border;
    border-radius: $kui-border-radius-30;
    display: flex;
    gap: $kui-space-30;
    /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
    height: $kui-line-height-40 + $kui-space-40 * 2;
    margin-bottom: $kui-space-60;
    padding: $kui-space-40 $kui-space-50;
  }

  .branch-label {
    align-items: center;
    display: flex;
    flex-grow: 1;
    gap: $kui-space-30;
    min-width: 0;
  }

  .branch-text {
    flex: 1 1 auto;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .remove-branch {
    color: $kui-icon-color-neutral;
  }

  .branch-note:not(:hover) .remove-branch {
    display: none;
  }

  &-desc {
    color: $kui-color-text;
    font-size: $kui-font-size-30;
    font-weight: normal;
    line-height: $kui-line-height-30;
    margin-bottom: $kui-space-60;
  }

  &-form {
    display: flex;
    flex-direction: column;
    gap: $kui-space-60;

    & > label {
      margin-bottom: $kui-space-0;
    }

    :deep(.ff-object-field-as-child) {
      gap: $kui-space-60
    }
  }

  :deep(.dk-node-configuration-label) {
    font-size: $kui-font-size-40;
    font-weight: 700;
    margin: 0;
  }
}
</style>
