<template>
  <DynamicLayout
    v-bind="props"
    :config-sections="configSections"
    :form-config="formConfig"
  >
    <template #field-renderers>
      <!-- Subject: look_up_value_in -->
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.subject.look_up_value_in'"
      >
        <EnumField
          v-bind="slotProps"
          :help="t('plugins.free-form.governance.fields.look_up_value_in.help')"
          :label="t('plugins.free-form.governance.fields.look_up_value_in.label')"
        />
      </FieldRenderer>

      <!-- Subject: field -->
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.subject.field'"
      >
        <StringField
          v-bind="slotProps"
          :help="t('plugins.free-form.governance.fields.subject_field.help')"
          :label="t('plugins.free-form.governance.fields.subject_field.label')"
          :placeholder="t('plugins.free-form.governance.fields.subject_field.placeholder')"
        />
      </FieldRenderer>

      <!-- Connection: ssl_verify -->
      <!-- NOTE: ssl_verify, timeout, and keepalive are design-driven fields not present
           in the authoritative YAML schema. Included per design spec; pending backend
           schema confirmation before the plugin ships. -->
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.ssl_verify'"
      >
        <BooleanField
          v-bind="slotProps"
          :description="t('plugins.free-form.governance.fields.ssl_verify.description')"
          :label="t('plugins.free-form.governance.fields.ssl_verify.label')"
        />
      </FieldRenderer>

      <!-- Connection: timeout -->
      <!-- NOTE: design-driven field, pending backend schema confirmation -->
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.timeout'"
      >
        <NumberField
          v-bind="slotProps"
          :label="t('plugins.free-form.governance.fields.timeout.label')"
        />
      </FieldRenderer>

      <!-- Connection: keepalive -->
      <!-- NOTE: design-driven field, pending backend schema confirmation -->
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.keepalive'"
      >
        <NumberField
          v-bind="slotProps"
          :label="t('plugins.free-form.governance.fields.keepalive.label')"
        />
      </FieldRenderer>
    </template>

    <!-- ── Section 2: Plugin configuration ────────────────────────────── -->
    <template #section-configuration>
      <!-- Subject: rendered flat (no collapsible group). `as-child` drops the
           ObjectField header; the render-rule keeps `field` visible only for
           header|query. -->
      <div class="ff-governance-subject">
        <ObjectField
          as-child
          name="config.subject"
          :render-rules="{
            dependencies: {
              field: ['look_up_value_in', ['header', 'query']],
            },
          }"
          reset-label-path="reset"
        />
      </div>

      <!-- Feature — async select backed by the OpenMeter features endpoint. -->
      <FeatureSelectField />

      <!-- Connection -->
      <CollapsibleSection
        v-model:expanded="connectionExpanded"
        :label="t('plugins.free-form.governance.sections.connection.title')"
      >
        <StringField
          :help="t('plugins.free-form.governance.fields.governance_endpoint.help')"
          name="config.governance_endpoint"
        />
        <Field name="config.api_token" />
        <Field name="config.ssl_verify" />
        <div class="ff-governance-inline-row">
          <Field name="config.timeout" />
          <Field name="config.keepalive" />
        </div>
      </CollapsibleSection>

      <!-- Redis — shared (partial) vs dedicated. Rendering a Field at the redis
           path lets PluginConfigurationForm's built-in renderer swap in
           RedisSelector. Requires the schema to declare
           `supported_partials: { 'redis-ce': ['config.redis'] }` so the partial
           machinery resolves this path. -->
      <Field name="config.redis" />

      <!-- Cache & sync settings (in AdvancedFields, grouped under a collapse) -->
      <AdvancedFields
        class="ff-governance-advanced-fields-container"
        data-testid="ff-governance-advanced-fields-container"
        hide-general-fields
      >
        <CollapsibleSection
          v-model:expanded="cacheSyncExpanded"
          :label="t('plugins.free-form.governance.sections.cache_sync.title')"
        >
          <div class="ff-governance-cache-sync">
            <NumberField
              :label="t('plugins.free-form.governance.fields.sync_rate.label')"
              name="config.sync_rate"
            />
            <NumberField
              :label="t('plugins.free-form.governance.fields.refresh_interval.label')"
              name="config.refresh_interval"
            />
            <NumberField
              :label="t('plugins.free-form.governance.fields.max_stale_seconds.label')"
              name="config.max_stale_seconds"
            />
            <NumberField
              :label="t('plugins.free-form.governance.fields.l1_ttl.label')"
              name="config.l1_ttl"
            />
            <NumberField
              :label="t('plugins.free-form.governance.fields.l2_ttl.label')"
              name="config.l2_ttl"
            />
          </div>
        </CollapsibleSection>
      </AdvancedFields>
    </template>

    <!-- ── Section 3: Governance settings ─────────────────────────────── -->
    <template #section-governance>
      <!-- credit_balance_required — 2-card boolean radio
           CardRadioField calls useFormShared() internally; rendered inside
           Form.vue's provider context via the slot. -->
      <CardRadioField
        :label="t('plugins.free-form.governance.fields.credit_balance_required.label')"
        name="config.credit_balance_required"
        :options="creditBalanceOptions"
      />

      <!-- fail_policy — 2-card enum radio -->
      <CardRadioField
        :label="t('plugins.free-form.governance.fields.fail_policy.label')"
        name="config.fail_policy"
        :options="failPolicyOptions"
      />

      <!-- Advanced settings within governance section -->
      <AdvancedFields
        class="ff-governance-advanced-fields-container"
        data-testid="ff-governance-advanced-settings"
        hide-general-fields
      >
        <!-- Response mapping — fixed 5 rows, editable status/message -->
        <CollapsibleSection
          v-model:expanded="responseMappingExpanded"
          :label="t('plugins.free-form.governance.fields.response.label')"
        >
          <ResponseMappingField />
        </CollapsibleSection>

        <!-- deny_unknown_customers — collapsible group of Allow/Deny cards -->
        <CollapsibleSection
          v-model:expanded="unknownCustomerExpanded"
          :label="t('plugins.free-form.governance.fields.deny_unknown_customers.label')"
        >
          <CardRadioField
            name="config.deny_unknown_customers"
            :options="denyUnknownCustomersOptions"
          />
        </CollapsibleSection>
      </AdvancedFields>
    </template>
  </DynamicLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME, FORMS_CONFIG } from '@kong-ui-public/forms'
