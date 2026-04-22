<template>
  <StandardLayout
    v-bind="props"
    :form-config="formConfig"
    :plugin-config-description="t('plugins.free-form.metering-and-billing.sections.plugin_config.description')"
  >
    <template #field-renderers>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.meter_api_requests'"
      >
        <BooleanField
          v-bind="slotProps"
          :description="t('plugins.free-form.metering-and-billing.fields.meter_api_requests.description')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.meter_ai_token_usage'"
      >
        <BooleanField
          v-bind="slotProps"
          :description="t('plugins.free-form.metering-and-billing.fields.meter_ai_token_usage.description')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.ssl_verify'"
      >
        <BooleanField
          v-bind="slotProps"
          :description="t('plugins.free-form.metering-and-billing.fields.ssl_verify.description')"
          :label="t('plugins.free-form.metering-and-billing.fields.ssl_verify.label')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.subject.look_up_value_in'"
      >
        <EnumField
          v-bind="slotProps"
          :help="t('plugins.free-form.metering-and-billing.fields.look_up_value_in.help')"
          :label="t('plugins.free-form.metering-and-billing.fields.look_up_value_in.label')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.subject.field'"
      >
        <StringField
          v-bind="slotProps"
          :help="t('plugins.free-form.metering-and-billing.fields.subject_field.help')"
          :label="t('plugins.free-form.metering-and-billing.fields.subject_field.label')"
          :placeholder="t('plugins.free-form.metering-and-billing.fields.subject_field.placeholder')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.timeout'"
      >
        <NumberField
          v-bind="slotProps"
          :label="t('plugins.free-form.metering-and-billing.fields.timeout.label')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.keepalive'"
      >
        <NumberField
          v-bind="slotProps"
          :label="t('plugins.free-form.metering-and-billing.fields.keepalive.label')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.queue.max_coalescing_delay'"
      >
        <NumberField
          v-bind="slotProps"
          :label="t('plugins.free-form.metering-and-billing.fields.queue.max_coalescing_delay.label')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.queue.initial_retry_delay'"
      >
        <NumberField
          v-bind="slotProps"
          :label="t('plugins.free-form.metering-and-billing.fields.queue.initial_retry_delay.label')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.queue.max_retry_delay'"
      >
        <NumberField
          v-bind="slotProps"
          :label="t('plugins.free-form.metering-and-billing.fields.queue.max_retry_delay.label')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.queue.max_retry_time'"
      >
        <NumberField
          v-bind="slotProps"
          :label="t('plugins.free-form.metering-and-billing.fields.queue.max_retry_time.label')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path.startsWith('config.attributes.') && path.endsWith('.look_up_value_in')"
      >
        <StringField
          v-bind="slotProps"
          :placeholder="t('plugins.free-form.metering-and-billing.fields.attributes.look_up_value_in.placeholder')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path.startsWith('config.attributes.') && path.endsWith('.event_property_name')"
      >
        <StringField
          v-bind="slotProps"
          :placeholder="t('plugins.free-form.metering-and-billing.fields.attributes.event_property_name.placeholder')"
        />
      </FieldRenderer>
    </template>

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
        :render-rules="{
          dependencies: {
            field: ['look_up_value_in', ['query', 'header']],
          },
        }"
        reset-label-path="reset"
      />
    </div>

    <!-- Attributes -->
    <CollapsibleSection
      v-model:expanded="attributesExpanded"
      :label="t('plugins.free-form.metering-and-billing.fields.attributes.title')"
    >
      <div class="ff-mb-attributes">
        <ArrayField
          hide-label
          name="config.attributes"
        />
      </div>
    </CollapsibleSection>

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
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME, FORMS_CONFIG } from '@kong-ui-public/forms'
import { computed, inject, provide, ref } from 'vue'
import type { KonnectBaseFormConfig, KongManagerBaseFormConfig } from '@kong-ui-public/entities-shared'
import { KLabel } from '@kong/kongponents'
import StandardLayout from '../../shared/layout/StandardLayout.vue'
import FieldRenderer from '../../shared/FieldRenderer.vue'
import Field from '../../shared/Field.vue'
import BooleanField from '../../shared/BooleanField.vue'
import EnumField from '../../shared/EnumField.vue'
import NumberField from '../../shared/NumberField.vue'
import ArrayField from '../../shared/ArrayField.vue'
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

const appConfig = inject<KonnectBaseFormConfig | KongManagerBaseFormConfig | undefined>(FORMS_CONFIG)

const ingestEndpointUrl = computed(() => {
  const geo = (appConfig as KonnectBaseFormConfig)?.geoApiServerUrl
  const region = geo ? new URL(geo).hostname.split('.')[0] : null
  return region
    ? `https://${region}.api.konghq.com/v3/openmeter/events`
    : 'https://{{region}}.api.konghq.com/v3/openmeter/events'
})

function getScopesFromFormModel(): Record<string, any> {
  const data: Record<string, any> = {}
  const scopeModelFields = ['service-id', 'route-id', 'consumer-id', 'consumer_group-id']
  for (const field of scopeModelFields) {
    if (props.formModel[field]) {
      const name = field.split('-')[0]
      if (name) data[name] = { id: props.formModel[field] }
    }
  }
  return data
}

const formConfig = {
  hasValue: (data: any): boolean => !!data && Object.keys(data).length > 0,
  prepareFormData: (data: any): any => {
    if (props.isEditing) return data

    const withScopes = { ...data, ...getScopesFromFormModel() }

    // Prefill ingest_endpoint for new Konnect plugins; Kong Manager has no regional endpoint
    if ((appConfig as KonnectBaseFormConfig)?.app === 'konnect' && !withScopes?.config?.ingest_endpoint) {
      return {
        ...withScopes,
        config: { ...withScopes?.config, ingest_endpoint: ingestEndpointUrl.value },
      }
    }

    return withScopes
  },
}

const meteringExpanded = ref(true)
const attributesExpanded = ref(true)
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

.ff-mb-attributes {
  :deep(.ff-object-field-as-child) {
    display: flex;
    flex-direction: row;
    gap: var(--kui-space-60, $kui-space-60);

    > * {
      flex: 1 1 0;
      min-width: 0;
    }
  }

  :deep(.ff-array-field-item-content) {
    width: 100%;
  }

  :deep(.card-content) {
    align-items: flex-start;
  }

  :deep(.ff-array-field-item-remove-tooltip) {
    align-self: flex-end;
    margin-bottom: var(--kui-space-20, $kui-space-20);
  }
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
