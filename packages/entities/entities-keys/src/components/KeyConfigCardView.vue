<template>
  <div>
    <EntityConfigCardView
      :config="config"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.Key"
      :hide-title="hideTitle"
      :record="record"
    >
      <template #set="{ row }">
        <!-- Loading -->
        <KSkeleton
          v-if="keySet?.loading && keySet.id === entityKeySetId"
          data-testid="key-set-name-loader"
          type="spinner"
        />
        <InternalLinkItem
          v-else-if="row.value && row.value.id === entityKeySetId && keySetName"
          :item="{
            key: row.value.id,
            value: keySetName,
            type: ConfigurationSchemaType.LinkInternal,
          }"
          @click="$emit('navigation-click', row.value.id, 'key-sets')"
        />
        <div
          v-else
        >
          {{ '&ndash;' }}
        </div>
      </template>

      <template
        v-for="keyFormat in ['jwk', 'pem'].filter(format => record[format])"
        :key="keyFormat"
        #[keyFormat]
      >
        <ConfigCardItem
          v-for="(value, propKey) in keyFields.values"
          :key="propKey"
          :data-testid="propKey"
          :item="{
            key: propKey,
            label: convertKeyToTitle(propKey),
            value,
          }"
        />
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
import { computed, watch } from 'vue'
import { useStringHelpers, ConfigCardItem, ConfigurationSchemaType, EntityConfigCardView, InternalLinkItem, SupportedEntityType } from '@kong-ui-public/entities-shared'
import composables from '../composables'
import '@kong-ui-public/entities-shared/dist/style.css'

const emit = defineEmits<{
  (e: 'navigation-click', id: string, entityType: string): void
  (e: 'error:parse', error: unknown): void
}>()

const props = defineProps({
  /** Resolved association display state; defaults to the ID in record.set. */
  keySet: { type: Object as PropType<{ id: string, name?: string, loading?: boolean }>, default: undefined },
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

const { convertKeyToTitle } = useStringHelpers()
const { i18n: { t } } = composables.useI18n()
const entityKeySetId = computed(() => props.record.set?.id || props.keySet?.id || '')
const keySetName = computed(() => props.keySet?.id === entityKeySetId.value
  ? props.keySet?.name || entityKeySetId.value
  : entityKeySetId.value)
const keyFields = computed((): { values: Record<string, unknown>, error?: unknown } => {
  const { jwk } = props.record
  if (!jwk) {
    const { pem } = props.record
    return { values: { 'pem.public_key': pem?.public_key, 'pem.private_key': pem?.private_key } }
  }

  // Parse and expand together so that both invalid JSON and `null` emit a parse error.
  try {
    const entries = Object.entries(JSON.parse(jwk)).map(([key, value]) => [`jwk.${key}`, value])
    return { values: Object.fromEntries(entries) }
  } catch (error) {
    return { values: {}, error }
  }
})
watch(() => keyFields.value.error, (error) => {
  if (error) emit('error:parse', error)
}, { immediate: true })

const configSchema = createConfigCardSchema(t)
</script>