import { computed, inject, provide, ref } from 'vue'
import type { KonnectBaseFormConfig, KongManagerBaseFormConfig } from '@kong-ui-public/entities-shared'
import DynamicLayout from '../../shared/layout/DynamicLayout.vue'
import FieldRenderer from '../../shared/FieldRenderer.vue'
import Field from '../../shared/Field.vue'
import BooleanField from '../../shared/BooleanField.vue'
import EnumField from '../../shared/EnumField.vue'
import NumberField from '../../shared/NumberField.vue'
import StringField from '../../shared/StringField.vue'
import ObjectField from '../../shared/ObjectField.vue'
import CollapsibleSection from '../../shared/CollapsibleSection.vue'
import AdvancedFields from '../../shared/AdvancedFields.vue'
import useI18n from '../../../../composables/useI18n'
import type { PluginFormLayoutProps as Props } from '../../shared/layout/provider'
import type { ConfigSection } from '../../shared/types'
import ResponseMappingField from './ResponseMappingField.vue'
import CardRadioField from './CardRadioField.vue'
import FeatureSelectField from './FeatureSelectField.vue'

const props = defineProps<Props>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])

const { i18n: { t } } = useI18n()

const appConfig = inject<KonnectBaseFormConfig | KongManagerBaseFormConfig | undefined>(FORMS_CONFIG)

