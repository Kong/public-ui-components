<template>
  <div class="json-config config-card-code-block">
    <div
      v-if="fetcherUrl"
      class="json-endpoint"
    >
      <KBadge :appearance="requestMethod">
        {{ requestMethod }}
      </KBadge>
      <KCodeBlock
        id="json-endpoint-codeblock"
        :code="fetcherUrl"
        language="plaintext"
        single-line
        theme="dark"
      />
    </div>
    <KCodeBlock
      v-if="entityRecord"
      id="json-codeblock"
      :class="{ 'json-content': fetcherUrl }"
      :code="JSON.stringify(jsonContent, null, 2)"
      :copy-code="JSON.stringify(unredactedRecord || jsonContent, null, 2)"
      data-dd-privacy="mask"
      language="json"
      theme="dark"
      @code-block-render="highlightCodeBlock"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import type { BadgeAppearance } from '@kong/kongponents'
import type { KonnectBaseEntityConfig, KongManagerBaseEntityConfig, KonnectBaseFormConfig, KongManagerBaseFormConfig } from '../../types'
import { highlightCodeBlock } from '../../utils/code-block'

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectBaseEntityConfig | KongManagerBaseEntityConfig | KonnectBaseFormConfig | KongManagerBaseFormConfig>,
    required: false,
    default: () => ({}),
  },
  /** Fetcher url for the entity with the filled-in controlPlaneId, workspace, and entity id. */
  fetcherUrl: {
    type: String,
    required: false,
    default: '',
  },
  /** HTTP request method like GET, POST, PUT, used to make the api call. */
  requestMethod: {
    type: String as PropType<BadgeAppearance>,
    required: false,
    default: '',
  },
  /** A record to indicate the entity's configuration, the visible code content (may be redacted) */
  entityRecord: {
    type: Object as PropType<Record<string, any>>,
    required: true,
  },
  /** The unredacted record, used for copy actions */
  unredactedRecord: {
    type: Object as PropType<Record<string, any>>,
    default: null,
  },
})

const jsonContent = computed((): Record<string, any> => props.entityRecord)

const displayedCharLength = computed((): number => {
  if (!props.fetcherUrl) {
    return 0
  }
  const url = props.fetcherUrl?.split('/')
  if (url.length < 2) {
    return 0
  }
  const entityType = props.requestMethod === 'post' ? url[url.length - 1] : url[url.length - 2]
  // each url contains 36 chars id + 2 slashes + 3 ellipses + number of characters in the entity type
  return 41 + entityType.length
})
</script>

<style lang="scss">
.json-content.k-code-block {
  border-top-left-radius: var(--kui-border-radius-0, $kui-border-radius-0);
  border-top-right-radius: var(--kui-border-radius-0, $kui-border-radius-0);
}

.json-endpoint {
  align-items: baseline;
  background-color: var(--kui-color-background-inverse, $kui-color-background-inverse);
  border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border-inverse, $kui-color-border-inverse);
  border-top-left-radius: var(--kui-border-radius-40, $kui-border-radius-40);
  border-top-right-radius: var(--kui-border-radius-40, $kui-border-radius-40);
  display: flex;
  padding: var(--kui-space-40, $kui-space-40) var(--kui-space-0, $kui-space-0) var(--kui-space-40, $kui-space-40) var(--kui-space-50, $kui-space-50);

  .k-code-block {
    flex: auto;
    z-index: 2;

    .code-block-content {
      padding-bottom: var(--kui-space-0, $kui-space-0);
      padding-top: var(--kui-space-0, $kui-space-0);
    }

    .code-block-secondary-actions {
      margin-top: 0 !important;
    }
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
}
</style>
