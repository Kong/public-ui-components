<template>
  <div>
    <EntityConfigCardView
      :config="config"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.KeySet"
      :hide-title="hideTitle"
      :record="record"
    >
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
import type { EntityConfigCardViewConfig } from '@kong-ui-public/entities-shared'
import type { PropType } from 'vue'
import { ref } from 'vue'
import { EntityConfigCardView, SupportedEntityType } from '@kong-ui-public/entities-shared'
import type { KeySetConfigurationSchema } from '../types'
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

const { i18n: { t } } = composables.useI18n()

const configSchema = ref<KeySetConfigurationSchema>({
  id: {},
  name: {},
  last_updated: {},
  created: {},
  tags: {
    tooltip: t('keySets.form.fields.tags.tooltip'),
  },
})
</script>
