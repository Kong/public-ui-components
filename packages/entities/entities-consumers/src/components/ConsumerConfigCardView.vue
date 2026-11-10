<template>
  <div>
    <EntityConfigCardView
      :config="config"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.Consumer"
      :hide-title="hideTitle"
      :record="record"
    >
      <template #username-label-tooltip>
        <i18nT
          keypath="consumers.fields.username.tooltip"
          scope="global"
        >
          <template #custom_id>
            <code>{{ t('consumers.fields.username.custom_id') }}</code>
          </template>
        </i18nT>
      </template>

      <template #custom_id-label-tooltip>
        <i18nT
          keypath="consumers.fields.custom_id.tooltip"
          scope="global"
        >
          <template #username>
            <code>{{ t('consumers.fields.custom_id.username') }}</code>
          </template>
        </i18nT>
      </template>
      <template
        v-if="$slots.title"
        #title
      >
        <slot name="title" />
      </template>
      <template
        v-if="$slots.actions"
        #actions
      >
        <slot name="actions" />
      </template>
    </EntityConfigCardView>
  </div>
</template>

<script setup lang="ts">
import { createConfigCardSchema } from './config-card-schema'
import type { EntityConfigCardViewConfig } from '@kong-ui-public/entities-shared'
import type { PropType } from 'vue'
import { EntityConfigCardView, SupportedEntityType } from '@kong-ui-public/entities-shared'
import composables from '../composables'
import '@kong-ui-public/entities-shared/dist/style.css'


defineProps({
  record: { type: Object as PropType<Record<string, any>>, required: true },
  config: {
    type: Object as PropType<EntityConfigCardViewConfig>,
    default: () => ({}),
  },
  /**
   * Control visibility of card title content
   */
  hideTitle: {
    type: Boolean,
    default: false,
  },
})

const { i18n: { t }, i18nT } = composables.useI18n()

const configSchema = createConfigCardSchema(t)
</script>
