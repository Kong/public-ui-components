<template>
  <div class="config-card-details-row">
    <div
      class="config-card-details-label"
      :data-testid="`${item.key}-label`"
    >
      <slot
        :item="item"
        name="label"
      >
        <KLabel :tooltip-attributes="{ maxWidth: '500px' }">
          {{ item.label }}
          <template
            v-if="hasTooltip"
            #tooltip
          >
            <div :data-testid="`${item.key}-label-tooltip`">
              <slot name="label-tooltip">
                {{ item.tooltip }}
              </slot>
            </div>
          </template>
        </KLabel>
      </slot>
    </div>

    <div
      class="config-card-details-value"
      :data-testid="`${item.key}-property-value`"
    >
      <slot
        :name="item.key"
        :row-value="item.value"
      >
        <div
          v-if="!itemHasValue"
          :data-testid="`${item.key}-no-value`"
        >
          –
        </div>
        <div v-else>
          <component
            :is="componentAttrsData.tag"
            v-bind="componentAttrsData.attrs"
          >
            <div
              v-if="componentAttrsData.additionalComponent === 'KBadge'"
              :data-testid="`${item.key}-badge-tags`"
            >
              <KBadge
                v-for="(tag, idx) in item.value"
                :key="`${item.key}-badge-tag-${idx}`"
                class="config-badge"
                :data-testid="`${item.key}-badge-tag-${idx}`"
                :tooltip="tag"
                truncation-tooltip
              >
                {{ tag }}
              </KBadge>
            </div>

            <div
              v-if="componentAttrsData.additionalComponent === 'CopyUuid'"
              class="copy-uuid-array"
              :data-testid="`${item.key}-copy-uuid-array`"
            >
              <CopyUuid
                v-for="(id, idx) in item.value"
                v-bind="componentAttrsData.childAttrs"
                :key="`${item.key}-copy-uuid-${idx}`"
                :data-testid="`${item.key}-copy-uuid-${idx}`"
                :uuid="id"
              />
            </div>

            <div
              v-else-if="componentAttrsData.additionalComponent === 'KMethodBadge'"
              class="method-badge-array"
              :data-testid="`${item.key}-badge-methods`"
            >
              <KMethodBadge
                v-for="(method, idx) in item.value"
                :key="`${item.key}-badge-method-${idx}`"
                class="config-badge"
                :data-testid="`${item.key}-badge-method-${idx}`"
                is-rounded
                :label="method"
                :method="MethodsArray.includes(method.toLowerCase()) ? method.toLowerCase() : 'custom'"
              >
                {{ method }}
              </KMethodBadge>
            </div>

            <div
              v-if="componentAttrsData.additionalComponent === 'JsonCardItem'"
              :data-testid="`${props.item.key}-json-array-content`"
            >
              <JsonCardItem
                v-for="(jitem, idx) in item.value"
                :key="`json-array-item-${idx}`"
                :index="idx"
                is-array-item
                :item="jitem"
              />
            </div>

            <KTooltip
              v-else
              :label="isTruncated ? item.value : ''"
            >
              <span
                ref="textContent"
                class="attrs-data-text"
                :class="{ 'truncated': truncated }"
              >
                {{ componentAttrsData.text }}
              </span>
            </KTooltip>
          </component>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import { computed, ref, useSlots } from 'vue'
import type { RecordItem, ComponentAttrsData } from '../../types'
import { ConfigurationSchemaType } from '../../types'
import composables from '../../composables'
import { CopyUuid } from '@kong-ui-public/copy-uuid'
import { MethodsArray } from '@kong/kongponents'
import JsonCardItem from './JsonCardItem.vue'
import InternalLinkItem from './InternalLinkItem.vue'
import StatusBadge from './StatusBadge.vue'
import '@kong-ui-public/copy-uuid/dist/style.css'

const props = defineProps({
  item: {
    type: Object as PropType<RecordItem>,
    required: true,
  },
  slim: {
    type: Boolean,
    required: false,
    default: false,
  },
  truncated: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'navigation-click', record: RecordItem): void,
}>()

const slots = useSlots()
const { i18n: { t, formatUnixTimeStamp } } = composables.useI18n()

const itemHasValue = computed((): boolean => props.item.value !== undefined && props.item.value !== null && props.item.value !== '')
const hasTooltip = computed((): boolean => !!(props.item.tooltip || slots['label-tooltip']))
const isJson = computed((): boolean => props.item.type === ConfigurationSchemaType.Json || props.item.type === ConfigurationSchemaType.JsonArray)
const isJsonArray = computed((): boolean => props.item.type === ConfigurationSchemaType.JsonArray)

