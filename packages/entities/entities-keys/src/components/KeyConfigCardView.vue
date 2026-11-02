<template>
  <div class="kong-ui-entities-keys-entity-config-card">
    <EntityConfigCardView
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.Key"
      :hide-title="hideTitle"
      :record="record"
      :request-url="requestUrl"
    >
      <template #set="{ row }">
        <!-- Loading -->
        <KSkeleton
          v-if="keySetNameLoading"
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
        v-if="record?.jwk"
        #jwk
      >
        <ConfigCardItem
          v-for="propKey in Object.keys(result)"
          :key="propKey"
          :data-testid="`${propKey}`"
          :item="{
            key: propKey,
            label: convertKeyToTitle(propKey),
            value: result[propKey],
          }"
        />
      </template>
      <template
        v-if="record?.pem"
        #pem
      >
        <ConfigCardItem
          v-for="propKey in Object.keys(result)"
          :key="propKey"
          :data-testid="`${propKey}`"
          :item="{
            key: propKey,
            label: convertKeyToTitle(propKey),
            value: result[propKey],
          }"
        />
      </template>
      <template
        v-for="slotKey in Object.keys($slots)"
        :key="slotKey"
        #[slotKey]="slotProps"
      >
        <slot
          :name="slotKey"
          v-bind="slotProps"
        />
      </template>
    </EntityConfigCardView>
  </div>
</template>

<script setup lang="ts">
import type { EntityConfigCardViewConfig } from '@kong-ui-public/entities-shared'
import type { PropType } from 'vue'
import { computed, ref } from 'vue'
import type { KeyConfigurationSchema } from '../types'
import { useStringHelpers, ConfigCardItem, ConfigurationSchemaSection, ConfigurationSchemaType, EntityConfigCardView, InternalLinkItem, SupportedEntityType } from '@kong-ui-public/entities-shared'
import composables from '../composables'
import '@kong-ui-public/entities-shared/dist/style.css'

const emit = defineEmits<{
  (e: 'navigation-click', id: string, entityType: string): void
  (e: 'error:parse', error: unknown): void
}>()

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  keySetName: { type: String, default: undefined },
  keySetNameLoading: { type: Boolean, default: false },
  record: { type: Object as PropType<Record<string, any>>, required: true },
  requestUrl: { type: String, default: '' },
  config: {
    type: Object as PropType<EntityConfigCardViewConfig>,
    default: () => ({}),
  },
  /**
   * External link for documentation that determines visibility of Documentation button
   */
  configCardDoc: {
    type: String,
    default: '',
    required: false,
  },
  /**
   * Control visibility of card title content
   */
  hideTitle: {
    type: Boolean,
    default: false,
  },
  /**
   * Keyset id for scoped key entity
   */
  keySetId: {
    type: String as PropType<string | null>,
    default: null,
  },
})

const { convertKeyToTitle } = useStringHelpers()
const { i18n: { t } } = composables.useI18n()
const entityKeySetId = computed(() => props.record.set?.id || props.keySetId || '')
const keySetName = computed(() => props.keySetName ?? entityKeySetId.value)
const result = computed<Record<string, any>>(() => {
  if (props.record.jwk) {
    try {
      return Object.fromEntries(Object.entries(JSON.parse(props.record.jwk)).map(([key, value]) => [`jwk.${key}`, value]))
    } catch (error) {
      emit('error:parse', error)
      return {}
    }
  }
  return { 'pem.public_key': props.record.pem?.public_key, 'pem.private_key': props.record.pem?.private_key }
})

const configSchema = ref<KeyConfigurationSchema>({
  id: {},
  name: {
    tooltip: t('keys.form.fields.name.tooltip'),
  },
  last_updated: {},
  created: {},
  set: {
    label: t('keys.form.fields.set.label'),
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('keys.form.fields.set.tooltip'),
    order: 5,
  },
  kid: {
    label: t('keys.form.fields.kid.label'),
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('keys.form.fields.kid.tooltip'),
  },
  tags: {
    tooltip: t('keys.form.fields.tags.tooltip'),
  },
  // advanced fields
  jwk: {
    label: t('keys.form.fields.jwk.label'),
    type: ConfigurationSchemaType.Json,
  },
  pem: {
    section: ConfigurationSchemaSection.Advanced,
    label: t('keys.form.fields.key_format.options.pem'),
    type: ConfigurationSchemaType.Json,
  },
})
</script>