const governanceEndpointUrl = computed(() => {
  const geo = (appConfig as KonnectBaseFormConfig)?.geoApiServerUrl
  const region = geo ? new URL(geo).hostname.split('.')[0] : null
  return region
    ? `https://${region}.api.konghq.com/v3/openmeter/governance/query`
    : 'https://us.api.konghq.com/v3/openmeter/governance/query'
})

const formConfig = {
  hasValue: (data: any): boolean => !!data && Object.keys(data).length > 0,
  prepareFormData: (data: any): any => {
    if (props.isEditing) return data

    // Prefill governance_endpoint for new Konnect plugins; Kong Manager has no regional endpoint
    if ((appConfig as KonnectBaseFormConfig)?.app === 'konnect' && !data?.config?.governance_endpoint) {
      return {
        ...data,
        config: { ...data?.config, governance_endpoint: governanceEndpointUrl.value },
      }
    }

    return data
  },
}

const configSections: ConfigSection[] = [
  {
    name: 'configuration',
    title: t('plugins.free-form.governance.sections.configuration.title'),
    description: t('plugins.free-form.governance.sections.configuration.description'),
  },
  {
    name: 'governance',
    title: t('plugins.free-form.governance.sections.governance.title'),
    description: t('plugins.free-form.governance.sections.governance.description'),
  },
]

// Section expand states
const connectionExpanded = ref(true)
const cacheSyncExpanded = ref(true)
const responseMappingExpanded = ref(true)
const unknownCustomerExpanded = ref(true)

// ── Card-radio option sets (static, translated at setup time) ─────────────

const creditBalanceOptions = computed(() => [
  {
    value: true,
    label: t('plugins.free-form.governance.fields.credit_balance_required.yes_label'),
    description: t('plugins.free-form.governance.fields.credit_balance_required.yes_description'),
  },
  {
    value: false,
    label: t('plugins.free-form.governance.fields.credit_balance_required.no_label'),
    description: t('plugins.free-form.governance.fields.credit_balance_required.no_description'),
  },
])

const failPolicyOptions = computed(() => [
  {
    value: 'allow',
    label: t('plugins.free-form.governance.fields.fail_policy.allow_label'),
    description: t('plugins.free-form.governance.fields.fail_policy.allow_description'),
  },
  {
    value: 'block',
    label: t('plugins.free-form.governance.fields.fail_policy.block_label'),
    description: t('plugins.free-form.governance.fields.fail_policy.block_description'),
  },
])

const denyUnknownCustomersOptions = computed(() => [
  {
    value: false,
    label: t('plugins.free-form.governance.fields.deny_unknown_customers.allow_label'),
    description: t('plugins.free-form.governance.fields.deny_unknown_customers.allow_description'),
  },
  {
    value: true,
    label: t('plugins.free-form.governance.fields.deny_unknown_customers.deny_label'),
    description: t('plugins.free-form.governance.fields.deny_unknown_customers.deny_description'),
  },
])
</script>

<style lang="scss" scoped>
// `as-child` ObjectField renders the subject fields without a header; lay the
// two fields (look_up_value_in + field) out side by side on one row.
.ff-governance-subject :deep(.ff-object-field-as-child) {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--kui-space-60, $kui-space-60);

  > * {
    flex: 1 1 calc(50% - var(--kui-space-60, $kui-space-60));
    min-width: 0;
  }
}

.ff-governance-inline-row {
  display: flex;
  gap: var(--kui-space-60, $kui-space-60);

  > * {
    flex: 1 1 0;
  }
}

.ff-governance-advanced-fields-container {
  border-top: 1px solid var(--kui-color-border, $kui-color-border);
  padding-top: var(--kui-space-70, $kui-space-70);

  :deep(.collapse-heading) {
    margin: 0;
  }
}

// Cache and sync fields laid out two per row, as designed.
.ff-governance-cache-sync {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--kui-space-60, $kui-space-60);

  > * {
    flex: 1 1 calc(50% - var(--kui-space-60, $kui-space-60));
    min-width: 0;
  }
}
</style>
