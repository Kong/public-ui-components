<template>
  <div class="json-config config-card-code-block">
    <KCodeBlock
      v-if="entityRecord"
      id="json-codeblock"
      :code="JSON.stringify(jsonContent, null, 2)"
      :copy-code="JSON.stringify(unredactedRecord || jsonContent, null, 2)"
      data-dd-privacy="mask"
      language="json"
      :max-height="CONFIG_CARD_CODE_BLOCK_MAX_HEIGHT"
      theme="dark"
      @code-block-render="highlightCodeBlock"
    >
      <template
        v-if="fetcherUrl"
        #actions
      >
        <KBadge
          :appearance="requestMethod"
          class="json-endpoint-method"
          data-testid="json-endpoint-method"
        >
          {{ requestMethod }}
        </KBadge>
        <code
          id="json-endpoint-codeblock"
          class="json-endpoint-url"
          :title="fetcherUrl"
        >{{ fetcherUrl }}</code>
        <KClipboardProvider v-slot="{ copyToClipboard }">
          <KCodeBlockIconButton
            :aria-label="t('jsonCodeBlock.copy_url')"
            :copy-tooltip="t('jsonCodeBlock.copy_url')"
            data-testid="code-block-copy-button-json-endpoint-codeblock"
            @click="copyToClipboard(fetcherUrl)"
          >
            <CopyIcon decorative />
          </KCodeBlockIconButton>
        </KClipboardProvider>
      </template>
    </KCodeBlock>
  </div>
</template>

<script setup lang="ts">
import { CONFIG_CARD_CODE_BLOCK_MAX_HEIGHT } from '../../constants'
import { computed, type PropType } from 'vue'
import type { BadgeAppearance } from '@kong/kongponents'
import type { KonnectBaseEntityConfig, KongManagerBaseEntityConfig, KonnectBaseFormConfig, KongManagerBaseFormConfig } from '../../types'
import { highlightCodeBlock } from '../../utils/code-block'
import { KCodeBlockIconButton } from '@kong/kongponents'
import { CopyIcon } from '@kong/icons'
import composables from '../../composables'

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

const { i18n: { t } } = composables.useI18n()

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

<style lang="scss" scoped>
.json-endpoint-method {
  flex-shrink: 0;
}

.json-endpoint-url {
  /* truncate prefix to display relevant partial url but support copying entire url */
  direction: rtl;
  font-family: var(--kui-font-family-code, $kui-font-family-code);
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  // push the copy button to the end of the header
  margin-right: auto;
  max-width: v-bind('`${displayedCharLength}ch`');
  min-width: 0;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
