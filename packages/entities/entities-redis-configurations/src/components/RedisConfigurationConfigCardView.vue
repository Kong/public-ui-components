<template>
  <div
    class="kong-ui-consumer-group-entity-config-card"
    :class="{ 'managed-konnect-redis-detail': recordKind === 'managed-cache' }"
  >
    <EntityConfigCardView
      :code-block-record="recordKind === 'managed-cache' ? addOnCodeRslv(record) : undefined"
      :code-block-record-formatter="recordKind === 'managed-cache' ? addOnCodeFmt : codeBlockRecordFormatter"
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="recordKind === 'managed-cache' ? managedSchema : configSchema"
      :entity-type="recordKind === 'managed-cache' ? SupportedEntityType.CloudGatewayAddon : SupportedEntityType.Partial"
      :formats-to-hide="recordKind === 'managed-cache' || disableKonnectManagedDetail ? ['yaml'] : []"
      :hide-title="hideTitle"
      :preserve-code-block-timestamps="recordKind === 'managed-cache'"
      :record="recordKind === 'managed-cache' ? managedRecord : recordResolver(record)"
      :request-url="requestUrl"
    >
      <template
        v-if="recordKind === 'managed-cache'"
        #title
      >
        {{ t('config_card.sections.cache_configuration') }}
      </template>
      <template #type>
        <div>{{ recordKind === 'managed-cache' ? t('list.type.konnect_managed_redis') : redisTypeText }}</div>
      </template>
      <!-- One JSON blob per group -->
      <template
        v-if="recordKind === 'managed-cache'"
        #data_plane_groups="{ row }"
      >
        <div
          class="dpg-stack"
          data-testid="dpg-display"
        >
          <template v-if="!dataPlaneGroupEntries(row.value).length">
            –
          </template>
          <template v-else>
            <div
              v-for="(entry, idx) in dataPlaneGroupEntries(row.value)"
              :key="idx"
              class="dpg-sub-row"
              :data-testid="`dpg-sub-row-${idx}`"
            >
              <div
                class="dpg-sub-label"
                :data-testid="`dpg-item-heading-${idx}`"
              >
                {{ dataPlaneGroupItemHeading(entry, idx) }}
              </div>
              <div
                class="dpg-sub-value"
                :data-testid="`dpg-entry-blob-${idx}`"
              >
                <KCodeBlock
                  :id="`dpg-${dataPlaneGroupsInstanceId}-${idx}`"
                  :code="jsonStringifyDpgEntryForBlob(entry)"
                  language="json"
                  max-height="480px"
                  :show-line-numbers="false"
                  @code-block-render="highlightCodeBlock"
                />
              </div>
            </div>
          </template>
        </div>
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
import { useId, type PropType } from 'vue'
import { EntityConfigCardView, SupportedEntityType, highlightCodeBlock, type EntityConfigCardViewConfig } from '@kong-ui-public/entities-shared'
import { KCodeBlock } from '@kong/kongponents'
import type { AddOnRecord, AddOnValue } from '../types/cloud-gateways-add-on'
import useRedisConfigCardPresentation from '../composables/useRedisConfigCardPresentation'
import composables from '../composables'
import '@kong-ui-public/entities-shared/dist/style.css'
const props = defineProps({
  record: { type: Object as PropType<Record<string, any>>, required: true },
  recordKind: { type: String as PropType<'partial' | 'managed-cache'>, default: 'partial' },
  config: { type: Object as PropType<EntityConfigCardViewConfig & { cloudAuthAvailable?: boolean }>, default: () => ({}) },
  requestUrl: { type: String, default: '' },
  configCardDoc: { type: String, default: '' },
  hideTitle: { type: Boolean, default: true },
  disableKonnectManagedDetail: { type: Boolean, default: false },
})
const { i18n: { t } } = composables.useI18n()
const dataPlaneGroupsInstanceId = useId()
const { redisTypeText, recordResolver, codeBlockRecordFormatter, configSchema, addOnCodeRslv, addOnCodeFmt, managedRecord, managedSchema } = useRedisConfigCardPresentation(() => props.record, () => !!props.config.cloudAuthAvailable)
// Shaped add-on/cache values use `AddOnRecord`; `row.value` is typed `any` on the shared card, we only accept add-on shapes here
const isDataPlaneGroupObject = (v: AddOnValue | undefined): v is AddOnRecord =>
  v !== null && typeof v === 'object' && !Array.isArray(v)

const dataPlaneGroupEntries = (value: AddOnValue | undefined): AddOnRecord[] => {
  if (value === undefined || value === null) {
    return []
  }

  if (Array.isArray(value)) {
    return value.filter(isDataPlaneGroupObject)
  }

  if (isDataPlaneGroupObject(value)) {
    return [value]
  }

  return []
}

const dataPlaneGroupItemHeading = (entry: AddOnRecord, index: number): string => {
  const name = entry.name
  if (typeof name === 'string' && name.trim() !== '') {
    return name
  }

  return t('config_card.managed_dpg.entry_heading', { n: index + 1 })
}

// Omit UI-only `name` before JSON blob; everything else stays on the payload
const jsonStringifyDpgEntryForBlob = (entry: AddOnRecord): string => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- `name` is UI-only; rest is serialized
  const { name, ...payload } = entry
  return JSON.stringify(payload, null, 2)
}

</script>
<style lang="scss" scoped>
.managed-konnect-redis-detail {
  // Fills the config card value column
  .dpg-stack {
    width: 100%;
  }

  // Mirror `ConfigCardItem`’s default label/value split
  .dpg-sub-row {
    align-items: flex-start;
    border-bottom: solid var(--kui-border-width-10, $kui-border-width-10) var(--kui-color-border, $kui-color-border);
    box-sizing: border-box;
    display: flex;
    padding: var(--kui-space-60, $kui-space-60) var(--kui-space-0, $kui-space-0);
    width: 100%;
  }

  .dpg-sub-label {
    box-sizing: border-box;
    color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    padding-right: var(--kui-space-60, $kui-space-60);
    width: 25%;
  }

  .dpg-sub-value {
    box-sizing: border-box;
    flex: 1;
    min-width: 0;
    width: 75%;
  }

  /* JsonArray fieldset legends (e.g. data plane groups): medium weight; keep global JsonCardItem unchanged */
  :deep(.config-card-fieldset-title b) {
    font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
  }
}
</style>
