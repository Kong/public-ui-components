<template>
  <StandardLayout
    v-bind="props"
    :plugin-config-description="t('plugins.free-form.metering-and-billing.sections.plugin_config.description')"
  >
    <CollapsibleSection
      v-model:expanded="meteringExpanded"
      :label="t('plugins.free-form.metering-and-billing.sections.metering.title')"
    >
      <Field name="config.meter_api_requests" />
      <Field name="config.meter_ai_token_usage" />
    </CollapsibleSection>

    <!-- Subject — ObjectField native collapse, 2-column content -->
    <div class="ff-mb-subject">
      <ObjectField
        :label="t('plugins.free-form.metering-and-billing.sections.subject.title')"
        name="config.subject"
        reset-label-path="reset"
      />
    </div>

    <!-- Attributes -->
    <Field name="config.attributes" />

    <CollapsibleSection
      v-model:expanded="ingestionExpanded"
      :label="t('plugins.free-form.metering-and-billing.sections.ingestion.title')"
    >
      <StringField
        :help="t('plugins.free-form.metering-and-billing.fields.ingest_endpoint.help')"
        name="config.ingest_endpoint"
      />
      <Field name="config.api_token" />
      <Field name="config.ssl_verify" />
      <div class="ff-metering-billing-inline-row">
        <Field name="config.timeout" />
        <Field name="config.keepalive" />
      </div>
    </CollapsibleSection>

    <!-- Queue — in AdvancedFields, header-less, 2-column -->
    <AdvancedFields
      class="ff-advanced-fields-container"
      data-testid="ff-advanced-fields-container"
      hide-general-fields
    >
      <div class="ff-mb-queue">
        <KLabel class="ff-mb-queue-label">
          {{ t('plugins.free-form.metering-and-billing.sections.queue.title') }}
        </KLabel>
        <ObjectField
          as-child
          name="config.queue"
          reset-label-path="reset"
        />
      </div>
    </AdvancedFields>
  </StandardLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { provide, ref } from 'vue'
import { KLabel } from '@kong/kongponents'
import StandardLayout from '../../shared/layout/StandardLayout.vue'
import Field from '../../shared/Field.vue'
import AdvancedFields from '../../shared/AdvancedFields.vue'
import ObjectField from '../../shared/ObjectField.vue'
import CollapsibleSection from '../../shared/CollapsibleSection.vue'
import StringField from '../../shared/StringField.vue'
import useI18n from '../../../../composables/useI18n'

import type { Props } from '../../shared/layout/StandardLayout.vue'

const props = defineProps<Props>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])

const { i18n: { t } } = useI18n()

const meteringExpanded = ref(true)
const ingestionExpanded = ref(true)


</script>

<style lang="scss" scoped>
.ff-mb-subject :deep(.ff-object-field-content) {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--kui-space-60, $kui-space-60);

  > * {
    flex: 1 1 calc(50% - var(--kui-space-60, $kui-space-60));
    min-width: 0;
  }
}

:deep([data-testid="ff-array-config.attributes"] .ff-object-field-as-child) {
  display: flex;
  flex-direction: row;
  gap: var(--kui-space-60, $kui-space-60);

  > * {
    flex: 1 1 0;
    min-width: 0;
  }
}

:deep([data-testid="ff-array-config.attributes"] [data-testid^="ff-array-item-config.attributes"] .ff-array-field-item-content) {
  width: 100%;
}

:deep([data-testid="ff-array-config.attributes"] [data-testid^="ff-array-item-config.attributes"] .card-content) {
  align-items: flex-start;
}

:deep([data-testid="ff-array-config.attributes"] [data-testid^="ff-array-item-config.attributes"] .ff-object-field-as-child) {
  display: flex;
  flex-direction: row;
  gap: var(--kui-space-60, $kui-space-60);

  > * {
    flex: 1 1 0;
    min-width: 0;
  }
}

:deep([data-testid="ff-array-config.attributes"] .ff-array-field-item-remove-tooltip) {
  align-self: flex-end;
  margin-bottom: var(--kui-space-20, $kui-space-20);
}

.ff-metering-billing-inline-row {
  display: flex;
  gap: var(--kui-space-60, $kui-space-60);

  > * {
    flex: 1 1 0;
  }
}

.ff-mb-queue {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);

  &-label {
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
  }

  :deep(.ff-object-field-as-child) {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--kui-space-60, $kui-space-60);

    > * {
      flex: 1 1 calc(50% - var(--kui-space-60, $kui-space-60));
      min-width: 0;
    }
  }
}

.ff-advanced-fields-container {
  border-top: 1px solid var(--kui-color-border, $kui-color-border);
  padding-top: var(--kui-space-70, $kui-space-70);

  :deep(.collapse-heading) {
    margin: 0;
  }

  // Hide the advanced fields container if there are no advanced fields to show
  &:has(> .collapse-hidden-content > .ff-advanced-fields > .ff-object-field:empty:only-child) {
    display: none;
  }
}
</style>