const componentAttrsData = computed((): ComponentAttrsData => {
  switch (props.item.type) {
    case ConfigurationSchemaType.ID:
      return {
        tag: 'CopyUuid',
        attrs: {
          'data-testid': `${props.item.key}-copy-uuid`,
          'success-tooltip': t('baseConfigCard.copy.success'),
          tooltip: t('baseConfigCard.copy.tooltip', { label: props.item.label }),
          truncated: false,
          uuid: props.item.value,
          notify: () => {},
        },
      }

    case ConfigurationSchemaType.IdArray:
      return {
        tag: 'div',
        additionalComponent: 'CopyUuid',
        childAttrs: {
          'success-tooltip': t('baseConfigCard.copy.success'),
          tooltip: t('baseConfigCard.copy.tooltip', { label: props.item.label }),
          truncated: false,
          notify: () => {},
        },
      }

    case ConfigurationSchemaType.Redacted:
      return {
        tag: 'CopyUuid',
        attrs: {
          'data-testid': `${props.item.key}-copy-uuid-redacted`,
          format: 'redacted',
          'success-tooltip': t('baseConfigCard.copy.success'),
          tooltip: t('baseConfigCard.copy.tooltip', { label: props.item.label }),
          truncated: false,
          uuid: props.item.value,
          notify: () => {},
        },
      }

    case ConfigurationSchemaType.RedactedArray:
      return {
        tag: 'div',
        additionalComponent: 'CopyUuid',
        childAttrs: {
          format: 'redacted',
          'success-tooltip': t('baseConfigCard.copy.success'),
          tooltip: t('baseConfigCard.copy.tooltip', { label: props.item.label }),
          truncated: false,
          notify: () => {},
        },
      }

    case ConfigurationSchemaType.Date:
      return {
        tag: 'div',
        attrs: {
          'data-testid': `${props.item.key}-date`,
        },
        text: formatUnixTimeStamp(props.item.value),
      }

    case ConfigurationSchemaType.BadgeStatus:
      return {
        tag: 'StatusBadge',
        attrs: {
          'data-testid': `${props.item.key}-badge-status`,
          status: props.item.value,
        },
      }

    case ConfigurationSchemaType.BadgeTag:
      return {
        tag: 'div',
        additionalComponent: 'KBadge',
      }

    case ConfigurationSchemaType.BadgeMethod:
      return {
        tag: 'div',
        additionalComponent: 'KMethodBadge',
      }

    case ConfigurationSchemaType.LinkInternal:
      return {
        tag: 'InternalLinkItem',
        attrs: {
          'data-testid': `${props.item.key}-internal-link`,
          item: props.item,
          onNavigationClick: (record: RecordItem) => { emit('navigation-click', record) },
        },
      }

    case ConfigurationSchemaType.LinkExternal:
      return {
        tag: 'KExternalLink',
        attrs: {
          'data-testid': `${props.item.key}-external-link`,
          href: props.item.value,
        },
        text: props.item.value,
      }

    case ConfigurationSchemaType.Json:
      return {
        tag: 'JsonCardItem',
        attrs: {
          'data-testid': `${props.item.key}-json-content`,
          item: props.item,
        },
      }

    case ConfigurationSchemaType.JsonArray:
      return {
        tag: 'div',
        additionalComponent: 'JsonCardItem',
        attrs: {
          'data-testid': `${props.item.key}-json-array-content`,
          item: props.item,
        },
      }

    default:
      return {
        tag: 'div',
        attrs: {
          'data-testid': `${props.item.key}-plain-text`,
        },
        text: props.item.value,
      }
  }
})

const textContent = ref<HTMLElement>()

const { isTruncated } = composables.useTruncationDetector(textContent as Ref<HTMLElement>)

</script>

<script lang="ts">
// eslint-disable-next-line import/first
import { KUI_BORDER_WIDTH_10, KUI_COLOR_BORDER } from '@kong/design-tokens'
// Must explicitly define components so <component :is="type"> works
export default {
  name: 'ConfigCardItem',
  components: { CopyUuid, JsonCardItem, StatusBadge, InternalLinkItem },
}
</script>

<style lang="scss" scoped>
.config-card-details-row {
  align-items: center;
  border-bottom: v-bind('isJsonArray ? "none" : `solid ${KUI_BORDER_WIDTH_10} ${KUI_COLOR_BORDER}`');
  display: v-bind('isJson && itemHasValue ? "block" : "flex"');
  padding: $kui-space-60;
  padding-left: 0;
  width: 100%;

  .config-card-details-label {
    width: v-bind('isJson && itemHasValue ? "100%" : props.slim ? "50%" : "25%"');

    label {
      color: $kui-color-text-neutral-stronger;
    }
  }

  .config-card-details-value {
    width: v-bind('isJson && itemHasValue ? "100%" : props.slim ? "50%" : "75%"');

    .truncated {
      display: inline-block;
      line-height: initial;
      max-width: 20ch;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span.attrs-data-text {
      overflow-wrap: anywhere;
    }

    .copy-uuid-array {
      :deep(.kong-ui-copy-uuid) {
        &:not(:last-of-type) {
          margin-bottom: $kui-space-40;
        }
      }
    }

    .method-badge-array {
      display: flex;
    }
  }

  .config-badge {
    margin-right: $kui-space-20;
  }

  :deep(.k-label) {
    margin-bottom: 0;

    .kong-icon-infoFilled {
      display: flex;
    }
  }

  :deep(.config-card-details-row) {
    width: auto;
  }
}
</style>
