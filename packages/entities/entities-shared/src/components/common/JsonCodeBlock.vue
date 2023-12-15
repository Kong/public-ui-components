<template>
  <div class="json-config">
    <div
      v-if="props.fetcherUrl && props.config?.jsonYamlMilestone2Enabled"
      class="json-endpoint"
    >
      <KBadge :appearance="props.requestMethod">
        <span request-method-badge>{{ props.requestMethod }}</span>
      </KBadge>
      <KCodeBlock
        id="json-endpoint-codeblock"
        :code="props.fetcherUrl"
        is-single-line
        language="json"
        theme="dark"
      />
    </div>
    <KCodeBlock
      v-if="props.jsonRecord"
      id="json-codeblock"
      :class="{ 'json-content': props.fetcherUrl }"
      :code="JSON.stringify(jsonContent, null, 2)"
      language="json"
      theme="dark"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType, reactive } from 'vue'
import type { BadgeAppearance } from '@kong/kongponents/dist/types'
import type { KonnectBaseEntityConfig, KongManagerBaseEntityConfig, KonnectBaseFormConfig, KongManagerBaseFormConfig } from '../../types'

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectBaseEntityConfig | KongManagerBaseEntityConfig | KonnectBaseFormConfig | KongManagerBaseFormConfig>,
    required: false,
    default: () => ({}),
  },
  fetcherUrl: {
    type: String,
    required: false,
    default: '',
  },
  jsonRecord: {
    type: Object as PropType<Record<string, any>>,
    required: true,
  },
  requestMethod: {
    type: String as PropType<BadgeAppearance>,
    required: false,
    default: '',
  },
})

const jsonContent = reactive(props.jsonRecord)

const displayedCharLength = computed(() => {
  if (!props.fetcherUrl) {
    return 0
  }
  const url = props.fetcherUrl?.split('/')
  if (url.length < 2) {
    return 0
  }
  const entityType = url[url.length - 2]
  // each url contains 36 chars id + 2 slashes + 3 ellipses + number of characters in the entity type
  return 41 + entityType.length
})
</script>

<style lang="scss">
.json-config {
  #json-endpoint-codeblock,
  #json-codeblock {
    .k-highlighted-code-block {
      code {
        background-color: $kui-color-background-neutral-strongest;
      }
    }
    .k-code-block-secondary-actions {
      top: 12px !important;
    }
  }
}

.json-content {
  .k-highlighted-code-block {
    border-top-left-radius: $kui-border-radius-0 !important;
    border-top-right-radius: $kui-border-radius-0 !important;
  }
}

.json-endpoint {
  align-items: baseline;
  background-color: $kui-color-background-neutral-strongest;
  border-bottom: $kui-border-width-10 solid $kui-navigation-color-border-divider;
  border-top-left-radius: $kui-border-radius-40;
  border-top-right-radius: $kui-border-radius-40;
  display: flex;
  padding-left: $kui-space-50;
  .k-badge {
    height: 24px;
  }
  .k-code-block {
    flex: auto;
  }
  code {
    /* truncate prefix to display relevant partial url but support copying entire url */
    direction: rtl;
    max-width: v-bind('`${displayedCharLength}ch`');
    overflow: hidden !important;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .request-method-badge {
    text-transform: uppercase;
  }
}
</style>
