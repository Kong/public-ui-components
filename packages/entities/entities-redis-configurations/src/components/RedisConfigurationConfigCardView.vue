<template>
  <div>
    <EntityConfigCardView
      :class="{ 'managed-cache-config-card': isManagedCache }"
      :code-block-record="isManagedCache ? record : undefined"
      :code-block-record-formatter="isManagedCache ? formatManagedRecord : formatPartialRecord"
      :config="config"
      :config-schema="isManagedCache ? managedSchema : partialSchema"
      :entity-type="isManagedCache ? SupportedEntityType.CloudGatewayAddon : SupportedEntityType.Partial"
      :formats-to-hide="isManagedCache ? ['yaml'] : []"
      :hide-title="hideTitle"
      :preserve-code-block-timestamps="isManagedCache"
      :record="isManagedCache ? managedRecord : partialRecord"
    >
      <template
        v-if="$slots.title || isManagedCache"
        #title
      >
        <slot name="title">
          {{ t('config_card.sections.cache_configuration') }}
        </slot>
      </template>
      <template #type>
        <div>{{ isManagedCache ? t('list.type.konnect_managed_redis') : redisTypeText }}</div>
      </template>
      <!-- One JSON blob per group -->
      <template
        v-if="isManagedCache"
        #data_plane_groups="{ row }"
      >
        <ManagedRedisDataPlaneGroups :value="row.value" />
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
import { computed, type PropType } from 'vue'
import { EntityConfigCardView, SupportedEntityType, type EntityConfigCardViewConfig } from '@kong-ui-public/entities-shared'
import useRedisConfigCardPresentation from '../composables/useRedisConfigCardPresentation'
import composables from '../composables'
import ManagedRedisDataPlaneGroups from './ManagedRedisDataPlaneGroups.vue'
import { isManagedCacheAddOn } from '../helpers/managed-cache-add-on-parse'
import '@kong-ui-public/entities-shared/dist/style.css'
const props = defineProps({
  record: { type: Object as PropType<Record<string, any>>, required: true },
  config: { type: Object as PropType<EntityConfigCardViewConfig>, default: () => ({}) },
  /** Show Cloud authentication fields of self-managed partials */
  cloudAuthAvailable: { type: Boolean, default: false },
  hideTitle: { type: Boolean, default: true },
})
const isManagedCache = computed(() => !!props.record.config && isManagedCacheAddOn(props.record))
const { i18n: { t } } = composables.useI18n()
const { redisTypeText, partialRecord, partialSchema, formatPartialRecord, managedRecord, managedSchema, formatManagedRecord } = useRedisConfigCardPresentation(() => props.record, () => props.cloudAuthAvailable)
</script>
<style lang="scss" scoped>
.managed-cache-config-card {
  /* JsonArray fieldset legends (e.g. data plane groups): medium weight; keep global JsonCardItem unchanged */
  :deep(.config-card-fieldset-title b) {
    font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
  }
}
</style>
